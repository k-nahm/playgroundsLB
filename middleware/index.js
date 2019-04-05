var Playground = require("../models/playground");
var Comment = require("../models/comment");

// all the middleare goes here
var middlewareObj = {};

middlewareObj.checkPlaygroundOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Playground.findById(req.params.id, function(err, foundPlayground){
           if(err || !foundPlayground){
               req.flash("error", "Spielplatz nicht gefunden.");
               res.redirect("back");
           }  else {
               // does user own the campground?
            if(foundPlayground.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "Du hast nicht die Rechte das zu tun.");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "Du musst angemeldet sein, um das zu tun.");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err || !foundComment){
                req.flash("error", "Kommentar nicht gefunden.");
                res.redirect("back");
           } else {
                // does user own the comment?
                if(foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "Du hast nicht die Rechte das zu tun.");
                    res.redirect("back");
                }
           }
        });
    } else {
        req.flash("error", "Du musst angemeldet sein, um das zu tun.");
        res.redirect("back");
    }
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Log dich bitte ein.");
    res.redirect("/login");
};

module.exports = middlewareObj;