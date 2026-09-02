const express = require("express");
const User = require("../models/user");
const {
    restrictToLoggedinUserOnly
} = require("../middlewares/auth");

const router = express.Router();

router.get("/", (req, res) => {
    res.redirect("/login");
});

router.get(
    "/faahhh",
    restrictToLoggedinUserOnly,
    async (req, res) => {
        const allUser = await User.find({});

        res.render("home", {
            allUser,
            user: req.user
        });
    }
);

router.get("/signup", (req, res) => {
    res.render("signup");
});

router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/profile/:id", async(req, res)=>{
    const id = req.params.id;
    const user = await User.findById(id);
    res.render("profile", {
        user : user
    });
});

router.get("/search", restrictToLoggedinUserOnly, async (req, res) => {
    const username = req.query.username;

    let users = [];

    if (username) {
        users = await User.find({
            username: {
                $regex: username,
                $options: "i"
            }
        });
    }

    res.render("search", {
        users,
        searched: !!username,
        user: req.user
    });
});

module.exports = router;