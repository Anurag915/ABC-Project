const express = require('express');
const router = express.Router();
const TechnologyDeveloped = require('../models/TechnologyDeveloped');
const auth = require('../middlewares/auth'); // Only login required

// CREATE technology
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, developedDate } = req.body;

    const newTech = new TechnologyDeveloped({
      name,
      description,
      developedDate
    });

    await newTech.save();
    res.status(201).json(newTech);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all technologies
router.get('/',  async (req, res) => {
  try {
    const technologies = await TechnologyDeveloped.find();
    res.status(200).json(technologies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one technology
router.get('/:id',  async (req, res) => {
  try {
    const tech = await TechnologyDeveloped.findById(req.params.id);
    if (!tech) return res.status(404).json({ error: 'Technology not found' });
    res.status(200).json(tech);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE technology
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedTech = await TechnologyDeveloped.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTech) return res.status(404).json({ error: 'Technology not found' });
    res.status(200).json(updatedTech);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE technology
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedTech = await TechnologyDeveloped.findByIdAndDelete(req.params.id);
    if (!deletedTech) return res.status(404).json({ error: 'Technology not found' });
    res.status(200).json({ message: 'Technology deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
