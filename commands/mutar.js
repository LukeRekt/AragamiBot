
const Discord = require('discord.js');
module.exports.run = async (bot, message, args) => {
    if(message.author.bot) return;
    if(message.channel.type === "dm") return;
      let messageArray = message.content.split(" ");
      let cmd = messageArray[0];
      let args = messageArray.slice(1);
  

  
          let member = message.mentions.members.first();
          if(!member) return message.reply("Você precisa mencionar alguem");
          let rankmute = message.guild.roles.find("name", "Mutado");
          if(!rankmute) return message.reply("não existe um cargo com nome de Mutado");
          if(!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("Sem permissão fiato! >:C");
          let params = message.content.split(" ").slice("1");
          let time = params[1];
          if(!time) return message.reply('Coloca um tempo fiato >:C');
  
          member.addRole(rankmute.id);
          message.channel.send(` ${member.user.tag} calei sua boca por ${ms(ms(time), {long: true})} >:D`);
  
          setTimeout(function() {
          member.removeRole(rankmute.id);
          message.channel.send(`${member.user.tag} foi desmutado`);
      }, ms(time));
  
    }


module.exports.help = {
  name: "mutar",
  aliases: ["mute"]
}
