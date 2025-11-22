import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';

const router = express.Router();

// Create expense
router.post('/', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { householdId, description, amount, category, date, paidBy, splitMethod, splits, recurring } = req.body;

    if (!householdId || !description || amount === undefined || !category || !date || !paidBy || !splitMethod || !splits) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const expenseId = uuidv4();

    await connection.execute(
      `INSERT INTO expenses (id, household_id, description, amount, category, date, paid_by, split_method, recurring_frequency, recurring_next_due, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expenseId, householdId, description, amount, category, date, paidBy, splitMethod,
        recurring?.frequency || null, recurring?.nextDue || null, req.user.id
      ]
    );

    // Add splits
    for (const split of splits) {
      await connection.execute(
        'INSERT INTO expense_splits (id, expense_id, roommate_id, amount, paid, paid_date) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), expenseId, split.roommateId, split.amount, split.paid || false, split.paidDate || null]
      );
    }

    await connection.commit();

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (id, household_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), householdId, req.user.id, 'created', 'expense', expenseId, JSON.stringify({ description, amount })]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('expense-created', {
      id: expenseId,
      householdId,
      description,
      amount,
      category,
      date,
      paidBy,
      splitMethod,
      splits,
      recurring
    });

    res.status(201).json({
      id: expenseId,
      description,
      amount,
      category,
      date,
      paidBy,
      splitMethod,
      splits,
      recurring
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Update expense
router.put('/:id', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { description, amount, category, date, paidBy, splitMethod, splits, recurring } = req.body;

    // Get expense to find household
    const [expenses] = await connection.execute(
      'SELECT household_id FROM expenses WHERE id = ?',
      [id]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const householdId = expenses[0].household_id;

    const updates = [];
    const values = [];

    if (description) {
      updates.push('description = ?');
      values.push(description);
    }

    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }

    if (category) {
      updates.push('category = ?');
      values.push(category);
    }

    if (date) {
      updates.push('date = ?');
      values.push(date);
    }

    if (paidBy) {
      updates.push('paid_by = ?');
      values.push(paidBy);
    }

    if (splitMethod) {
      updates.push('split_method = ?');
      values.push(splitMethod);
    }

    if (recurring !== undefined) {
      updates.push('recurring_frequency = ?', 'recurring_next_due = ?');
      values.push(recurring?.frequency || null, recurring?.nextDue || null);
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update splits if provided
    if (splits) {
      // Remove existing splits
      await connection.execute('DELETE FROM expense_splits WHERE expense_id = ?', [id]);

      // Add new splits
      for (const split of splits) {
        await connection.execute(
          'INSERT INTO expense_splits (id, expense_id, roommate_id, amount, paid, paid_date) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, split.roommateId, split.amount, split.paid || false, split.paidDate || null]
        );
      }
    }

    await connection.commit();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('expense-updated', { id, description, amount, category, date, paidBy, splitMethod, splits, recurring });

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Mark split as paid
router.post('/:expenseId/splits/:roommateId/pay', async (req, res, next) => {
  try {
    const { expenseId, roommateId } = req.params;

    // Get expense to find household
    const [expenses] = await pool.execute(
      'SELECT household_id FROM expenses WHERE id = ?',
      [expenseId]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const householdId = expenses[0].household_id;

    await pool.execute(
      'UPDATE expense_splits SET paid = TRUE, paid_date = CURRENT_TIMESTAMP WHERE expense_id = ? AND roommate_id = ?',
      [expenseId, roommateId]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('split-paid', { expenseId, roommateId });

    res.json({ message: 'Split marked as paid' });
  } catch (error) {
    next(error);
  }
});

// Unmark split as paid
router.post('/:expenseId/splits/:roommateId/unpay', async (req, res, next) => {
  try {
    const { expenseId, roommateId } = req.params;

    // Get expense to find household
    const [expenses] = await pool.execute(
      'SELECT household_id FROM expenses WHERE id = ?',
      [expenseId]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const householdId = expenses[0].household_id;

    await pool.execute(
      'UPDATE expense_splits SET paid = FALSE, paid_date = NULL WHERE expense_id = ? AND roommate_id = ?',
      [expenseId, roommateId]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('split-unpaid', { expenseId, roommateId });

    res.json({ message: 'Split marked as unpaid' });
  } catch (error) {
    next(error);
  }
});

// Delete expense
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get expense to find household
    const [expenses] = await pool.execute(
      'SELECT household_id, description, amount FROM expenses WHERE id = ?',
      [id]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const householdId = expenses[0].household_id;

    await pool.execute('DELETE FROM expenses WHERE id = ?', [id]);

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (id, household_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), householdId, req.user.id, 'deleted', 'expense', id, JSON.stringify({ description: expenses[0].description, amount: expenses[0].amount })]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('expense-deleted', { id, householdId });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get expenses by category
router.get('/household/:householdId/by-category', async (req, res, next) => {
  try {
    const { householdId } = req.params;

    const [results] = await pool.execute(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM expenses
      WHERE household_id = ?
      GROUP BY category
    `, [householdId]);

    res.json(results.map(r => ({
      category: r.category,
      total: parseFloat(r.total),
      count: r.count
    })));
  } catch (error) {
    next(error);
  }
});

export default router;
