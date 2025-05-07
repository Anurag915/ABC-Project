const express = require('express');
const router = express.Router();
const Patent = require('../models/Patent.js');
const auth = require('../middlewares/auth.js');
const allowRoles = require('../middlewares/allowRoles.js');

// CREATE - Only admin
router.post('/', auth, allowRoles('admin'), async (req, res) => {
  try {
    const { title, inventor, filingDate, patentNumber } = req.body;

    const newPatent = new Patent({
      title,
      inventor,
      filingDate,
      patentNumber
    });

    await newPatent.save();
    res.status(201).json(newPatent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ ALL - Authenticated users
router.get('/', async (req, res) => {
  try {
    const patents = await Patent.find();
    res.status(200).json(patents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ ONE BY ID - Authenticated users
router.get('/:id', async (req, res) => {
  try {
    const patent = await Patent.findById(req.params.id);
    if (!patent) return res.status(404).json({ error: 'Patent not found' });
    res.status(200).json(patent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE - Only admin
router.put('/:id', auth, allowRoles('admin'), async (req, res) => {
  try {
    const { title, inventor, filingDate, patentNumber } = req.body;
    const updatedPatent = await Patent.findByIdAndUpdate(
      req.params.id,
      { title, inventor, filingDate, patentNumber },
      { new: true }
    );

    if (!updatedPatent) return res.status(404).json({ error: 'Patent not found' });

    res.status(200).json(updatedPatent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Only admin
router.delete('/:id', auth, allowRoles('admin'), async (req, res) => {
  try {
    const deletedPatent = await Patent.findByIdAndDelete(req.params.id);
    if (!deletedPatent) return res.status(404).json({ error: 'Patent not found' });
    res.status(200).json({ message: 'Patent deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
