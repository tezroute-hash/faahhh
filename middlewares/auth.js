const { getUser } = require("../service/auth");

function checkForAuthentication(req, res, next) {
    const userid = req.cookies?.uid;
    req.user = null;

    if(!userid) return next();

    const user = getUser(userid);

    req.user = user;
    next();
}

module.exports = { checkForAuthentication };