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
	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
	    Money.findOne({serverID: message.guild.id, userID: member.id},(err,data) => {
      const filter = (reaction, user) => ['A', 'B', 'C'].includes(reaction.emoji.name)
          const embed = new RichEmbed()
          .setTitle('Loja')
          .setDescription(`

            A ${a.toString()}
            B ${b.toString()}
            C ${c.toString()}

            `)
            .setColor(0xdd9323)
            .setFooter(`ID: ${message.author.id}`);

            message.channel.send(embed).then(async msg => {
              await msg.react('a');
              await msg.react('b');
              await msg.react('c');

              msg.awaitReactions(filter, {
                max: 1,
                time: 30000,
                errors: ['time']

              }).then(colleted => {

                const reaction = colleted.first();

                switch (reaction.emoji.name) {
                  case 'A':
                    message.reply("penis a");
                    break;
                  case 'B':
                      message.reply("penis b");
                    break;
                  case 'C':
                        message.reply("penis c");
                    break;
                  default:

                }


              }).catch(colleted => {
                return message.channel.send('nao foi')
              })
            });
	            })
	        })
	    }

module.exports.help = {
  name: "loja",
  aliases: ["shop"]
}
//loc.money -= Math.floor(parseInt(args[1]));
//data.money += Math.floor(parseInt(args[1]));
