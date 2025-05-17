const express = require("express");
const Lab = require("../models/Lab.js");
const auth = require("../middlewares/auth.js");
const allowRoles = require("../middlewares/allowRoles.js");
const router = express.Router();

// GET all labs with full population
router.get("/", async (req, res) => {
  try {
    const labs = await Lab.find()
      .populate("manpowerList")
      .populate("technologiesDeveloped")
      .populate("courses")
      .populate("projects")
      .populate("publications")
      .populate("patents")
      .populate("director"); // New population

    res.json(labs);
  } catch (error) {
    console.error("Error fetching labs:", error);
    res.status(500).json({ error: "Failed to fetch labs" });
  }
});

// GET single lab by ID with full details
router.get("/:id", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id)
      .populate("manpowerList")
      .populate("technologiesDeveloped")
      .populate("courses")
      .populate("projects")
      .populate("publications")
      .populate("patents")
      .populate("director");

    if (!lab) return res.status(404).json({ error: "Lab not found" });
    res.json(lab);
  } catch (err) {
    res.status(400).json({ error: "Invalid lab ID" });
  }
});

// POST create a new lab (admin only)
router.post("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    // Check for required field `director`
    if (!req.body.director) {
      return res
        .status(400)
        .json({ error: "Director is required for lab creation" });
    }

    const newLab = await Lab.create(req.body);
    res.status(201).json(newLab);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update lab by ID (admin only)
router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const updatedLab = await Lab.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedLab) return res.status(404).json({ error: "Lab not found" });
    res.json(updatedLab);
  } catch (err) {
    res
      .status(400)
      .json({ error: "Failed to update lab", details: err.message });
  }
});

module.exports = router;
