
const mongoose = require('mongoose');

const patentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  inventor: { type: String, required: true },
  filingDate: { type: Date },
  documentUrl: { type: String, required: true }, // Path to uploaded file
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Patent', patentSchema);
