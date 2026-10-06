const User = require("../models/user");
const Notification = require("../models/notification");
const { setUser } = require("../service/auth");

const handleUserSignup = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        const user = await User.create({
            name,
            username,
            email,
            password
        });

        const token = setUser(user);
        res.cookie("uid", token);

        return res.redirect(`/hangout`);
    } catch (error) {
        console.error(error);
        return res.render("signup", { error: "Username or email already exists. Please try another." });
    }
};

const handleUserLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.render("login", { error: "Invalid email or password." });
        }

        const token = setUser(user);
        res.cookie("uid", token);
        return res.redirect(`/hangout`);
    } catch (error) {
        console.error(error);
        return res.render("login", { error: "An error occurred during login. Please try again." });
    }
};

const handleEditUser = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };

        if (req.file) {
            updateData.profilePic = req.file.path; // Save Cloudinary URL
        }

        await User.findByIdAndUpdate(id, updateData);

        res.redirect(`/profile/${id}`);
    } catch (error) {
        console.error("Error editing user:", error);
        return res.status(500).render("error", { error: "Failed to update profile", currentUser: req.user || null });
    }
};

const handleLogout = (req, res) => {
    res.clearCookie("uid");
    res.redirect("/login");
};

const handleFollowUser = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.id;

        // Cannot follow yourself
        if (currentUserId.toString() === targetUserId.toString()) {
            return res.redirect(`/profile/${targetUserId}`);
        }

        // Check whether target user exists
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).render("error", { error: "User not found", currentUser: req.user || null });
        }

        // Add target user to current user's following
        await User.findByIdAndUpdate(
            currentUserId,
            {
                $addToSet: {
                    following: targetUserId
                }
            }
        );

        // Add current user to target user's followers
        const updatedTarget = await User.findByIdAndUpdate(
            targetUserId,
            {
                $addToSet: {
                    followers: currentUserId
                }
            }
        );

        // Create notification
        await Notification.create({
            recipient: targetUserId,
            sender: currentUserId,
            type: "follow"
        });

        return res.redirect(`/profile/${targetUserId}`);

    } catch (error) {
        console.log(error);
        return res.status(500).render("error", { error: "Something went wrong", currentUser: req.user || null });
    }
};


const handleUnfollowUser = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.id;

        // Remove target from current user's following
        await User.findByIdAndUpdate(
            currentUserId,
            {
                $pull: {
                    following: targetUserId
                }
            }
        );

        // Remove current user from target's followers
        await User.findByIdAndUpdate(
            targetUserId,
            {
                $pull: {
                    followers: currentUserId
                }
            }
        );

        return res.redirect(`/profile/${targetUserId}`);

    } catch (error) {
        console.log(error);
        return res.status(500).render("error", { error: "Something went wrong", currentUser: req.user || null });
    }
};

module.exports = {
    handleUserSignup,
    handleUserLogin,
    handleEditUser,
    handleLogout,
    handleFollowUser,
    handleUnfollowUser
};