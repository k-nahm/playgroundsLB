var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: {type: String, unique: true, required: true},
    favoritePlaygrounds: [String],
    comments: [{ playgroundID: String, commentID: String}],
    reviews: [{ playgroundID: String, reviewssID: String}],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {type: Boolean, default: false}
});


UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);