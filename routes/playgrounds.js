var express = require("express");
var router  = express.Router();
var Playground = require("../models/playground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//INDEX - show all playgrounds
router.get("/", function(req, res){
    // Get all playgrounds from DB
    Playground.find({}, function(err, allPlaygrounds){
       if(err){
           console.log(err);
       } else {
          res.render("playgrounds/index",{playgrounds:allPlaygrounds});
       }
    });
});

//CREATE - add new playground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var newPlayground = {name: name, image: image, description: desc, author:author};
    // Create a new playground and save to DB
    Playground.create(newPlayground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to playgrounds page
            res.redirect("/playgrounds");
        }
    });
});

//NEW - show form to create new playground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("playgrounds/new.ejs"); 
});

// SHOW - shows more info about one playground
router.get("/:id", function(req, res){
    //find the playground with provided ID
    Playground.findById(req.params.id).populate("comments").exec(function(err, foundPlayground){
        if(err || !foundPlayground){
            req.flash("error", "Spielplatz nicht gefunden.");
            res.redirect("back");
        } else {
            console.log(foundPlayground);
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
    // find and update the correct playground
    Playground.findByIdAndUpdate(req.params.id, req.body.playground, function(err, updatedPlayground){
       if(err){
           res.redirect("/playgrounds");
       } else {
           res.redirect("/playgrounds/" + req.params.id);
       }
    });
});

// DESTROY PLAYGROUND ROUTE
// router.delete("/:id", function(req, res){
//   Playground.findByIdAndRemove(req.params.id, function(err){
//       if(err){
//           res.redirect("/playgrounds");
//       } else {
//           res.redirect("/playgrounds");
//       }
//   });
// });

router.delete("/:id", middleware.checkPlaygroundOwnership, (req, res) => {
    Playground.findByIdAndRemove(req.params.id, (err, playgroundRemoved) => {
        if (err) {
            console.log(err);
        }
        Comment.deleteMany( {_id: { $in: playgroundRemoved.comments } }, (err) => {
            if (err) {
                console.log(err);
            }
            res.redirect("/playgrounds");
        });
    });
});

module.exports = router;