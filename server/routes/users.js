import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

const router = express.Router();

// Get current user profile
router.get('/me', async (req, res, next) => {
  try {
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatarUrl: req.user.avatar_url,
      preferences: req.user.preferences ? JSON.parse(req.user.preferences) : {}
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me', async (req, res, next) => {
  try {
    const { name, avatarUrl, preferences } = req.body;
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }

    if (avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatarUrl);
    }

    if (preferences) {
      updates.push('preferences = ?');
      values.push(JSON.stringify(preferences));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user
    const [users] = await pool.execute(
      'SELECT id, email, name, avatar_url, preferences FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      id: users[0].id,
      email: users[0].email,
      name: users[0].name,
      avatarUrl: users[0].avatar_url,
      preferences: users[0].preferences ? JSON.parse(users[0].preferences) : {}
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/me/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current password hash
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Get user's households
router.get('/me/households', async (req, res, next) => {
  try {
    const [households] = await pool.execute(`
      SELECT h.*, hm.role, hm.joined_at,
        (SELECT COUNT(*) FROM roommates WHERE household_id = h.id) as roommate_count
      FROM households h
      JOIN household_members hm ON h.id = hm.household_id
      WHERE hm.user_id = ?
      ORDER BY hm.joined_at DESC
    `, [req.user.id]);

    res.json(households.map(h => ({
      id: h.id,
      name: h.name,
      totalRent: parseFloat(h.total_rent),
      role: h.role,
      joinedAt: h.joined_at,
      roommateCount: h.roommate_count,
      createdAt: h.created_at
    })));
  } catch (error) {
    next(error);
  }
});

// Get user notifications
router.get('/me/notifications', async (req, res, next) => {
  try {
    const [notifications] = await pool.execute(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/me/notifications/:id/read', async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete user account
router.delete('/me', async (req, res, next) => {
  try {
    const { password } = req.body;

    // Verify password
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    const validPassword = await bcrypt.compare(password, users[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    // Soft delete - just mark as inactive
    await pool.execute(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
