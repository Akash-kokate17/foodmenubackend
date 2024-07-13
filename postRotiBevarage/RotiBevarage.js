const express = require("express");
const { Order } = require("../schema");
const router = express.Router();

router.post("/postRotiOrder/:tableNo/:roti/:bottle", async (req, res) => {
  const { tableNo, roti, bottle } = req.params;

  try {
    let order = await Order.findOne({ tableNo: parseInt(tableNo) });

    if (order) {
      if (roti > 0) {
        let previousRoti = order.tanduriRoti;
        previousBottle += roti;
      }
      if (bottle > 0) {
        let previousBottle = order.waterBottle;
        previousBottle += bottle;
      }
      await order.save();
      res.status(200).send(order);
    } else {
      // Create a new order if none exists for the given table number
      order = new Order({
        no: no || 1,
        items: items || [],
        tableNo: parseInt(tableNo),
        tanduriRoti: roti,
        waterBottle: bottle,
      });

      await order.save();
      res.status(200).send(order);
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Error updating order" });
  }
});

module.exports = router;
