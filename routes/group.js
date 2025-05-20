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


const groupCircularStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/groupCirculars"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const circularDir = path.join(__dirname, "uploads/groupCirculars");
if (!fs.existsSync(circularDir)) {
  fs.mkdirSync(circularDir, { recursive: true });
}

const uploadGroupCircular = multer({
  storage: groupCircularStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const groupNoticeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/groupNotices"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const noticeDir = path.join(__dirname, "uploads/groupNotices");
if (!fs.existsSync(noticeDir)) {
  fs.mkdirSync(noticeDir, { recursive: true });
}

const uploadGroupNotice = multer({
  storage: groupNoticeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

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

router.get("/name", async (req, res) => {
  try {
    const groups = await Group.find().select("name _id"); // Only return name and id
    res.status(200).json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST create new group
router.post("/", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { labId } = req.params;
    const { name, description, vision, mission, employees, about, ADs } =
      req.body;
    if (!name) return res.status(400).json({ error: "Group name required" });

    const group = new Group({
      name,
      description,
      vision,
      mission,
      labId,
      employees,
      about,
      ADs,
    });
    const saved = await group.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});
router.post(
  "/:groupId/assistant-directors",
  auth,
  allowRoles("admin"), // Only admin can add ADs, as per your requirement
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const {
        user,
        name,
        designation = "Assistant Director",
        image,
        from,
        to,
      } = req.body;

      if (!from) {
        return res.status(400).json({ error: "'from' date is required" });
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const newAD = {
        user: user || undefined,
        name: name || undefined,
        designation,
        image: image || undefined,
        from: new Date(from),
      };

      // Only add 'to' field if provided (and the role is already admin due to middleware)
      if (to) {
        newAD.to = new Date(to);
      }

      group.assistantDirectors.push(newAD);
      await group.save();

      res.status(201).json({
        message: "Assistant Director added successfully",
        assistantDirector: newAD,
      });
    } catch (err) {
      console.error("Error adding AD:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// UPDATE group details (name, description, vision, mission, employees)
router.put("/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { name, description, vision, mission, employees, ad } = req.body;
    const updated = await Group.findByIdAndUpdate(
      req.params.id,
      { name, description, vision, mission, employees, ad },
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
    const group = await Group.findById(id)
      .populate("employees", "name email photo")
      .populate("ad", "name email photo"); // Populate ADs with name, email, and designation // Populate employees with name and email
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
// Add contact info to a group
router.post(
  "/:groupId/contact-info",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { type, label, value } = req.body;
      if (!type || !value) {
        return res.status(400).json({ error: "Type and value are required" });
      }

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      group.contactInfo = group.contactInfo || [];
      group.contactInfo.push({ type, label, value });

      await group.save();
      res.json({
        message: "Contact info added",
        contactInfo: group.contactInfo,
      });
    } catch (err) {
      console.error("Error adding contact info:", err);
      res.status(500).json({ error: "Failed to add contact info" });
    }
  }
);

// Update a specific contact info entry by its ID
router.put(
  "/:groupId/contact-info/:contactId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { groupId, contactId } = req.params;
      const { type, label, value } = req.body;

      if (!type || !value) {
        return res.status(400).json({ error: "Type and value are required" });
      }

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const contact = group.contactInfo.id(contactId);
      if (!contact)
        return res.status(404).json({ error: "Contact info not found" });

      contact.type = type;
      contact.label = label;
      contact.value = value;

      await group.save();
      res.json({
        message: "Contact info updated",
        contactInfo: group.contactInfo,
      });
    } catch (err) {
      console.error("Error updating contact info:", err);
      res.status(500).json({ error: "Failed to update contact info" });
    }
  }
);

// Delete a specific contact info entry by its ID
router.delete(
  "/:groupId/contact-info/:contactId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { groupId, contactId } = req.params;

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const contact = group.contactInfo.id(contactId);
      if (!contact)
        return res.status(404).json({ error: "Contact info not found" });

      group.contactInfo.pull(contactId); // ✅ Correct way to remove subdoc

      await group.save();
      res.json({
        message: "Contact info deleted",
        contactInfo: group.contactInfo,
      });
    } catch (err) {
      console.error("Error deleting contact info:", err);
      res.status(500).json({ error: "Failed to delete contact info" });
    }
  }
);

router.post(
  "/:id/notices",
  auth,
  allowRoles("admin"),
  uploadGroupNotice.single("file"), // 'file' is the field name in Postman/form
  async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: "group not found" });

      const { name, description } = req.body;
      const fileUrl = req.file
        ? `/uploads/groupNotices/${req.file.filename}`
        : null;

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      group.notices.push({ name, description, fileUrl });
      await group.save();

      res.status(200).json({ message: "Notice added", notices: group.notices });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

// Add a circular to a lab
router.post(
  "/:id/circulars",
  auth,
  allowRoles("admin"),
  uploadGroupCircular.single("file"), // Field name must match in Postman/form
  async (req, res) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: "group not found" });

      const { name, description } = req.body;
      const fileUrl = req.file
        ? `/uploads/groupCirculars/${req.file.filename}`
        : null;

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      group.circulars.push({ name, description, fileUrl });
      await group.save();

      res
        .status(200)
        .json({ message: "Circular added", circulars: group.circulars });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);

module.exports = router;
