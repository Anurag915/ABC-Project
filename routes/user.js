const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const Log = require("../models/Log.js");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const auth = require("../middlewares/auth");

// Ensure uploads and subdirectory exist
const uploadsDir = path.join(__dirname, "../uploads");
const employeePhotosDir = path.join(uploadsDir, "employees");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(employeePhotosDir)) fs.mkdirSync(employeePhotosDir);

// === Multer for documents (PDFs only) ===
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const docFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf" && file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};
const uploadDoc = multer({
  storage: docStorage,
  fileFilter: docFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// === Multer for photo upload (images only) ===
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/employees/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG/PNG images allowed"), false);
};
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
});

// === GET user by ID ===
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await Log.create({ userId: req.params.id, action: "Viewed user profile" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// === PUT update user ===
router.put("/:id", auth, async (req, res) => {
  try {
    const updates = req.body;

    // If user is not admin, prevent editing `employmentPeriod.to`
    if (req.user.role !== "admin" && updates?.employmentPeriod?.to) {
      return res
        .status(403)
        .json({ error: "Only admins can set the ending date." });
    }

    // Optional: prevent normal user from editing someone else's profile
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this user." });
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    await Log.create({ userId: req.params.id, action: "Updated user profile" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// === POST upload document ===
router.post("/:id/upload", auth, (req, res) => {
  uploadDoc.single("file")(req, res, async (err) => {
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

// === POST upload profile photo ===
router.post("/:id/upload-photo", auth, (req, res) => {
  uploadImage.single("photo")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: "Image too large. Max 1MB allowed." });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.photo = `/uploads/employees/${req.file.filename}`;
      await user.save();

      await Log.create({
        userId: req.params.id,
        action: "Uploaded profile photo",
      });

      res.json({ message: "Profile photo uploaded", photoUrl: user.photo });
    } catch (err) {
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });
});


// === GET all users ===
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    await Log.create({ action: "Viewed all users" });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
