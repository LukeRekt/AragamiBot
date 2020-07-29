const Discord = require('discord.js');
const mongoose = require("mongoose");
mongoose.connect(process.env.mongosenha, {
	useNewUrlParser: true
});
const Money = require("../models/money.js")

module.exports.run = async(bot, message, args) => {


await message.delete();
if(message.author.id == "437752484963024907") return;

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
		embed.addField("Mão✋", "0", true);
		embed.addField("Banco🏦", "0", true);
		return message.channel.send(embed).then(msg => {msg.delete(5000)});
	}else {
		embed.addField("Mão✋", money.money, true);
		embed.addField("Banco🏦", money.banco, true);
		return message.channel.send(embed).then(msg => {msg.delete(5000)});
	}
})
}

module.exports.help = {
  name: "money",
  aliases: ["dinheiro"]
}
