const mongoose = require("mongoose");
require("dotenv").config()

async function connectDatabase() {
  await mongoose.connect(process.env.DB_URL);
  console.log("database connected successfully");
}

module.exports = {connectDatabase}
