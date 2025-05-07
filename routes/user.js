const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const Log = require("../models/Log.js");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const auth = require('../middlewares/auth');
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf" && file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});
// GET user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await Log.create({ userId: req.params.id, action: "Viewed user profile" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
// PUT update user
router.put("/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    await Log.create({ userId: req.params.id, action: "Updated user profile" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});
// POST upload a document
router.post("/:id/upload", auth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File too large. Max 2MB allowed." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const user = await User.findById(req.params.id);
      user.documents.push({
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
      });
      await user.save();
      await Log.create({ userId: req.params.id, action: "Uploaded document" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Failed to upload document" });
    }
  });
});

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    await Log.create({ action: "Viewed all users" }); // No userId because it might be admin/system-wide
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
module.exports = router;
