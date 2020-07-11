const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
const roubo = false;
const ativo = false;
mongoose.connect(process.env.mongosenha, {
	useNewUrlParser: true
});

const Money = require("../models/money.js")

module.exports.run = async (bot, message, args) => {
	ativo = true;
	if(ativo === false) return;

	var testeCanal = bot.channels.find(channel => channel.id === '446837976597528586');

	setInterval(() => {
	testeCanal.send("banco encontrado escreva **roubar**", {files: ["https://cdn1.iconfinder.com/data/icons/ecommerce-and-business-icon-set/256/bank.png"]});
    roubo = true;
    testeCanal.send(`Debug: status do roubo : ${roubo}`);
    var myInterval = setInterval(() => {
	roubo = false;
	testeCanal.send("adasdasdsadasd", {files: ["https://cdn1.iconfinder.com/data/icons/ecommerce-and-business-icon-set/256/bank.png"]});
	testeCanal.send(`Debug: status do roubo : ${roubo}`);
	clearInterval(myInterval);

   }, 10000);

}, 30000)



	    Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {


	    if(roubo === true){
		message.reply('entrou no roubo')
	     }else{
		 message.reply('nenhum roubo acontecendo')
	}
  
	    
	        })
	    }

module.exports.help = {
  name: "roubo",
  aliases: ["heist"]
}
