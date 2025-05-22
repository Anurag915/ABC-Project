const express = require("express");
const Lab = require("../models/Lab.js");
const auth = require("../middlewares/auth.js");
const allowRoles = require("../middlewares/allowRoles.js");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/notices"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const dir = path.join(__dirname, "uploads/notices");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const productdir = path.join(__dirname, "uploads/products");
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/products"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
if (!fs.existsSync(dir)) {
  fs.mkdirSync(productdir, { recursive: true });
}
const circularsDir = path.join(__dirname, "../uploads/circulars");
if (!fs.existsSync(circularsDir)) {
  fs.mkdirSync(circularsDir, { recursive: true });
}

// Multer storage for circulars
const circularStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, circularsDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const advertisementDir = path.join(__dirname, "../uploads/advertisements");

const advertisementStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, advertisementDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const uploadAdvertisement = multer({
  storage: advertisementStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});
const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// const upload = multer({ storage });
// const uploadCircular = multer({ storage: circularStorage });
const uploadCircular = multer({
  storage: circularStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});
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
      .populate({
        path: "directors.user", // 👈 Correctly populates user field inside each director
        select: "firstName lastName email", // Optional: only the fields you need
      });
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
      .populate({
        path: "directors.user", // 👈 Correctly populates user field inside each director
        select: "name email", // Optional: only the fields you need
      });
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

