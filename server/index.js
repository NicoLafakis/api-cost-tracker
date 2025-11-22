import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import householdRoutes from './routes/households.js';
import roommateRoutes from './routes/roommates.js';
import roomRoutes from './routes/rooms.js';
import expenseRoutes from './routes/expenses.js';
import agreementRoutes from './routes/agreements.js';

// Middleware imports
import { authenticateToken } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/households', authenticateToken, householdRoutes);
app.use('/api/roommates', authenticateToken, roommateRoutes);
app.use('/api/rooms', authenticateToken, roomRoutes);
app.use('/api/expenses', authenticateToken, expenseRoutes);
app.use('/api/agreements', authenticateToken, agreementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join household room for real-time updates
  socket.on('join-household', (householdId) => {
    socket.join(`household:${householdId}`);
    console.log(`Socket ${socket.id} joined household:${householdId}`);
  });

  // Leave household room
  socket.on('leave-household', (householdId) => {
    socket.leave(`household:${householdId}`);
    console.log(`Socket ${socket.id} left household:${householdId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error('Failed to connect to database. Please check your configuration.');
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });
}

startServer();

export { io };
