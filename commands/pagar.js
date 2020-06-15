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
 let member = message.guild.member(message.mentions.users.first())

 if(!member) return message.reply(`O usuário não foi encontrado.`)

  if(args[1] == null) return message.reply("quantidade pfv");
  //if(sCoins < args[1]) return message.reply("quantidade de moedas indisponivel");

	if(!args[1]) return message.reply(`Indique a quantidade de dinheiro que você deseja pagar.`)
	    if(args[1] < 1) return message.reply(`valor muito baixo`)
	    if(isNaN(args[1])) return message.reply(`Por favor, insira um valor válido.`)
	    Money.findOne({guildID: message.guild.id, userID: message.author.id},(err,loc) => {
	    Money.findOne({guildID: message.guild.id, userID: member.id},(err,data) => {
	        if(!data){
	            let errorMess = new Discord.MessageEmbed()
	            .setColor('RED')
	            .setDescription(`o User **${member.user.tag}** nao esta no banco de dados.`)
	            return message.channel.send(errorMess)
	        }else{

	            if(loc.money < args[1]) return message.reply(`Você não tem tantas moedas.`)
	            if(loc.userID == member.id) return message.reply(`Você não pode transferir moedas para si mesmo!`)
	            if(member.user.bot) return message.reply(`Bots não são humanos.`)

	            let embed = new Discord.MessageEmbed()
	            .setColor(config.color)
	            .setDescription(`**${message.author.username}** transferido com sucesso **${member.user.username}** money ${args[1]}`)
	            loc.money -= Math.floor(parseInt(args[1]));
	            data.money += Math.floor(parseInt(args[1]));
	            loc.save(); data.save()
	            message.channel.send(embed)
	                }
	            })
	        })
	    }
	}

module.exports.help = {
  name: "pay",
  aliases: ["pagar"]
}
