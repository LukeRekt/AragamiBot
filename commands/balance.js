const fs = require("fs");
const money = require("../coins.json");
module.exports.run = async(bot, message, args) => {


if(!coins[message.author.id]){
  coins[message.author.id] = {
    coins: 0
  };
}
let uCoins = coins[message.author.id].coins;
let coinEmbed = new Discord.RichEmbed()
.setAuthor(messsage.author.username)
.setColor("#00FF00")
.addField("a", uCoins);

message.channel.send(coinEmbed).then(msg => {msg.delete(5000)});

}

module.exports.help = {
  name: "balance",
  aliases: ["money"]
}
