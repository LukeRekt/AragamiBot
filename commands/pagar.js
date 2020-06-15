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
 let pUser = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])

  //checar se todos os argumentos foram colocados
  if(args[1] == null) return message.reply("quantidade pfv");
  //if(sCoins < args[1]) return message.reply("quantidade de moedas indisponivel");

  let pagamento = args[1];
  console.log(pagamento + " coins");

  Money.findOne({
  	userID: message.author.id,
  	serverID: message.guild.id
   }, (err, money) =>{
  if(err) console.log(err);
  if(!money){

  return message.reply("essa pessoa nunca falou no chat");

  	newMoney.save().catch(err => console.console.log(err));
    }else {
  money.money = money.money + pagamento;
  money.save().catch(err => console.log(err));
  }
  })
  message.channel.send(`${message.author} deu ${args[1]} moedas para ${pUser}`);

}

module.exports.help = {
  name: "pay",
  aliases: ["pagar"]
}
