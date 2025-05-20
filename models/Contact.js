const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Email", "Phone", "Address", "Other"],
      required: true,
    },
    label: String,
    value: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports =  mongoose.model("ContactInfo", contactInfoSchema);
