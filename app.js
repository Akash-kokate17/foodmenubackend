const express = require("express");
const { connectDatabase } = require("./databaseConnection");
const { Veg, NonVeg, Order, rotiBottleCount } = require("./schema");
const authController = require("./controller/authController");
const nodeMailer = require("nodemailer");
require("dotenv").config();
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", authController);

// /veg for fetching all the veg data in mongodb
app.get("/veg", async (req, res) => {
  try {
    const vegData = await Veg.find({}).sort({no:1});
    res.send(vegData);
  } catch (err) {
    console.error("Error fetching veg data:", err);
    res.status(500).send("Something went wrong while fetching veg data");
  }
});

// /nonVeg is for fetching all the nonVeg data from mongodb
app.get("/nonVeg", async (req, res) => {
  try {
    const nonVegData = await NonVeg.find({}).sort({no:1});
    res.send(nonVegData);
  } catch (err) {
    console.error("Error fetching non-veg data:", err);
    res.status(500).send("Something went wrong while fetching non-veg data");
  }
});

// /oderMenuData is for posting posting a data in oder table & if data is already in items then add the dishName in that table number other wise create a newOder for that table number
app.post("/orderMenuData", async (req, res) => {
  try {
    const { no, items, tableNo } = req.body;

    let existingOrder = await Order.findOne({ tableNo });

    if (existingOrder) {
      let findItem = existingOrder.items.find(
        (item) => item.dishName === items.dishName
      );
      if (!findItem) {
        existingOrder.items.push({
          dishName: items.dishName,
          price: items.price,
        });
        let result = await existingOrder.save();
        res.status(200).send(result);
      } else {
        res.status(200).send({ message: "Dish is already in the cart" });
      }
    } else {
      const newOrder = new Order({
        no: no,
        items: [{ dishName: items.dishName, price: items.price }],
        tableNo: tableNo,
      });
      let result = await newOrder.save();
      res.status(200).send(result);
    }
  } catch (err) {
    console.error("Error posting order data:", err);
    res.status(500).send("Something went wrong while posting order data");
  }
});

// /removeOrder/:tableNo/:food this  is for removing the dishName in table if selected.
app.delete("/removeOrder/:tableNo/:food", async (req, res) => {
  try {
    const { tableNo, food } = req.params;

    let order = await Order.findOne({ tableNo });

    if (!order) {
      return res.status(404).send("Order not found");
    }

    order.items = order.items.filter((item) => item.dishName !== food);

    let updatedOrder = await order.save();

    res.status(200).send(updatedOrder);
  } catch (err) {
    console.error("Error removing order data:", err);
    res.status(500).send("Something went wrong while removing order data");
  }
});

// /deleteAllOrder/:tableNo for delete all table data in oders collection.
app.delete("/deleteAllOrder/:tableNo", async (req, res) => {
  try {
    let { tableNo } = req.params;
    const deleteAllOrder = await Order.deleteOne({ tableNo: tableNo });
    res.status(200).send({ message: "all data deleted", deleteAllOrder });
  } catch (err) {
    console.error("Something went wrong while removing order data", err);
    res.status(500).send("Something went wrong while removing order data");
  }
});

//"/orderList/:tableNo" for showing oders accordingly there table in oderList component.
app.get("/orderList/:tableNo", async (req, res) => {
  try {
    const tableNo = req.params.tableNo;
    let orders = await Order.findOne({ tableNo: tableNo });

    if (!orders) {
      return res
        .status(404)
        .send("No orders found for the given table number.");
    }
    res.status(200).send(orders);
  } catch (err) {
    console.error("Something went wrong while fetching order data", err);
    console.log("code is working");
    res.status(500).send("Something went wrong while fetching order data");
  }
});

// send mail get method

