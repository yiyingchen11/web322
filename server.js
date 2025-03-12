/*********************************************************************************
* WEB322 – Assignment 1
* I declare that this assignment is my own work in accordance with Seneca Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Name: __Yiying Chen____________________ Student ID: ____145556221______________ Date: ____2025.02.19________________
*
********************************************************************************/
/*********************************************************************************
* WEB322 – Assignment 3
* Name: Yiying Chen       Student ID: 145556221    Date: 2025.02.19
********************************************************************************/

const express = require('express');
const path = require('path');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const siteData = require("./modules/data-service");

const app = express();
const PORT = 8080;

// Configure EJS as the view engine.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Parsing static resources (e.g. CSS, JS, images).
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Configure Cloudinary.
cloudinary.config({
  cloud_name: 'Cloud Name',
  api_key: 'API Key',
  api_secret: 'API Secret',
  secure: true
});

const upload = multer();

//  Initialize the data.
siteData.initialize()
  .then(() => {
    console.log("Data initialized successfully");

    // Home
    app.get("/", (req, res) => {
      res.render("home");
    });
    //  About 
    app.get("/about", (req, res) => {
      res.render("about", { page: "/about" });
    });


    // Show all sites.
    app.get("/sites", (req, res) => {
      siteData.getAllSites()
        .then(sites => {
          let filteredSites = sites;

          // Handles region filtering.
          if (req.query.region) {
            filteredSites = sites.filter(site =>
              site.provinceOrTerritoryObj.region.toLowerCase().trim() === req.query.region.toLowerCase().trim()
            );
            if (filteredSites.length === 0) {
              return res.status(404).render("404", { message: `No sites found in region: ${req.query.region}` });
            }
          }

          // Handles provinceOrTerritory filtering.
          if (req.query.provinceOrTerritory) {
            filteredSites = filteredSites.filter(site => site.provinceOrTerritoryObj.name === req.query.provinceOrTerritory);
            if (filteredSites.length === 0) {
              return res.status(404).render("404", { message: `No sites found in province/territory: ${req.query.provinceOrTerritory}` });
            }
          }

          res.render("sites", { sites: filteredSites });
        })
        .catch(err => res.status(500).render("404", { message: "Error retrieving site data." }));
    });

    // Site Details.
    app.get("/item/:id", (req, res) => {
      siteData.getSiteById(req.params.id)
        .then(data => res.render("site", { site: data }))
        .catch(err => res.status(404).render("404", { message: "Site not found." }));
    });

    //  The Add Site screen is displayed.
    app.get("/items/add", (req, res) => {
      res.render("addItem");
    });

    // Processing of additional sites.
    app.post("/items/add", upload.single("featureImage"), (req, res) => {
      if (req.file) {
        let streamUpload = (req) => {
          return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream((error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            });
            streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
        };

        async function upload(req) {
          let result = await streamUpload(req);
          return result;
        }

        upload(req).then((uploaded) => {
          processItem(uploaded.url);
        });
      } else {
        processItem("");
      }

      function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        siteData.addItem(req.body).then(() => {
          res.redirect("/sites");
        });
      }
    });

    //404 Page
    app.use((req, res) => {
      res.status(404).render("404", { message: "Page not found." });
    });

    // Start the server.
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("Error initializing data:", err);
  });