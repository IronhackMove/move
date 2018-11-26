const express = require("express");
const router = express.Router();
const axios = require("axios");

const Epoint = require("../models/Epoint");

// Time for setInterval
var dayInMilliseconds = 1000 * 60 * 60 * 24;

// SetInterval that will download once a day the dataBase of the Gob

setInterval(() => {
  axios
    .get(
      "https://www.electromaps.com/ejson/puntos_cluster.json?lat_min=-21.575513063103706&lon_min=-20.639870293229592&lat_max=44.58498114533759&lon_max=5.6512646524009824&zoom=17&vehiculos=T&tipos=T&connectors=T&velocidades=T&active_app=0&active_rfid=0&lista=ALL"
    )
    .then(response => {
      return convertToGeoJSONandSave(response.data);
    })
    .then(geojson => {
      Epoint.create(geojson)
        .then(points => {
          console.log(points);
        })
        .catch(err => console.log(err));
    });
}, dayInMilliseconds);

function convertToGeoJSONandSave(json) {
  var geojson = [];

  for (i = 0; i < json.simple.length; i++) {
    var coordinates = [+json.simple[i].longitud, +json.simple[i].latitud];

    geojson.push({
      type: "Feature",
      properties: {
        stationName: json.simple[i].nombre,
        totalDocks: 5
      },
      geometry: {
        type: "Point",
        coordinates: coordinates
      }
    });
  }
  return geojson;
}

/* GET home page */

router.get("/", (req, res, next) => {
  res.render("index");
});

module.exports = router;
