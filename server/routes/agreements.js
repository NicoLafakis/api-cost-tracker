import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';

const router = express.Router();

// Create or update agreement
router.post('/', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { householdId, guestPolicy, paymentDeadline, choreRotation, quietHours, customSections } = req.body;

    if (!householdId) {
      return res.status(400).json({ error: 'Household ID is required' });
    }

    // Check if agreement exists
    const [existing] = await connection.execute(
      'SELECT id FROM agreements WHERE household_id = ?',
      [householdId]
    );

    let agreementId;

    if (existing.length > 0) {
      // Update existing
      agreementId = existing[0].id;
      await connection.execute(
        `UPDATE agreements SET guest_policy = ?, payment_deadline = ?, chore_rotation = ?, quiet_hours = ?, custom_sections = ? WHERE id = ?`,
        [guestPolicy, paymentDeadline, choreRotation, quietHours, customSections ? JSON.stringify(customSections) : '[]', agreementId]
      );
    } else {
      // Create new
      agreementId = uuidv4();
      await connection.execute(
        `INSERT INTO agreements (id, household_id, guest_policy, payment_deadline, chore_rotation, quiet_hours, custom_sections) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [agreementId, householdId, guestPolicy, paymentDeadline, choreRotation, quietHours, customSections ? JSON.stringify(customSections) : '[]']
      );
    }

    await connection.commit();

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (id, household_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), householdId, req.user.id, existing.length > 0 ? 'updated' : 'created', 'agreement', agreementId, null]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('agreement-updated', {
      id: agreementId,
      householdId,
      guestPolicy,
      paymentDeadline,
      choreRotation,
      quietHours,
      customSections
    });

    res.status(existing.length > 0 ? 200 : 201).json({
      id: agreementId,
      guestPolicy,
      paymentDeadline,
      choreRotation,
      quietHours,
      customSections: customSections || []
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Sign agreement
router.post('/:householdId/sign', async (req, res, next) => {
  try {
    const { householdId } = req.params;
    const { roommateId } = req.body;

    if (!roommateId) {
      return res.status(400).json({ error: 'Roommate ID is required' });
    }

    // Get agreement
    const [agreements] = await pool.execute(
      'SELECT id FROM agreements WHERE household_id = ?',
      [householdId]
    );

    if (agreements.length === 0) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    const agreementId = agreements[0].id;

    // Check if already signed
    const [existing] = await pool.execute(
      'SELECT id FROM agreement_signatures WHERE agreement_id = ? AND roommate_id = ?',
      [agreementId, roommateId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Already signed' });
    }

    // Add signature
    await pool.execute(
      'INSERT INTO agreement_signatures (id, agreement_id, roommate_id) VALUES (?, ?, ?)',
      [uuidv4(), agreementId, roommateId]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('agreement-signed', {
      householdId,
      roommateId,
      signedAt: new Date().toISOString()
    });

    res.json({ message: 'Agreement signed successfully' });
  } catch (error) {
    next(error);
  }
});

// Remove signature
router.delete('/:householdId/sign/:roommateId', async (req, res, next) => {
  try {
    const { householdId, roommateId } = req.params;

    // Get agreement
    const [agreements] = await pool.execute(
      'SELECT id FROM agreements WHERE household_id = ?',
      [householdId]
    );

    if (agreements.length === 0) {
      return res.status(404).json({ error: 'Agreement not found' });
    }

    await pool.execute(
      'DELETE FROM agreement_signatures WHERE agreement_id = ? AND roommate_id = ?',
      [agreements[0].id, roommateId]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('agreement-unsigned', { householdId, roommateId });

    res.json({ message: 'Signature removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
