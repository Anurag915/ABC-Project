const mongoose = require("mongoose");
const courseConductedSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    instructor: { type: String },
    documentUrl: { type: String, required: true }, // Path to uploaded file (PDF, doc, etc.)
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("CourseConducted", courseConductedSchema);
