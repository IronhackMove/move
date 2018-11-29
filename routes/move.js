const express = require("express");
const passport = require('passport');
const router = express.Router();
const Epoint = require("../models/Epoint");

router.get("/home", (req, res, next) => {
  res.render("move/home");
});


router.get("/getPointsOfCharge", (req, res, next) => {
  Epoint.find()
  .then(points => {
    res.json(points)
  })
});

module.exports = router;