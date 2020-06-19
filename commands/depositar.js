const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});

const Money = require("../models/money.js")

module.exports.run = async (bot, message, args) => {
//todo
//checar money da pessoa(pronto)
//enviar para o banco e remover do bolso/money(+-)
//membro nao foi definido
//formatar as msgs em embed

	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
	        if(!loc){
	            let errorMess = new Discord.RichEmbed()
	            .setColor('RED')
	            .setDescription(`o User **${member.user.tag}** nao esta no banco de dados.`)
	            return message.channel.send(errorMess)
	        }else{

	            if(loc.money < 1) return message.reply(`Você não tem dinheiro.`)

	            let embed = new Discord.RichEmbed()
	            .setColor('RED')
	            .setDescription(`**${message.author.username}** depositou ${oldmoney}`)

	            message.channel.send(embed)
							let oldmoney = loc.money
							loc.banco += Math.floor(parseInt(oldmoney));
							loc.money -= Math.floor(parseInt(oldmoney));

							loc.save();
	                }
	        })
	    }

module.exports.help = {
  name: "depositar",
  aliases: ["deposit"]
}
