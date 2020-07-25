const mongoose = require("mongoose");

const moneySchema = mongoose.Schema({
userID: String,
serverID: String,
username: String,
money: Number,
banco: Number,
xp: Number,
level: Number


})

module.exports = mongoose.model("Money", moneySchema);
