/**
 * @module controllers/loginController
 */

const google = require("../middlewares/google");
const User = require("../models/user");
const Settings = require("../models/settings");
const Profile = require("../models/profile");
const logger = require("../middlewares/logger");
const Error = require('../middlewares/error');
const {getIp} = require("../utils/utils");
exports.loginGet = async (req, res) => {
    if(req.session._id){
        let user = await User.findOne({_id:req.session._id},(err,user)=>{
            Error.handler(req,res,err,'7L0000','','NO_REDIRECT');
            return user;
        });
        if(!user){
            logger.warning.log("[WARNING]: User on Ip "+getIp(req)+" has session _id, but not valid. session: "+req.session);
            req.flash("danger","Could not logging, please try again. Or contact us.");
            return res.redirect("/");
        }
        logger.info.log("[INFO]: Email:\'"+req.session.email+"\' already in session, redirecting to dashboard");
        return res.redirect("/dashboard");
    }
    //req.session.regenerate(function(err) {
    // will have a new session here
    res.render("login");
};

exports.createUserGet = async function getCreateNewUser(req, res) {
    if (process.env.DEVELOP === "true" && process.env.DEVELOP_WITH_GOOGLE === "false") {
        let newUser;
        if (process.env.DEVELOP_NO_RANDOM_USER === "false") {
            const googleId = Math.floor((Math.random() * 99999999999999999999999999999999999) + 10000000000000000000000000000000000);
            const email = Math.floor((Math.random() * 99999999999999999999999999999999999) + 10000000000000000000000000000000000);
            newUser = new User({
                googleId: googleId,
                email: email,
                tokens: {}
            });
            /// TODO , refactor duplicate lines
            await newUser.save();
            const currentUser = await User.findOne({googleId: googleId}, function (err, User) {
                if(err) Error.handler(req,res,err,'7L0100','','NO_REDIRECT');
                return User._id;
            });
            const newSettings = new Settings({
                fromUser: currentUser._id
            });
            await newSettings.save();
            const newProfile = new Profile({
                fromUser: currentUser._id
            });
            await newProfile.save();
            const settings = await Settings.findOne({fromUser: currentUser._id});
            const profile = await Profile.findOne({fromUser: currentUser._id});
            await User.updateOne({_id: currentUser._id}, {settings: settings._id, profile: profile._id},(err)=>{
                if(err) Error.handler(req,res,err,'7L0101');
            });
            req.session._id = currentUser._id;
            req.session.loggedIn = currentUser;
        } else { //DEVELOP_NO_RANDOM_USER === true
            await User.findOne({}, function (err, User) {
                if (err) if(err) Error.handler(req,res,err,'7L0102');
                if (User.length <= 0) {
                } else {
                    newUser = User[0];
                }
            });
        }
        if (process.env.LOGGING > 1) {
        }
        req.session.email = newUser.email;
        res.redirect("/dashboard");
    } else {
        res.redirect(google.urlGoogle());
    }
};

