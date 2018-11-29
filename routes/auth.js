const express = require("express");
const passport = require('passport');
const router = express.Router();

const User = require("../models/User");
const Car = require("../models/Car");

const Bussines = require("../models/Bussines");
const Chargingpoints = require("../models/Chargingpoints")


// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.get("/login", (req, res, next) => {
  res.render("epoint/home", {
    "message": req.flash("error")
  });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/move/home",
  failureRedirect: "/",
  failureFlash: true,
  passReqToCallback: true
}));


router.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {
  
  if (req.body.models !== '') {

    const model = req.body.model;
    const brand = req.body.brand;
    const autonomy = req.body.autonomy;

    const username = req.body.user;
    const password = req.body.password;
    const email = req.body.email;


    if (email === "" || password === "") {
      res.render("auth/signup", {
        message: "Indicate email and password"
      });
      return;
    }

    User.findOne({
      username
    }, "username", (err, user) => {
      if (user !== null) {
        res.render("auth/signup", {
          message: "The username already exists"
        });
        return;
      }
    })

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let confirmationCode = '';
    for (let i = 0; i < 25; i++) {
      confirmationCode += characters[Math.floor(Math.random() * characters.length)];
    }


    const newCar = new Car({
      brand,
      model,
      autonomy
    });


    newCar.save()
      .then((car) => {

        const newUser = new User({
          username,
          email,
          password: hashPass,
          confirmationCode,
          car: [car._id]
        });

        newUser.save()
          .then(() => {
            req.login(newUser, function(err) {
              if (err) { return next(err); }
              return res.redirect('/move/home');
            });
          })
      })
      .catch(err => {
        res.render("auth/signup", {
          message: "Something went wrong"
        });
      })


  } else {

    const street = req.body.street;
    const number = req.body.number;
    const cp = req.body.cp;
    const city = req.body.city;

    const username = req.body.user;
    const password = req.body.password;
    const email = req.body.email;



    if (email === "" || password === "") {
      res.render("auth/signup", {
        message: "Indicate email and password"
      });
      return;
    }

    Bussines.findOne({
        username
      },
      "username", (err, user) => {
        if (user !== null) {
          res.render("auth/signup", {
            message: "The username already exists"
          });
          return;
        }

        const salt = bcrypt.genSaltSync(bcryptSalt);
        const hashPass = bcrypt.hashSync(password, salt);
        const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let confirmationCode = '';
        for (let i = 0; i < 25; i++) {
          confirmationCode += characters[Math.floor(Math.random() * characters.length)];
        }
        const newChargingpoints = new newChargingpoints({
          street,
          number,
          cp,
          city
        });

        newChargingpoints.save()
          .then((chargingpoints) => {

            const newBussines = new Bussines({
              username,
              email,
              password: hashPass,
              confirmationCode,
              chargingpoints: [chargingpoints._id]
            });

            newBussines.save()
              .then(() => {
                res.redirect("/");
              })
              .catch(err => {
                res.render("auth/signup", {
                  message: "Something went wrong"
                });
              })
          });

      });
  }
});

router.get(
  "/confirm/:confirmationCode",
  (req, res) => {

    User.findOne({
      confirmationCode: req.params.confirmationCode
    }).then(user => {
      User.findByIdAndUpdate(user.id, {
        status: "Active"
      }).then(() => {
        res.render("auth/confirm", {
          user
        });
      })

    }, console.log("Error"));
  }
);

router.get("/profile/:username", (req, res) => {
  User.findOne({
    username: req.params.username
  }).then(user => {
    res.render("auth/profile", {
      user
    });
  }, console.log("Error"));
});


router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/move/home");
});

module.exports = router;