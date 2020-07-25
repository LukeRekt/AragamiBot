
const Discord = require('discord.js');
const jimp =require("jimp");
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
const mongoose = require("mongoose");
const moedasRecentes = new Set();
var roubo = false;
var ativo = false;
var msgsRoubo = 0;
var ladroes = [];
var cafezinho = '';

const prefix = '-'

const botLogin = require(path.join(configPath, 'botLogin.js'));
const yt = require(path.join(modulesPath, 'youtube.js'));
const botPreferenceFile = path.join(configPath, 'preference.json');
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

mongoose.connect(process.env.mongosenha, {
	useNewUrlParser: true
});
const Money = require("./models/money.js")

//apenas para testar se o heroku esta fazendo os deploys
fs.readdir("./commands/", (err, files) => {
	if(err) console.log(err);

	let jsfile = files.filter(f => f.split(".").pop() === "js")
	if(jsfile.length <= 0){
		console.log("Couldnt find any commands");
		return;
	}
	jsfile.forEach((f) => {
		let props = require(`./commands/${f}`);
		console.log(`${f} carregado!`);
		bot.commands.set(props.help.name, props);

		props.help.aliases.forEach(alias => {
			bot.aliases.set(alias, props.help.name);
		})
	})
})

try{
	var botVersion = require(path.join(__dirname, 'package.json')).version;

}catch(error) {
	if(error) {
		console.log(error);
		return;
	}
	var botVersion = "#?";
}

try{
	var botPreference = JSON.parse(fs.readFileSync(botPreferenceFile));
}
catch(err){
	if(err) console.log(err);
	var defualt = {
		initcmd: ".",
		adminGroups: "report"
	}

	fs.writeFile(botPreferenceFile, JSON.stringify(defualt, null, '\t'), err =>{
		if(err) console.loge(err);
	});
}

var adminRoles = botPreference.admingroups;
var initcmd = botPreference.initcmd;
var defualtGame = "Comandos -ajuda";

// The object voice channel the bot is in
var currentVoiceChannel = null;

// Playback
var queue = [];
var botPlayback;	// stream dispatcher
var voiceConnection;	// voice Connection object
var playing = false;
var stopped = false;
var stayOnQueue = false;
var looping = false;

// Check existence of folders
var paths = [localPath, playlistPath, tempFilesPath, logsPath];
for(var i = 0; i < paths.length; i++){
	if(!fs.existsSync(paths[i])){
		fs.mkdirSync(paths[i])
	}
}

// Prints errors to console and also reports error to user
function sendError(title, error, channel){
	console.log("-----"  + "ERROR"+ "------");
	console.log(error);
	console.log("----------");
	channel.send("**" + title + " Error**\n```" + error.message +"```");
}

//	peguei aq: https://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript#1303650
function isNumber(obj) {
	return !isNaN(parseFloat(obj))
}

// teste do comando
function isCommand(message, command){
	var init = message.slice(0,1);
	var keyword = (message.indexOf(' ') !== -1) ? message.slice(1, message.indexOf(' ')) : message.slice(1);
	if(init === initcmd && keyword.toLowerCase() === command.toLowerCase() ){
		return true;
	}
	return false;
}

// checkar rank
function isAdmin(message){
	var roles = message.member.roles.array();
	for(var role = 0; role < roles.length; role++){
		for( var i = 0; i < adminRoles.length; i++){
			if(roles[role].name.toLowerCase() === adminRoles[i])
				return true;
		}
	}

	return false;
}

function isOwner(message){
	if(message.member.id === botLogin.owner_id)
		return true
	else
		return false;
}

function getGuildByString(guildName){
	return bot.guilds.filterArray( (guild) =>{
		return guild.name === guildName;
	})[0];
}

function getChannelByString(guild, channelName){
	return guild.channels.filterArray( (channel) =>{
		return channel.name === channelName;
	})[0];
}

function setGame(game){
	bot.user.setActivity(game);
	if(game)
		console.log("DISCORD: GAME SET: " + game)
}

// Removes all temporary files downloaded from youtube
function removeTempFiles(){
	fs.readdir(tempFilesPath, (error, files) =>{
		if(error) return sendError("Reading Temp Path", error, message.channel);

		async.each(files, (file, callback) =>{
			fs.unlink(path.join(tempFilesPath, file), error =>{
				if(error) return callback(error);
				callback(null);
			});
		});
	});
}

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;


    return month + "/" + day + "/" + year + "," + hour + ":" + min + ":" + sec;
}

function botUptime(){
	var uptimeSeconds = 0, uptimeMinutes = 0, uptimeHours = 0, uptimeDays = 0;

	uptimeSeconds = Math.floor(bot.uptime/1000);

	if(uptimeSeconds > 60){
		uptimeMinutes = Math.floor(uptimeSeconds/60);
		uptimeSeconds = Math.floor(uptimeSeconds % 60);
	}

	if(uptimeMinutes > 60){
		uptimeHours = Math.floor(uptimeMinutes / 60);
		uptimeMinutes = Math.floor(uptimeMinutes % 60);
	}

	if(uptimeHours > 24){
		uptimeDays = Math.floor(uptimeHours / 24);
		uptimeHours = Math.floor(uptimeHours % 24);
	}

	return [uptimeDays, uptimeHours, uptimeMinutes, uptimeSeconds];
}

/*	Starts playing the first song(index) of the queue
*	After it has passed it checks to see if there is another in queue
*	If there are more songs in queue, the first song is removed after it has been played unless
*	it is set to loop, replay, or stopped
*/
function play(connection, message) {
	const song = queue[0];
	if(!fs.existsSync(song.file)){
		message.channel.send("**ERRO:** `" + queue[0].title + "` Arquivo não encontrado Pulando...");
		queue.shift();
	}

	botPlayback = connection.playFile(song.file)
		.on('end', ()=>{
			playing = false;

			if(!stopped){
				if(looping){
					queue.push(queue.shift());
				} else{
					if(!stayOnQueue){
						queue.shift();
					} else
						stayOnQueue = false;
				}

				if(queue.length > 0){
					play(connection, message);
				} else{
					// setGame(defualtGame);
					setTimeout(()=>{
						removeTempFiles();
					}, 1500);
				}
			}
		})
		.on('error', (error)=>{
			sendError("Playback", error, message.channel);
		});
	botPlayback.setVolume(0.5);
	playing = true;
}

// Generate Invite link
function getInvite(callback){
	bot.generateInvite([
		"CONNECT", "SPEAK", "READ_MESSAGES", "SEND_MESSAGES", "SEND_TTS_MESSAGES",
		"ATTACH_FILES", "USE_VAD"
	]).then( link => {
		callback(link);
	});
}

function clearTemp(){
	fs.readdir(tempFilesPath, (error, files) =>{
		if(files.length > 0){
			async.each(files, (file, callback) =>{
				fs.unlinkSync(path.join(tempFilesPath, file));
				callback();
			}, ()=>{
				console.log("Temp Folder cleared");
			});
		}
	});

}

function isYTLink(input){
	/* YT REGEX : https://stackoverflow.com/questions/3717115/regular-expression-for-youtube-links
	*	by Adrei Zisu
	*/
	var YT_REG = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/

	return YT_REG.test(input);
}

bot.on('ready', () => {
	console.log("Aragami V" + botVersion)
	console.log(bot.user.username + " (" + bot.user.id + ")");

	// display servers
	var guilds = [];
	bot.guilds.array().forEach( (guild) =>{
		guilds.push(guild.name);
	});

	if(guilds.length > 0){
		console.log("Servers:");
		console.log(guilds.join("\n"));
		console.log();
	}

	setGame(defualtGame);

	// Displays invite link if the bot isn't conntected to any servers
	if(bot.guilds.size === 0){
		getInvite(link =>{
			console.log("Invite this bot to your server using this link:\n"  + link);
		});
		console.log();
	}

	clearTemp();
});

bot.on('disconnect', (event) =>{
	console.log("Exited with code: " + event.code);
	if(event.reason)
		console.log("Reason: " + event.reason);

	removeTempFiles();
	process.exit(0);
});

