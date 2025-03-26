
require('dotenv').config();
const { Sequelize, DataTypes, Op } = require('sequelize');
const provinceAndTerritoryData = require('../data/provinceAndTerritoryData.json');
const siteData = require('../data/NHSiteData.json');

// Create Sequelize 
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    logging: false
  }
);

// Define the model
const ProvinceOrTerritory = sequelize.define('ProvinceOrTerritory', {
  code: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
  type: DataTypes.STRING,
  region: DataTypes.STRING,
  capital: DataTypes.STRING
}, { timestamps: false });

const Site = sequelize.define('Site', {
  siteId: { type: DataTypes.STRING, primaryKey: true },
  site: DataTypes.STRING,
  description: DataTypes.TEXT,
  date: DataTypes.INTEGER,
  dateType: DataTypes.STRING,
  image: DataTypes.STRING,
  location: DataTypes.STRING,
  latitude: DataTypes.FLOAT,
  longitude: DataTypes.FLOAT,
  designated: DataTypes.INTEGER,
  provinceOrTerritoryCode: DataTypes.STRING
}, { timestamps: false });

// correlation model
Site.belongsTo(ProvinceOrTerritory, { foreignKey: 'provinceOrTerritoryCode' });

// Initialize database (synchronize model structure)
function initialize() {
  return sequelize.sync();
}

// Get all sites
function getAllSites() {
  return Site.findAll({ include: [ProvinceOrTerritory] });
}

// Access to all areas
function getAllProvincesAndTerritories() {
  return ProvinceOrTerritory.findAll();
}

// Get individual sites by ID
function getSiteById(id) {
  return Site.findOne({
    where: { siteId: id },
    include: [ProvinceOrTerritory]
  });
}

// Search by area name
function getSitesByProvinceOrTerritoryName(name) {
  return Site.findAll({
    include: {
      model: ProvinceOrTerritory,
      where: {
        name: { [Op.iLike]: `%${name}%` }
      }
    }
  });
}

// Search by area name
function getSitesByRegion(region) {
  return Site.findAll({
    include: {
      model: ProvinceOrTerritory,
      where: {
        region: { [Op.iLike]: `%${region}%` }
      }
    }
  });
}

// Add new site
function addSite(siteData) {
  return Site.create(siteData);
}

// Edit existing site
function editSite(id, siteData) {
  return Site.update(siteData, { where: { siteId: id } });
}

// Delete site
function deleteSite(id) {
  return Site.destroy({ where: { siteId: id } });
}

// Export all functions
module.exports = {
  initialize,
  getAllSites,
  getSiteById,
  getSitesByProvinceOrTerritoryName,
  getSitesByRegion,
  getAllProvincesAndTerritories,
  addSite,
  editSite,
  deleteSite
};
