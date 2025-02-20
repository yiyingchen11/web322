const siteData = require("../data/NHSiteData.json");
const provinceAndTerritoryData = require("../data/provinceAndTerritoryData.json");

let sites = [];

// Initialize function
function initialize() {
  return new Promise((resolve, reject) => {
    try {
      sites = siteData.map(site => {
        let provinceObj = provinceAndTerritoryData.find(province => province.code === site.provinceOrTerritoryCode);
        return { ...site, provinceOrTerritoryObj: provinceObj };
      });
      resolve();
    } catch (error) {
      reject("Failed to initialize site data.");
    }
  });
}

// Get all sites
function getAllSites() {
  return new Promise((resolve, reject) => {
    sites.length > 0 ? resolve(sites) : reject("No sites available.");
  });
}

// Get site by ID
function getSiteById(id) {
  return new Promise((resolve, reject) => {
    const site = sites.find(site => site.siteId === id);
    site ? resolve(site) : reject(`Unable to find site with ID: ${id}`);
  });
}

// Get sites by province or territory name 
function getSitesByProvinceOrTerritoryName(name) {
  return new Promise((resolve, reject) => {
    const filteredSites = sites.filter(site =>
      site.provinceOrTerritoryObj.name.toLowerCase().includes(name.toLowerCase())
    );
    filteredSites.length > 0 ? resolve(filteredSites) : reject(`No sites found in province/territory matching: ${name}`);
  });
}

// Filtering sites by date
function getSitesByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const filtered = sites.filter(site => new Date(site.postDate) >= new Date(minDateStr));
    filtered.length > 0 ? resolve(filtered) : reject("No matching date results found.");
  });
}

// Addition  new sites
function addItem(itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = itemData.published ? true : false;
    itemData.siteId = `NEW${sites.length + 1}`;
    sites.push(itemData);
    resolve(itemData);
  });
}

module.exports = {
  initialize,
  getAllSites,
  getSiteById,
  getSitesByProvinceOrTerritoryName,
  getSitesByMinDate,
  addItem
};