bot.on('message', message => {
	// List admin groups that are allowed to use admin commands
	if(isCommand(message.content, 'listgroups')){
		if(isOwner(message) || isAdmin(message)){
			var list = [];
			for(var i = 0; i < adminRoles.length; i++){
				list.push("**"+(i+1) + "**. " + adminRoles[i]);
			}
			message.channel.send("**Admins-Grupos**", {
				embed: {
					description: list.join('\n'),
					color: 15158332
				}
			});
		}
	}

	// Command to add a certain group to use admin access
	if(isCommand(message.content, 'addgrupo')){
		if(isOwner(message) || isAdmin(message)){
			if(message.content.indexOf(' ') !== -1){
				var group = message.content.split(' ');
				group.splice(0,1);
				group = group.join(" ");

				group = message.guild.roles.find( role => {
					return role.name.toLowerCase() === group.toLowerCase();
				});

				if(!group){
					message.channel.send("grupo não encontrado");
					return;
				}else
					group = group.name.toLowerCase();

				fs.readFile(botPreferenceFile, (error, file) =>{
					if(error) return sendError("Reading Preference File", error, message.channel);

					try{
						file = JSON.parse(file);
					}catch(error){
						if(error) return sendError("Parsing Preference File", error, message.channel);
					}

					for(var i = 0; i < file.admingroups.length; i++){
						if(file.admingroups[i] === group)
							return message.channel.send("Grupo já adicionado");
					}

					file.admingroups.push(group);

					adminRoles = file.admingroups;

					fs.writeFile(botPreferenceFile, JSON.stringify(file, null, '\t'), error =>{
						if(error) return sendError("Writing to Preference File", error, message.channel);

						message.channel.send("Grupo `" + group + '` adicionado');
					});
				});
			}
		} else message.channel.send("Você não tem permissão batola.");
	}

	// Remove a group from admin access
	if(isCommand(message.content, 'remgrupo')){
		if(isOwner(message) || isAdmin(message)){
			if(message.content.lastIndexOf(' ') !== -1){
				var groupName = message.content.split(' ')[1].toLowerCase();

				for(var i = 0; i < adminRoles.length; i++){
					if(groupName === adminRoles[i]){
						adminRoles.splice(i, 1);

						fs.readFile(botPreferenceFile, (err, file)=>{
							if(err) return sendError("Reading Preference File", err, message.channel);

							try{
								file = JSON.parse(file)
							}catch(err){
								if(err) return sendError("Parsing Preference File", err, message.channel);
							}

							file.admingroups = adminRoles;

							fs.writeFile(botPreferenceFile, JSON.stringify(file, null, '\t'), err =>{
								if(err) return sendError("Writing to Preference File", err, message.channel);
								message.channel.send("Grupo `" + groupName + "` Removido.");
							});
						});
					}
				}
			}
		} else message.channel.send("Você não pode usar esse comando.");
	}

	// Admin Commands
	if(isCommand(message.content, 'mudarnome')){
		if(isOwner(message) || isAdmin(message)){
			if(message.content.indexOf(' ') !== -1){
				var username = message.content.split(' ')[1];
				bot.user.setUsername(username);
				console.log("DISCORD: Username set to " + username);
			}
		} else message.channel.send("Você não tem permissão.");
	}

	if(isCommand(message.content, 'mudaravt')){
		if(isOwner(message) || isAdmin(message)){
			if(message.content.indexOf(' ') !== -1){
				var url = message.content.split(' ')[1];
				bot.user.setAvatar(url);
				console.log("DISCORD: Avatar changed");
			}
		} else message.channel.send("Você não tem permissão.");
	}

  	if(isCommand(message.content, 'mudargame') && isAdmin(message)){
  		if(isOwner(message) || isAdmin(message)){
				if(message.content.indexOf(' ') !== -1){
	  			var init = message.content.split(' ')[1];
	  			setGame(init);
	  		}
			} else message.channel.send("Você não tem permissão.");
  	}

  	if(isCommand(message.content, 'desligar')){
  		if(isOwner(message) || isAdmin(message)){
				if(currentVoiceChannel)
	  			currentVoiceChannel.leave();
	  		bot.destroy();
			} else message.channel.send("Você não tem permissão.");
  	}

  	if(isCommand(message.content, 'setinit')){
  		if(isOwner(message) || isAdmin(message)){
				if(message.content.indexOf(' ') !== -1){
	  			var init = message.content.split(' ')[1];

	  			initcmd = init;

	  			fs.readFile(botPreferenceFile, (error, file) => {
	  				if(error) return sendError("Reading Preference File", error, message.channel);

	  				try{
	  					file = JSON.parse(file);
	  				}catch(error){
	  					if(error) return sendError("Parsing Preference File", error, message.channel);
	  				}

	  				file.initcmd = init;

	  				fs.writeFile(botPreferenceFile, JSON.stringify(file, null, '\t'), error =>{
	  					if(error) return sendError("Writing Preference File");

	  					message.channel.send("init setada `" + init + "`");
	  				});
	  			});
	  		}
			} else message.channel.send("Você não tem permissão.");
  	}
  	// -----------------------------------------------------------------------

  	if(isCommand(message.content, 'Teste')){
  		message.channel.send("Esse é o primeiro comando <3");
  	}

  	if(isCommand(message.content, 'reportar')){
  		if(message.content.indexOf(' ') !== -1){
  			var user = message.member.user.username;
  			var msg = message.content.split(' ');
  			var report;
  			var reportFile = path.join(logsPath, message.guild.id + '_reports');

  			msg.splice(0,1);
  			msg = msg.join(' ');
  			report = getDateTime() + " " + user + "@"+ message.guild.name + ": " + msg;

  			if(fs.existsSync(reportFile)){
  				fs.readFile(reportFile, 'utf-8', (error, file)=>{
  					if(error) return sendError("Reading Report File", error, message.channel);
  					file = file.split('\n');
  					file.push(report);
  					fs.writeFile(reportFile, file.join('\n'), error=>{
  						if(error) return sendError("Writing Report File", error, message.channel);
  						message.channel.send("Vlw por reportar <3");
  					});
  				});
  			}else{
  				fs.writeFile(reportFile, report, error =>{
  					if(error) return sendError("Writing Report File", error, message.channel);
  					message.channel.send("Vlw por reportar <3");
  				});
  			}
  			console.log("REPORT: " + user + " from " + message.guild.name + " submitted a report.");
  		} else{
  			message.channel.send("Q?");
  		}
  	}

		if(isCommand(message.content, 'reports')){
			if(isOwner(message) || isAdmin(message)){
				fs.readdir(logsPath, (error, files)=>{
					if(error) return sendError("Reading Logs Path", error, message.channel);

					for(var i = 0; i < files.length; i++){
						if(files[i].split('_')[0] === message.guild.id){
							fs.readFile(path.join(logsPath, files[i]),'utf-8', (error, file)=>{
								if(error) return sendError("Reading Report File", error, message.channel);

								// Clear the report once it's been read
								if(file === "") return message.channel.send("nenhum report");

								message.channel.send("_-Reports-_", {
									embed: {
										color: 0xee3239,
										description: file
									}
								});
							});
							return;
						}
					}
					message.channel.send("Report não disponiveis");
				});
			} else message.channel.send("sem permissão batola.");
		}

		if(isCommand(message.content, 'delreports')){
			if(isOwner(message) || isAdmin(message)){
				fs.readdir(logsPath, (error, files) => {
					if(error) return sendError('Reading Logs Path', error, message.channel);

					for(var i = 0; i < files.length; i++){
						if(files[i].split('_')[0] === message.guild.id){
							fs.unlink(path.join(logsPath, files[i]), error =>{
								if(error) return sendError("Unlinking log file", error, message.channel);
								message.channel.send("Reports deletados");
							});
							return;
						}
					}
					message.channel.send("Arquivo de report não encontrado Pvf Contate @LukeRekt#9589");
				})
			} else message.channel.send("sem permissão batola.");
		}

  	if(isCommand(message.content, 'stats')){
  		const users = bot.users.array();
  		const guildMembers = message.guild.members.array();
  		const channels = bot.channels.array();

  		var guildTotalOnline = 0;
  		var totalOnline = 0;
  		var totalTextChannels = 0;
  		var totalVoiceChannels = 0;
  		var uptime = botUptime();

  		for(var i = 0; i < guildMembers.length; i++){
  			if(guildMembers[i].presence.status === 'online'){
  				guildTotalOnline++;
  			}
  		}

  		for(var i = 0; i < users.length; i++){
  			if(users[i].presence.status === 'online'){
  				totalOnline++;
  			}
  		}
  		var nonGuildChannels = 0;
  		for(var i = 0; i < channels.length; i++){
  			if(channels[i].type === 'text')
  				totalTextChannels++
  			else if(channels[i].type === 'voice')
  				totalVoiceChannels++
  			else
  				nonGuildChannels++
  		}

	  	getInvite(link =>{
	  		message.channel.send("**Status**",{
	  			embed: {
	  				author: {
				      name: bot.user.username,
				      url: link,
				      icon_url: bot.user.displayAvatarURL
				    },
	  				color: 1752220,
	  				fields: [{
	  					name: "Members",
	  					value: "`" + bot.users.size + "` Total\n`" + totalOnline + "` Online\n\n`" + message.guild.memberCount + "` total this server\n`" + guildTotalOnline + "` online this server",
	  					inline: true
	  				}, {
	  					name: "Channels",
	  					value: "`" + (bot.channels.size - nonGuildChannels)+ "` Total\n`" + message.guild.channels.size + "` this server\n`" + totalTextChannels + "` Total Text\n`" + totalVoiceChannels + "` Total Voice",
	  					inline: true
	  				}, {
	  					name: "Servers",
	  					value: bot.guilds.size,
	  					inline: true
	  				}, {
	  					name: "Uptime",
	  					value: uptime[0] + "d " + uptime[1] + "h " + uptime[2] + "m " + uptime[3] + "s",
	  					inline: true
	  				}],
	  				thumbnail: {
						url: bot.user.displayAvatarURL
					}
	  			}
	  		});
	  	});
  	}

  	if(isCommand(message.content, 'sobre')){
  		var owner = message.guild.members.find(member =>{
  			return member.user.username === "LukeRekt"
  		});

  		if(owner){
  			owner = "<@" + owner.id + ">"
  		}else
  			owner = "LukeRekt"

  		getInvite(link =>{
  			message.channel.send("**Sobre**", {
	  			embed: {
	  				author: {
				      name: bot.user.username,
				      url: link,
				      icon_url: bot.user.displayAvatarURL
				    },
				    color: 10181046,
	  				fields: [{
	  					name: "Nome",
	  					value: bot.user.username,
	  					inline: true
	  				},{
	  					name: "Versão",
	  					value: "V" + botVersion,
	  					inline: true
	  				},{
	  					name: "Autor",
	  					value: owner,
	  					inline: true
	  				},{
	  					name: "Lib",
	  					value: "js",
	  					inline: true
	  				},{
	  					name: "Quem sou?",
	  					value: "sou conhecido por todos como lo expocador de xotas",
	  					inline: false
	  				}],
	  				thumbnail: {
						url: bot.user.displayAvatarURL
					}
	  			}
	  		});
  		});

  	}

  	if(isCommand(message.content, 'ajuda')){
			if(message.content.indexOf(' ') !== -1){
				var prt = message.content.split(' ')[1];

				if(prt.toLowerCase() === 'admin'){
					message.channel.send("**Comandos de admin**", {
						embed: {
							color: 1752220,
							description: "`" + initcmd + "setinit`: seta a pefix\n"+
							"`" + initcmd + "listgroup`: lista os grupos com perm de admin\n"+
							"`" + initcmd + "addgroup`: adiciona um grupo no admin\n"+
							"`" + initcmd + "remgroup`: remove um grupo do admin\n"+
							"`" + initcmd + "setusername`: muda o nome do bot\n"+
							"`" + initcmd + "setavatar`: muda o foto do bot\n"+
							"`" + initcmd + "setgame`: muda o que o bot está jogando\n"+
							"`" + initcmd + "setinit`: seta a prefix\n"+
							"`" + initcmd + "reports`: lista os reports\n"+
							"`" + initcmd + "delreports`: limpa os reports\n"+
							"`" + initcmd + "desligar`: desliga o bot bot\n"
						}
					});
						return;
				}

				if(prt.toLowerCase() === 'geral'){
					message.channel.send("**Comandos Gerais**", {
						embed: {
							color: 1752220,
							description: "`" + initcmd+ "sobre`: informaçoes sobre o bot\n" +
							"`" + initcmd+ "status`: mostra o status\n" +
							"`" + initcmd+ "report`: Reporta um problema/player\n" +
							"`" + initcmd+ "Teste`: é teste\n" +
							"`" + initcmd+ "uptime`: tempo de atividade\n" +
							"`" + initcmd+ "invite`: pega o invite do server\n" +
							"`" + initcmd+ "setvc`: segredo\n" +
							"`" + initcmd+ "entrar`: Bot vai entrar no canal\n"
						}
					});
						return;
				}

				if(prt.toLowerCase() === 'musica'){
					message.channel.send("**comandos musica**(Não funciona)", {
						embed: {
							color: 1752220,
							description: "`" + initcmd + "fila` ou `tocando`: para ver as musicas na fila\n" +
							"`" + initcmd + "tocar [YT_URL]`: toca a musica de um link especifico\n" +
							"`" + initcmd + "tocar [index]`: toca a musica de algum arquivo do bot\n" +
							"`" + initcmd + "tocar [nome do video]`: tocar o primeiro resultado\n" +
							"`" + initcmd + "tocar [nome da playlist ou link]`: adiciona uma playlist\n" +
							"`" + initcmd + "tocar`: volta a tocar se o bot estiver pausado\n" +
							"`" + initcmd + "parar`: para a musica\n" +
							"`" + initcmd + "pular`: pula a musica atual\n" +
							"`" + initcmd + "replay`: para e recomeça a musica atual\n" +
							"`" + initcmd + "readd`: duplica a musica atual na fila\n" +
							"`" + initcmd + "loop`: Toca a musica atual infinitamente\n" +
							"`" + initcmd + "local`: mostra a musicas salvas no bot\n" +
							"`" + initcmd + "remover [index]`: remove a fila da fila\n" +
							"`" + initcmd + "remover [#,#,#]`: remove musicas especificas por numero\n" +
							"`" + initcmd + "salvar [YT_URL]`: armazena a musica no bot\n" +
							"`" + initcmd + "salvar`: salva a musica na playlist\n" +
							"`" + initcmd + "remlocal [index]`: remove a musica salva local\n" +
							"`" + initcmd + "playlist`: Lista todas as playlists\n" +
							"`" + initcmd + "playlist [playlist_index]`: lista todas as musicas da playlist\n" +
							"`" + initcmd + "playlist salvar [nome]`: salva a playlist nos arquivos do bot\n" +
							"`" + initcmd + "playlist remover [index]`: Remove a playlist\n"+
							"`" + initcmd + "playlist remover [playlist_index] [track_index]`: Remove uma musica especifica da playlist\n"+
							"`" + initcmd + "playlist add [playlist_index] [YT_URL]`: adiciona uma musica para a playlist\n"+
							"`" + initcmd + "playlist renomear [nome_playlist ou index_playlist] [novo_nome_playlist]`: muda o nome da playlist"
						}
					});
					return;
				}
			} else{
				message.channel.send("**Comandos**", {
					embed: {
						color: 1752220,
						description: "**Comandos Adm**\n" +
						"`" + initcmd + "ajuda admin`: Comandos de admin\n"+
						"`" + initcmd + "ajuda geral`: Comandos gerais\n"+
						"`" + initcmd + "ajuda musica`: Comando de Musica\n"
					}
				});
			}
  	}

  	if(isCommand(message.content, 'invite')){
  		getInvite(link => {
  			message.channel.send("**Invite:** "  + link);
  		});
  	}

  	if(isCommand(message.content, 'uptime')){
  		var uptime = botUptime();
  		var d = uptime[0], h = uptime[1], m = uptime[2], s = uptime[3];

  		message.channel.send("**Uptime:** " + d + " Dias(s) : " + h + " houras(s) : " + m + " minuto(s) : " + s + " segundo(s)");
  	}

  	if(isCommand(message.content, 'setvc')){
  		if(message.content.indexOf(" ") !== -1){
  			var voiceChannelName = message.content.split(" ")[1];

  			var guild = message.member.guild;
  			var channel = getChannelByString(guild, voiceChannelName);

  			function writeOutChannels(){
  				fs.writeFile(defaultChannelPath, JSON.stringify(defaultChannel, null, '\t'), () =>{
		  			message.channel.send("vc do server setado para " + voiceChannelName);
		  		});
  			}

  			if(channel){
  				defaultChannel.name = voiceChannelName;
				defaultChannel.guild = guild.name;
				defaultChannel.voiceID = channel.id;
				defaultChannel.guildID = guild.id;
				writeOutChannels();
  			} else
  			  	message.channel.send("vc não encontrado");
  		}
  	}

  	if(isCommand(message.content, 'entrar')){
  		var userVoiceChannel = message.member.voiceChannel;
  		if(userVoiceChannel){
  			if(!playing){
  				if(currentVoiceChannel){
	  				currentVoiceChannel.leave();
	  				currentVoiceChannel = null;
	  			 }
  				userVoiceChannel.join();
  				currentVoiceChannel = userVoiceChannel;
		  	} else
		  		message.channel.send("já tô tocando >:C");
  		}
  		else
  			message.channel.send("Entra no chat primeiro >:C .");
  	}

  	if(isCommand(message.content, 'fila') || isCommand(message.content, 'tocando') || isCommand(message.content, 'q')){
  		var songs = [];
  		for (var i = 0; i < queue.length; i++) {
  			songs.push(queue[i].title);
  		}

  		if(songs.length > 0){
  			if(songs.length === 1){
  				if(looping){
  					message.channel.send("**Fila - [LOOP]**\n**Tocando:** " + songs[0]);
  				} else
  					message.channel.send("*Fila - [LOOP]**\n**Tocando:**  " + songs[0]);
  			} else{
  				var firstSong = songs.shift();
  				for (var i = 0; i < songs.length; i++) {
  					songs[i] = "**" + (i+1) + ". **"+ songs[i];
  				}
  				if(looping){
  					message.channel.send("*Fila - [LOOP]**\n**Tocando:** " + firstSong + "\n\n" + songs.join("\n"));
  				} else
  					message.channel.send("**Queue - Playlist**\n**Tocando:** " + firstSong + "\n\n" + songs.join("\n"));
  			}
  		} else
  			message.channel.send("No songs queued");
  	}

  	if(isCommand(message.content, 'local') || isCommand(message.content, 'l')){
  		fs.readdir(localPath, (error, files) =>{
  			if(error) return sendError("Reading Local directory", error, message.channel);
  			for(var i = 0; i < files.length; i++){
  				files[i] = "**" + (i+1) + ".** " + files[i].split(".")[0];
  			}

  			message.channel.send("**Local Songs**", {
  				embed: {
  					color: 10181046,
  					description: files.length > 0 ? files.join("\n") : "No Local files found"
  				}
  			});
  		});
  	}

  	if(isCommand(message.content, 'tocar') || isCommand(message.content, 'p')){
  		var file = message.attachments.first();

  		// Handle playing audio for a single channel
  		if(playing && currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Tô tocando em outro canal de voz >:C");
			return;
		}

		if(!message.member.voiceChannel){
			message.channel.send("entra em um canal primeiro batola");
			return;
		}

		if(currentVoiceChannel !== message.member.voiceChannel){
			if(currentVoiceChannel) currentVoiceChannel.leave();

			currentVoiceChannel = message.member.voiceChannel;
			if(playing){
				message.channel.send("atualmente tocando algo");
				return;
			}
		}

		function pushPlay(title, fPath, local, id, URL){
			if(id && URL){
				queue.push({
			 		title: title,
			 		id: id,
			 		file: fPath,
			 		local: local,
			 		url: URL
			 	});
			} else if(!id && !URL){
				queue.push({
			 		title: title,
			 		file: fPath,
			 		local: local
			 	});
			}


		 	if(!playing){
		 		message.channel.send("**Tocando:** " + title);
		 		currentVoiceChannel.join().then( connection => {
					voiceConnection = connection;
					play(connection, message);
				});
		 	} else{
		 		message.channel.send("**Adicionado:**\n" + title);
		 	}
		}

		// Play audio by file
		if(file){
			if(stopped){
				stopped = false;
	  			stayOnQueue = false;
	  			queue.splice(0,1);
	  	}

			var ext = file.filename.split('.');
			ext = ext[ext.length - 1];
			if(ext !== 'mp3'){
				message.channel.send("SÓ Mp3 :c");
				return;
			}

			var fileName = file.filename.replace(/[&\/\\#,+()$~%'":*?<>{}|_-]/g,'');
			var filePath = path.resolve(tempFilesPath, fileName);
			var title = fileName.slice(0, fileName.lastIndexOf('.'));

			if(fs.existsSync(filePath)){
				pushPlay(title, filePath, false);
			 } else{
			 	var stream = request.get(file.url);

				stream.on('error', error => {
					if(error) return sendError("Getting Sound File", error, message.channel);
				});

				stream.pipe(fs.createWriteStream(filePath));

				stream.on('complete', () =>{
					pushPlay(title, filePath, false);
				});
			}
		} else if(message.content.indexOf(' ') !== -1){
			var input = message.content.split(' ')[1];
			var qUrl = URL.parse(input, true);
			var isLink = isYTLink(input);

			if(stopped){
				stopped = false;
	  			stayOnQueue = false;
	  			queue.splice(0,1);
	  		}

			// Play audio by direct url link
			if( qUrl.hostname !== null && qUrl.hostname !== "www.youtube.com" && qUrl.hostname !== "youtu.be"){
				if(input.endsWith('.mp3')){
					var file = input.slice(input.lastIndexOf('/') + 1).replace(/[&\/\\#,+()$~%'":*?<>{}|_-]/g,'');
					var filePath = path.join(tempFilesPath, file);
					var title = file.slice(0, file.lastIndexOf('.'));

					if(fs.existsSync(filePath)){
						pushPlay(title, filePath, false);
					 } else{
					 	var stream = request.get(input);

					 	stream.on('response', response =>{
					 		if(response.statusCode === 404){
					 			message.channel.send("Nenhum arquivo aceitavel encontrado nesse link");
					 		}else{
					 			stream.pipe(fs.createWriteStream(filePath));
					 		}
					 	});

						stream.on('error', error => {
							if(error) return sendError("Pegando somzinho", error, message.channel);
						});

						stream.on('complete', () =>{
							if(fs.existsSync(filePath)){
								pushPlay(title, filePath, false);
							}
						});
					}
				} else
					message.channel.send("arquivo não encontrado/não suportavel");
			} else if(isLink){
				// Play audo by YTURL
				var input = message.content.split(' ')[1];
				yt.getInfo(input, (error, rawData, id, title, length_seconds) => {
					if(error) return sendError("Youtube Info", error, message.channel);
					var filePath = path.join(tempFilesPath, id + '.mp3');

					yt.getFile(input, filePath, (err) =>{
						if(err) return sendError("Streamando", err, message.channel);
						pushPlay(title, filePath, false, id, input);
					});
				});
			} else{
				// Play audio file by index number
				var indexFile = message.content.split(' ')[1];
				if(isNumber(indexFile)){
					indexFile = Number(indexFile);
					fs.readdir(localPath, (error, files) =>{
						if(error) return sendError("Reading local", error, message.channel);
						for(var i = 0; i < files.length; i++){
							if( indexFile === (i+1)){
								var title = files[i].split('.')[0];
								var file = path.join(localPath, files[i]);

								pushPlay(title, file, true);
								return;
							}
						}
						message.channel.send("nenhuma musica local encontrada.");
					});
				} else{
					input = message.content.split(' ');
					input.shift();

					// Playing a playlist
					if(input[0] === 'playlist' || input[0] === 'pl'){
						var pl = input[1];
						fs.readdir(playlistPath, (error, files) =>{
							if(error) return sendError("Reading Playlist Path", error, message.channel);

							if(isNumber(pl)){
								pl = Number(pl);
							} else
								pl = pl.toLowerCase();

							async.eachOf(files, (file, index, callback)=>{
								if((index+1) === pl || files[index].split('.')[0].toLowerCase() === pl){
									try{
										var playlist = fs.readFileSync(path.join(playlistPath, files[index]));
										playlist = JSON.parse(playlist);
									}catch(error){
										if(error) return sendError("Parsing Playlist File", error, message.channel);
									}

									message.channel.send("Carregando `" + files[index].split('.')[0] + '` Para a fila');

									async.eachSeries(playlist, (song, callback) =>{
										var title = song.title;
										var URL = song.url;
										var id = song.id;
										var local = song.local;

										if(song.local){
											queue.push({
												title: title,
												file: song.file,
												local: true
											});

											if(queue.length === 1){
												if(!playing){
											 		message.channel.send("**Tocando:** " + title);
											 		currentVoiceChannel.join().then( connection => {
														voiceConnection = connection;
														play(connection, message);
													});
											 	}
											}
										} else{
											yt.getInfo(URL, (error, rawData, id, title, length_seconds) =>{
												if(error) return callback(error);
												var filePath = path.join(tempFilesPath, id + '.mp3');

												yt.getFile(URL, filePath, ()=>{
													queue.push({
														title: title,
														file: filePath,
														id: id,
														url: URL,
														local: false
													});

													if(queue.length === 1){
														if(!playing){
													 		message.channel.send("**Tocando:** " + title);
													 		currentVoiceChannel.join().then( connection => {
																voiceConnection = connection;
																play(connection, message);
															});
													 	}
													}
												});
											});
										}
										callback(null);
									}, err =>{
										if(err) return sendError("Getting Youtube Info", err, message.channel);
									});
								}
							}, err=>{
								if(err) return sendError(err, err, message.channel);
							});
						});
					}else{
						input = input.join();
						//	Play Youtube by search
						yt.search(input, (error, searchResults) =>{
							if(error) return sendError("Youtube Search", error, message.channel);
							var id, title, songURL;

							if(searchResults.length > 0){
								id = searchResults[0].id;
								title = searchResults[0].title;
								songURL = searchResults[0].url;
							} else{
								message.channel.send("Não achei >:C");
								return;
							}
							var file = path.join(tempFilesPath, id + '.mp3' );

							yt.getFile(songURL, file, () =>{
								pushPlay(title, file, false, id, songURL);
							});
						});
					}
				}
			}
  		} else{
  			if(queue.length > 0){
  				if(!playing){
  					currentVoiceChannel.join().then( connection => {
  						voiceConnection = connection;
  						play(voiceConnection, message);
  					});
  				} else
  					message.channel.send("Já estou tocando algo");
  			}
  			else
  				message.channel.send("Sem musicas na fila");
  		}
  	}

  	if(isCommand(message.content, 'parar')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Você não está no meu canal >:C");
  			return;
  		}

  		if(playing){
  			playing = false;
  			stayOnQueue = true;
  			stopped = true;
  			botPlayback.end();
  		} else
  			message.channel.send("Tem nada pra parar ;-;");
  	}

  	if(isCommand(message.content, 'pular')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Você não está no meu canal >:C");
  			return;
  		}

  		if(playing){
  			var prevSong = queue[0].title;
  			playing = false;
  			stayOnQueue = false;
  			botPlayback.end();
  			if(queue.length > 0)
  				message.channel.send("**Pulado:** " + prevSong + "\n**Tocando:** " + queue[0].title);
  			else
  				message.channel.send("**Pulado:** " + prevSong);
  		} else{
  			if(queue.length > 0){
  				var prevSong = queue[0].title;

  				if(stayOnQueue)
  					stayOnQueue = false;
  				queue.shift();
  				message.channel.send("**Pulado:** " + prevSong + "\n**Tocando:** " + queue[0].title);
  				play(voiceConnection, message);
  			} else{
  				message.channel.send("Nada pra para ;-;");
  			}
  		}
  	}

  	if(isCommand(message.content, 'replay')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Você não está no meu canal >:C");
  			return;
  		}

  		if(playing){
  			playing = false;
  			stayOnQueue = true;
  			botPlayback.end();
  		} else
  			message.channel.send("Precisa estar tocando pra dar replay");
  	}

  	if(isCommand(message.content, 'remover')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Você não está no meu canal >:C");
  			return;
  		}

  		if(message.content.indexOf(' ') !== -1){
  			var param = message.content.split(' ')[1];

  			if(param === "all"){
  				if(!playing){
  					queue = [];
  					removeTempFiles();
  				} else{
  					queue.splice(1, queue.length - 1);
  				}
  				message.channel.send("Todas as musicas removidas da fila");
  				return;
  			}

  			if(param.indexOf(',') !== -1){
  				param = param.split(',');
  			}else{
  				param = [param];
  			}
  			for(var i = 0; i < param.length; i++){
  				if(isNumber(param[i])){
  					param[i] = Number(param[i]);
  				}else{
  					message.channel.send("alguns dos parametros não são numeros");
  					return;
  				}
  			}

  			var list = [];
  			for(var x = 0; x < param.length; x++){
  				for(var y = 1; y < queue.length; y++){
  					if(param[x] === y){
  						list.push(queue[y]);
  					}
  				}
  			}

  			for(var i = 0; i < list.length; i++){
  				for(var x = 1; x < queue.length; x++){
  					if(list[i].title === queue[x].title){
  						var title = queue[x].title;
						queue.splice(x, 1);
						message.channel.send("**Removido:** `" + title + "` da fila");
  					}
  				}
  			}
  		}
  	}

  	if(isCommand(message.content, 'salva')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Você não está no meu canal >:C");
  			return;
  		}

	  	if(message.content.indexOf(' ') !== -1){
	  		var url = message.content.split(' ')[1];
	  		yt.getInfo(url, (error, rawData, id, title, length_seconds) =>{
	  			if(error) return sendError("Youtube Info", error, message.channel);
	  			var title = title.replace(/[&\/\\#,+()$~%.'":*?<>{}|]/g,'');
	  			yt.getFile(url, './local/' + title + '.mp3', () =>{
	  				message.channel.send("**Salvado:** *" + title + "*");
	  			});
	  		});

	  	}
	  	else{
	  		if(playing){
	  			var song = queue[0];
		  		var title = song.title.replace(/[&\/\\#,+()$~%.'":*?<>{}|]/g,'');
			  	var output = './local/' + title + '.mp3';
	  			if(!song.local){
		  			if(!fs.existsSync(output)){
		  				fs.createReadStream(song.file).pipe(fs.createWriteStream(output));
		  				message.channel.send("**Salvado:** *" + title + "*");
		  			} else{
		  				message.channel.send("Você já salvou essa musica >:C")
		  			}
		  		} else{
		  			message.channel.send("Você já salvou essa musica >:C");
		  		}
	  		} else{
	  			message.channel.send("Nada tocando para adicionar");
	  		}
	  	}
  	}

  	if(isCommand(message.content, 'remlocal')){
  		var index = Number(message.content.split(' ')[1]);

  		fs.readdir(localPath, (error, files) =>{
  			if(error) return sendError("Remove Local", error, message.channel);
  			for (var i = 0; i < files.length; i++) {
	  			if((i+1) === index){
	  				if(!playing){
	  					fs.unlinkSync(localPath + files[i]);
	  					message.channel.send("Removido " + files[i].split('.')[0]);
	  					return;
	  				} else{
	  					if(files[i] !== queue[0].title + '.mp3'){
	  						fs.unlinkSync(localPath + files[i]);
	  						message.channel.send("Removido " + files[i].split('.')[0]);
	  						return;
	  					}
	  				}

	  			}
  			}
  			message.channel.send("Nenhum arquivo local removido com essa index.");
  		});
  	}

  	if(isCommand(message.content, 'readd')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("não está no meu canal >:C");
  			return;
  		}

  		if(queue.length > 0){
  			var newSong = queue[0];
			queue.push(newSong);
			message.channel.send("**Readicionado na fila** " + newSong.title);
  		} else
  			message.channel.send("Nada tocando.");
  	}

  	if(isCommand(message.content, 'loop')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("não está no meu canal >:C");
  			return;
  		}

	  	if(!looping){
	  		looping = true;
	  		message.channel.send("Loop `ON`");
	  	} else{
	  		looping = false;
	  		message.channel.send("Loop `OFF`");
	  	}
  	}

  	if(isCommand(message.content, 'playlist') || isCommand(message.content, 'pl')){
  		if(message.content.indexOf(' ') !== -1){
  			var param = message.content.split(' ')[1];

  			if(isNumber(param)){
  				param = Number(param);
  				fs.readdir(playlistPath, (error, files) => {
  					if(error) return sendError("Reading Playlist Directory", error, message.channel);

  					for(var i = 0; i < files.length; i++){
  						if((i+1) === param){
  							try{
								var playlist = fs.readFileSync(path.join(playlistPath, files[i]));
								var playlist = JSON.parse(playlist);
  							}catch(error){
  								if(error) return sendError("Reading Playlist File", error, message.channel);
  							}

  							var playlistTitle = files[i].split('.')[0];
							var songs = [];

							for(var i = 0; i < playlist.length; i++){
								songs.push("**" + (i+1) + ".** " + playlist[i].title);
							}

							message.channel.send("**Playlist - " + playlistTitle + "**\n" + songs.join("\n"));
  						}
  					}
  				});
  			} else{
  				if(param.toLowerCase() === 'save'){
  					if(message.content.indexOf(' ', message.content.indexOf('save')) !== -1){
  						var playlistName = message.content.split(' ');
  						playlistName.splice(0,2);
  						playlistName = playlistName.join(' ');
  						var playlist = [];

  						if(queue.length === 0)
  							return message.channel.send("No songs in queue to save from");

  						for(var i = 0; i < queue.length; i++){
  							if(queue[i].local){
  								playlist.push({
  									title: queue[i].title,
  									file: queue[i].file,
  									local: queue[i].local
  								});
  							} else{
  								playlist.push({
  									title: queue[i].title,
  									url: queue[i].url,
  									id: queue[i].id,
  									local: false
  								});
  							}
  						}

  						fs.readdir(playlistPath, (error, files) =>{
  							if(error) return sendError("Readding Playlist Path", error, message.channel);

  							for(var i = 0; i < files.length; i++){
  								var fileName = files[i].split('.')[0];
  								if(fileName.toLowerCase() === playlistName.toLowerCase()){
  									message.channel.send("There is a playlist with this name already");
  									return;
  								}
  							}

  							fs.writeFile(path.join(playlistPath, playlistName + '.json'), JSON.stringify(playlist, null, '\t'), error =>{
	  							if(error) return sendError("Writing Playlist File", error, message.channel);
	  							message.channel.send("Playlist `" + playlistName + '` salva');
	  						});
  						});
  					}
  					return;
  				}

  				if(param.toLowerCase() === 'remover'){
  					if(message.content.indexOf(' ', message.content.indexOf('remover')) !== -1){
  						var playlistIndex = message.content.split(' ')[2];
  						var trackIndex = message.content.split(' ')[3];

  						if(!isNumber(playlistIndex)){
  							message.channel.send('coloque o numero da index para remover')
  							return;
  						} else playlistIndex = Number(playlistIndex);

  						if(trackIndex){
  							if(isNumber(trackIndex)){
  								trackIndex = Number(trackIndex);
  								fs.readdir(playlistPath, (error, files) =>{
  									if(error) return sendError("Reading Playlist Path", error, message.channel);
  									for(var i = 0; i < files.length; i++){
  										if((i+1) === playlistIndex){
  											var playlistFile = files[i];
  											var playlistFileName = files[i].split('.')[0];

  											fs.readFile(path.join(playlistPath, playlistFile), (error, file)=>{
  												try{
  													file = JSON.parse(file);
  												} catch(error){
  													if(error) return sendError("Parsing Playlist File", error, message.channel);
  												}

  												if(trackIndex > file.length || trackIndex <= 0){
  													return message.channel.send('Coloca o index certo >:C')
  												}

  												var titleTrack = file[trackIndex-1].title;
  												file.splice(trackIndex - 1, 1);
  												if(file.length === 0){
  													message.channel.send("Considere remover a playlist toda.");
  													return;
  												}
  												fs.writeFile(path.join(playlistPath, playlistFile), JSON.stringify(file, null, '\t'), error =>{
  													if(error) return sendError("Writing to Playlist File", error, message.channel);
  													message.channel.send('**Playlist**\n `' + titleTrack +  '` Foi removida de `' + playlistFileName + '` playlist')
  												});
  											});
  										}
  									}
  								});
  							} else{
  								message.channel.send('por favor o numero da index');
  								return;
  							}
  							return;
  						}

  						fs.readdir(playlistPath, (error, files) => {
  							if(error) return sendError("Reading Playlist Path", error, message.channel);
  							for(var i = 0; i < files.length; i++){
  								if((i+1) === playlistIndex){
  									var title = files[i].split('.')[0];
  									fs.unlink(path.join(playlistPath, files[i]), error =>{
  										if(error) return sendError("Unlinking Playlist File", error, message.channel);
  										message.channel.send("Playlist `" + title + "` removida");
  									});
  									return;
  								}
  							}
  							message.channel.send("Playlist não encontrada");
  						});
  					}
  					return;
  				}

  				if(param.toLowerCase() === 'add'){
  					if(message.content.indexOf(' ', message.content.indexOf('add')) !== -1){
  						var playListIndex = message.content.split(' ')[2];
  						var link = message.content.split(' ')[3];

  						if(isNumber(playListIndex)){
  							playListIndex = Number(playListIndex);
  							if(link){
  								if(!isYTLink(link)){
								message.channel.send("você não colocou um numero do youtube valido");
  									return;
  								}

  								fs.readdir(playlistPath, (err, files) =>{
  									if(err) return sendError("Reading Directory", err, message.channel);
  									async.eachOf(files, (file, index) =>{
  										if((index + 1) === playListIndex){
  											fs.readFile(path.join(playlistPath, file), (err, pl) =>{
  												if(err) return sendError("Reading File", err, message.channel);
  												try{
  													pl = JSON.parse(pl);
  												} catch(err){
  													if(err) return sendError("Parsing File", err, message.channel);
  												}

  												yt.getInfo(link, (error, rawData, id, title) =>{

  													async.each(pl, (song, callback) =>{
	  													if(song.id === id || song.url === link || song.title === title){
	  														callback(new Error("Already in playlist"));
	  													} else {
	  														callback(null);
	  													}
	  												}, err =>{
	  													if(err) return sendError(err, err, message.channel);

	  													pl.push({
	  														title: title,
	  														id: id,
	  														url: link,
	  														local: false
	  													});

	  													fs.writeFile(path.join(playlistPath, file), JSON.stringify(pl, null, '\t'), err =>{
	  														if(err) return sendError("Writing Playlist File", err, message.channel);

	  														message.channel.send("*" + title +"*\n Foi adicionada em `" + file.split('.')[0] + "` playlist");
	  													});
	  												});


  												});

  											});
  										}
  									});
  								});
  							}else {
  								message.channel.send("URL não deu tenta dnv parceirinho");
  							}
   						} else{
  							message.channel.send("Index não especificada");
  						}
  					}
  					return;
  				}

  				if(param.toLowerCase() === 'renomear'){
  					if(message.content.indexOf(' ', message.content.indexOf('renomear')) !== -1){
  						var playlistName = message.content.split(' ')[2];
  						var newPlaylistName = message.content.split(' ')[3];

  						if(!newPlaylistName){
  							message.channel.send("nome da playlist não especificada");
  							return;
  						}

  						if(isNumber(playlistName)){
  							playlistName = Number(playlistName);
  						}

  						var e = /^[a-zA-Z0-9_]*$/;
  						if(!e.test(newPlaylistName)){
  							message.channel.send("Sem simbolos >:C");
  							return;
  						}

  						fs.readdir(playlistPath, (err, files) =>{
  							if(err) return sendError("Reading Playlist Path", err, message.channel);

  							for(var i = 0; i < files.length; i++){
  								if(files[i].split('.')[0].toLowerCase() === (isNumber(playlistName) ? playlistName : playlistName.toLowerCase()) || (playlistName - 1) === i){
  									var oldPlPath = path.join(playlistPath, files[i]);
  									var newPlPath = path.join(playlistPath, newPlaylistName + '.json');
  									fs.rename(oldPlPath, newPlPath, (err)=>{
  										if(err) return sendError("Renaming Playlist File", err, message.channel);
  										message.channel.send("Playlist `" + files[i].split('.')[0] + "` has been renamed to `" + newPlaylistName + "`");
  									});
  									return;
  								}
  							}
  							message.channel.send("Playlist `" + files[i].split('.')[0] + "` not found");
  						});
  					} else{
  						message.channel.send("No name specified");
  					}
  				}
  			}
  		} else {
  			fs.readdir(playlistPath, (error, files) =>{
  				if(error) return sendError("Reading Playlist Directory", error, message.channel);
  				for(var i = 0; i < files.length; i++){
  					files[i] = "**" + (i+1) + ".** " + files[i].split('.')[0];
  				}

  				if(files.length > 0)
  					message.channel.send("**Playlist**\n" + files.join("\n"));
  				else {
  					message.channel.send("Nenhuma playlist salva");
  				}
  			});
  		}
  	}
});


bot.on('voiceStateUpdate', (oldMember, newMember) =>{
	if(newMember.id === bot.user.id){
		newMember.voiceChannel = currentVoiceChannel;
	}

	if(currentVoiceChannel && oldMember.voiceChannel){
		if(oldMember.voiceChannel === currentVoiceChannel && newMember.voiceChannel !== currentVoiceChannel  && currentVoiceChannel.members.size === 1){
			if(queue.length > 0){
				queue.splice(0, queue.length);
			}

			if(playing){
				botPlayback.end();
				playing = false;
				stopped = false;
				looping = false;
				stayOnQueue = false;
			}

			currentVoiceChannel.leave();
		}
	}
});
//glubglub basico
bot.on('message', (message) => {
	if(message.content == '-mamaeu'){
		bot.channels.get("446430669560741888").send("Glub-Glub")
		//message.author.sendMessage('ainda quer o Glub-Glub ?');
	}
});


//pm top do aragami
bot.on('message', (message) => {
	if(message.content == '-pmara'){
		message.author.sendMessage('Estou fazendo doação anal e oral gratis para quem tiver mais de 20 cm ');

		message.author.sendMessage("Foto do mine", {files: ["https://media.discordapp.net/attachments/446159043103555595/454497116631597056/Capture_2018-06-08-00-07-20-1.png"]});
	}
});
bot.on('message', message=> {
    if (message.isMentioned(bot.user)) {
    message.reply('TÔ de volta patrono :moyai:');

}
});


bot.on("message", async message => {
  if(message.author.bot) return;
  if(message.channel.type === "dm") return;

  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

  if(cmd === `${initcmd}kick`){

    //!kick @daeshan askin for it

    let kUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!kUser) return message.channel.send("Não achei o fiato!");
    let kReason = args.join(" ").slice(22);
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sem permissão!");
    if(kUser.hasPermission("BAN_MEMBERS")) return message.channel.send("Não tenho permissão para kickar essa pessoa!");

    let kickEmbed = new Discord.RichEmbed()
    .setDescription("---Kickado---")
    .setColor("#e56b00")
    .addField("Kickado", `${kUser}`)
    .addField("Kickado por", `<@${message.author.id}>`)
	  .addField("Hora", message.createdAt)
    .addField("Motivo", kReason);

    let kickChannel = message.guild.channels.find(`name`, "punidos");
    if(!kickChannel) return message.channel.send("Canal de kick não encontrado.");

    message.guild.member(kUser).kick(kReason);
    kickChannel.send(kickEmbed);

    return;
  }

  if(cmd === `${initcmd}ban`){

    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!bUser) return message.channel.send("Usuário inválido!");
    let bReason = args.join(" ").slice(22);
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sem permissão!");
    if(bUser.hasPermission("BAN_MEMBERS")) return message.channel.send("Não tenho permissão para banir essa pessoa!");

    let banEmbed = new Discord.RichEmbed()
    .setDescription("---Banido---")
    .setColor("#bc0000")
    .addField("Banido", `${bUser}`)
    .addField("Banido por", `<@${message.author.id}>`)
	.addField("Hora", message.createdAt)
    .addField("Motivo", bReason);
    let incidentchannel = message.guild.channels.find(`name`, "punidos");
    if(!incidentchannel) return message.channel.send("não achei o canal ;-;.");

    message.guild.member(bUser).sendMessage("Banido do café Otaro >:D Motivo:");
    message.guild.member(bUser).sendMessage(bReason);
    message.guild.member(bUser).ban(bReason);
    incidentchannel.send(banEmbed);


    return;
  }
  });


