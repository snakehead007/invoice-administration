const Settings = require("../models/settings");
const User = require("../models/user");
const Profile = require("../models/profile");
const fs = require("fs");
exports.uploadLogoGet = (req, res) => {
    Settings.findOne({fromUser: req.session._id}, function (err, settings) {
        Profile.findOne({fromUser: req.session._id}, async (err, profile) => {
            res.render("upload", {
                "settings": settings,
                "description": "Upload logo",
                "profile": profile,
                "role": (await User.findOne({_id: req.session._id}, (err, user) => {
                    return user
                })).role
            });
        });
    });
};

exports.uploadLogoPost = async (req, res) => {
    try {
        if (Object.keys(req.files).length === 0) // TODO: THIS CHECK DOESNT WORK
            return res.status(400).send("No files were uploaded.");
        let logoFile = req.files.logoFile;
        if (logoFile.mimetype === "image/jpeg" || logoFile.mimetype === "image/jpg" || !logoFile.mimetype) {
            Profile.findOne({fromUser: req.session._id}, async function (err, profile) {
                let url = "public/images/" + req.session._id + "/logo.jpeg";
                if (!fs.existsSync("public/images/" + req.session._id)) {
                    await fs.mkdirSync("public/images/" + req.session._id);
                }
                await logoFile.mv(url);
                profile.logoFile.data = fs.readFileSync(url);
                profile.logoFile.contentType = "image/jpeg";
                await profile.save();
                req.flash("success", "succefully updated your logo");
                res.redirect("/view/profile/");
            });
        } else {
            req.flash("danger", "Wrong filetype");
            throw new Error();
        }
    } catch (error) {
        req.flash('danger',"Something happend, please try again");
        res.redirect("/upload/logo");
    }
};