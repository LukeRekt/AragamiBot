
const Discord = require('discord.js');
module.exports.run = async (bot, message, args) => {
    let bReason = args.splice(1).join(" ");

    let banEmbed = new Discord.RichEmbed()
    .setDescription("**---Sugestão---**")
    .setColor("#bc0000")
    .addField("Por", `<@${message.author.id}>`)
    .addField("Sugestão: ", bReason);
    let incidentchannel = message.guild.channels.find(`name`, "sugestoes");
    if(!incidentchannel) return message.channel.send("não achei o canal ;-;.");

    incidentchannel.send(banEmbed);


    return;
  }


module.exports.help = {
  name: "sugestao",
  aliases: ["sugestion"]
}