//bem-vindo é no começo

bot.on('guildMemberAdd', member => {
    let channel = member.guild.channels.find('name', '💬salão-principal');
   let memberavatar = member.user.avatarURL
        if (!channel) return;
				bot.channels.get('445793368078024706').send('use o canal #📝-registro-cliente para conhecermos mais sobre vc amiguinho');





      //  let embed = new Discord.RichEmbed()
        //.setColor('RANDOM')
        //.addField('nome : ', `${member}`)
      //  .addField(':coffee: | Bem-vindo!', `Bem-vindo ao server amiguinho <3`)
	//	.addField('use o canal #registro-do-cliente para conhecermos mais sobre vc amiguinho', '.')


        //channel.sendEmbed(embed);

});

//bot.on("guildMemberAdd", async member => {

  //let canal = bot.channels.get("445793368078024706")
  //let fonte = await jimp.loadFont(jimp.FONT_SANS_32_BLACK)
  //let mask = await jimp.read('mascara.png')
  //let fundo = await jimp.read('fundo.png')

  //jimp.read(member.user.displayAvatarURL).then(avatar => {
  //avatar.resize(130, 130)
  //mask.resize(130, 130)
  //avatar.mask(mask)

  //fundo.print(fonte, 170, 175, member.user.username)
  //fundo.composite(avatar, 40, 90).write('bemvindo.png')
  //canal.send(``, { files: ["bemvindo.png"] })

  //console.log('Imagem enviada para o Discord')
  //})
  //.catch(err => {
  //console.log('error avatar')
  //})