app.get("/sendMail/:tableNo/:userEmail", async (req, res) => {
  try {
    const { tableNo, userEmail } = req.params;

    // Fetch order details
    const order = await Order.findOne({ tableNo: parseInt(tableNo) });

    // Fetch roti and bottle count details
    const rotiAndBottleData = await rotiBottleCount.findOne({
      tableNo: parseInt(tableNo),
    });

    // Calculate total roti count
    const roti = rotiAndBottleData.roti.reduce(
      (acc, obj) => acc + (obj.rotiCount || 0),
      0
    );

    // Calculate total roti count
    const bottle = rotiAndBottleData.bottle.reduce(
      (acc, obj) => acc + (obj.bottleCount || 0),
      0
    );

    // Handle case where order is not found
    if (!order) {
      return res.status(400).send("Order not found, order not placed");
    }

    // Create transporter for sending email
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: "akashkokate1717@gmail.com",
        pass: "ugja dfbk oojq jrzz", // Replace with your actual password or use environment variables for better security
      },
    });

    // Create list of ordered dishes
    const orderList = order.items
      .map((item) => `<li>${item.dishName}</li>`)
      .join("");

    // Compose email content
    const mailInfo = {
      from: "akashkokate1717@gmail.com",
      to: ["akashkokate1717@gmail.com", userEmail],
      subject: `Your Order List Of Table No : ${tableNo}`,
      html: ` 
        <h1 style="text-align:center">This is your order menu</h1>
        <div style="text-align:center">
        <ul style="list-style-type: none; padding: 0;">
        ${orderList}
        </ul>
        <p style="color:black; font-weight:bold; text-align:center;">This is your all roti count: ${roti}</p>
        <p style="color:black; font-weight:bold; text-align:center;">This is your all bottle count: ${bottle}</p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailInfo);
    console.log("Email sent successfully:", mailInfo);
    res.status(200).send("Email sent successfully");
  } catch (err) {
    console.log("Something went wrong while sending the email", err);
    res.status(400).send("Something went wrong while sending the email");
  }
});

// /getAllOderData in oders collection.

app.get("/getAllOderData", async (req, res) => {
  try {
    let oder = await Order.find({});
    res.status(200).send(oder);
  } catch (err) {
    console.log("something went wrong to fetch oders collection data", err);
    res.send("error to fetch oders data", { data: false });
  }
});

// this /postRotiBottle for posting tableNumber, rotiCount,bottleCount
app.post("/postRotiBottle", async (req, res) => {
  let { tableNo, rotiCount, bottleCount } = req.body;
  try {
    let rotiBottleData = await rotiBottleCount.findOne({ tableNo });
    if (rotiBottleData) {
      rotiBottleData.roti.push({ rotiCount: rotiCount });
      rotiBottleData.bottle.push({ bottleCount: bottleCount });

      await rotiBottleData.save();
      res.status(200).send(rotiBottleData);
    } else {
      const newData = new rotiBottleCount({
        tableNo: tableNo,
        roti: [{ rotiCount: rotiCount }],
        bottle: [{ bottleCount: bottleCount }],
      });
      await newData.save();
      res.status(400).send(newData);
    }
  } catch (error) {
    console.log("something went wrong to push roti and bottle data", error);
  }
});

// this rest api is for getting all the roti and bottle

app.get("/getRotiBottleTableNo", async (req, res) => {
  try {
    let allData = await rotiBottleCount.find({});
    if (allData) {
      res.status(200).send(allData);
    } else {
      res
        .status(500)
        .send("something went wrong to get data", { status: failed });
    }
  } catch (error) {
    console.log("something went wrong to get roti bottle and tableNo");
  }
});

// this route is for otp verification;

app.get("/otpVerificationMail/:otp/:gmail", async (req, res) => {
  try {
    let { otp, gmail } = req.params;
    otp = parseInt(otp);
    let transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: "akashkokate1717@gmail.com",
        pass: "ugja dfbk oojq jrzz",
      },
    });

    let mailInfo = {
      from: "akashkokate1717@gmail.com",
      to: ["akashkokate1717@gmail.com", gmail],
      subject: "Your Otp Verification Mail",
      html: `
        <h1>Welcome To Your XYX Restaurant.
        <h5>This Is Your Otp For Email Verification ${otp}<h3>
      `,
    };
    await transporter.sendMail(mailInfo);
  } catch (error) {
    console.log("get error to send otp mail", error);
  }
});

// this route is for delete the all roti and bottle

app.delete("/deleteAllRotiBottle/:tableNo", async (req, res) => {
  try {
    let { tableNo } = req.params;
    if (!tableNo) {
      return res.status(400).send("tableNo is not found");
    } else {
      await rotiBottleCount.deleteOne({ tableNo: tableNo });
      res
        .status(200)
        .send({ msg: "roti and bottle data deleted", deleted: true });
    }
  } catch (error) {
    console.log("getting error to delete table number roti and bottle");
    res.status(400).send("getting error to delete roti and bottle order");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await connectDatabase();
  console.log(`Server is running on http://localhost:${PORT}`);
});
