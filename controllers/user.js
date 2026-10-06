const User = require("../models/user");
const { sendOtpEmail } = require("../service/email");
const Notification = require("../models/notification");
const { setUser } = require("../service/auth");


const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const handleUserSignup = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        
        let user = await User.findOne({ email });
        if (user && user.verified) {
            return res.render("signup", { error: "Email already exists." });
        }
        if (user && !user.verified) {
            // override unverified user
            Object.assign(user, { name, username, password });
        } else {
            user = await User.create({ name, username, email, password, verified: false });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendOtpEmail(email, otp);

        return res.render("verify", { email, action: "signup" });
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

        if (!user.verified) {
            const otp = generateOTP();
            user.otp = otp;
            user.otpExpiry = Date.now() + 10 * 60 * 1000;
            await user.save();
            await sendOtpEmail(email, otp);
            return res.render("verify", { email, action: "signup", error: "Please verify your email first. We sent a new OTP." });
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


const handleVerifyOtp = async (req, res) => {
    try {
        const { email, otp, action } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.render("verify", { email, action, error: "User not found" });

        if (user.otp !== otp || user.otpExpiry < Date.now()) {
            return res.render("verify", { email, action, error: "Invalid or expired OTP" });
        }

        user.otp = null;
        user.otpExpiry = null;
        
        if (action === "signup") {
            user.verified = true;
            await user.save();
            const token = setUser(user);
            res.cookie("uid", token);
            return res.redirect('/hangout');
        } else if (action === "reset") {
            await user.save();
            return res.render("reset_password", { email });
        }
    } catch (err) {
        console.error(err);
        return res.render("verify", { email, action: req.body.action, error: "Server error" });
    }
};

const handleForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.render("forgot", { error: "No account with that email found." });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendOtpEmail(email, otp);
        return res.render("verify", { email, action: "reset" });
    } catch (err) {
        console.error(err);
        return res.render("forgot", { error: "Server error" });
    }
};

const handleResetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        await User.findOneAndUpdate({ email }, { password });
        return res.redirect("/login");
    } catch (err) {
        console.error(err);
        return res.redirect("/login");
    }
};

module.exports = {
    handleVerifyOtp,
    handleForgotPassword,
    handleResetPassword,
    handleUserSignup,
    handleUserLogin,
    handleEditUser,
    handleLogout,
    handleFollowUser,
    handleUnfollowUser
};