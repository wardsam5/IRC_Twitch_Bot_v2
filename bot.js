//started tracking message count on 1/9/2022
//started tracking paycheck on 1/12/2022

const tmi = require('tmi.js');
var cron = require('node-cron');
const dotenv = require('dotenv');
dotenv.config();
var fs = require("fs");

let startTime = new Date();
let commandCount = 0;
var chatters = {};
var chatters_sorted = [];
banned_chatters = ["Fossabot"];
let paycheck = {
	bits: 0,
	subs: 0
}
//fills chatters object
readData("data.txt");
readData("paycheck.txt");

//every 15 mins update text file
cron.schedule('*/5 * * * *', () => {
	writeData("data.txt");
	writeData("paycheck.txt");
	var today = new Date();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	//console.log('Updating Data - ' + time);
});

//every 30 seconds
cron.schedule('*/30 * * * * *', () =>  {
  commandCount = 0;
});

//every midnight
cron.schedule('0 0 0 * * *', () =>  {
	const d = new Date();
	let fileName = d.getMonth() + "-" + d.getDate() + "-" + d.getFullYear() + ".txt";
	
	let chat_data = "";
	chatters_sorted = Object.entries(chatters).sort((a,b) => b[1]-a[1]);
	for(let i = 0; i < chatters_sorted.length; i++){
		chat_data = chat_data + chatters_sorted[i][0] + "=" + chatters_sorted[i][1] + "\n";
	}
	
	try {
		fs.writeFileSync(fileName, chat_data);
	} catch (error) {
		console.error(err);
	}
});

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

//cheering
client.on("cheer", (channel, userstate, message) => {
	paycheck.bits += (userstate.bits/100);
});

//subscribing
client.on("subscription", (channel, username, method, message, userstate) => {
	//confused how to fetch sub plan. it's under method somewhere
    paycheck.subs += 3;
	//let subPlan = ~~userstate["msg-param-sub-plan"];
});

//giftsubsanon
client.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
	paycheck.subs += (numbOfSubs*3);
    //let senderCount = ~~userstate["msg-param-sender-count"];
});

//giftsubsreg
client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
	let senderCount = ~~userstate["msg-param-sender-count"];
	console.log(senderCount);
	paycheck.subs += 3;
});

//resub
client.on("resub", (channel, username, months, message, userstate, methods) => {
	paycheck.subs += 3;
    //let subPlan = ~~userstate["msg-param-sub-plan"];
});

//anon upgrade
client.on("anongiftpaidupgrade", (channel, username, userstate) => {
	paycheck.subs += 3;
});

