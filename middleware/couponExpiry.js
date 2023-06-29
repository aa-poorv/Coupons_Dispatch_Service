const Coupon = require("../models/coupon");
const createError = require("http-errors");
const User = require("../models/user");

const verifyCoupon = async (req, res, next) => {
  const coupons = await Coupon.find({});
  coupons.map((getCoupon) => {
    if (
      new Date().getTime() >= getCoupon.expiryTime.getTime() // expirationTime data access from database
    ) {
      Coupon.findOneAndDelete({
        _id: getCoupon._id,
      })
        .exec()
        .then(async (deleteCoupon) => {
          console.log(`Coupon doesnt exists or expired`);
          const userId = deleteCoupon.users;
          await User.updateOne(
            { _id: userId },
            {
              $pull: {
                coupons: deleteCoupon.id,
              },
            }
          );
        })
        .catch((error) => {
          console.log(error, "Error occured on coupon section");
        });
    }
  });
  next();
};

module.exports = verifyCoupon;
