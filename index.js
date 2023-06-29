const express = require("express");
const app = express();
const connectDB = require("./config/mongoConnect");
const verifyCoupon = require("./middleware/couponExpiry");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const couponRouter = require("./routes/coupon");
const userRouter = require("./routes/user");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const { verify } = require("jsonwebtoken");

connectDB();

app.set("view engine", "ejs");
app.set("views", "views");
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(verifyCoupon);
app.use(session({ secret: "this is the secret" }));
app.use("/users", userRouter);
app.use("/coupon", couponRouter);

app.get("/", (req, res) => {
  res.send("This is the home page");
});

app.use(async (req, res, next) => {
  next(createError.NotFound("This route does not exist"));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      staus: err.status || 500,
      message: err.message,
    },
  });
});

app.listen(3000, () => {
  console.log("Serving your app");
});
