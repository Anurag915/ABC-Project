const express = require('express');
const Group = require('../models/Group.js');
const auth = require('../middlewares/auth.js');
const allowRoles = require('../middlewares/allowRoles.js');
const router = express.Router();

// GET all groups with full details
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('employees')
      .populate('labId') // Populate related labId
      .populate('projects') // Populate related projects
      .populate('patents')// Populate related patents
      .populate('technologiesDeveloped') // Populate related technologiesDeveloped
      .populate('publications') // Populate related publications
      .populate('coursesConducted'); // Populate related coursesConducted
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET single group by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('employees')
      .populate('labId')
      .populate('projects')
      .populate('patents')
      .populate('technologiesDeveloped')
      .populate('publications')
      .populate('coursesConducted');
      

    if (!group) return res.status(404).json({ error: 'Group not found' });

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group', details: error.message });
  }
});



// POST a single group for a specific lab
router.post('/:labId', auth, allowRoles('admin'), async (req, res) => {
  const { labId } = req.params;
  const {
    name,
    description,
    employees,
    projects,
    patents,
    technologiesDeveloped,
    publications,
    coursesConducted
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const newGroup = new Group({
      name,
      description,
      employees,
      labId,
      projects,
      patents,
      technologiesDeveloped,
      publications,
      coursesConducted
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group', details: error.message });
  }
});

// UPDATE group by ID
router.put('/:id', auth, allowRoles('admin'), async (req, res) => {
  const { name, description, employees } = req.body;

  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { name, description, employees },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) return res.status(404).json({ error: 'Group not found' });

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group', details: error.message });
  }
});


// DELETE group by ID
router.delete('/:id', auth, allowRoles('admin'), async (req, res) => {
  try {
    const deletedGroup = await Group.findByIdAndDelete(req.params.id);
    if (!deletedGroup) return res.status(404).json({ error: 'Group not found' });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete group', details: error.message });
  }
});

module.exports = router;
