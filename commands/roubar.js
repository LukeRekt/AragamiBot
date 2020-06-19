const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});

const Money = require("../models/money.js")

module.exports.run = async (bot, message, args) => {
     let numero = Math.floor(Math.random() * 10) + 1;
  //   let numeroroub = Math.floor(Math.random() * 100) + 1;
     let member = message.guild.member(message.mentions.users.first())



     if(!member) return message.reply(`O usuário não foi encontrado.`)



    	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
    	    Money.findOne({serverID: message.guild.id, userID: member.id},(err,data) => {
          if(data.money < 100) return message.reply(`Você não tem tantas moedas.`)
              if(data.money > 500){
								     let numeroroub = Math.floor(Math.random() * 500) + 1;
							}
							if(data.money > 1000){
								     let numeroroub = Math.floor(Math.random() * 1000) + 1;
							}
							if(!data){
    	            let errorMess = new Discord.RichEmbed()
    	            .setColor('RED')
    	            .setDescription(`o User **${member.user.tag}** nao esta no banco de dados.`)
    	            return message.channel.send(errorMess)
    	        }else{


    	           // if(data.userID == member.id) return message.reply(`Você não pode transferir moedas para si mesmo!`)
    	            if(member.user.bot) return message.reply(`Bots não são humanos.`)

                  if(numero > 5){
    	            let embed = new Discord.RichEmbed()
    	            .setColor('RED')
    	            .setDescription(`**${message.author.username}** roubou **${numeroroub}** de ${member}`)
    	            loc.money += Math.floor(parseInt(numeroroub));
    	            data.money -= Math.floor(parseInt(numeroroub));
    	            loc.save(); data.save()
    	            message.channel.send(embed)
                }else {
									let embed = new Discord.RichEmbed()
									.setColor('RED')
									.setDescription(`**${message.author.username}** não conseguiu roubar de ${member}`)
									message.channel.send(embed)
                }
								}
    	                })
    	            })
    	        }
    	    

module.exports.help = {
  name: "roubar",
  aliases: ["steal"]
}
