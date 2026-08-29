import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import orgsRoutes from './routes/organizations.js';
import queuesRoutes from './routes/queues.js';
import staffRoutes from './routes/staff.js';
import tokensRoutes from './routes/tokens.js';
import displayRoutes from './routes/display.js';
import analyticsRoutes from './routes/analytics.js';
import whatsappRoutes from './routes/whatsapp.js';
import vapiRoutes from './routes/vapi.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with base64 image upload limit (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizations', orgsRoutes);
app.use('/api/queues', queuesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/display', displayRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/vapi', vapiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Queless Backend Engine',
    database: 'Oracle SQL Local Protocol (SQLite engine)',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Queless REST Server running on http://localhost:${PORT}`);
  console.log(`📡 Oracle SQL Local Engine ready`);
});
