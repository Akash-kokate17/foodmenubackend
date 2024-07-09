const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Order, registers } = require("../schema");
const authRouter = express.Router();
require("dotenv").config();

authRouter.post("/register", async (req, res) => {
  try {
    const payload = req.body;
    (payload.token = ""),
      (payload.password = bcryptjs.hashSync(payload.password, 8));
    const newUser = new registers(payload);
    await newUser.save();
    res.status(200).send("user added successfully");
  } catch (err) {
    return res.status(401).send({auth:false,msg:"something went wrong to register",error:err})
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const user = await registers.findOne({ email: req.body.email }); 
    if (!user) {
      return res
        .status(404)
        .send({ auth: false, msg: "User not found, please register first" }); 
    }

    const isPasswordValid = bcryptjs.compareSync(
      req.body.password,
      user.password
    ); 
    if (!isPasswordValid) {
      return res.status(401).send({
        auth: false,
        msg: "Password is not matching to your userName",
      });
    }

    const expireTime = 60 * 10; // 10 minutes
    const token = jwt.sign({ id: user._id }, process.env.MY_SECRETKEY, {
      expiresIn: expireTime,
    });

    res.send({ auth: true, token: token, expiresIn: expireTime });
  } catch (err) {
    console.error("Something went wrong during login", err);
    res.status(500).send("Something went wrong to login"); 
  }
});

authRouter.get("/orders", async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      console.log("Token is not found");
      return res.status(401).send("Token is not found");
    }

    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      console.log("Invalid token format");
      return res.status(401).send("Invalid token format");
    }

    const authToken = tokenParts[1];

    jwt.verify(authToken, process.env.MY_SECRETKEY, async (err, decoded) => {
      if (err) {
        console.log("Token verification failed:", err);
        return res.status(401).send("Invalid token");
      }
      const data = await Order.find({});
      res.send(data);
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Something went wrong while fetching orders");
  }
});

module.exports = authRouter;
