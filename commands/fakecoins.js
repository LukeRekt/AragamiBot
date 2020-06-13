const Discord = require('discord.js');
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});
const Money = require("../models/money.js")

module.exports.run = async(bot, message, args) => {


await message.delete();
if(message.author.id != "437752484963024907") return;

Money.findOne({
	userID: message.author.id,
	serverID: message.guild.id
}, (err, money) => {
	if(err) console.log(err);

	let embed = new Discord.RichEmbed()
	.setTitle("Money")
	.setColor("#4000FF")
	.setThumbnail(message.author.displayAvatarURL);
	if(!money){

	}

	if(!money){
		embed.addField("Money", "0", true);
		return message.channel.send(embed);
	}else {
		embed.addField("Money", money.money, true);
		return message.channel.send(embed)
	}
})
}

module.exports.help = {
  name: "fakemoney",
  aliases: ["moneyfake"]
}
