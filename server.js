require('dotenv').config(); // Ensure environment variables are loaded

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const groupRoutes = require('./routes/group');
const labRoutes = require('./routes/lab');
const logRoutes = require('./routes/log');
const courseRoutes = require('./routes/courseConducted.js');
const projectRoutes = require('./routes/project.js');
const patentRoutes = require('./routes/patent.js');
const technologyRoutes = require('./routes/technologyDeveloped.js');
const publicationRoutes = require('./routes/publication.js');
const allowRoles = require('./middlewares/allowRoles.js');
const auth = require('./middlewares/auth.js');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/drdo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected');

  // Ensure unique index is created
  await mongoose.connection.collection('groups').createIndex({ name: 1, labId: 1 }, { unique: true });
  await mongoose.connection.collection('labs').createIndex({ name: 1 }, { unique: true });

  const PORT = process.env.PORT ||5000;

  // Start server after index is ensured
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/logs', logRoutes);

app.use('/api/projects',projectRoutes);
app.use('/api/patents', patentRoutes);
app.use('/api/technologies', technologyRoutes);
app.use('/api/publications',publicationRoutes);
app.use('/api/courses',courseRoutes);


// Base route
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

// Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
