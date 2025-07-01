const mongoose = require("mongoose");

const urlsSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  url_original: {
    type: String,
  },
  url_short: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
  expireDate: {
    type: Date,
    expires: 0,
  },
});

module.exports = mongoose.model("Urls", urlsSchema);