//})

//Comando de mutar por tempo

bot.on("message", async message => {
  if(message.author.bot) return;
  if(message.channel.type === "dm") return;
	let messageArray = message.content.split(" ");
	let cmd = messageArray[0];
	let args = messageArray.slice(1);

	if(cmd === `${initcmd}mutar`){

		let member = message.mentions.members.first();
		if(!member) return message.reply("Você precisa mencionar alguem");
		let rankmute = message.guild.roles.find("name", "Mutado");
		if(!rankmute) return message.reply("não existe um cargo com nome de Mutado");
		if(!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("Sem permissão fiato! >:C");
		let params = message.content.split(" ").slice("1");
		let time = params[1];
		if(!time) return message.reply('Coloca um tempo fiato >:C');

		member.addRole(rankmute.id);
		message.channel.send(` ${member.user.tag} calei sua boca por ${ms(ms(time), {long: true})} >:D`);

		setTimeout(function() {
		member.removeRole(rankmute.id);
		message.channel.send(`${member.user.tag} foi desmutado`);
	}, ms(time));

  }
  	if(cmd === `${initcmd}dbmutar`){

		let member = message.mentions.members.first();
		if(!member) return message.reply("Você precisa mencionar alguem");
		let rankmute = message.guild.roles.find("name", "Mutado");
		if(!rankmute) return message.reply("não existe um cargo com nome de Mutado");
		//if(!isOwner (message)) return message.channel.send("Sem permissão fiato! >:C");
		let params = message.content.split(" ").slice("1");
		let time = params[1];
		if(!time) return message.reply('Tempo de mute inválido!');
        message.delete();
		member.addRole(rankmute.id);


		setTimeout(function() {
		member.removeRole(rankmute.id);

	}, ms(time));
//aa
  }

//desmutar - inicio
//membro recebe message.guild.members
//if quem escreveu prem == Mute
//else msg sem permissão
//if member cargo == Mutado then Remove
//message (desmutado/remove count)
});

bot.on("message", async message => {
  if(message.author.bot) return;
  if(message.channel.type === "dm") return;

  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

  if(cmd === `${initcmd}bater`){
    let mUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!mUser) return message.channel.send("Usuário inválido!");
      message.channel.send(`${mUser}`, {files: ["https://media.giphy.com/media/iWEIxgPiAq58c/giphy.gif"]});
    return;
  }

});

