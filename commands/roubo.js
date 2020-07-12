const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
const main = require("../app.js");
mongoose.connect(process.env.mongosenha, {
	useNewUrlParser: true
});

const Money = require("../models/money.js")

module.exports.run = async (bot, message, args) => {

	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {

	    if(main.roubo === true){
		message.reply('entrou no roubo')
		main.ladroes.push(message.author.username);
		message.reply(`${main.ladroes}`)
	     }else{
		 message.reply('nenhum roubo acontecendo')
	}
  
	    
	        })
	    }

module.exports.help = {
  name: "roubo",
  aliases: ["heist"]
}