client.on("giftpaidupgrade", (channel, username, sender, userstate) => {
    paycheck.subs += 3;
});

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
	if (self) { return; } // Ignore messages from the bot
	
	var message_date = new Date();
	var message_time = message_date.getHours() + ":" + message_date.getMinutes() + ":" + message_date.getSeconds();
	
	// Remove whitespace from chat message
	const commandName = msg.trim();
	const isSubscriber = context["subscriber"];
	const isMod = context["mod"];
	const messageType = context["message-type"];
	const userType = context["user-type"];
	const displayName = context["display-name"];
  	const userName = context.username;
	const userID = context["user-id"];
	
	//if a new chatter add to object
	if(!(banned_chatters.includes(displayName))){
		if(!(displayName in chatters)){
			chatters[displayName] = 1;
			//console.log(`Added ${displayName} to the list`);
		} else {
			chatters[displayName] = chatters[displayName] + 1;
			//console.log(`${displayName}: ${chatters[displayName]}`);
		}
	}

	//temporary ignore phrases to avoid bot being banned
	if(commandName.includes("im 12") || commandName.includes("i'm 12") || commandName.includes("i am 12")) {return;}
	if(commandName.includes("im12") || commandName.includes("i'm12") || commandName.includes("iam12")) {return;}
	if(commandName.includes("im twelve") || commandName.includes("i'm twelve") || commandName.includes("i am twelve")) {return;}
	if(commandName.includes("imtwelve") || commandName.includes("i'mtwelve") || commandName.includes("iamtwelve")) {return;}
	
	//mods can kick the bot
	if(commandName === "$leave" && userID == '66202000'){
		writeData("data.txt");
		writeData("paycheck.txt");
		client.say(target, `peepoHey cya!`);
		process.exit(1);
	}
	
	if(commandName.toLowerCase().includes("$commands") && commandCount < 19){
		client.say(target, `${displayName}, $topchatters, $rank [username], $uptime, $chatstats, $paycheck`);
	}
	
	if(commandName.toLowerCase().includes("$pingers") && commandCount < 19){
		client.say(target, `eluusiive, Hekata__, QuickFinesse, gassedupbp, Drolyagxam, banta_juice`);
	}
	
	if(commandName.toLowerCase().includes("$paycheck") && commandCount < 19){
		//client.say(target, `${displayName}, since January 12th, 2022, erobb221 has made $${Math.round(paycheck.bits * 100) / 100} in bits and $${Math.round(paycheck.subs * 100) / 100} in subscribers, totaling a measly $${(Math.round(paycheck.bits * 100) / 100)+(Math.round(paycheck.subs * 100) / 100)}. 4WeirdBusiness`);
		client.say(target, `${displayName}, since January 12th, 2022, erobb221 has made $1- Lemao Tssk`);
	}
	
	if(commandName.toLowerCase().includes("$chatstats") && commandCount < 19){
		const totalMessages = obj => Object.values(obj).reduce((a, b) => a + b);
		client.say(target, `${displayName}, ${Object.keys(chatters).length} chatstats have typed in this chat. A total of ${totalMessages(chatters)} messages have been sent.`);
	}
	
	if(commandName.toLowerCase().includes("$uptime") && commandCount < 19){
		let currentTime = new Date();
		let diff = currentTime.getTime() - startTime.getTime();
		client.say(target, `${displayName}, I have been running for ${Math.floor(diff/(1000*60*60))} hours.`)
	}

	if(commandName.toLowerCase().includes("$rank") && commandCount < 19){
		console.log(displayName + " used $rank | " + message_time);
		
		let temp = commandName.split(' ');
		if(temp[1] in chatters){
			chatters_sorted = Object.entries(chatters).sort((a,b) => b[1]-a[1]);
			//console.log(chatters_sorted.slice(0, 10));
			let index = chatters_sorted.findIndex(e => e[0] === temp[1])+1;
			client.say(target, `${displayName}, ${temp[1]} is rank #${index} with ${chatters[temp[1]]} total messages.`);
		} else if(temp.length === 1 && displayName in chatters){
			chatters_sorted = Object.entries(chatters).sort((a,b) => b[1]-a[1]);
			//console.log(chatters_sorted.slice(0, 10));
			let index = chatters_sorted.findIndex(e => e[0] === displayName)+1;
			client.say(target, `${displayName}, ${displayName} is rank #${index} with ${chatters[displayName]} total messages.`);
		} else {
			client.say(target, `That user does not exist, or has not typed in chat recently. Remember that the user should be typed with case sensitivity.`);
		}
	}

	// top chatters
	if(commandName.toLowerCase().includes("$topchatters") && commandCount < 19){
		commandCount++;
		console.log(displayName + " used $topchatters | " + message_time);
		
		chatters_sorted = Object.entries(chatters).sort((a,b) => b[1]-a[1]);
		
		var temp_format = `${displayName}, `;
		if(chatters_sorted.length >= 10){
			for (let i = 0; i < 10; i++) {
				if(i === 9){
					temp_format = temp_format + chatters_sorted[i][0] + ": " + chatters_sorted[i][1];
				} else {
				temp_format = temp_format + chatters_sorted[i][0] + ": " + chatters_sorted[i][1] + ", ";
				}
			}
		} else {
			client.say(target, "10 users haven't chatted yet Lemon");
		}
		
		//console.log(temp_format);
		client.say(target, `${temp_format}`);
	}
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
	console.log(`* Connected to ${addr}:${port}`);
}

function writeData(fileName){
	if(fileName === "data.txt"){
		let chat_data = "";
		chatters_sorted = Object.entries(chatters).sort((a,b) => b[1]-a[1]);
		for(let i = 0; i < chatters_sorted.length; i++){
			chat_data = chat_data + chatters_sorted[i][0] + "=" + chatters_sorted[i][1] + "\n";
		}
		
		try {
			fs.writeFileSync(fileName, chat_data);
		} catch (error) {
			console.error(err);
		}
	} else if(fileName === "paycheck.txt"){
		let paycheck_data = `${paycheck.bits}, ${paycheck.subs}`;
		
		try {
			fs.writeFileSync(fileName, paycheck_data);
		} catch (error) {
			console.error(err);
		}
	}
}

function readData(fileName){
	try {
		const data = fs.readFileSync(fileName);
		splitData(data.toString(), fileName);
	} catch (err) {
		console.error(err);
	}
}


function splitData(data, fileName){
	//clears chatter object so data from file can replace it
	if(fileName === "data.txt"){
		//for users
		for (const prop of Object.getOwnPropertyNames(chatters)) {
			delete chatters[prop];
		}
	
	
		let splitUsers = data.split('\n');
		for(let i = 0; i < splitUsers.length-1; i++){
			let tempLine = splitUsers[i].split('=');
			if(chatters.hasOwnProperty(tempLine[0])){
				chatters[tempLine[0]] += parseInt(tempLine[1], 10);
			} else {
				chatters[tempLine[0]] = parseInt(tempLine[1]);
			}
		}
	} else if(fileName === "paycheck.txt"){
		let splitPay = data.split(', ');
		paycheck.bits = parseFloat(splitPay[0]);
		paycheck.subs = parseFloat(splitPay[1]);
	}
}