bot.on("message", async message => {
  if(message.author.bot) return;
  if(message.channel.type === "dm") return;

  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);
  let bReason = args.join(" ").slice(22);

  if(cmd === `${initcmd}chat`){
	if(!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("Sem permissão");
	bot.channels.get("445793368078024706").send(bReason)
    return;
  }
    if(cmd === `${initcmd}falar`){
	bot.channels.get("451844584012644362").send(bReason)
    return;
  }

    if(cmd === `${initcmd}privado`){
    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!bUser) return message.channel.send("Usuário inválido!");
      message.guild.member(bUser).sendMessage(bReason);
	  message.delete();
    return;
  }
    if(cmd === `${initcmd}dick`){
    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!bUser) return message.channel.send("Usuário inválido!");
      message.guild.member(bUser).sendMessage("https://cdn.boob.bot/penis/4A88.jpg");
	  message.delete();
    return;
  }
  if(cmd === `${initcmd}roubo`){
	Money.findOne({serverID: message.guild.id, userID: message.author.id},(err,loc) => {
		cafezinho = message.guild.id;
		console.log(cafezinho);
	    if(roubo === true){
		
		message.react("💸")
		message.delete(10000);
		ladroes.push(message.author.id);

	     }else{
		 message.reply('nenhum roubo acontecendo')
            	}

	       })
	    }
});

