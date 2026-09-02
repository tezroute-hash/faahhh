const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        age: {
            type: Number,
            min: 13,
            max: 120,
        },

        profilePic: {
            type: String,
            default: "",
        },

        bio: {
            type: String,
            maxlength: 160,
            default: "",
            trim: true,
        },

        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;