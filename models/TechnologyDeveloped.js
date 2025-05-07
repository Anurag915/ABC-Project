const mongoose = require('mongoose');

const technologyDevelopedSchema = new mongoose.Schema({
  name: String,
  description: String,
  developedDate: Date
});

module.exports = mongoose.model('TechnologyDeveloped', technologyDevelopedSchema);
