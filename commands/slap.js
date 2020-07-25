
const superagent = require("superagent");
const Discord = require('discord.js');
module.exports.run = async (bot, message, args) => {

    let User = message.guild.members.get(args[0]) || message.mentions.members.first();
    if (!User) return message.channel.send("Mencione alguém para da um tapa.");
    if (User.id == message.author.id) return message.reply("você não pode dar um tapa em si mesmo.")

    const {
        body
    } = await superagent
        .get(`https://nekos.life/api/v2/img/slap`);

    let Embed = new Discord.RichEmbed()
        .setDescription(`<@${message.author.id}> bate em <@${User.id}> QueOta?`)
        .setImage(body.url)
        .setColor("RANDOM")
        .setTimestamp()

    message.channel.send(Embed)
}

module.exports.help = {
  name: "tapa",
  aliases: ["slap"]
}
