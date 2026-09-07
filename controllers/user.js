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

    const token = setUser(user);
    res.cookie("uid", token);

    return res.redirect(`/faahhh`);
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
    return res.redirect(`/faahhh`);
};

const handleEditUser = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);

    await User.findByIdAndUpdate(id, req.body);

    res.redirect(`/profile/${id}`);
};

module.exports = {handleUserSignup, handleUserLogin, handleEditUser};