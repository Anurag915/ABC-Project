const mongoose = require("mongoose");
const { Schema } = mongoose;

// Reusable subdocument schema for items with file upload
const FileItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    fileUrl: { type: String, required: true },
  },
  { _id: true }
);
const AssistantDirectorSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: { type: String }, // for retired or non-User ADs
    designation: { type: String, default: "Assistant Director" },
    // image: { type: String },
    from: { type: Date, required: true },
    to: { type: Date }, // null if currently serving
  },
  { _id: true }
);
const ContactInfoSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Email", "Phone", "Address", "Other"],
      required: true,
    },
    label: String,
    value: { type: String, required: true },
  },
  { _id: true }
);

const GroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    about: { type: String, trim: true }, // <-- Add this About field
    vision: { type: String, trim: true }, // Vision statement
    mission: { type: String, trim: true }, // Mission statement
    // Select employees from existing users
    employees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    ad: { type: Schema.Types.ObjectId, ref: "User" }, // Assistant Director
    // Work tracking arrays with file upload + metadata
    projects: [FileItemSchema],
    patents: [FileItemSchema],
    technologies: [FileItemSchema],
    publications: [FileItemSchema],
    courses: [FileItemSchema],
    contactInfo: [ContactInfoSchema], // <-- Add this here
    assistantDirectors: [AssistantDirectorSchema],
    notices: [FileItemSchema],
    circulars: [FileItemSchema],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Group", GroupSchema);
