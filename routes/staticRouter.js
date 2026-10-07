const express = require("express");

const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Like = require("../models/like");
const Notification = require("../models/notification");

const router = express.Router();

const {
    restrictToLoggedinUserOnly
} = require("../middlewares/auth");


// =========================
// NOTIFICATIONS
// =========================

router.get(
    "/notifications",
    restrictToLoggedinUserOnly,
    async (req, res) => {
        try {
            const notifications = await Notification.find({
                recipient: req.user._id
            })
                .populate("sender")
                .populate("post")
                .sort({ createdAt: -1 });

            res.render("notifications", {
                notifications,
                currentUser: req.user
            });

        } catch (error) {
            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });
        }
    }
);


// =========================
// ROOT
// =========================

router.get("/", (req, res) => {
    res.redirect("/login");
});


// =========================
// HOME
// =========================

router.get("/hangout", async (req, res) => {
    try {
        const allPosts = await Post.find({})
            .populate("author")
            .sort({ createdAt: -1 });


        // Get like count for every post
        const likeCounts = await Like.aggregate([
            {
                $group: {
                    _id: "$post",
                    count: {
                        $sum: 1
                    }
                }
            }
        ]);


        // Convert result into object
        const likeCountMap = {};

        likeCounts.forEach((item) => {
            likeCountMap[item._id.toString()] = item.count;
        });


        res.render("home", {
            allPosts,
            likeCountMap,
            user: req.user,
            currentUser: req.user
        });

    } catch (error) {
        console.log(error);

        res.status(500).render("error", {
            error: "Something went wrong",
            currentUser: req.user || null
        });
    }
});


// =========================
// SAVED POSTS
// =========================

router.get(
    "/saved",
    restrictToLoggedinUserOnly,
    async (req, res) => {
        try {

            const user = await User.findById(req.user._id)
                .populate({
                    path: "savedPosts",
                    populate: {
                        path: "author"
                    }
                });


            if (!user) {
                return res.status(404).render("error", {
                    error: "User not found",
                    currentUser: req.user || null
                });
            }


            res.render("saved", {
                savedPosts: user.savedPosts || [],
                currentUser: req.user
            });

        } catch (error) {
            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });
        }
    }
);


// =========================
// SIGNUP
// =========================

router.get("/signup", (req, res) => {
    res.render("signup");
});


// =========================
// LOGIN
// =========================

router.get("/login", (req, res) => {
    res.render("login");
});


// =========================
// PROFILE
// =========================

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


        const posts = await Post.find({
            author: id
        }).sort({
            createdAt: -1
        });


        // =========================
        // CHECK FOLLOWING STATUS
        // =========================

        let isFollowing = false;


        if (req.user) {
            isFollowing = user.followers.some(
                followerId =>
                    followerId.toString() === req.user._id.toString()
            );
        }


        res.render("profile", {
            user,
            currentUser: req.user,
            posts,
            isFollowing
        });

    } catch (error) {
        console.log(error);

        res.status(500).render("error", {
            error: "Something went wrong",
            currentUser: req.user || null
        });
    }
});


// =========================
// SEARCH
// =========================

router.get("/search", async (req, res) => {
    try {

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

    } catch (error) {
        console.log(error);

        res.status(500).render("error", {
            error: "Something went wrong",
            currentUser: req.user || null
        });
    }
});


// =========================
// EDIT PROFILE
// =========================

router.get("/profile/:id/edit", async (req, res) => {
    try {

        const { id } = req.params;

        const user = await User.findById(id);


        if (!user) {
            return res.status(404).render("error", {
                error: "User not found",
                currentUser: req.user || null
            });
        }


        res.render("edit", {
            user,
            currentUser: req.user
        });

    } catch (error) {
        console.log(error);

        res.status(500).render("error", {
            error: "Something went wrong",
            currentUser: req.user || null
        });
    }
});


// =========================
// CREATE POST
// =========================

router.get(
    "/create",
    restrictToLoggedinUserOnly,
    (req, res) => {

        res.render("create", {
            user: req.user,
            currentUser: req.user
        });

    }
);


// =========================
// VIEW POST
// =========================

router.get("/profile/:id/view", async (req, res) => {
    try {

        const { id } = req.params;


        const post = await Post.findById(id)
            .populate("author");


        if (!post) {
            return res.status(404).render("error", {
                error: "Post not found",
                currentUser: req.user || null
            });
        }


        // Get comments
        const comments = await Comment.find({
            post: id
        })
            .populate("author")
            .sort({
                createdAt: -1
            });


        // Get like count
        const likeCount = await Like.countDocuments({
            post: id
        });


        // Check if current user liked the post
        let userLiked = false;


        if (req.user) {

            const existingLike = await Like.findOne({
                post: id,
                user: req.user._id
            });


            if (existingLike) {
                userLiked = true;
            }
        }


        res.render("view", {
            post,
            comments,
            currentUser: req.user,
            likeCount,
            userLiked
        });

    } catch (error) {
        console.log(error);

        res.status(500).render("error", {
            error: "Something went wrong",
            currentUser: req.user || null
        });
    }
});


// =========================
// COMMENT
// =========================

