const express = require("express");
const router = express.Router();
const Group = require("../models/Group.js");

// GET /api/documents/all
router.get("/all", async (req, res) => {
  try {
    const groups = await Group.find({});
    const allDocuments = [];
    for (const group of groups) {
      const docTypes = [
        "projects",
        "patents",
        "technologies",
        "publications",
        "courses",
      ];
      docTypes.forEach((type) => {
        if (Array.isArray(group[type])) {
          group[type].forEach((doc) => {
            allDocuments.push({
              groupName: group.name,
              type,
              name: doc.name,
              description: doc.description,
              url: doc.fileUrl,
            });
          });
        }
      });
    }

    res.json(allDocuments);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

module.exports = router;
