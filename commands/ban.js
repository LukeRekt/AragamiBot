
const Discord = require('discord.js');
module.exports.run = async (bot, message, args) => {
  
    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!bUser) return message.channel.send("Usuário inválido!");
    let bReason = args.join(" ").slice(22);
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sem permissão!");
    if(bUser.hasPermission("BAN_MEMBERS")) return message.channel.send("Não tenho permissão para banir essa pessoa!");

    let banEmbed = new Discord.RichEmbed()
    .setDescription("---Banido---")
    .setColor("#bc0000")
    .addField("Banido", `${bUser}`)
    .addField("Banido por", `<@${message.author.id}>`)
	.addField("Hora", message.createdAt)
    .addField("Motivo", bReason);
    let incidentchannel = message.guild.channels.find(`name`, "punidos");
    if(!incidentchannel) return message.channel.send("não achei o canal ;-;.");

    message.guild.member(bUser).sendMessage("Banido do café Otaro >:D Motivo:");
    message.guild.member(bUser).sendMessage(bReason);
    message.guild.member(bUser).ban(bReason);
    incidentchannel.send(banEmbed);


    return;
  }


module.exports.help = {
  name: "ban",
  aliases: ["banir"]
}
