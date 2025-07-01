const crypto = require("crypto");
const Urls = require("../models/Urls");
const { v4: uuid } = require("uuid");

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function shortenUrl(length = 6) {
  const bytes = crypto.randomBytes(length);
  return [...bytes].map((b) => chars[b % chars.length]).join("");
}

module.exports = {
  shortenUrl: async (req, res) => {
    try {
      const { url_original } = req.body;

      let url_short, urlExists;
      do {
        url_short = shortenUrl();
        urlExists = await Urls.findOne({ url_short });
      } while (urlExists);

      const creationDate = new Date();
      const expireDate = new Date(creationDate.getTime() + 10 * 60 * 1000);

      const newUrl = new Urls({
        _id: uuid(),
        url_original,
        url_short,
        clicks: 0,
        creationDate,
        expireDate,
      });

      await newUrl.save();
      res.status(201).json({
        message: "URL shortened successfully",
        _id: newUrl._id,
        url_short: newUrl.url_short,
        url_original: newUrl.url_original,
        creationDate: newUrl.creationDate,
        expireDate: newUrl.expireDate,
      });
    } catch (error) {
      console.error("Error shortening URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  redirectUrl: async (req, res) => {
    try {
      const { url_short } = req.params;
      const urlData = await Urls.findOne({ url_short });

      if (!urlData) {
        return res.status(404).json({ error: "URL not found" });
      }

      if (urlData.expireDate && urlData.expireDate < new Date()) {
        return res.status(410).json({ error: "URL has expired" });
      }

      urlData.clicks += 1;
      await urlData.save();

      // Emite evento Socket.IO com os dados atualizados
      req.io.emit("clickUpdated", urlData);

      res.redirect(urlData.url_original);
    } catch (error) {
      console.error("Error redirecting URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  deleteUrl: async (req, res) => {
    try {
      const { url_short } = req.params;
      const urlData = await Urls.findOneAndDelete({ url_short });
      if (!urlData) {
        return res.status(404).json({ error: "URL not found" });
      }
      res.status(200).json({ message: "URL deleted successfully" });
    } catch (error) {
      console.error("Error deleting URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getUrls: async (req, res) => {
    try {
      const urls = await Urls.find().sort({ creationDate: -1 });
      res.status(200).json(urls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
