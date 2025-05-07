const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  filename: String,
  url: String
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  documents: [DocumentSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
