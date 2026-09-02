const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { checkAuth } = require("./middlewares/auth");

const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");

const app = express();
const port = process.env.PORT || 8001;

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
}

main()
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/user", userRoute);
app.use("/", checkAuth, staticRoute);

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});