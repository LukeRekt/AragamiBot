const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
const membrosroubo = [];
mongoose.connect(process.env.mongosenha, {
	useNewUrlParser: true
});

const Money = require("../models/money.js")

module.exports.run = async (bot, message, args) => {
	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
	    if(roubo === true){
            membrosroubo.push(msg.author.username);
            message.reply("add no roubo")
		  message.reply(`Debug: participantes: ${membrosroubo}`)
           
           }else{
               message.reply("nenhum roubo acontencendo")
           }
	    })
	}

module.exports.help = {
  name: "roubo",
  aliases: ["heist"]
}
