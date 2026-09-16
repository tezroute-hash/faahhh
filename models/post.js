const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["text", "image"],
            required: true,
        },

        content: {
            type: String,
            default: "",
            maxlength: 280,
        },

        mediaUrl: {
            type: String,
            default: "",
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;