bot.on('message', function(message) {
    if (message.content === "-msg") {
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sem permissão");
        var interval = setInterval (function () {
           message.channel.send("https://media.discordapp.net/attachments/445793368078024706/719639321329664000/unknown.png?width=327&height=677")
           .catch(console.error); //
       }, 1 * 3000);
    }
});

bot.on("message", async message => {
	//if (!message.content.startsWith(prefix)) return;

	if(ativo === false){
		msgsRoubo ++;
	} 
	//message.channel.send(`${msgsRoubo}`)
       let args = message.content.slice(prefix.length).trim().split(/ +/g);
			 let cmd;
			 cmd = args.shift().toLowerCase();
			 let command;
			 let commandfile = bot.commands.get(cmd.slice(prefix.length));

			 if(commandfile) commandfile.run(bot, message, args);

			 if(bot.commands.has(cmd)){
				 command = bot.commands.get(cmd);
			 }else if (bot.aliases.has(cmd)) {
			 	command = bot.commands.get(bot.aliases.get(cmd));
			 }
			 try{
				 command.run(bot, message, args);
			 }catch (e) {
				 return;
			 }

		{


    }
});

//bot.on('ready', () => {
	//ativo = true;
//	if(ativo === false) return;

//	var testeCanal = bot.channels.find(channel => channel.id === '445793368078024706');

