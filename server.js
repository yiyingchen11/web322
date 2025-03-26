const express = require('express');
const path = require('path');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const siteData = require("./modules/data-service");

const app = express();
const PORT = 8080;

// EJS 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static Resources and Forms Parsing
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Cloudinary 
cloudinary.config({
  cloud_name: 'dsmhfiuer',
  api_key: '835383986911247',
  api_secret: 'IKkMRuZjj-it7PO67cAv7AJbLpc',
  secure: true
});

const upload = multer();

// Start the service after initializing the database
siteData.initialize().then(() => {
  console.log(" The data is initialized.");

  // Home
  app.get("/", (req, res) => {
    res.render("home");
  });

  // About Page
  app.get("/about", (req, res) => {
    res.render("about", { page: "/about" });
  });

  // All sites
  app.get("/sites", (req, res) => {
    if (req.query.province) {
      siteData.getSitesByProvinceOrTerritoryName(req.query.province)
        .then(sites => res.render("sites", { sites, page: "/sites" }))
        .catch(() => res.render("sites", { sites: [], page: "/sites", message: "No results." }));
    } else if (req.query.region) {
      siteData.getSitesByRegion(req.query.region)
        .then(sites => res.render("sites", { sites, page: "/sites" }))
        .catch(() => res.render("sites", { sites: [], page: "/sites", message: "No results." }));
    } else {
      siteData.getAllSites()
        .then(sites => res.render("sites", { sites, page: "/sites" }))
        .catch(() => res.render("sites", { sites: [], page: "/sites", message: "No results." }));
    }
  });

  // Individual site detail pages
  app.get("/site/:id", (req, res) => {
    siteData.getSiteById(req.params.id)
      .then(site => {
        if (site) {
          res.render("site", { site, page: "/sites" });
        } else {
          res.status(404).render("404", { message: "Site not found." });
        }
      })
      .catch(() => res.status(500).render("500"));
  });

  // Add site form page
  app.get("/items/add", (req, res) => {
    siteData.getAllProvincesAndTerritories()
      .then(provinces => res.render("addItem", { provinces }))
      .catch(() => res.render("500"));
  });

  // Add site submission processing
  app.post("/items/add", upload.single("image"), async (req, res) => {
    try {
      let imageUrl = "";

      if (req.file) {
        const streamUpload = (req) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream((error, result) => {
              if (result) resolve(result);
              else reject(error);
            });
            streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
        };
        const uploaded = await streamUpload(req);
        imageUrl = uploaded.url;
      }

      const newSite = {
        siteId: req.body.siteId,
        site: req.body.site,
        description: req.body.description,
        date: req.body.date,
        dateType: req.body.dateType,
        image: imageUrl,
        location: req.body.location,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        designated: req.body.designated,
        provinceOrTerritoryCode: req.body.provinceOrTerritoryCode
      };

      await siteData.addSite(newSite);
      res.redirect("/sites");

    } catch (err) {
      res.status(500).render("500", { message: "Failed to add site." });
    }
  });

  // Edit Site - Show Forms
  app.get("/editSite/:id", async (req, res) => {
    try {
      const site = await siteData.getSiteById(req.params.id);
      const provinces = await siteData.getAllProvincesAndTerritories();
      res.render("editSite", { site, provinces });
    } catch (err) {
      res.status(500).render("500", { message: "Failed to load edit form." });
    }
  });

  // Edit Site - Submission Processing
  app.post("/editSite", upload.single("image"), async (req, res) => {
    try {
      let imageUrl = req.body.currentImage;

      if (req.file) {
        const streamUpload = (req) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream((error, result) => {
              if (result) resolve(result);
              else reject(error);
            });
            streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
        };
        const uploaded = await streamUpload(req);
        imageUrl = uploaded.url;
      }

      const updatedSite = {
        site: req.body.site,
        description: req.body.description,
        date: req.body.date,
        dateType: req.body.dateType,
        image: imageUrl,
        location: req.body.location,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        designated: req.body.designated,
        provinceOrTerritoryCode: req.body.provinceOrTerritoryCode
      };

      await siteData.editSite(req.body.siteId, updatedSite);
      res.redirect("/sites");

    } catch (err) {
      res.status(500).render("500", { message: "Failed to update site." });
    }
  });

  // Delete site
  app.get("/deleteSite/:id", async (req, res) => {
    try {
      await siteData.deleteSite(req.params.id);
      res.redirect("/sites");
    } catch (err) {
      res.status(500).render("500", { message: "Failed to delete site." });
    }
  });

  // 404 
  app.use((req, res) => {
    res.status(404).render("404", { message: "Page not found." });
  });

  // Start the server.
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

}).catch(err => {
  console.error(" Initialization failed:", err);
});
