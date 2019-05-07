require('dotenv').config()

var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Playground  = require("./models/playground"),
    User        = require("./models/user");
    
//requring routes
var reviewRoutes     = require("./routes/reviews"),
    playgroundRoutes = require("./routes/playgrounds"),
    indexRoutes      = require("./routes/index");

mongoose.connect('mongodb://localhost:27017/playground_app', { useNewUrlParser: true, useCreateIndex: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB();

app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/playgrounds", playgroundRoutes);
app.use("/playgrounds/:id/reviews", reviewRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The Playground Server Has Started!");
});