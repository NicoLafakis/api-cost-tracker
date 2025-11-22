import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const [users] = await pool.execute(
      'SELECT id, email, name, avatar_url, preferences FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function requireHouseholdAccess(roles = ['owner', 'admin', 'member']) {
  return async (req, res, next) => {
    const householdId = req.params.householdId || req.body.householdId;

    if (!householdId) {
      return res.status(400).json({ error: 'Household ID required' });
    }

    try {
      const [members] = await pool.execute(
        'SELECT role FROM household_members WHERE household_id = ? AND user_id = ?',
        [householdId, req.user.id]
      );

      if (members.length === 0) {
        return res.status(403).json({ error: 'Not a member of this household' });
      }

      if (!roles.includes(members[0].role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.householdRole = members[0].role;
      next();
    } catch (error) {
      next(error);
    }
  };
}
