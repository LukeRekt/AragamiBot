const mongoose = require("mongoose");

const coinsSchema = mongoose.Schema({
  userID: String,
  serverId: String,
  coins: Number
});

module.exports = mongoose.model("Coins", coinsSchema)