router.post(
    "/profile/:id/comment",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const post = await Post.findById(req.params.id);


            if (!post) {
                return res.status(404).render("error", {
                    error: "Post not found",
                    currentUser: req.user || null
                });
            }


            await Comment.create({
                text: req.body.text,
                author: req.user._id,
                post: post._id
            });


            if (
                post.author.toString() !==
                req.user._id.toString()
            ) {

                await Notification.create({
                    recipient: post.author,
                    sender: req.user._id,
                    type: "comment",
                    post: post._id
                });

            }


            res.redirect(`/profile/${post._id}/view`);

        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });

        }
    }
);


// =========================
// DELETE POST
// =========================

router.delete(
    "/profile/:id/view/delete/:postId",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const post = await Post.findById(
                req.params.postId
            );


            if (!post) {
                return res.status(404).render("error", {
                    error: "Post not found",
                    currentUser: req.user || null
                });
            }


            // Only post owner can delete
            if (
                post.author.toString() !==
                req.user._id.toString()
            ) {

                return res.status(403).send(
                    "You are not authorized to delete this post"
                );

            }


            // Delete post
            await Post.findByIdAndDelete(
                req.params.postId
            );


            // Delete likes belonging to post
            await Like.deleteMany({
                post: req.params.postId
            });


            // Delete comments belonging to post
            await Comment.deleteMany({
                post: req.params.postId
            });


            // Remove deleted post from everyone's saved posts
            await User.updateMany(
                {
                    savedPosts: req.params.postId
                },
                {
                    $pull: {
                        savedPosts: req.params.postId
                    }
                }
            );


            // DO NOT clear uid here
            // Otherwise user gets logged out


            res.redirect(
                `/profile/${req.params.id}`
            );

        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });

        }
    }
);


// =========================
// SAVE POST
// =========================

router.post(
    "/hangout/:id/save",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const { id } = req.params;


            // Check whether post exists
            const post = await Post.findById(id);


            if (!post) {
                return res.status(404).send(
                    "Post not found"
                );
            }


            // Add post to savedPosts
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $addToSet: {
                        savedPosts: id
                    }
                }
            );


            // Return to previous page
            res.redirect(
                req.get("Referrer") || "/hangout"
            );

        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });

        }
    }
);


// =========================
// UNSAVE POST
// =========================

router.post(
    "/hangout/:id/unsave",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const { id } = req.params;


            // Remove post from savedPosts
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $pull: {
                        savedPosts: id
                    }
                }
            );


            // Return to previous page
            res.redirect(
                req.get("Referrer") || "/hangout"
            );

        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });

        }
    }
);


// =========================
// LIKE / UNLIKE FROM HOME
// =========================

router.post(
    "/hangout/:id/like",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const { id } = req.params;


            const post = await Post.findById(id);


            if (!post) {
                return res.status(404).send(
                    "Post not found"
                );
            }


            const existingLike = await Like.findOne({
                post: id,
                user: req.user._id
            });


            if (existingLike) {

                // UNLIKE
                await Like.findByIdAndDelete(
                    existingLike._id
                );

            } else {

                // LIKE
                await Like.create({
                    post: id,
                    user: req.user._id
                });


                if (
                    post.author.toString() !==
                    req.user._id.toString()
                ) {

                    await Notification.create({
                        recipient: post.author,
                        sender: req.user._id,
                        type: "like",
                        post: post._id
                    });

                }
            }


            // Stay on Home
            res.redirect("/hangout");

        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });

        }
    }
);


// =========================
// LIKE / UNLIKE FROM VIEW POST
// =========================

router.post(
    "/profile/:id/view/like",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const { id } = req.params;


            const post = await Post.findById(id);


            if (!post) {
                return res.status(404).send(
                    "Post not found"
                );
            }


            const existingLike = await Like.findOne({
                post: id,
                user: req.user._id
            });


            if (existingLike) {

                // UNLIKE
                await Like.findByIdAndDelete(
                    existingLike._id
                );

            } else {

                // LIKE
                await Like.create({
                    post: id,
                    user: req.user._id
                });


                if (
                    post.author.toString() !==
                    req.user._id.toString()
                ) {

                    await Notification.create({
                        recipient: post.author,
                        sender: req.user._id,
                        type: "like",
                        post: post._id
                    });

                }
            }


            // Stay on View Post
            res.redirect(
                `/profile/${id}/view`
            );

        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });

        }
    }
);


// =========================
// FOLLOWERS LIST
// =========================

router.get(
    "/profile/:id/followers",
    async (req, res) => {

        try {

            const { id } = req.params;


            const user = await User.findById(id)
                .populate("followers");


            if (!user) {
                return res.status(404).render("error", {
                    error: "User not found",
                    currentUser: req.user || null
                });
            }


            res.render("followers", {
                user,
                followers: user.followers,
                currentUser: req.user
            });

        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });

        }
    }
);


// =========================
// FOLLOWING LIST
// =========================

router.get(
    "/profile/:id/following",
    async (req, res) => {

        try {

            const { id } = req.params;


            const user = await User.findById(id)
                .populate("following");


            if (!user) {
                return res.status(404).render("error", {
                    error: "User not found",
                    currentUser: req.user || null
                });
            }


            res.render("following", {
                user,
                following: user.following,
                currentUser: req.user
            });

        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user || null
            });

        }
    }
);


module.exports = router;