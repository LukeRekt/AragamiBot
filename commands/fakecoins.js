const Discord = require('discord.js');
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});
const Money = require("../models/money.js")

module.exports.run = async(bot, message, args) => {


await message.delete();
if(message.author.id != "223207253522644992") return;

}

module.exports.help = {
  name: "fakemoney",
  aliases: ["moneyfake"]
}
