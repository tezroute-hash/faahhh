const User = require("../models/user");
const { setUser } = require("../service/auth");

const handleUserSignup = async (req, res) => {
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
};

const handleUserLogin = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user) {
        return res.render("login",
            { error: "user not found" });
    }

    const token = setUser(user);
    res.cookie("uid", token);
    return res.redirect(`/hangout`);
};

const handleEditUser = async (req, res) => {
    const { id } = req.params;
    let updateData = { ...req.body };

    if (req.file) {
        updateData.profilePic = req.file.path; // Save Cloudinary URL
    }

    await User.findByIdAndUpdate(id, updateData);

    res.redirect(`/profile/${id}`);
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
            return res.status(404).send("User not found");
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
        await User.findByIdAndUpdate(
            targetUserId,
            {
                $addToSet: {
                    followers: currentUserId
                }
            }
        );

        return res.redirect(`/profile/${targetUserId}`);

    } catch (error) {
        console.log(error);
        return res.status(500).send("Something went wrong");
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
        return res.status(500).send("Something went wrong");
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