const express = require("express");
const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const router = express.Router();

const {
    restrictToLoggedinUserOnly
} = require("../middlewares/auth");

router.get("/", (req, res) => {
    res.redirect("/login");
});

router.get("/hangout", async (req, res) => {
    try {

        const allPosts = await Post.find({})
            .populate("author")
            .sort({ createdAt: -1 });

        res.render("home", {
            allPosts,
            user: req.user
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
});

router.get("/signup", (req, res) => {
    res.render("signup");
});

router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/profile/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).render("profile", {
                user: null,
                currentUser: req.user,
                posts: []
            });
        }

        const posts = await Post.find({ author: id })
            .sort({ createdAt: -1 });

        res.render("profile", {
            user,
            currentUser: req.user,
            posts
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
});

router.get("/search", async (req, res) => {
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
        currentUser: req.user
    });
});

router.get("/profile/:id/edit", async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);

    res.render("edit", { user });
});

router.get("/create", restrictToLoggedinUserOnly, (req, res) => {
    res.render("create", {
        user: req.user
    });
});

router.get("/profile/:id/view", async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate("author");

        if (!post) {
            return res.status(404).send("Post not found");
        }

        const comments = await Comment.find({
            post: id
        })
            .populate("author")
            .sort({ createdAt: -1 });

        res.render("view", {
            post,
            comments,
            currentUser: req.user
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
});

router.post(
    "/profile/:id/comment",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const post = await Post.findById(req.params.id);

            if (!post) {
                return res.status(404).send("Post not found");
            }

            await Comment.create({
                text: req.body.text,
                author: req.user._id,
                post: post._id
            });

            res.redirect(`/profile/${post._id}/view`);

        } catch (error) {

            console.log(error);
            res.status(500).send("Something went wrong");

        }
    }
);

router.delete("/profile/:id/view/delete/:postId", async (req, res) => {
    await Post.findByIdAndDelete(req.params.postId);
    res.clearCookie("uid");
    res.redirect(`/profile/${req.params.id}`);
});

module.exports = router;