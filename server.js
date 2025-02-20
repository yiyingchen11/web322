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

const fs = require('fs');
const express = require('express');
const path = require('path');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const siteData = require("./modules/data-service");

const app = express();
const PORT = 8080;

// Cloudinary 
cloudinary.config({
  cloud_name: 'Cloud Name',
  api_key: 'API Key',
  api_secret: 'API Secret',
  secure: true
});

const upload = multer();
app.use(express.urlencoded({ extended: true }));

// Initialize the data before starting the server
siteData.initialize()
  .then(() => {
    console.log("Data initialized successfully");


    app.get("/", (req, res) => {
      res.send("Assignment 3: Yiying Chen - 145556221");
    });

    // Get all sites or filter by query parameters
    app.get("/sites", (req, res) => {
      if (req.query.category) {
        siteData.getSitesByProvinceOrTerritoryName(req.query.category)
          .then(data => res.json(data))
          .catch(err => res.status(404).send(err));
      } else if (req.query.minDate) {
        siteData.getSitesByMinDate(req.query.minDate)
          .then(data => res.json(data))
          .catch(err => res.status(404).send(err));
      } else {
        siteData.getAllSites()
          .then(data => res.json(data))
          .catch(err => res.status(404).send(err));
      }
    });

    // Individual Sites by ID
    app.get("/item/:id", (req, res) => {
      siteData.getSiteById(req.params.id)
        .then(data => res.json(data))
        .catch(err => res.status(404).send(err));
    });

    // Display the Add Item page
    app.get("/items/add", (req, res) => {
      res.sendFile(path.join(__dirname, "/views/addItem.html"));
    });

    // Handling requests to add items
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

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on http: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("Error initializing data:", err);
  });
