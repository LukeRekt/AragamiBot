const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});

const Money = require("../models/money.js")

module.exports.run = async (bot, message, args) => {
//todo
//checar money da pessoa
//enviar para o alvo e remover do sender

  //if(sCoins < args[1]) return message.reply("quantidade de moedas indisponivel");
  const a = message.guild.roles.get('726215603563528403');
    const b = message.guild.roles.get('726215588850171951');
      const c = message.guild.roles.get('726227853376749570');
			const d = message.guild.roles.get('726227857025794128');
			const e = message.guild.roles.get('726215603538624594');
			const f = message.guild.roles.get('726215576988418159');
	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
      const filter = (reaction, user) => ['🇦', '🇧', '🇨'].includes(reaction.emoji.name) && user.id === message.author.id;
          let embed = new Discord.RichEmbed()
          .setTitle('Loja')
          .setDescription(`

            🇦 ${a.toString()}
            🇧 ${b.toString()}
            🇨 ${c.toString()}

            `)
            .setColor(0xdd9323)
            .setFooter(`ID: ${message.author.id}`);

            message.channel.send(embed).then(async msg => {
              await msg.react('🇦');
              await msg.react('🇧');
              await msg.react('🇨');

              msg.awaitReactions(filter, {
                max: 1,
                time: 30000,
                errors: ['time']

              }).then(colleted => {

                const reaction = colleted.first();

                switch (reaction.emoji.name) {
                  case '🇦':
									message.member.addRole(a);
                    msg.delete();
                    break;
                  case '🇧':
									message.member.addRole(b);
                      msg.delete();
                    break;
                  case '🇨':
									message.member.addRole(c);
                      msg.delete();
                    break;
                  default:

                }

              }).catch(colleted => {
                return message.channel.send('nao foi')
              })
            });
	        })
	    }

module.exports.help = {
  name: "loja",
  aliases: ["shop"]
}
//loc.money -= Math.floor(parseInt(args[1]));
//data.money += Math.floor(parseInt(args[1]));
