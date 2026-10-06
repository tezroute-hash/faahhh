const Post = require("../models/post");

const handleCreatePost = async (req, res) => {
    try {
        // Get caption from form
        const content = req.body.content || "";

        // Get logged-in user's ID
        const author = req.user._id;

        let type = "text";
        let mediaUrl = "";

        // If image was uploaded
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
            type: type,
            content: content,
            mediaUrl: mediaUrl,
            author: author
        });

        console.log("Post created successfully:", post._id);

        // Go back to feed
        return res.redirect("/hangout");

    } catch (err) {
        console.error("Error creating post:", err);

        return res.status(500).render("error", { error: "Failed to create post", currentUser: req.user || null });
    }
};

module.exports = {
    handleCreatePost
};