const express = require('express');
const Lab = require('../models/Lab.js');
const auth = require('../middlewares/auth.js');
const allowRoles = require('../middlewares/allowRoles.js');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const labs = await Lab.find()
      .populate('manpowerList')
      .populate('technologiesDeveloped')
      .populate('courses')
      .populate('projects')
      .populate('publications')
      .populate('patents');

    res.json(labs);
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});


router.get('/:id', async (req, res) => {
  const lab = await Lab.findById(req.params.id).populate('manpowerList');
  res.json(lab);
});

//Lab creation
router.post('/', auth, allowRoles('admin'), async (req, res) => {
  try {
    const newLab = await Lab.create(req.body);
    res.status(201).json(newLab);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// PUT update lab by ID
router.put('/:id', auth, allowRoles('admin'), async (req, res) => {
  try {
    const updatedLab = await Lab.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedLab) return res.status(404).json({ error: 'Lab not found' });
    res.json(updatedLab);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update lab', details: err.message });
  }
});

module.exports = router;