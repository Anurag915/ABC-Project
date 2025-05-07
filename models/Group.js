// const mongoose = require('mongoose');

// const GroupSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: String,
//   employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
// }, { timestamps: true });

// module.exports = mongoose.model('Group', GroupSchema);

// const mongoose = require('mongoose');

// const GroupSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: String,
//   employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true }
// }, { timestamps: true });

// // Prevent duplicate group names within the same lab
// GroupSchema.index({ name: 1, labId: 1 }, { unique: true });

// module.exports = mongoose.model('Group', GroupSchema);


// const mongoose = require('mongoose');

// const GroupSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: String,
//   employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },

//   // New fields for work tracking
//   projects: [{
//     title: String,
//     description: String,
//     startDate: Date,
//     endDate: Date
//   }],
//   patents: [{
//     title: String,
//     patentNumber: String,
//     filedDate: Date,
//     status: String
//   }],
//   technologiesDeveloped: [{
//     name: String,
//     description: String,
//     year: Number
//   }],
//   publications: [{
//     title: String,
//     journal: String,
//     year: Number,
//     link: String
//   }],
//   coursesConducted: [{
//     title: String,
//     description: String,
//     conductedOn: Date,
//     durationInDays: Number
//   }]
// }, { timestamps: true });

// // Prevent duplicate group names within the same lab
// GroupSchema.index({ name: 1, labId: 1 }, { unique: true });

// module.exports = mongoose.model('Group', GroupSchema);

const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },

  // Work tracking references
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  patents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patent' }],
  technologiesDeveloped: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TechnologyDeveloped' }],
  publications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Publication' }],
  coursesConducted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseConducted' }]
}, { timestamps: true });

// Prevent duplicate group names within the same lab
GroupSchema.index({ name: 1, labId: 1 }, { unique: true });

module.exports = mongoose.model('Group', GroupSchema);
