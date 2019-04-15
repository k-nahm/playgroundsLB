var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Playground = require("../models/playground");

//root route
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'});
});

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    var newUser = new User({
        username: req.body.username,
        email: req.body.email,
      });
    
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register", {"error": err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Willkommen" +req.body.username);
           res.redirect("/playgrounds"); 
        });
    });
});

// show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'});
});

// handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/playgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Abgemeldet!");
   res.redirect("/playgrounds");
});

// USER PROFILE
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if(err) {
      req.flash("error", "Etwas ist schiefgelaufen.");
      return res.redirect("/");
    }
    Playground.find().where('author.id').equals(foundUser._id).exec(function(err, playgrounds) {
      if(err) {
        req.flash("error", "Etwas ist schiefgelaufen.");
        return res.redirect("/");
      }
      res.render("users/show", {user: foundUser, playgrounds: playgrounds});
    })
  });
});


module.exports = router;