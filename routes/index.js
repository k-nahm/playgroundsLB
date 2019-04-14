var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");

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
    // if(req.body.adminCode === 'secret') {
    //   newUser.isAdmin = true;
    // }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register", {"error": err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Willkommen " + user.username);
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


module.exports = router;