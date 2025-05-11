const mongoose = require('mongoose');
const { Schema } = mongoose;

// Reusable subdocument schema for items with file upload
const FileItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true }
}, { _id: true });

const GroupSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },

  // Select employees from existing users
  employees: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  // Work tracking arrays with file upload + metadata
  projects:    [FileItemSchema],
  patents:     [FileItemSchema],
  technologies:[FileItemSchema],
  publications:[FileItemSchema],
  courses:     [FileItemSchema]
}, { timestamps: true });
module.exports = mongoose.model('Group', GroupSchema);
