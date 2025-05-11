

const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publishedDate: { type: Date },
  journal: { type: String },
  documentUrl: { type: String, required: true }, // Path to uploaded PDF or doc
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Publication', publicationSchema);
