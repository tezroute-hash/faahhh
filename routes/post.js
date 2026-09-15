const express = require("express");
const router = express.Router();

const upload = require("../config/cloudinary");
const { handleCreatePost } = require("../controllers/post");

router.post(
    "/user/:id/posts",
    upload.single("image"),
    handleCreatePost
);

module.exports = router;