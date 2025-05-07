const mongoose = require('mongoose');

const courseConductedSchema = new mongoose.Schema({
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  instructor: String
});

module.exports = mongoose.model('CourseConducted', courseConductedSchema);
