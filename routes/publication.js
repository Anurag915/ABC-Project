const express = require('express');
const router = express.Router();
const Publication = require('../models/Publication');
const auth = require('../middlewares/auth');
const allowRoles = require('../middlewares/allowRoles');

// CREATE - Only admin
router.post('/', auth, allowRoles('admin'), async (req, res) => {
  try {
    const { title, author, publishedDate, journal } = req.body;

    const newPublication = new Publication({
      title,
      author,
      publishedDate,
      journal
    });

    await newPublication.save();
    res.status(201).json(newPublication);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL - Authenticated users
router.get('/',  async (req, res) => {
  try {
    const publications = await Publication.find();
    res.status(200).json(publications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE - Authenticated users
router.get('/:id',  async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    if (!publication) return res.status(404).json({ error: 'Publication not found' });
    res.status(200).json(publication);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE - Only admin
router.put('/:id', auth, allowRoles('admin'), async (req, res) => {
  try {
    const { title, author, publishedDate, journal } = req.body;
    const updatedPublication = await Publication.findByIdAndUpdate(
      req.params.id,
      { title, author, publishedDate, journal },
      { new: true }
    );

    if (!updatedPublication) return res.status(404).json({ error: 'Publication not found' });

    res.status(200).json(updatedPublication);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Only admin
router.delete('/:id', auth, allowRoles('admin'), async (req, res) => {
  try {
    const deletedPublication = await Publication.findByIdAndDelete(req.params.id);
    if (!deletedPublication) return res.status(404).json({ error: 'Publication not found' });

    res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
