const Post = require("../models/post");

const handleCreatePost = async (req, res) => {
    try {
        const { content } = req.body;

        // Get logged-in user
        const author = req.user._id;

        let type = "text";
        let mediaUrl = "";

        // If a file was uploaded
        if (req.file) {
            mediaUrl = req.file.path;

            if (req.file.mimetype.startsWith("image/")) {
                type = "image";
            } else if (req.file.mimetype.startsWith("video/")) {
                type = "video";
            }
        }

        // Create post
        const post = await Post.create({
            type,
            content: content || "",
            mediaUrl,
            author,
        });

        console.log("Post created:", post);

        // Go back to Hangout feed
        return res.redirect("/hangout");

    } catch (err) {
        console.error("Error creating post:", err);

        return res.status(500).json({
            message: "Failed to create post",
            error: err.message,
        });
    }
};

module.exports = {
    handleCreatePost,
};