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
	.setTitle("Level")
	.setColor("#4000FF")
	.setThumbnail(message.author.displayAvatarURL);
	if(!money){

	}

	if(!money){
		embed.addField("Level", "0", true);
		embed.addField("XP", "0", true);
		return message.channel.send(embed);
	}else {
        let atuxp = money.xp;
		let prolvl = money.level * 300;
        let diferenca = prolvl - atuxp;
		embed.addField("Level", money.level, true);
        embed.addField("XP", money.xp, true);
        embed.setFooter(`${diferenca}XP restando para upar`)
		return message.channel.send(embed).then(msg => {msg.delete(5000)});
	}
})
}

module.exports.help = {
  name: "level",
  aliases: ["lvl"]
}
