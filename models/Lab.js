// const mongoose = require('mongoose');

// const LabSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   domain: String,
//   technology: [String],
//   courses: [String],
//   projects: [String],
//   publications: [String],
//   manpowerList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
// }, { timestamps: true });

// module.exports = mongoose.model('Lab', LabSchema);


// const mongoose = require('mongoose');

// const LabSchema = new mongoose.Schema({
//   name: { type: String, required: true, unique: true }, // Enforce uniqueness on lab name
//   domain: String,
//   technology: [String],
//   courses: [String],
//   projects: [String],
//   publications: [String],
//   manpowerList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
// }, { timestamps: true });

// // Optional: Explicitly define index (good for clarity/debugging)
// LabSchema.index({ name: 1 }, { unique: true });

// module.exports = mongoose.model('Lab', LabSchema);


const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Enforce uniqueness on lab name
  domain: String,

  // Referencing other collections instead of embedding data directly
  technologiesDeveloped: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TechnologyDeveloped' }],
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseConducted' }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  publications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Publication' }],
  patents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patent' }], // New reference for patents

  // Manpower list of users working in the lab
  manpowerList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Optional: Explicitly define index (good for clarity/debugging)
LabSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Lab', LabSchema);
