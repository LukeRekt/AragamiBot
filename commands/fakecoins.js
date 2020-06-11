const Discord = require('discord.js');
mongoose.connect("mongodb://179.35.0.113:27017/Tutorial", {
	useNewUrlParser: true
});
const Money = require("./models/money.js")

module.exports.run = async(bot, message, args) => {


await message.delete();
if(message.author.id != "223207253522644992") return;

}

module.exports.help = {
  name: "fakemoney",
  aliases: ["moneyfake"]
}
