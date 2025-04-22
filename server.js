import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectedDB from './config/db.js';
import userRouter from './routes/userRoutes.js';
import imageRouter from './routes/imageRoutes.js';

const PORT = process.env.PORT || 4000;
const app = express();

// Middleware
// Increase payload size limit (50MB) for handling large images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Connect to database
connectedDB();

// API routes
app.use('/api/users', userRouter);
app.use('/api/images', imageRouter);

// Root route
app.get('/', (req, res) => res.send('API running'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      message: 'Request entity too large. Maximum size is 50MB.', 
      error: 'PAYLOAD_TOO_LARGE' 
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error', 
    error: err.message 
  });
});

// Start server
app.listen(PORT, () => console.log('Server running on port ' + PORT));
