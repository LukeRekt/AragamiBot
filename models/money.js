const mongoose = require("mongoose");

const moneySchema = mongoose.Schema({
userID: String,
serverID: String,
username: String,
money: Number


})

module.exports = mongoose.model("Money", moneySchema);
