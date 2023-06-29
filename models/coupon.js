const User = require("./user");
const { date } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  createdTime: {
    type: Date,
    required: true,
  },
  expiryTime: {
    type: Date,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  users: { type: Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Coupon", couponSchema);
