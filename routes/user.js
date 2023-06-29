const express = require("express");
const verifyRoles = require("../middleware/UserVerify");
const ROLES_LIST = require("../config/roles_list");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");
const { verify } = require("jsonwebtoken");
const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login", { messages: req.flash("error") });
});

router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  const { jwt } = req.cookies;

  const validUser = await User.checkUser(username, password);
  if (validUser) {
    const accessToken = await signAccessToken(validUser.id);
    const refreshToken = await signRefreshToken(validUser.id);
    const refreshTokenArray = !jwt
      ? validUser.refreshToken
      : validUser.refreshToken.filter((rt) => rt !== jwt);

    validUser.refreshToken = [...refreshTokenArray, refreshToken];
    await validUser.save();
    res.cookie("jwt", refreshToken);
    res.send({ accessToken });
  } else {
    req.flash("error", "username/password is wrong");
    res.redirect("/users/login");
  }
});

router.get("/register", (req, res) => {
  res.render("Register");
});

router.post("/register", async (req, res, next) => {
  try {
    let { username, password } = req.body;
    password = await bcrypt.hash(password, 10);
    const doesExist = await User.findOne({ username });
    if (doesExist) {
      throw createError.Conflict(`${username} is already been registered`);
    }

    const user = new User({ username, password });
    await user.save();
    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);
    user.refreshToken = [...user.refreshToken, refreshToken];
    user.save();

    res.cookie("jwt", refreshToken);
    res.send(accessToken);
  } catch (error) {
    next(error);
  }
});

router.post("/refresh-token", async (req, res, next) => {
  try {
    const { jwt } = req.cookies;
    if (!jwt) throw createError.BadRequest();
    const validUser = await User.findOne({ refreshToken: jwt });

    if (!validUser) {
      const userId = await verifyRefreshToken(jwt);
      const us = await User.findById(userId);
      if (!us) throw createError.BadRequest();
      us.refreshToken = [];
      return await us.save();
    }

    const refreshTokenArray = validUser.refreshToken.filter((rt) => rt !== jwt);

    const userId = await verifyRefreshToken(jwt);

    const accessToken = await signAccessToken(userId);
    const refToken = await signRefreshToken(userId);
    res.clearCookie("jwt");
    res.cookie("jwt", refToken);
    validUser.refreshToken = [...refreshTokenArray, refToken];
    await validUser.save();
    res.send({ accessToken });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const { jwt } = req.cookies;
    const userId = await verifyRefreshToken(jwt);
    const us = await User.findById(userId);
    if (!us) throw createError.BadRequest();
    const refreshTokenArray = us.refreshToken.filter((rt) => rt !== jwt);
    us.refreshToken = [...refreshTokenArray];
    await us.save();
    res.clearCookie("jwt");
    return res.redirect(200, "/users/login");
  } catch (error) {
    next(error);
  }
});

router.get(
  "/secret",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.User),
  (req, res) => {
    res.render("secret");
  }
);

router.get(
  "/topsecret",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin),
  (req, res) => {
    res.send("Welcome to top secret site");
  }
);

module.exports = router;
