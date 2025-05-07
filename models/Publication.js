const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  title: String,
  author: String,
  publishedDate: Date,
  journal: String
});

module.exports = mongoose.model('Publication', publicationSchema);
