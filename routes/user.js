const express = require("express");

const multer = require("multer");

const { storage } = require("../cloudConfig");

const upload = multer({ storage });

const {
    handleUserSignup,
    handleUserLogin,
    handleEditUser,
    handleLogout,
    handleFollowUser,
    handleUnfollowUser
} = require("../controllers/user");

const router = express.Router();


// Signup
router.post("/", handleUserSignup);


// Login
router.post("/login", handleUserLogin);


// Edit profile
router.post(
    "/profile/:id/edit",
    upload.single("profileImage"),
    handleEditUser
);


// Logout
router.get("/logout", handleLogout);


// Follow user
router.post(
    "/profile/:id/follow",
    handleFollowUser
);


// Unfollow user
router.post(
    "/profile/:id/unfollow",
    handleUnfollowUser
);


module.exports = router;