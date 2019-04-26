var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Playground = require("../models/playground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

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
   if(req.body.password===req.body.password2) {
      //  var newUser = new User({username: req.body.username});
    var newUser = new User({
        username: req.body.username,
        email: req.body.email,
      });
    
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register", {"error": err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Willkommen " +req.body.username);
           res.redirect("/playgrounds"); 
        });
    });
   }else {
      req.flash("error", "Passwörter stimmen nicht überein.");
      return res.redirect('back');  
   }
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


// forgot passwort

router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'Es existiert kein Profil mit dieser E-Mail-Adresse.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'lb.spielplatz@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'lb.spielplatz@gmail.com',
        subject: 'Passwort zurücksetzen',
        text: 'Du bekommst diese E-Mail, weil du (oder jemand anders) angefordert hast dein Passwort zurückzusetzen.\n\n' +
          'Bitte klick auf den folgenden Link, oder gebe ihn in deinen Browser ein:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'Wenn du das nicht angefordert hast, ignoriere diese E-Mail und dein Passwort bleibt unverändert.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'Eine E-Mail mit weiteren Anweisungen wurde an ' + user.email + ' gesendet');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Passwort Token ist ungültig oder agelaufen.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Passwort Token ist ungültig oder agelaufen.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwörter stimmen nicht überein.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'lb.spielplatz@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'lb.spielplatz@mail.com',
        subject: 'Dein Passwort wurde geändert',
        text: 'Hallo,\n\n' +
          'Das ist eine Bestätigung, dass das Passwort für deinen Account ' + user.email + ' gerade geändert wurde.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Dein Passwort wurde geändert.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/playgrounds');
  });
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