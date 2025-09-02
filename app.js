import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import multer from 'multer';
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import db from './models/index.js';
import authMiddleware from './middleware/auth.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import reimbursementRoutes from './routes/reimbursement.routes.js';
import disbursementRoutes from './routes/disbursement.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Finance system backend is running!');
});

// Public static files url (Receipt images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/budget', authMiddleware, budgetRoutes);
app.use('/api/reimbursement', authMiddleware, reimbursementRoutes);
app.use('/api/disbursement', authMiddleware, disbursementRoutes);

// Global error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  if (err.status && err.message) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Connect to DB and start server
const startServer = async () => {
  try {
    await db.sequelize.sync({ alter: true }); // Dev only: auto-sync models
    console.log('Database synced');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
  }
};

startServer();