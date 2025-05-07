const express = require('express');
const router = express.Router();
const CourseConducted = require('../models/CourseConducted');
const auth = require('../middlewares/auth'); // Just auth, no role checking

// CREATE course (only logged-in users)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    const newCourse = new CourseConducted({
      title,
      description,
      startDate,
      endDate
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all courses
router.get('/', async (req, res) => {
  try {
    const courses = await CourseConducted.find();
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ a single course
router.get('/:id',  async (req, res) => {
  try {
    const course = await CourseConducted.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.status(200).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE course
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedCourse = await CourseConducted.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCourse) return res.status(404).json({ error: 'Course not found' });
    res.status(200).json(updatedCourse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE course
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedCourse = await CourseConducted.findByIdAndDelete(req.params.id);
    if (!deletedCourse) return res.status(404).json({ error: 'Course not found' });
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
