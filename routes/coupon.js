const Coupon = require("../models/coupon");
const User = require("../models/user");
const ROLES_LIST = require("../config/roles_list");
const verifyRoles = require("../middleware/UserVerify");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const asyncHandler = require("express-async-handler");
const express = require("express");
const createError = require("http-errors");
const { date } = require("joi");
const { id } = require("@hapi/joi/lib/base");
const router = express.Router();

router.post(
  "/create/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor),
  asyncHandler(async (req, res, next) => {
    try {
      const { name, discount } = req.body;
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) throw createError.BadRequest();
      const coupon = new Coupon({ name, discount });
      coupon.createdTime = new Date();
      coupon.expiryTime = new Date();
      const coupon_duration = 20;
      coupon.expiryTime.setMinutes(
        coupon.expiryTime.getMinutes() + coupon_duration
      );
      coupon.users = user;
      coupon.save();
      user.coupons.push(coupon);
      user.save();
      res.send("New Coupon created");
    } catch (error) {
      next(error);
    }
  })
);

router.get(
  "/showAll",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.User, ROLES_LIST.Editor, ROLES_LIST.Admin),
  asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({});
    res.send(coupons);
  })
);

router.get(
  "/show/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.User, ROLES_LIST.Editor, ROLES_LIST.Admin),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).populate("coupons");
    res.send(user.coupons);
  })
);

router.patch(
  "/update/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor),
  asyncHandler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findById(id);
      if (!coupon) throw createError.BadRequest();
      let { name = null, discount = null } = req.body;
      if (name != null) {
        coupon.name = name;
      }
      if (discount != null) {
        coupon.discount = discount;
      }
      coupon.save();
      res.send(coupon);
    } catch (error) {
      next(error);
    }
  })
);

router.delete(
  "/delete/:id",
  verifyAccessToken,
  verifyRoles(ROLES_LIST.Admin),
  asyncHandler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findByIdAndDelete(id);
      if (!coupon) throw createError.BadRequest();
      const userId = coupon.users;
      await User.updateOne(
        { _id: userId },
        {
          $pull: {
            coupons: id,
          },
        }
      );

      res.send(`Deleted ${coupon.name}`);
    } catch (error) {
      next(error);
    }
  })
);

module.exports = router;
