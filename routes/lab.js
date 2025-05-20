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
module.exports = router;
