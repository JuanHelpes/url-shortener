const express = require("express");
const routes = express.Router();

const urlsController = require("../controllers/urlsController");

routes.post("/shorten", urlsController.shortenUrl);
routes.get("/:url_short", urlsController.redirectUrl);
routes.delete("/:url_short", urlsController.deleteUrl);
routes.get("/", urlsController.getUrls);
module.exports = routes;
