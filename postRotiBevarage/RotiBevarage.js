const express = require("express");
const { Order } = require("../schema");
const router = express.Router();

router.post("/postRotiOrder/:tableNo/:roti/:bottle", async (req, res) => {
  try {
    let { tableNo, roti, bottle } = req.params;
    let findTable = await Order.findOne({ tableNo: tableNo });
    if (!findTable) {
      return res.status(400).send("table is not found");
    } else {
      findTable.tanduriRoti = roti || 0;
      findTable.waterBottle = bottle || 0;
      await findTable.save();
      return res.send(400).status("order updated successfully")
    }
  } catch (error) {
    console.log("something went wrong to send roti and water bottle")
  }
});

module.exports = router;