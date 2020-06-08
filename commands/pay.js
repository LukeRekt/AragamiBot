const Discord = require("discord.js");
const fs = require("fs");
let coins = require("../coins.json");

module.exports.run = async (bot, message, args) => {
//pagar
if(!coins[message.author.id]){
  return message.reply("vc nao tem dindin")
}

 let pUser = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])

if(!coins[pUser.id]){
  coins[pUser.id] = {
coins: 0
    };
  }

  let pCoins = coins[pUser.id].coins;
  let sCoins = coins[message.author.id].coins;

  if(sCoins < args[0]) return message.reply("quantidade de moedas indisponivel");

coins[message.author.id] = {
  coins: sCoins - parseInt(args[1])
  };

  coins[pUser.id] = {
    coins: pCoins - parseInt(args[1])
  };
  message.channel.send(`${message.author} deu ${args[1]} moedas para ${pUser}`);
fs.writeFile("./coins.json", JSON.stringify(coins), (err) => {
//pinto molhado

});

}

module.exports.help = {
  name: "pay",
  aliases: ["pagar"]
}
