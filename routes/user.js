const express = require("express");
const {
    handleUserSignup,
    handleUserLogin,
    handleEditUser
} = require("../controllers/user");

const router = express.Router();

router.post("/", handleUserSignup);
router.post("/login", handleUserLogin);
router.post("/profile/:id/edit", handleEditUser);

module.exports = router;