//	setInterval(() => {
	//testeCanal.send("*Você observa um banco no horizonte* **-roubo** *para tentar roubá-lo*", {files: ["https://cdn1.iconfinder.com/data/icons/ecommerce-and-business-icon-set/256/bank.png"]})
	//.then(msg => {
//		msg.delete(10000)
	//  })
 //   roubo = true;
	
   // var myInterval = setInterval(() => {
	// roubo = false;
	// const ganhadorRan = ladroes[Math.floor(Math.random() * ladroes.length)];
	// var testeCanal = bot.channels.find(channel => channel.id === '445793368078024706');
	// if(ladroes == null) return testeCanal.send("*O Banco saiu ileso!");
   //  addMoney(cafezinho, ganhadorRan);
	// ladroes = [];
	// clearInterval(myInterval);
	 
  // }, 10000);
   
//}, 1000)

	//});
	bot.on("message", async message => {
	if(msgsRoubo === 200){
		msgsRoubo = 0;
        if(message.author.bot) return;
		ativo = true;
		if(ativo === false) return;
	
		var testeCanal = bot.channels.find(channel => channel.id === '445793368078024706');
	
		testeCanal.send("*Você observa um banco no horizonte* **-roubo** *para tentar roubá-lo*", {files: ["https://cdn1.iconfinder.com/data/icons/ecommerce-and-business-icon-set/256/bank.png"]})
		.then(msg => {
			msg.delete(19000)
		  })
		roubo = true;
		
		var myInterval = setInterval(() => {
		 roubo = false;
		 const ganhadorRan = ladroes[Math.floor(Math.random() * ladroes.length)];
		 var testeCanal = bot.channels.find(channel => channel.id === '445793368078024706');
		 if(ladroes == null) return testeCanal.send("*O Banco saiu ileso!");
		 addMoney(cafezinho, ganhadorRan);
		 ladroes = [];
		 
		 ativo = false;
		 clearInterval(myInterval);
		 
	   }, 19000);

	}
});

	function addMoney(serverId, ganhador){
		var testeCanal = bot.channels.find(channel => channel.id === '445793368078024706');
		var iddd = serverId.toString();
		var ganhaa = ganhador.toString();
		Money.findOne({serverID: iddd, userID: ganhaa},(err,data) => {
			if(!data){
				let errorMess = new Discord.RichEmbed()
				.setColor('RED')
				.setDescription(`o User **<@${ganhaa}>** não esta no banco de dados.`)
				return testeCanal.send(errorMess)
			}else{

			let numeroaaroll = Math.floor(Math.random() * 10000) + 1;
			testeCanal.send(`<@${ganhador}> conseguiu assaltar o banco e levou ${numeroaaroll} moneys`)
			.then(msg => {
				msg.delete(19000)
			  })
			
			data.money += Math.floor(parseInt(numeroaaroll));
			data.save();
			}
	
		})
	}

