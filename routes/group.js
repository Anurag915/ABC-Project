// routes/groups.js
const express = require("express");
const Group = require("../models/Group.js");
const multer = require("multer");
const auth = require("../middlewares/auth.js");
const allowRoles = require("../middlewares/allowRoles.js");
const router = express.Router();
const User = require("../models/User"); // User model
const fs = require("fs");
const path = require("path");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// GET all groups (with employees & lab populated)
router.get("/", async (req, res) => {
  try {
    console.log("GET /groups called");

    const groups = await Group.find();
    console.log("Groups fetched (raw):", groups);

    const populatedGroups = await Group.find().populate(
      "employees",
      "name email"
    );

    console.log("Groups after populate:", populatedGroups);

    res.json(populatedGroups);
  } catch (err) {
    console.error("❌ Error fetching groups:");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// POST create new group
router.post("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { labId } = req.params;
    const { name, description, vision, mission, employees } = req.body;
    if (!name) return res.status(400).json({ error: "Group name required" });

    const group = new Group({ name, description, vision, mission, labId, employees });
    const saved = await group.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// UPDATE group details (name, description, vision, mission, employees)
router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { name, description, vision, mission, employees } = req.body;
    const updated = await Group.findByIdAndUpdate(
      req.params.id,
      { name, description, vision, mission, employees },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Group not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating group:", err);
    res.status(500).json({ error: "Failed to update" });
  }
});

// POST upload a file to a group's sub-document array

router.post(
  "/:groupId/upload",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  async (req, res) => {
    const { groupId } = req.params;
    const { type, name, description } = req.body;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileUrl = `/uploads/${req.file.filename}`;

    try {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const item = { name, description, fileUrl };

      // Add item to the correct array based on the type
      switch (type) {
        case "project":
          group.projects.push(item);
          break;
        case "patent":
          group.patents.push(item);
          break;
        case "technology":
          group.technologies.push(item);
          break;
        case "publication":
          group.publications.push(item);
          break;
        case "course":
          group.courses.push(item);
          break;
        default:
          return res.status(400).json({ error: "Invalid type" });
      }

      // Save the updated group document
      await group.save();
      res.json({ message: "Uploaded successfully", group: group.toObject() });
    } catch (err) {
      console.error("Error during upload:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// UPDATE group details (name/desc/employees)
// router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
//   try {
//     const { name, description, employees } = req.body;
//     const updated = await Group.findByIdAndUpdate(
//       req.params.id,
//       { name, description, employees },
//       { new: true, runValidators: true }
//     );
//     if (!updated) return res.status(404).json({ error: "Group not found" });
//     res.json(updated);
//   } catch (err) {
//     console.error("Error updating group:", err);
//     res.status(500).json({ error: "Failed to update" });
//   }
// });

// DELETE group
router.delete("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const del = await Group.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "Group not found" });
    res.json({ message: "Group deleted" });
  } catch (err) {
    console.error("Error deleting group:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// GET single group by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Incoming GET /group/:id", id);

  try {
    const group = await Group.findById(id).populate("employees", "name email"); // Populate employees with name and email

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    console.error("Fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

router.delete(
  "/:groupId/delete-document/:docId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    const { groupId, docId } = req.params;
    const { type } = req.query;

    const validTypes = {
      projects: "projects",
      patents: "patents",
      technologies: "technologies",
      publications: "publications",
      courses: "courses",
    };

    const subDocKey = validTypes[type];
    if (!subDocKey) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    try {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });
      console.log("🔍 Group ID:", groupId);
      console.log("🔍 Document ID:", docId);
      console.log("🔍 Document Type:", type);
      console.log("📁 SubDoc Key:", subDocKey);
      console.log("📄 Group[subDocKey]:", group[subDocKey]);

      const docArray = group[subDocKey];
      if (!Array.isArray(docArray)) {
        return res
          .status(400)
          .json({ error: `${subDocKey} array not found in group` });
      }

      const index = docArray.findIndex((doc) => doc._id.toString() === docId);
      if (index === -1) {
        return res.status(404).json({ error: "Document not found in group" });
      }

      // Delete file from disk
      const filePath = path.join(__dirname, "..", docArray[index].fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      // Remove from array
      docArray.splice(index, 1);
      await group.save();

      res.json({ message: "Document deleted successfully", group });
    } catch (err) {
      console.error("❌ Error deleting document:", err.message);
      console.error(err.stack);
      res.status(500).json({ error: "Deletion failed", message: err.message });
    }
  }
);

module.exports = router;
