import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import weatherRoutes from './routes/weather.js';
import chatRoutes from './routes/chat.js';
import voiceRoutes from './routes/voice.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.join(__dirname, '..');
const frontendPath = path.join(rootPath, 'frontend');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets from both '/' and '/frontend' paths to prevent 404s
app.use(express.static(frontendPath));
app.use('/frontend', express.static(frontendPath));
app.use(express.static(rootPath));

// API Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/voice', voiceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'WeatherGPT Backend',
    timestamp: new Date().toISOString()
  });
});

// Explicit route for root and frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/frontend', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Catch-all fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌦️  WeatherGPT Server running successfully!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📡 Open-Meteo Integration: Active (No API Key Required)`);
  console.log(`🗣️ BHASHINI Integration: ${process.env.BHASHINI_USER_ID ? 'Configured' : 'Fallback mode active (Web Speech API ready)'}`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.warn(`[WARNING] Port ${PORT} is already in use by another program.`);
    console.log(`[RETRY] Starting on port ${nextPort} instead...`);
    app.listen(nextPort, () => {
      console.log(`🌦️  WeatherGPT Server now running at: http://localhost:${nextPort}`);
    });
  } else {
    console.error('Server error:', err);
  }
});
