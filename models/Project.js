

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  documentUrl: { type: String, required: true }, // Path to uploaded file
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
