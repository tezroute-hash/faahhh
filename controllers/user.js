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

module.exports = { handleUserSignup, handleUserLogin, handleEditUser, handleLogout };