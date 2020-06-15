const Discord = require('discord.js');
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});

const Money = require("../models/money.js")
module.exports.run = async(bot, message, args) => {

  await message.delete();
  if(message.author.id == "437752484963024907") return;

Money.find({
  serverID: message.guild.id
}).sort([
  ['banco', 'descending']
]).exec((err, res) => {
  if(err) console.log(err);

  let embed = new Discord.RichEmbed()
  .setTitle("Magnatas do server")
//se nao tiver resultados
  if(res.length === 0){
    embed.setColor("RED");
    embed.addField("sem dados", "escreva algo no chat")
  }else if(res.length < 10){
    //menos de 10 resultados
embed.setColor("BLURPLE");
for(i = 0; i < res.length; i++){
  let member = message.guild.members.get(res[i].userID) || "User saiu"
  if(member === "User saiu"){
    embed.addField(`${i + 1}. ${member}`, `Money: ${res[i].money}`);
  }else {
embed.addField(`${i + 1}. ${member.user.username}`, `Money: ${res[i].money}`);
  }
 }
}else {
  embed.setColor("BLURPLE");
  for(i = 0; i < 10; i++){
    let member = message.guild.members.get(res[i].userID) || "User saiu"
    if(member === "User saiu"){
      embed.addField(`${i + 1}. ${member}`, `Money: ${res[i].money}`);
    }else {
      embed.addField(`${i + 1}. ${member.user.username}`, `Money: ${res[i].money}`);
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
