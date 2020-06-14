const Discord = require('discord.js');
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});

const Coins = require("../models/coins.js")
module.exports.run = async(bot, message, args) => {

  await message.delete();
  if(message.author.id == "437752484963024907") return;

Coins.find({
  serverID: message.guild.id
}).sort([
  ['coins', 'descending']
]).exec((err, res) => {
  if(err) console.log(err);

  let embed = new Discord.RichEmbed()
  .setTitle("Magnatas do server")

  if(res.length === 0){
    embed.setColor("RED");
    embed.addField("sem dados", "escreva algo no chat")
  }else if(res.length < 10){
embed.setColor("BLURPLE");
for(i = 0; e < res.length; i++){
  let member = message.guild.members.get(res[i].userID) || "User saiu"
  if(member === "User saiu"){
    embed.addField(`${i + 1}. ${member}`, `Money: ${res[i].coins}`);
  }else {
embed.addField(`${i + 1}. ${member.user.username}`, `Money: ${res[i].coins}`);
  }

  }
}else {
  embed.setColor("BLURPLE");
  for(i = 0; e < 10; i++){
    let member = message.guild.members.get(res[i].userID) || "User saiu"
    if(member === "User saiu"){
      embed.addField(`${i + 1}. ${member}`, `Money: ${res[i].coins}`);
    }else {
      embed.addField(`${i + 1}. ${member.user.username}`, `Money: ${res[i].coins}`);
      }
     }
    }
    message.channel.send(embed);
 })
}

module.exports.help = {
  name: "leaders",
  aliases: ["rank"]
}
