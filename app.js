const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const ms = require('ms');
const request = require('request');
const async = require('async');
const URL = require('url');
const bot = new Discord.Client();
var express = require("express");
var app = express();
var port = process.env.PORT || 3000;

const localPath = path.join(__dirname, 'local');
const playlistPath = path.join(__dirname, 'playlist');
const tempFilesPath = path.join(__dirname, 'tempFiles');
const logsPath = path.join(__dirname, 'logs');
const configPath = path.join(__dirname, 'config');
const modulesPath = path.join(__dirname, 'modules');

const botLogin = require(path.join(configPath, 'botLogin.js'));
const yt = require(path.join(modulesPath, 'youtube.js'));
const botPreferenceFile = path.join(configPath, 'preference.json');
const prefix = '-';

//unica parte que importa

bot.on('guildMemberAdd', member => {
    let channel = member.guild.channels.find('name', 'bem-vindo');
    let memberavatar = member.user.avatarURL
member.sendMessage("Então sejam Bem-Vindos e divirtam-se e chamem os amigos !! Convite: https://discord.gg/SMCmgMC");
});


//até aq

//ping
var http = require("http");
setInterval(function() {
    http.get("http://quiet-wave-83938.herokuapp.com");
}, 300000);





bot.login("NDkxMzczMzY0NjQyNDEzODcxMl1.DrJaig.nSP2G4yVC-chquHEH3Y3fpGonxc");
app.listen(port);