// Add a notice to a lab
router.post(
  "/:id/notices",
  auth,
  allowRoles("admin"),
  upload.single("file"), // 'file' is the field name in Postman/form
  async (req, res) => {
    try {
      const lab = await Lab.findById(req.params.id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const { name, description } = req.body;
      const fileUrl = req.file ? `/uploads/notices/${req.file.filename}` : null;

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      lab.notices.push({ name, description, fileUrl });
      await lab.save();

      res.status(200).json({ message: "Notice added", notices: lab.notices });
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
  uploadCircular.single("file"), // Field name must match in Postman/form
  async (req, res) => {
    try {
      const lab = await Lab.findById(req.params.id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const { name, description } = req.body;
      const fileUrl = req.file
        ? `/uploads/circulars/${req.file.filename}`
        : null;

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      lab.circulars.push({ name, description, fileUrl });
      await lab.save();

      res
        .status(200)
        .json({ message: "Circular added", circulars: lab.circulars });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
);
// Add a advertisement to a lab
router.post(
  "/:labId/advertisements",
  auth,
  allowRoles("admin"),
  uploadAdvertisement.single("file"),
  async (req, res) => {
    try {
      const { labId } = req.params;
      const { name, description } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File is required." });
      }

      const fileUrl = req.file
        ? `/uploads/advertisements/${req.file.filename}`
        : null;
      const advertisement = {
        name,
        description,
        fileUrl,
      };

      const updatedLab = await Lab.findByIdAndUpdate(
        labId,
        { $push: { advertisements: advertisement } },
        { new: true }
      );

      if (!updatedLab) {
        return res.status(404).json({ message: "Lab not found" });
      }

      res.status(201).json({ message: "Advertisement added", advertisement });
    } catch (error) {
      console.error("Error posting advertisement:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//put request for advertisment
router.put(
  "/:labId/advertisements/:id",
  auth,
  allowRoles("admin"),
  uploadAdvertisement.single("file"),
  async (req, res) => {
    try {
      const { labId, id } = req.params;
      const { name, description } = req.body;
      const file = req.file;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const ad = lab.advertisements.id(id);
      if (!ad) return res.status(404).json({ message: "Advertisement not found" });

      // Store old file path
      const oldFilePath = ad.fileUrl ? path.join(__dirname, "..", ad.fileUrl) : null;

      // Update fields
      ad.name = name || ad.name;
      ad.description = description || ad.description;

      if (file) {
        ad.fileUrl = `/uploads/advertisements/${file.filename}`;

        // Delete old file from server
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error("Error deleting old file:", err);
          });
        }
      }

      await lab.save();
      res.json({ message: "Advertisement updated", advertisement: ad });
    } catch (error) {
      console.error("Error updating advertisement:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


//Deletion of advertisement
router.delete(
  "/:labId/advertisements/:adId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId, adId } = req.params;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const ad = lab.advertisements.id(adId);
      if (!ad) return res.status(404).json({ message: "Advertisement not found" });

      // Extract filename from fileUrl
      const filename = path.basename(ad.fileUrl); // This gives '12345-myfile.pdf'

      // Build absolute file path
      const filePath = path.join(__dirname, "..", "uploads", "advertisements", filename);

      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove advertisement entry from DB
      ad.deleteOne(); // Remove the embedded subdocument
      await lab.save();

      res.json({ message: "Advertisement and associated file deleted successfully" });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//Deletion of project , patents, technologiesDeveloped, courses, publications

const deleteAndUnreference = async (labId, field, itemId, Model) => {
  const lab = await Lab.findByIdAndUpdate(
    labId,
    { $pull: { [field]: itemId } },
    { new: true }
  );
  if (!lab) throw new Error("Lab not found");

  const deleted = await Model.findByIdAndDelete(itemId);
  if (!deleted) throw new Error(`${field} document not found`);

  return lab;
};

// Delete Project
router.delete("/:labId/projects/:projectId", auth, allowRoles("admin"), async (req, res) => {
  try {
    const lab = await deleteAndUnreference(req.params.labId, "projects", req.params.projectId, Project);
    res.json({ message: "Project deleted and removed from lab", lab });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Technology Developed
router.delete("/:labId/technologies/:techId", auth, allowRoles("admin"), async (req, res) => {
  try {
    const lab = await deleteAndUnreference(req.params.labId, "technologiesDeveloped", req.params.techId, TechnologyDeveloped);
    res.json({ message: "Technology deleted and removed from lab", lab });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Patent
router.delete("/:labId/patents/:patentId", auth, allowRoles("admin"), async (req, res) => {
  try {
    const lab = await deleteAndUnreference(req.params.labId, "patents", req.params.patentId, Patent);
    res.json({ message: "Patent deleted and removed from lab", lab });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Course Conducted
router.delete("/:labId/courses/:courseId", auth, allowRoles("admin"), async (req, res) => {
  try {
    const lab = await deleteAndUnreference(req.params.labId, "courses", req.params.courseId, CourseConducted);
    res.json({ message: "Course deleted and removed from lab", lab });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Publication
router.delete("/:labId/publications/:publicationId", auth, allowRoles("admin"), async (req, res) => {
  try {
    const lab = await deleteAndUnreference(req.params.labId, "publications", req.params.publicationId, Publication);
    res.json({ message: "Publication deleted and removed from lab", lab });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Helper function to create DELETE route for reference fields
// function createDeleteRoute(field) {
//   router.delete(
//     `/:labId/${field}/:itemId`,
//     auth,
//     allowRoles("admin"),
//     async (req, res) => {
//       try {
//         const { labId, itemId } = req.params;

//         const lab = await Lab.findById(labId);
//         if (!lab) return res.status(404).json({ message: "Lab not found" });

//         lab[field] = lab[field].filter(
//           (id) => id.toString() !== itemId.toString()
//         );

//         await lab.save();
//         res.json({ message: `${field.slice(0, -1)} removed from lab`, [field]: lab[field] });
//       } catch (err) {
//         console.error(`Error removing from ${field}:`, err);
//         res.status(500).json({ message: "Server error" });
//       }
//     }
//   );
// }

// // Apply for all fields
// ["projects", "patents", "technologiesDeveloped", "courses"].forEach(createDeleteRoute);

// Deletion of product 

router.delete(
  "/:labId/products/:adId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId, adId } = req.params;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const ad = lab.products.id(adId);
      if (!ad) return res.status(404).json({ message: "Products not found" });

      // Extract filename from fileUrl
      const filename = path.basename(ad.fileUrl); // This gives '12345-myfile.pdf'

      // Build absolute file path
      const filePath = path.join(__dirname, "..", "uploads", "products", filename);

      // Delete the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove advertisement entry from DB
      ad.deleteOne(); // Remove the embedded subdocument
      await lab.save();

      res.json({ message: "Products and associated file deleted successfully" });
    } catch (error) {
      console.error("Error deleting Products:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// Add a product to a lab
router.post(
  "/:labId/products",
  auth,
  allowRoles("admin"),
  uploadProduct.single("file"), // You can rename this multer config if needed
  async (req, res) => {
    try {
      const { labId } = req.params;
      const { name, description } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File is required." });
      }

      const fileUrl = req.file
        ? `/uploads/products/${req.file.filename}` // You can rename directory to /uploads/products
        : null;

      const product = {
        name,
        description,
        fileUrl,
      };

      const updatedLab = await Lab.findByIdAndUpdate(
        labId,
        { $push: { products: product } },
        { new: true }
      );

      if (!updatedLab) {
        return res.status(404).json({ message: "Lab not found" });
      }

      res.status(201).json({ message: "Product added", product });
    } catch (error) {
      console.error("Error posting product:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/:id/products-advertisements", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id).select(
      "products advertisements"
    );
    if (!lab) return res.status(404).json({ message: "Lab not found" });

    res.json({
      products: lab.products,
      advertisements: lab.advertisements,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/:labId/directors",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { labId } = req.params;
      const { user, name, designation, image, from, to } = req.body;

      if (!from) {
        return res.status(400).json({ message: "'from' date is required" });
      }

      const director = {
        from,
        to: to || null,
      };

      if (user) {
        director.user = user;
      } else {
        director.name = name || "Unknown";
        director.designation = designation || "Unknown";
        director.image = image || null;
      }

      const updatedLab = await Lab.findByIdAndUpdate(
        labId,
        { $push: { directors: director } },
        { new: true }
      ).populate("directors.user", "name email photo");

      if (!updatedLab) {
        return res.status(404).json({ message: "Lab not found" });
      }

      res.status(201).json({ message: "Director added", director });
    } catch (error) {
      console.error("Error adding director:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:id/notices/:noticeId",
  auth,
  allowRoles("admin"),
  upload.single("file"),
  async (req, res) => {
    const { id, noticeId } = req.params;

    try {
      const name = (req.body.name || "").trim();
      const description = (req.body.description || "").trim();
      const fileUrl = req.file
        ? `/uploads/notices/${req.file.filename}` // relative URL here
        : (req.body.fileUrl || "").trim();

      // If file is uploaded, create fileUrl from file info
      // const fileUrl = req.file ? req.file.path : req.body.fileUrl;
      console.log("req.body:", req.body);
      console.log("req.file:", req.file);

      if (!name || !description || !fileUrl) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const lab = await Lab.findById(id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const notice = lab.notices.id(noticeId);
      if (!notice) return res.status(404).json({ error: "Notice not found" });

      // Update notice fields
      notice.name = name;
      notice.description = description;
      notice.fileUrl = fileUrl;

      await lab.save();
      res.json({ message: "Notice updated successfully", notice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.put(
  "/:id/circulars/:circularId",
  auth,
  allowRoles("admin"),
  uploadCircular.single("file"), // assumes you're uploading a file
  async (req, res) => {
    try {
      const { id, circularId } = req.params;

      // Defensive extraction and trimming
      const name = (req.body.name || "").trim();
      const description = (req.body.description || "").trim();
      const fileUrl = req.file
        ? `/uploads/circulars/${req.file.filename}` // relative URL here
        : (req.body.fileUrl || "").trim();

      if (!name || !description || !fileUrl) {
        console.log("Missing field(s):", { name, description, fileUrl });
        return res.status(400).json({ error: "All fields are required" });
      }

      const lab = await Lab.findById(id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const circular = lab.circulars.id(circularId);
      if (!circular)
        return res.status(404).json({ error: "Circular not found" });

      // Update fields
      circular.name = name;
      circular.description = description;
      circular.fileUrl = fileUrl;

      await lab.save();
      res.json({ message: "Circular updated successfully", circular });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.delete(
  "/:id/notices/:noticeId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id, noticeId } = req.params;

      const lab = await Lab.findById(id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const notice = lab.notices.id(noticeId);
      if (!notice) return res.status(404).json({ error: "Notice not found" });

      // Delete the associated file from the server
      const filePath = path.join(__dirname, "..", notice.fileUrl); // Assuming fileUrl is relative like "uploads/notices/filename.pdf"
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove notice from array
      lab.notices.pull(noticeId);
      await lab.save();

      res.json({ message: "Notice deleted successfully" });
    } catch (error) {
      console.error("Delete Notice Error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);
router.delete(
  "/:id/circulars/:circularId",
  auth,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id, circularId } = req.params;

      const lab = await Lab.findById(id);
      if (!lab) return res.status(404).json({ error: "Lab not found" });

      const circular = lab.circulars.id(circularId);
      if (!circular)
        return res.status(404).json({ error: "Circular not found" });

      // Delete associated file from server
      const filePath = path.join(__dirname, "..", circular.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove circular from array
      lab.circulars.pull(circularId);
      await lab.save();

      res.json({ message: "Circular deleted successfully" });
    } catch (error) {
      console.error("Delete Circular Error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);


router.put(
  "/:labId/products/:id",
  auth,
  allowRoles("admin"),
  uploadProduct.single("file"),
  async (req, res) => {
    try {
      const { labId, id } = req.params;
      const { name, description } = req.body;
      const file = req.file;

      const lab = await Lab.findById(labId);
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      const ad = lab.products.id(id);
      if (!ad) return res.status(404).json({ message: "products not found" });

      // Store old file path
      const oldFilePath = ad.fileUrl ? path.join(__dirname, "..", ad.fileUrl) : null;

      // Update fields
      ad.name = name || ad.name;
      ad.description = description || ad.description;

      if (file) {
        ad.fileUrl = `/uploads/products/${file.filename}`;

        // Delete old file from server
        if (oldFilePath && fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, (err) => {
            if (err) console.error("Error deleting old file:", err);
          });
        }
      }

      await lab.save();
      res.json({ message: "products updated", product: ad });
    } catch (error) {
      console.error("Error updating products:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);
module.exports = router;
