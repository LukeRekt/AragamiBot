const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
mongoose.connect(process.env.mongosenha, {
	useNewUrlParser: true
});

const Money = require("../models/money.js");

module.exports.run = async (bot, message, args) => {
//todo
//checar money da pessoa
//enviar para o alvo e remover do sender
//sim
  //if(sCoins < args[1]) return message.reply("quantidade de moedas indisponivel");
  Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,money) => {
  const a = message.guild.roles.get('726215603563528403');
    const b = message.guild.roles.get('726215588850171951');
      const c = message.guild.roles.get('726227853376749570');
			const d = message.guild.roles.get('726227857025794128');
			const e = message.guild.roles.get('726215603538624594');
			const f = message.guild.roles.get('726215576988418159');
      const filter = (reaction, user) => ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫'].includes(reaction.emoji.name) && user.id === message.author.id;
          let embed = new Discord.RichEmbed()
          .setTitle('Loja')
          .setDescription(`

            🇦 ${a.toString()} 
            **💸 10000$**
            🇧 ${b.toString()} 
            **💸 20000$**
            🇨 ${c.toString()} 
            **💸 30000$**
            🇩 ${d.toString()} 
            **💸 40000$**
            🇪 ${e.toString()} 
            **💸 50000$**
            🇫 ${f.toString()} 
            **💸 60000$**

            `)
            .setColor(0x9323DD)
            .setFooter(` mais itens em breve`);

            message.channel.send(embed).then(async msg => {
              await msg.react('🇦');
              await msg.react('🇧');
              await msg.react('🇨');
							await msg.react('🇩');
              await msg.react('🇪');
							await msg.react('🇫');
              msg.awaitReactions(filter, {
                max: 1,
                time: 30000,
                errors: ['time']

              }).then(colleted => {

                const reaction = colleted.first();

                switch (reaction.emoji.name) {
                  case '🇦':
                   
                  message.member.addRole(a);
                  if(money.banco < 10000) return message.channel.send("você não tem dinheiro suficiente!")
                  money.banco -= Math.floor(parseInt(10000));
                  money.save();
                    msg.delete();
                     
                    break;
                  case '🇧':
                  message.member.addRole(b);
                  if(money.banco < 20000) return message.channel.send("você não tem dinheiro suficiente!")
                  money.banco -= Math.floor(parseInt(20000));
                  money.save();
                      msg.delete();
                    break;
                  case '🇨':
                  message.member.addRole(c);
                  if(money.banco < 30000) return message.channel.send("você não tem dinheiro suficiente!")
                  money.banco -= Math.floor(parseInt(30000));
                  money.save();
                      msg.delete();
                    break;
									case '🇩':
                  message.member.addRole(d);
                  if(money.banco < 40000) return message.channel.send("você não tem dinheiro suficiente!")
                  money.banco -= Math.floor(parseInt(40000));
                  money.save();
										  msg.delete();
									  break;
									case '🇪':
                  message.member.addRole(e);
                  if(money.banco < 50000) return message.channel.send("você não tem dinheiro suficiente!")
                  money.banco -= Math.floor(parseInt(50000));
                  money.save();
										  msg.delete();
									  break;
									case '🇫':
                  message.member.addRole(f);
                  if(money.banco < 60000) return message.channel.send("você não tem dinheiro suficiente!")
                  money.banco -= Math.floor(parseInt(60000));
                  money.save();
										msg.delete();
										break;
                  default:

                }

              }).catch(colleted => {
                return msg.delete();
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
