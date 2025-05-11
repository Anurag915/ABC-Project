
const mongoose = require('mongoose');

const technologyDevelopedSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  developedDate: { type: Date },
  documentUrl: { type: String, required: true }, // Path to uploaded file (PDF, doc, etc.)
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true }
}, { timestamps: true });

module.exports = mongoose.model('TechnologyDeveloped', technologyDevelopedSchema);
