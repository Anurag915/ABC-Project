const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Log = require('../models/Log.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth.js');
const allowRoles = require('../middlewares/allowRoles.js');

const Project = require('../models/Project.js');
const Group = require('../models/Group.js');
const Lab = require('../models/Lab.js');

// POST route for creating a new project (only admin allowed)
router.post('/', auth, allowRoles('admin'), async (req, res) => {
    try {
        const { title, description, startDate, endDate, status } = req.body;

        // Check if all required fields are present
        if (!title || !description || !startDate || !endDate || !status) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Create a new project using the schema
        const newProject = new Project({
            title,
            description,
            startDate,
            endDate,
            status
        });

        // Save the new project to the database
        await newProject.save();

        // Respond with the created project
        res.status(201).json(newProject);
    } catch (err) {
        // Handle any errors
        res.status(400).json({ error: err.message });
    }
});

// GET route for fetching all projects
router.get('/', async (req, res) => {
    try {
        // Fetch all projects from the database
        const projects = await Project.find();

        // If no projects are found, return a message
        if (projects.length === 0) {
            return res.status(404).json({ message: 'No projects found.' });
        }

        // Respond with the list of all projects
        res.status(200).json(projects);
    } catch (err) {
        // Handle any errors
        res.status(400).json({ error: err.message });
    }
});

// PUT route for updating a project (only admin allowed)
router.put('/:id', auth, allowRoles('admin'), async (req, res) => {
    try {
        const { title, description, startDate, endDate, status } = req.body;

        // Find the project by ID and update it
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id, // The project ID from URL params
            {
                title,
                description,
                startDate,
                endDate,
                status
            },
            { new: true } // Return the updated document
        );

        if (!updatedProject) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // Respond with the updated project
        res.status(200).json(updatedProject);
    } catch (err) {
        // Handle any errors
        res.status(400).json({ error: err.message });
    }
});

// DELETE route for deleting a project (only admin allowed)
router.delete('/:id', auth, allowRoles('admin'), async (req, res) => {
    try {
        // Find the project by ID and delete it
        const deletedProject = await Project.findByIdAndDelete(req.params.id);

        if (!deletedProject) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // Respond with a success message
        res.status(200).json({ message: 'Project deleted successfully.' });
    } catch (err) {
        // Handle any errors
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;


