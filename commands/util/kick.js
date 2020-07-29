
const Discord = require('discord.js');
module.exports.run = async (bot, message, args) => {
  
    let kUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!kUser) return message.channel.send("Não achei o fiato!");
    let kReason = args.join(" ").slice(22);
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sem permissão!");
    if(kUser.hasPermission("BAN_MEMBERS")) return message.channel.send("Não tenho permissão para kickar essa pessoa!");

    let kickEmbed = new Discord.RichEmbed()
    .setDescription("---Kickado---")
    .setColor("#e56b00")
    .addField("Kickado", `${kUser}`)
    .addField("Kickado por", `<@${message.author.id}>`)
	  .addField("Hora", message.createdAt)
    .addField("Motivo", kReason);

    let kickChannel = message.guild.channels.find(`name`, "punidos");
    if(!kickChannel) return message.channel.send("Canal de kick não encontrado.");

    message.guild.member(kUser).kick(kReason);
    kickChannel.send(kickEmbed);

    return;
  }


module.exports.help = {
  name: "kick",
  aliases: ["kickar"]
}
