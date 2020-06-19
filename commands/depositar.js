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
	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
	    Money.findOne({serverID: message.guild.id, userID: member.id},(err,data) => {
	        if(!loc){
	            let errorMess = new Discord.RichEmbed()
	            .setColor('RED')
	            .setDescription(`o User **${member.user.tag}** nao esta no banco de dados.`)
	            return message.channel.send(errorMess)
	        }else{

	            if(loc.money < 1) return message.reply(`essa pessoa nao tem dinheiro.`)
              let oldmoney = loc.money
	            let embed = new Discord.RichEmbed()
	            .setColor('RED')
	            .setDescription(`**${message.author.username}** depositou ${oldmoney}`)
              loc.banco += Math.floor(parseInt(oldmoney));
              loc.money -= Math.floor(parseInt(oldmoney));

	            loc.save();
	            message.channel.send(embed)
	                }
	            })
	        })
	    }

module.exports.help = {
  name: "depositar",
  aliases: ["deposit"]
}
