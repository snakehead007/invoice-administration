/**
 * @module controllers/dashboardController
 */

const Settings = require("../models/settings");
const Profile = require("../models/profile");
const Invoice = require("../models/invoice");
const {month, month_small, year} = require("../utils/date");
const User = require("../models/user");
const i18n = require("i18n");
const logger = require('../middlewares/logger');
/**
 * @apiVersion 3.0.0
 * @api {get} / mainGet
 * @apiDescription This gives back the dashboard
 * @apiName mainGet
 * @apiGroup DashboardRouter
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *  {{
        "currentUrl": "dashboard",
        "total": newChart,
        "settings": settings,
        "year": (new Date).getFullYear(),
        "profile": profile,
        "invoices": invoice_open,
        "role": role
    }
 */
exports.mainGet = async function getLogin(req, res) {
    //Finds a profile, if not found will create a new one
    Profile.findOne({fromUser: req.session._id}, async function (err, profile) {
        if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.mainGet on method Profile.findOne trace: "+err.message);
        if (profile === null) {
            logger.error.log("[WARNING]: No profile found for User "+req.session.email);
            const newProfile = new Profile({
                fromUser: req.session._id
            });
            await newProfile.save((err) => {
                if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.mainGet on method Profile.save trace: "+err.message);
            });
            profile = await Profile.findOne({fromUser: req.session._id},(err)=> {
                if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.mainGet on method Profile.findOne trace: "+err.message);
            });
            await User.updateOne({_id: req.session._id}, {profile: profile._Id},(err)=>{
                logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.mainGet on method User.updateOne trace: "+err.message);
            });

        }
        if (!err) {
            Settings.findOne({fromUser: req.session._id}, function (err, settings) {
                if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.mainGet on method Settings.findOne trace: "+err.message);
                if (!err) {
                    Invoice.find({fromUser: req.session._id,isRemoved:false}, async (err, invoices) => {
                        if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.mainGet on method Invoice.find trace: "+err.message);
                        if (!err) {
                            let chart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            let chartPreview = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            let invoice_open = [];
                            for (let invoice of invoices) {
                                if (invoice.invoiceNr) {
                                    if (!invoice.isPaid) { //not paid
                                        //adds to unpaid invoices
                                        invoice_open.push(invoice);
                                        if ((new Date()).getFullYear() == invoice.date.getFullYear()) {
                                            chartPreview[invoice.date.getMonth()] += invoice.total;
                                        }
                                    } else if(invoice.datePaid){
                                        //Adds to chart data
                                        if ((new Date()).getFullYear() == invoice.datePaid.getFullYear() && invoice.isPaid) {
                                            chart[invoice.datePaid.getMonth()] += invoice.total;
                                            chartPreview[invoice.datePaid.getMonth()] += invoice.total;
                                        }
                                    }
                                }
                            }
                            let newChart = [];
                            let newCharPreview = [];
                            chart.forEach((n) => {
                                newChart.push(n.toFixed(2));
                            });
                            chartPreview.forEach((n) => {
                                newCharPreview.push(n.toFixed(2));
                            });
                            let role = (await User.findOne({_id: req.session._id}, (err, user) => {
                                if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.mainGet on method User.findOne trace: "+err.message);
                                return user
                            })).role;
                            res.render("index", {
                                "currentUrl": "dashboard",
                                "total": newChart,
                                "totalPreview":newCharPreview,
                                "settings": settings,
                                "year": (new Date).getFullYear(),
                                "profile": profile,
                                "invoices": invoice_open,
                                "role": role
                            });
                        }
                    });
                }
            });
        }
    });
};
/**
 * @apiVersion 3.0.0
 * @api {get} /chart/:year chartYearGet
 * @apiDescription This gives back the dashboard but with a different year, with the parameter :year as a number
 * @apiName chartYearGet
 * @apiGroup DashboardRouter
 * @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *  {
        "currentUrl": "dashboard",
        "total": newChart,
        "settings": settings,
        "year": req.params.year,
        "profile": profile,
        "invoices": invoice_open,
        "role": role
    }
 @apiParamExample Request-Example:
 *  {
 *     "year": 2019
 *  }
 */
exports.chartYearGet = (req, res) => {
    let fact_open = [];
    Profile.findOne({fromUser: req.session._id}, function (err, profile) {
        if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.chartYearGet on method Profile.findOne trace: "+err.message);
        if (!err) {
            Settings.findOne({fromUser: req.session._id}, function (err, settings) {
                if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.chartYearGet on method Settings.findOne trace: "+err.message);
                if (!err) {
                    Invoice.find({fromUser: req.session._id,isRemoved:false}, async (err, invoices) => {
                        if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.chartYearGet on method Invoice.find trace: "+err.message);
                        if (!err) {
                            let chart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            let chartPreview = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            let invoice_open = [];
                            for (let invoice of invoices) {
                                if (!invoice.isPaid) { //not paid
                                    //adds to unpaid invoices
                                    invoice_open.push(invoice);
                                    if (req.params.year == invoice.date.getFullYear()) {
                                        chartPreview[invoice.date.getMonth()] += invoice.total;
                                    }
                                } else if(invoice.datePaid){
                                    //Adds to chart data
                                    if (req.params.year == invoice.datePaid.getFullYear() && invoice.isPaid) {
                                        chart[invoice.datePaid.getMonth()] += invoice.total;
                                        chartPreview[invoice.datePaid.getMonth()] += invoice.total;
                                    }
                                }
                            }
                            let newChart = [];
                            let newCharPreview = [];
                            chart.forEach((n) => {
                                newChart.push(n.toFixed(2));
                            });
                            chartPreview.forEach((n) => {
                                newCharPreview.push(n.toFixed(2));
                            });
                            let role = (await User.findOne({_id: req.session._id}, (err, user) => {
                                if(err) logger.error.log("[ERROR]: thrown at /src/controllers/dashboardController.chartYearGet on method User.findOne trace: "+err.message);
                                return user
                            })).role;
                            res.render("index", {
                                "currentUrl": "dashboard",
                                "total": newChart,
                                "totalPreview":newCharPreview,
                                "settings": settings,
                                "year": req.params.year,
                                "profile": profile,
                                "invoices": invoice_open,
                                "role": role
                            });
                        }
                    });
                }
            });
        }
    });
};
exports.about = (req,res) => {
    req.flash('warning',i18n.__("This page is still under construction"));
    res.redirect('back');
    return;
    //write here the about controller
};