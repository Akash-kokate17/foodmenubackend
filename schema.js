const mongoose = require("mongoose");

const vegSchema = new mongoose.Schema({
  no: Number,
  dishName: String,
  price: Number,
});

const Veg = mongoose.model("vegs", vegSchema);

const nonVegSchema = new mongoose.Schema({
  no: Number,
  dishName: String,
  price: Number,
});

const NonVeg = mongoose.model("nonvegs", nonVegSchema);

// this schema for deleting after new customer came.
const orderSchema = new mongoose.Schema({
  no: Number,
  items: [{ dishName: String, price: Number }],
  tableNo: Number,
});

const Order = mongoose.model("oders", orderSchema);

const loginSchema = mongoose.Schema({
  userName: String,
  email: String,
  password: String,
});

const logins = new mongoose.model("logins", loginSchema);

const registerSchema = mongoose.Schema({
  userName: String,
  email: String,
  password: String,
});

const registers = new mongoose.model("registers", registerSchema);

let bevarageSchema = mongoose.Schema({
  tableNo: Number,
  roti: [{ rotiCount: Number }],
  bottle: [{ bottleCount: Number }],
});

let RotiBottleCount = mongoose.model("rotibottlecounts", bevarageSchema);

module.exports = { Veg, NonVeg, Order, logins, registers, RotiBottleCount };
