var Playground = require("../models/playground");
var Comment = require("../models/comment");
var Review = require("../models/review");

// all the middleare goes here
var middlewareObj = {};

middlewareObj.checkPlaygroundOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Playground.findById(req.params.id, function(err, foundPlayground){
           if(err || !foundPlayground){
               req.flash("error", "Spielplatz nicht gefunden.");
               res.redirect("back");
           }  else {
               // does user own the playground?
            if(req.user.isAdmin) {
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
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
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

middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "Du hast nicht die Berechtigung das zu tun.");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "Bitte log dich ein.");
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Playground.findById(req.params.id).populate("reviews").exec(function (err, foundPlayground) {
            if (err || !foundPlayground) {
                req.flash("error", "Spielplatz nicht gefunden.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundPlayground.reviews
                var foundUserReview = foundPlayground.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "Du hast schon eine Bewertung abgegeben.");
                    return res.redirect("/playgrounds/" + foundPlayground._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
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

middlewareObj.isAdmin = function(req, res, next){
    if(req.user.isAdmin) {
        return next();
    }
    req.flash("error", "Das kann nur der Admin tun.");
    res.redirect("/login");
};

module.exports = middlewareObj;