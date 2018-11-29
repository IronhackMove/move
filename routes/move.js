const express = require("express");
const passport = require('passport');
const router = express.Router();
const Epoint = require("../models/Epoint");
const User = require("../models/User");

router.get("/home", (req, res, next) => {
  User.find()
  .then(users => {
    console.log(users);
  })
  console.log(req.user);
  if(req.user) {
    res.render("move/home", {user: req.user});
  } else {
    res.render('move/home')
  }
  console.log(req.user);
  
});


router.get("/getPointsOfCharge", (req, res, next) => {
  Epoint.find()
  .then(points => {
    res.json(points)
  })
});

module.exports = router;