bot.on("message", async message => {

if(message.author.bot) return;
if(message.channel.type === "dm") return;
if(message.author.id !== "223207253522644992") return;
//if(bot.channels.get === "446570179258744842") return;

if (moedasRecentes.has(message.author.id)) {
	return;
} else {
	
let coinstoadd = Math.ceil(Math.random() * 10);
let xptoadd = Math.ceil(Math.random() * 10);
console.log(coinstoadd + " coins");
Money.findOne({
	userID: message.author.id,
	serverID: message.guild.id
 }, (err, money) =>{
if(err) console.log(err);
if(!money){
	const newMoney = new Money({
		userID: message.author.id,
		username: message.author.tag,
		serverID: message.guild.id,
		money: coinstoadd,
		banco: 0,
		xp: 0,
		level: 1
	})

	newMoney.save().catch(err => console.console.log(err));
  }else {
		if (message.content.startsWith(prefix)) return;

		money.money = money.money + coinstoadd;
        money.save().catch(err => console.log(err));
		moedasRecentes.add(message.author.id);
		money.xp += Math.floor(parseInt(50));
		let atuxp = money.xp;
		let atulvl = money.level;
		let prolvl = money.level * 300;
		if(prolvl <= money.xp){
			money.level += Math.floor(parseInt(1));
			message.channel.send(`<@${message.author.id}> upou para o lvl ${atulvl}`)
		}
   setTimeout(() => {
	moedasRecentes.delete(message.author.id);
  }, 10000);
}
})
}
});

//ping
var http = require("http");
setInterval(function() {
    http.get("http://quiet-wave-83938.herokuapp.com");
}, 300000);


//setInterval(function() {
 // bot.channels.get('445793368078024706').send('aaaaaa')
//}, 30000000);




bot.login(process.env.token);
app.listen(port);