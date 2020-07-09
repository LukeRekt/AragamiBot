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

  //if(sCoins < args[1]) return message.reply("quantidade de moedas indisponivel");

	if(!args[0]) return message.reply(`Indique a quantidade de dinheiro que você deseja sacar.`)
	    if(args[0] < 1) return message.reply(`valor muito baixo`)
	    if(isNaN(args[0])) return message.reply(`Por favor, insira um valor válido.`)
	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,data) => {
	        if(!data){
	            let errorMess = new Discord.RichEmbed()
	            .setColor('RED')
	            .setDescription(`o User **${message.author.id}** não esta no banco de dados.`)
	            return message.channel.send(errorMess)
	        }else{

	            if(loc.banco < args[0]) return message.reply(`Você não tem tantas moedas.`)
	            //if(member.user.bot) return message.reply(`Bots não são humanos.`)

	            let embed = new Discord.RichEmbed()
	            .setColor('RED')
	            .setDescription(`**${message.author.username}** Sacado com sucesso ${args[1]} de money`)
	            loc.banco -= Math.floor(parseInt(args[0]));
	            data.money += Math.floor(parseInt(args[0]));
	            loc.save(); data.save();
	            message.channel.send(embed)
	                }
	            })
	        })
	    }

module.exports.help = {
  name: "sacar",
  aliases: ["withdraw"]
}
