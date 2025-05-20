const express = require('express');
const ContactInfo = require("../models/Contact.js"); // Assuming you have a Contact model
const auth = require("../middlewares/auth.js"); // Assuming you have an auth middleware
const allowRoles = require("../middlewares/allowRoles.js"); // Assuming you have a role-checking middleware
const router = express.Router();

// Get all contact info
router.get("/contact-info", async (req, res) => {
  const infos = await ContactInfo.find();
  res.json(infos);
});

// Add new contact info (admin only)
router.post("/contact-info", auth, allowRoles("admin"), async (req, res) => {
  const { type, label, value } = req.body;
  const newInfo = new ContactInfo({ type, label, value });
  await newInfo.save();
  res.status(201).json(newInfo);
});

// Update contact info by id (admin only)
router.put("/contact-info/:id",auth, allowRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { type, label, value } = req.body;
  const updatedInfo = await ContactInfo.findByIdAndUpdate(
    id,
    { type, label, value },
    { new: true }
  );
  res.json(updatedInfo);
});

// Delete contact info by id (admin only)
router.delete("/contact-info/:id",auth, allowRoles("admin"), async (req, res) => {
  await ContactInfo.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
});


module.exports = router;
