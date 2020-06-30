const Discord = require('discord.js');
const mongoose = require("mongoose");
mongoose.connect(process.env.mongosenha, {
	useNewUrlParser: true
});

const Coins = require("../models/money.js")
module.exports.run = async(bot, message, args) => {

  await message.delete();
  if(message.author.id == "437752484963024907") return;
   let member = message.mentions.members.first();
   if(!member) return message.reply("zap");

   Coins.findOneAndDelete({
     userID: member.id,
     serverID: message.guild.id
   }, (err, res) => {
     if(err) console.log(err)
     console.log("Usuario " + member.id + " foi removido do banco de dados")
   })
}

module.exports.help = {
  name: "deluser",
  aliases: ["zerar"]
}
