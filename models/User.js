const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  filename: String,
  url: String
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee'
  },
  documents: [DocumentSchema],

  // 🆕 Employee photo field (relative path to image)
  photo: {
    type: String,
    default: '' // e.g., '/uploads/employees/1712345678-profile.jpg'
  },
  // 🆕 About field for user description
  about: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
