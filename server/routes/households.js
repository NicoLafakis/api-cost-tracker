import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { requireHouseholdAccess } from '../middleware/auth.js';

const router = express.Router();

// Generate random invite code
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Create new household
router.post('/', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, totalRent } = req.body;

    if (!name || totalRent === undefined) {
      return res.status(400).json({ error: 'Name and total rent are required' });
    }

    const householdId = uuidv4();
    const inviteCode = generateInviteCode();

    // Create household
    await connection.execute(
      'INSERT INTO households (id, name, total_rent, owner_id, invite_code) VALUES (?, ?, ?, ?, ?)',
      [householdId, name, totalRent, req.user.id, inviteCode]
    );

    // Add creator as owner member
    await connection.execute(
      'INSERT INTO household_members (id, household_id, user_id, role) VALUES (?, ?, ?, ?)',
      [uuidv4(), householdId, req.user.id, 'owner']
    );

    await connection.commit();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`user:${req.user.id}`).emit('household-created', { householdId });

    res.status(201).json({
      id: householdId,
      name,
      totalRent,
      inviteCode,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Get household by ID
router.get('/:householdId', requireHouseholdAccess(), async (req, res, next) => {
  try {
    const { householdId } = req.params;

    // Get household
    const [households] = await pool.execute(
      'SELECT * FROM households WHERE id = ?',
      [householdId]
    );

    if (households.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    // Get roommates
    const [roommates] = await pool.execute(
      'SELECT * FROM roommates WHERE household_id = ?',
      [householdId]
    );

    // Get rooms with occupants
    const [rooms] = await pool.execute(`
      SELECT r.*, GROUP_CONCAT(ro.roommate_id) as occupant_ids
      FROM rooms r
      LEFT JOIN room_occupants ro ON r.id = ro.room_id
      WHERE r.household_id = ?
      GROUP BY r.id
    `, [householdId]);

    // Get expenses with splits
    const [expenses] = await pool.execute(
      'SELECT * FROM expenses WHERE household_id = ? ORDER BY date DESC',
      [householdId]
    );

    const expenseIds = expenses.map(e => e.id);
    let splits = [];
    if (expenseIds.length > 0) {
      const [splitResults] = await pool.execute(
        `SELECT * FROM expense_splits WHERE expense_id IN (${expenseIds.map(() => '?').join(',')})`,
        expenseIds
      );
      splits = splitResults;
    }

    // Get agreement
    const [agreements] = await pool.execute(
      'SELECT * FROM agreements WHERE household_id = ?',
      [householdId]
    );

    let agreement = null;
    if (agreements.length > 0) {
      const [signatures] = await pool.execute(
        'SELECT * FROM agreement_signatures WHERE agreement_id = ?',
        [agreements[0].id]
      );
      agreement = {
        ...agreements[0],
        customSections: agreements[0].custom_sections ? JSON.parse(agreements[0].custom_sections) : [],
        signatures: signatures.map(s => ({
          roommateId: s.roommate_id,
          signedAt: s.signed_at
        }))
      };
    }

    const household = {
      id: households[0].id,
      name: households[0].name,
      totalRent: parseFloat(households[0].total_rent),
      createdAt: households[0].created_at,
      inviteCode: households[0].invite_code,
      roommates: roommates.map(r => ({
        id: r.id,
        name: r.name,
        color: r.color,
        paymentMethods: r.payment_methods ? JSON.parse(r.payment_methods) : [],
        paymentStreak: r.payment_streak
      })),
      rooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        squareFootage: parseFloat(r.square_footage),
        amenities: r.amenities ? JSON.parse(r.amenities) : [],
        occupants: r.occupant_ids ? r.occupant_ids.split(',') : [],
        rentAmount: r.rent_amount ? parseFloat(r.rent_amount) : undefined,
        tier: r.tier,
        isCouple: r.is_couple
      })),
      expenses: expenses.map(e => ({
        id: e.id,
        description: e.description,
        amount: parseFloat(e.amount),
        category: e.category,
        date: e.date,
        paidBy: e.paid_by,
        splitMethod: e.split_method,
        splits: splits.filter(s => s.expense_id === e.id).map(s => ({
          roommateId: s.roommate_id,
          amount: parseFloat(s.amount),
          paid: s.paid,
          paidDate: s.paid_date
        })),
        recurring: e.recurring_frequency ? {
          frequency: e.recurring_frequency,
          nextDue: e.recurring_next_due
        } : undefined
      })),
      agreement
    };

    res.json(household);
  } catch (error) {
    next(error);
  }
});

