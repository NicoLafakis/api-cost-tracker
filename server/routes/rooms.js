import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';

const router = express.Router();

// Create room
router.post('/', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { householdId, name, squareFootage, amenities, occupants, rentAmount, tier, isCouple } = req.body;

    if (!householdId || !name || squareFootage === undefined) {
      return res.status(400).json({ error: 'Household ID, name, and square footage are required' });
    }

    const roomId = uuidv4();

    await connection.execute(
      'INSERT INTO rooms (id, household_id, name, square_footage, amenities, rent_amount, tier, is_couple) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [roomId, householdId, name, squareFootage, amenities ? JSON.stringify(amenities) : '[]', rentAmount || null, tier || null, isCouple || false]
    );

    // Add occupants
    if (occupants && occupants.length > 0) {
      for (const roommateId of occupants) {
        await connection.execute(
          'INSERT INTO room_occupants (id, room_id, roommate_id) VALUES (?, ?, ?)',
          [uuidv4(), roomId, roommateId]
        );
      }
    }

    await connection.commit();

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (id, household_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), householdId, req.user.id, 'created', 'room', roomId, JSON.stringify({ name })]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('room-created', {
      id: roomId,
      householdId,
      name,
      squareFootage,
      amenities: amenities || [],
      occupants: occupants || [],
      rentAmount,
      tier,
      isCouple
    });

    res.status(201).json({
      id: roomId,
      name,
      squareFootage,
      amenities: amenities || [],
      occupants: occupants || [],
      rentAmount,
      tier,
      isCouple
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Update room
router.put('/:id', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { name, squareFootage, amenities, occupants, rentAmount, tier, isCouple } = req.body;

    // Get room to find household
    const [rooms] = await connection.execute(
      'SELECT household_id FROM rooms WHERE id = ?',
      [id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const householdId = rooms[0].household_id;

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (squareFootage !== undefined) {
      updates.push('square_footage = ?');
      values.push(squareFootage);
    }

    if (amenities !== undefined) {
      updates.push('amenities = ?');
      values.push(JSON.stringify(amenities));
    }

    if (rentAmount !== undefined) {
      updates.push('rent_amount = ?');
      values.push(rentAmount);
    }

    if (tier !== undefined) {
      updates.push('tier = ?');
      values.push(tier);
    }

    if (isCouple !== undefined) {
      updates.push('is_couple = ?');
      values.push(isCouple);
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update occupants if provided
    if (occupants !== undefined) {
      // Remove existing occupants
      await connection.execute('DELETE FROM room_occupants WHERE room_id = ?', [id]);

      // Add new occupants
      for (const roommateId of occupants) {
        await connection.execute(
          'INSERT INTO room_occupants (id, room_id, roommate_id) VALUES (?, ?, ?)',
          [uuidv4(), id, roommateId]
        );
      }
    }

    await connection.commit();

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('room-updated', { id, name, squareFootage, amenities, occupants, rentAmount, tier, isCouple });

    res.json({ message: 'Room updated successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Delete room
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get room to find household
    const [rooms] = await pool.execute(
      'SELECT household_id, name FROM rooms WHERE id = ?',
      [id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const householdId = rooms[0].household_id;

    await pool.execute('DELETE FROM rooms WHERE id = ?', [id]);

    // Log activity
    await pool.execute(
      'INSERT INTO activity_log (id, household_id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), householdId, req.user.id, 'deleted', 'room', id, JSON.stringify({ name: rooms[0].name })]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`household:${householdId}`).emit('room-deleted', { id, householdId });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
