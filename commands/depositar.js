const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
mongoose.connect(process.env.mongosenha, {
	useNewUrlParser: true
});

const Money = require("../models/money.js")

module.exports.run = async (bot, message, args) => {
//todo
//checar money da pessoa
//enviar para o alvo e remover do sender
message.delete(1000);
	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
	        if(!loc){
	            let errorMess = new Discord.RichEmbed()
	            .setColor('RED')
	            .setDescription(`O user **${message.author.username}** não esta no banco de dados.`)
	            return message.channel.send(errorMess)
	        }else{

	            if(loc.money < 1) return message.reply(`essa pessoa não tem dinheiro.`)
              let oldmoney = loc.money
	            let embed = new Discord.RichEmbed()
	            .setColor('RED')
	            .setDescription(`**${message.author.username}** depositou ${oldmoney}`)
              loc.banco += Math.floor(parseInt(oldmoney));
              loc.money -= Math.floor(parseInt(oldmoney));

	            loc.save();
	            message.channel.send(embed).then(msg => {msg.delete(5000)});
	                }
	        })
	    }

module.exports.help = {
  name: "depositar",
  aliases: ["deposit"]
}
