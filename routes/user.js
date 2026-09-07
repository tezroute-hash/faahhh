const express = require("express");
const {
    handleUserSignup,
    handleUserLogin,
    handleEditUser,
    handleLogout
} = require("../controllers/user");

const router = express.Router();

router.post("/", handleUserSignup);
router.post("/login", handleUserLogin);
router.post("/profile/:id/edit", handleEditUser);
router.get("/logout", handleLogout);

module.exports = router;