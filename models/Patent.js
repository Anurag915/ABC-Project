const mongoose = require('mongoose');

const patentSchema = new mongoose.Schema({
  title: String,
  inventor: String,
  filingDate: Date,
  patentNumber: String
});

module.exports = mongoose.model('Patent', patentSchema);
