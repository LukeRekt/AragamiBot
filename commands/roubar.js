const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://lucasrsl1:1010101010@cluster0-rzkwu.mongodb.net/Teste?retryWrites=true&w=majority", {
	useNewUrlParser: true
});

const Money = require("../models/money.js")

module.exports.run = async (bot, message, args) => {
     let numero = Math.floor(Math.random() * 10) + 1;
     message.reply(`caiu ${numero}`)
     if(numero > 5){
       message.reply(`ganhou`)
     }else {
       message.reply(`perdeu`)
     }

	    }

module.exports.help = {
  name: "roubar",
  aliases: ["steal"]
}
