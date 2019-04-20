var express = require("express");
var router = express.Router({mergeParams: true});
var Playground = require("../models/playground");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews Index
router.get("/", function (req, res) {
    Playground.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, playground) {
        if (err || !playground) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {playground: playground});
    });
});

// Reviews New
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the playground, only one review per user is allowed
    Playground.findById(req.params.id, function (err, playground) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {playground: playground});

    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    //lookup playground using ID
    Playground.findById(req.params.id).populate("reviews").exec(function (err, playground) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated playground to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.playground = playground;
            //save review
            review.save();
            playground.reviews.push(review);
            // calculate the new average review for the playground
            playground.rating = calculateAverage(playground.reviews);
            //save playground
            playground.save();
            req.flash("success", "Deine Bewertung wurde hinzugefügt.");
            res.redirect('/playgrounds/' + playground._id);
        });
    });
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {playground_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Playground.findById(req.params.id).populate("reviews").exec(function (err, playground) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate playground average
            playground.rating = calculateAverage(playground.reviews);
            //save changes
            playground.save();
            req.flash("success", "Deine Bewertung wurde geändert.");
            res.redirect('/playgrounds/' + playground._id);
        });
    });
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Playground.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, playground) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate playground average
            playground.rating = calculateAverage(playground.reviews);
            //save changes
            playground.save();
            req.flash("success", "Deine Bewertung wurde gelöscht.");
            res.redirect("/playgrounds/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;