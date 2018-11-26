const express = require("express");
const passport = require('passport');
const router = express.Router();
const User = require("../models/User");
const Car = require("../models/Car");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.get("/login", (req, res, next) => {
  res.render("auth/login", { "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const email    = req.body.email;
  // const img      = file;

  if (email === "" || password === "") {
    res.render("auth/signup", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return;
    }

    const salt     = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashPass,
      //img
    });

    newUser.save()
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      res.render("auth/signup", { message: "Something went wrong" });
    })
  });
});



router.get("/car", (req, res, next) => {
  res.render("auth/car");
}); 

router.post("/car", (req, res, next) => {
  const brand = req.body.brand;
  const model = req.body.model;
  const autonomy    = req.body.autonomy;

  if (brand === "" || model === "") {
    res.render("auth/car", { message: "Add your car for calculate your travel" });
    return;
  }
})

router.get("/signupbussines", (req, res, next) => {
  res.render("auth/signupbussines");
});

router.post("/signupbussines", (req, res, next) => {
  const password = req.body.password;
  const email    = req.body.email;

  if (email === "" || password === "") {
    res.render("auth/signupbussines", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signupbussines", { message: "The username already exists" });
      return;
    }

    const salt     = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      email,
      password: hashPass,
    });

    newUser.save()
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      res.render("auth/signupbussines", { message: "Something went wrong" });
    })
  });
});



router.get("/chargingpoints", (req, res, next) => {
  res.render("auth/chargingpoints");
}); 

router.post("/chargingpoints", (req, res, next) => {
  const brand = req.body.brand;
  const model = req.body.model;
  const autonomy    = req.body.autonomy;

  if (brand === "" || model === "") {
    res.render("auth/chargingpoints", { message: "Add your car for calculate your travel" });
    return;
  }


  User.findOne({ autonomy }, "autonomy", (err, user) => {
    if (err !== null) {
      res.render("auth/car", { message: "This autonomy no correct" });
      return;
    }

    const newUser = new Car({
      brand,
      model,
      autonomy,
    });

    newUser.save()
    .then(() => {
      res.redirect("/");
    })
    .catch(err => {
      res.render("auth/car", { message: "Something went wrong" });
    })
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
