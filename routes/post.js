const express = require("express");
const router = express.Router();

const upload = require("../cloudConfig");

const { handleCreatePost } = require("../controllers/post");

const {
    restrictToLoggedinUserOnly
} = require("../middlewares/auth");

router.post(
    "/user/:id/posts",
    restrictToLoggedinUserOnly,
    upload.single("image"),
    handleCreatePost
);


module.exports = router;