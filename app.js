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
const roubo = false;

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
			} else message.channel.send("sem permissão baitola.");
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
	  					value: "exato",
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
					message.channel.send("**comandos musica**", {
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
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sem permissão fiato! >:C");
    if(kUser.hasPermission("BAN_MEMBERS")) return message.channel.send("você não pode kickar esse fiato! >:C");

    let kickEmbed = new Discord.RichEmbed()
    .setDescription("---Kickado---")
    .setColor("#e56b00")
    .addField("Kickado", `${kUser}`)
    .addField("Kickado por", `<@${message.author.id}>`)
	  .addField("Hora", message.createdAt)
    .addField("Motivo", kReason);

    let kickChannel = message.guild.channels.find(`name`, "punidos");
    if(!kickChannel) return message.channel.send("não achei o canal ;-;.");

    message.guild.member(kUser).kick(kReason);
    kickChannel.send(kickEmbed);

    return;
  }

  if(cmd === `${initcmd}ban`){

    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!bUser) return message.channel.send("Não achei o fiato!");
    let bReason = args.join(" ").slice(22);
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sem permissão fiato! >:C");
    if(bUser.hasPermission("BAN_MEMBERS")) return message.channel.send("você não pode kickar esse fiato! >:C");

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
		message.channel.send(`${member.user.tag} pode falar denovo fiatinho`);
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
		if(!time) return message.reply('Coloca um tempo fiato >:C');
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
  let bReason = args.join(" ").slice(22);

    if(cmd === `${initcmd}privado`){
    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!bUser) return message.channel.send("Não achei o fiato!");
      message.guild.member(bUser).sendMessage(bReason);
	  message.delete();
    return;
  }
    if(cmd === `${initcmd}dick`){
    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!bUser) return message.channel.send("Não achei o fiato!");
      message.guild.member(bUser).sendMessage("https://cdn.boob.bot/penis/4A88.jpg");
	  message.delete();
    return;
  }

});

bot.on('message', function(message) {
    if (message.content === "-msg") {
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Sem permissão fiato! >:C");
        var interval = setInterval (function () {
           message.channel.send("https://media.discordapp.net/attachments/445793368078024706/719639321329664000/unknown.png?width=327&height=677")
           .catch(console.error); //
       }, 1 * 3000);
    }
});

bot.on("message", async message => {
    if (!message.content.startsWith(prefix)) return;
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

bot.on("message", async message => {
	if(roubo === true){
		if (message.content === '-teste'){
			message.reply(`vc foi add ao roubo `)	
		membrosroubo.push(msg.author.username);
		message.reply("add no roubo")
	  message.reply(`Debug: participantes: ${membrosroubo}`)
	}
	   
	   }else{
		   message.reply("nenhum roubo acontencendo")
	   }

if(message.author.bot) return;
if(message.channel.type === "dm") return;

let coinstoadd = Math.ceil(Math.random() * 40);
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
		banco: 0
	})

	newMoney.save().catch(err => console.console.log(err));
  }else {
		if (message.content.startsWith(prefix)) return;
money.money = money.money + coinstoadd;
money.save().catch(err => console.log(err));
}
})

});

//lootbox
bot.on('ready', () => {
	var testeCanal = bot.channels.find(channel => channel.id === '446837976597528586');

	setInterval(() => {
	//testeCanal.send("banco encontrado escreva **roubar**", {files: ["https://cdn1.iconfinder.com/data/icons/ecommerce-and-business-icon-set/256/bank.png"]});
  const roubo = true;
  testeCanal.send(`Debug: status do roubo : ${roubo}`)
  var myInterval = setInterval(() => {
	const roubo = false;
	//testeCanal.send("adasdasdsadasd", {files: ["https://cdn1.iconfinder.com/data/icons/ecommerce-and-business-icon-set/256/bank.png"]});
	testeCanal.send(`Debug: status do roubo : ${roubo}`)
	clearInterval(myInterval);

}, 10000);

}, 30000)
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
