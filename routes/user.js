const express = require("express");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

const {
    handleUserSignup,
    handleUserLogin,
    handleEditUser,
    handleLogout
} = require("../controllers/user");

const router = express.Router();

router.post("/", handleUserSignup);
router.post("/login", handleUserLogin);
router.post("/profile/:id/edit", upload.single("profileImage"), handleEditUser);
router.get("/logout", handleLogout);

module.exports = router;