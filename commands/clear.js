const fs = require("fs");
const Discord = require('discord.js');
module.exports.run = async (bot, message, args) => {

  if(isNaN(args[0])) return message.channel.send("quantidade");

  if(args[0] > 100) return message.channel.send("menor que 100");

  message.channel.bulkDelete(args[0])
  .then( message => message.channel.send("apagado"));
}

module.exports.help = {
  name: "clear",
  aliases: ["limpar"]
}
