const mongoose = require("mongoose");

const connectDB = () => {
  mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME,
  });
  var conn = mongoose.connection;
  conn.on("connected", function () {
    console.log("database is connected successfully");
  });
  conn.on("disconnected", function () {
    console.log("database is disconnected successfully");
  });
};

module.exports = connectDB;
