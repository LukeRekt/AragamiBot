const Discord = require('discord.js');
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});

const Coins = require("../models/coins.js")
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
