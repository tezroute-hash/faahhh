const User = require("../models/user");
const {setUser} = require("../service/auth");

const handleUserSignup = async (req, res) => {
    const { name, username, email, password } = req.body;

    const user = await User.create({
        name,
        username,
        email,
        password
    });

    return res.redirect(`/profile/${user._id}`);
};

const handleUserLogin = async(req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email, password});

    if(!user) {
        return res.render( "login",
            {error : "user not found"});
    }

    const token = setUser(user);
    res.cookie("uid", token);
    return res.redirect(`/profile/${user._id}`);
};

module.exports = {handleUserSignup, handleUserLogin};