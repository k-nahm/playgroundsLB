var express = require("express");
var router  = express.Router();
var Playground = require("../models/playground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware");

//MAPS
var NodeGeocoder = require('node-geocoder');
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
var geocoder = NodeGeocoder(options);

//INDEX - show all playgrounds
router.get("/", function (req, res) {
    var searchDistrict = req.query.search;

    if (searchDistrict==undefined || searchDistrict==false || searchDistrict=="Alle" || searchDistrict=="Stadtteil...") {
        searchDistrict="all";
    }
    if(searchDistrict!="all") {
        Playground.find({district:req.query.search}, function(err, allPlaygrounds){
            if (err) {
                console.log(err);
            } else {
                res.render("playgrounds/index",{playgrounds: allPlaygrounds, page: 'playgrounds'});
            }
        });
        
    }else {
        Playground.find({}, function(err, allPlaygrounds){
            if (err) {
                console.log(err);
            } else {
                res.render("playgrounds/index",{playgrounds: allPlaygrounds, page: 'playgrounds'});
            }
        });
    }
});

//CREATE - add new playground to DB
router.post("/", middleware.isAdmin, function(req, res){
    // get data from form and add to playgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var district = req.body.district;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Ungültige Adresse');
            return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newPlayground = {name: name, image: image, description: desc, district: district, author:author, location: location, lat: lat, lng: lng};
        // Create a new playground and save to DB
        Playground.create(newPlayground, function(err, newlyCreated){
            if(err){
                console.log(err);
            } else {
                //redirect back to playgrounds page
                console.log(newlyCreated);
                res.redirect("/playgrounds");
            }
        });
    });
});

//NEW - show form to create new playground
router.get("/new", middleware.isAdmin, function(req, res){
   res.render("playgrounds/new.ejs"); 
});

// SHOW - shows more info about one playground
router.get("/:id", function (req, res) {
    //find the playground with provided ID
    Playground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundPlayground) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that playground
            res.render("playgrounds/show", {playground: foundPlayground});
        }
    });
});

// EDIT PLAYGROUND ROUTE
router.get("/:id/edit", middleware.checkPlaygroundOwnership, function(req, res){
    Playground.findById(req.params.id, function(err, foundPlayground){
        if(err){
            res.redirect("/playgrounds");
        } else {
            res.render("playgrounds/edit", {playground: foundPlayground});
        }
    });
});

// UPDATE PLAYGROUND ROUTE
router.put("/:id", middleware.checkPlaygroundOwnership, function(req, res){
    delete req.body.playground.rating;
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Ungültige Adresse');
            return res.redirect('back');
        }
        req.body.playground.lat = data[0].latitude;
        req.body.playground.lng = data[0].longitude;
        req.body.playground.location = data[0].formattedAddress;
    
        Playground.findByIdAndUpdate(req.params.id, req.body.playground, function(err, playground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Erfolgreich geändert!");
                res.redirect("/playgrounds/" + playground._id);
            }
        });
    });
});

// DESTROY PLAYGROUND ROUTE
router.delete("/:id", middleware.checkPlaygroundOwnership, function (req, res) {
    Playground.findById(req.params.id, function (err, playground) {
        if (err) {
            res.redirect("/playgrounds");
        } else {
            // deletes all comments associated with the playground
            Comment.remove({"_id": {$in: playground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/playgrounds");
                }
                // deletes all reviews associated with the playground
                Review.remove({"_id": {$in: playground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/playgrounds");
                    }
                    //  delete the playground
                    playground.remove();
                    req.flash("success", "Spielplatz gelöscht.");
                    res.redirect("/playgrounds");
                });
            });
        }
    });
});

module.exports = router;