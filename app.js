const express = require("express");
const { connectDatabase } = require("./databaseConnection");
const { Veg, NonVeg, Order, placeOrders, AllDayOrder } = require("./schema");
const authController = require("./controller/authController");
const nodeMailer = require("nodemailer");
require("dotenv").config();
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use("/api", authController);

// /veg for fetching all the veg data in mongodb
app.get("/veg", async (req, res) => {
  try {
    const vegData = await Veg.find({});
    res.send(vegData);
  } catch (err) {
    console.error("Error fetching veg data:", err);
    res.status(500).send("Something went wrong while fetching veg data");
  }
});

// /nonVeg is for fetching all the nonVeg data from mongodb
app.get("/nonVeg", async (req, res) => {
  try {
    const nonVegData = await NonVeg.find({});
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
    res.status(500).send("Something went wrong while fetching order data");
  }
});

// send mail get method

app.get("/sendMail/:tableNo/:userEmail", async (req, res) => {
  try {
    const { tableNo,userEmail  } = req.params;
    const order = await Order.findOne({ tableNo: tableNo });
    if (!order) {
      res.status(400).send("order is not found, order not placed");
    }
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: "akashkokate1717@gmail.com",
        pass: "ugja dfbk oojq jrzz",
      },
    });

    const orderList = order.items
      .slice(1)
      .map((item) => `<li>${item.dishName}</li>`)
      .join("");

    const mailInfo = {
      from: "akashkokate1717@gmail.com",
      to: ["akashkokate1717@gmail.com",userEmail],
      subject: "Your Oder List",
      html: `
      <h1 style="text-center">this is your oder menu</h1>
      <div>
      <ul>
      ${orderList}
      </ul>
      </div>
      `,
    };

    await transporter.sendMail(mailInfo);
    console.log("Email response:", mailInfo);
  } catch (err) {
    console.log("something went wrong to send mail", err);
    res.status(400).send("something went wrong to send mail");
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await connectDatabase();
  console.log(`Server is running on http://localhost:${PORT}`);
});
