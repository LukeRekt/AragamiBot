const mongoose = require("mongoose");

const moneySchema = mongoose.Schema({
userID: String,
serverID: String,
money: Number

})

module.exports = mangoose.model("Money", moneySchema);