// Update household
router.put('/:householdId', requireHouseholdAccess(['owner', 'admin']), async (req, res, next) => {
  try {
    const { householdId } = req.params;
    const { name, totalRent } = req.body;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (totalRent !== undefined) {
      updates.push('total_rent = ?');
      values.push(totalRent);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(householdId);

    await pool.execute(
      `UPDATE households SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('household-updated', { householdId, name, totalRent });

    res.json({ message: 'Household updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Join household by invite code
router.post('/join', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Find household
    const [households] = await connection.execute(
      'SELECT * FROM households WHERE invite_code = ?',
      [inviteCode.toUpperCase()]
    );

    if (households.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const household = households[0];

    // Check if already a member
    const [existing] = await connection.execute(
      'SELECT id FROM household_members WHERE household_id = ? AND user_id = ?',
      [household.id, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Already a member of this household' });
    }

    // Add as member
    await connection.execute(
      'INSERT INTO household_members (id, household_id, user_id, role) VALUES (?, ?, ?, ?)',
      [uuidv4(), household.id, req.user.id, 'member']
    );

    await connection.commit();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${household.id}`).emit('member-joined', {
      householdId: household.id,
      userId: req.user.id,
      userName: req.user.name
    });

    res.json({
      message: 'Joined household successfully',
      household: {
        id: household.id,
        name: household.name
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Regenerate invite code
router.post('/:householdId/invite-code', requireHouseholdAccess(['owner', 'admin']), async (req, res, next) => {
  try {
    const { householdId } = req.params;
    const newCode = generateInviteCode();

    await pool.execute(
      'UPDATE households SET invite_code = ? WHERE id = ?',
      [newCode, householdId]
    );

    res.json({ inviteCode: newCode });
  } catch (error) {
    next(error);
  }
});

// Get household members
router.get('/:householdId/members', requireHouseholdAccess(), async (req, res, next) => {
  try {
    const { householdId } = req.params;

    const [members] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.avatar_url, hm.role, hm.joined_at
      FROM household_members hm
      JOIN users u ON hm.user_id = u.id
      WHERE hm.household_id = ?
    `, [householdId]);

    res.json(members.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatarUrl: m.avatar_url,
      role: m.role,
      joinedAt: m.joined_at
    })));
  } catch (error) {
    next(error);
  }
});

// Remove member from household
router.delete('/:householdId/members/:userId', requireHouseholdAccess(['owner', 'admin']), async (req, res, next) => {
  try {
    const { householdId, userId } = req.params;

    // Can't remove owner
    const [household] = await pool.execute(
      'SELECT owner_id FROM households WHERE id = ?',
      [householdId]
    );

    if (household[0].owner_id === userId) {
      return res.status(400).json({ error: 'Cannot remove household owner' });
    }

    await pool.execute(
      'DELETE FROM household_members WHERE household_id = ? AND user_id = ?',
      [householdId, userId]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('member-removed', { householdId, userId });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete household
router.delete('/:householdId', requireHouseholdAccess(['owner']), async (req, res, next) => {
  try {
    const { householdId } = req.params;

    await pool.execute('DELETE FROM households WHERE id = ?', [householdId]);

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('household-deleted', { householdId });

    res.json({ message: 'Household deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get activity log
router.get('/:householdId/activity', requireHouseholdAccess(), async (req, res, next) => {
  try {
    const { householdId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const [activities] = await pool.execute(`
      SELECT a.*, u.name as user_name
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.household_id = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `, [householdId, limit]);

    res.json(activities.map(a => ({
      id: a.id,
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id,
      details: a.details ? JSON.parse(a.details) : null,
      userName: a.user_name,
      createdAt: a.created_at
    })));
  } catch (error) {
    next(error);
  }
});

export default router;
