import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { requireHouseholdAccess } from '../middleware/auth.js';

const router = express.Router();

// Create roommate
router.post('/', async (req, res, next) => {
  try {
    const { householdId, name, color, paymentMethods, userId } = req.body;

    if (!householdId || !name || !color) {
      return res.status(400).json({ error: 'Household ID, name, and color are required' });
    }

    const roommateId = uuidv4();

    await pool.execute(
      'INSERT INTO roommates (id, household_id, user_id, name, color, payment_methods) VALUES (?, ?, ?, ?, ?, ?)',
      [roommateId, householdId, userId || null, name, color, paymentMethods ? JSON.stringify(paymentMethods) : null]
    );

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (id, household_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), householdId, req.user.id, 'created', 'roommate', roommateId, JSON.stringify({ name })]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('roommate-created', {
      id: roommateId,
      householdId,
      name,
      color,
      paymentMethods: paymentMethods || [],
      paymentStreak: 0
    });

    res.status(201).json({
      id: roommateId,
      name,
      color,
      paymentMethods: paymentMethods || [],
      paymentStreak: 0
    });
  } catch (error) {
    next(error);
  }
});

// Update roommate
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, paymentMethods, paymentStreak } = req.body;

    // Get roommate to find household
    const [roommates] = await pool.execute(
      'SELECT household_id FROM roommates WHERE id = ?',
      [id]
    );

    if (roommates.length === 0) {
      return res.status(404).json({ error: 'Roommate not found' });
    }

    const householdId = roommates[0].household_id;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (color) {
      updates.push('color = ?');
      values.push(color);
    }

    if (paymentMethods !== undefined) {
      updates.push('payment_methods = ?');
      values.push(JSON.stringify(paymentMethods));
    }

    if (paymentStreak !== undefined) {
      updates.push('payment_streak = ?');
      values.push(paymentStreak);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE roommates SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('roommate-updated', { id, name, color, paymentMethods, paymentStreak });

    res.json({ message: 'Roommate updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete roommate
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get roommate to find household
    const [roommates] = await pool.execute(
      'SELECT household_id, name FROM roommates WHERE id = ?',
      [id]
    );

    if (roommates.length === 0) {
      return res.status(404).json({ error: 'Roommate not found' });
    }

    const householdId = roommates[0].household_id;

    await pool.execute('DELETE FROM roommates WHERE id = ?', [id]);

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (id, household_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), householdId, req.user.id, 'deleted', 'roommate', id, JSON.stringify({ name: roommates[0].name })]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('roommate-deleted', { id, householdId });

    res.json({ message: 'Roommate deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Link roommate to user account
router.post('/:id/link', async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE roommates SET user_id = ? WHERE id = ?',
      [req.user.id, id]
    );

    res.json({ message: 'Roommate linked to account successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
