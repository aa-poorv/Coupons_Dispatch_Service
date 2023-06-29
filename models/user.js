const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const createError = require("http-errors");
const Coupon = require("./coupon");
const { Schema } = mongoose;
const { number } = require("joi");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username cannot be blank"],
  },
  password: {
    type: String,
    required: [true, "Password cannot be blank"],
  },
  roles: {
    User: {
      type: Number,
      default: 2001,
    },
    Editor: Number,
    Admin: Number,
  },
  refreshToken: [String],
  coupons: [{ type: Schema.Types.ObjectId, ref: "Coupon" }],
});

userSchema.statics.checkUser = async function (username, password) {
  const foundUser = await this.findOne({ username: username });
  let isValid = false;
  if (foundUser) {
    isValid = await bcrypt.compare(password, foundUser.password);
  }

  return isValid ? foundUser : false;
};

module.exports = mongoose.model("User", userSchema);
