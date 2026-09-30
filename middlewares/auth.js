const { getUser } = require("../service/auth");

function checkForAuthentication(req, res, next) {

    const token = req.cookies?.uid;

    req.user = null;

    res.locals.user = null;
    res.locals.currentUser = null;

    if (!token) {
        return next();
    }

    const user = getUser(token);

    req.user = user;

    res.locals.user = user;
    res.locals.currentUser = user;

    next();
}


function restrictToLoggedinUserOnly(req, res, next) {

    if (!req.user) {
        return res.redirect("/login");
    }

    next();
}


module.exports = {
    checkForAuthentication,
    restrictToLoggedinUserOnly
};