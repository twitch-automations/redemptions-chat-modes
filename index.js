// Library used to write this code.
// https://github.com/d-fischer/twitch

import { ApiClient } from 'twitch';
import { PubSubClient } from 'twitch-pubsub-client';
import { StaticAuthProvider } from 'twitch-auth';
import { ChatClient } from 'twitch-chat-client';
import { config } from './config.js';
import { messages } from './messages.js';

const clientId = config.clientId;
const accessToken = config.accessToken;
const refreshToken = config.refreshToken;
const channelName = config.channelName;
const rewards = config.rewards;

const authProvider = new StaticAuthProvider(clientId, accessToken);
const chatClient = new ChatClient(authProvider, { channels: [channelName] });
const apiClient = new ApiClient({ authProvider });

const pubSubClient = new PubSubClient();
const userId = await pubSubClient.registerUserListener(apiClient);
await chatClient.connect();

let timers = {
	emoteOnly: 0,
	followerOnly: 0,
	subscriberOnly: 0
};

let intervals = {
	emoteOnly: null,
	followerOnly: null,
	subscriberOnly: null
};

let currentChatMode = null;
let queue = [];

function processRedempton(message) {
	console.log(message.rewardName + ' redeemed by ' + message.userDisplayName);

	if(message.rewardName == 'Emote Only Mode') {
    currentChatMode = 'Emote Only Mode';
    processRoomMode('emoteOnly', message)
	}	else
	if(message.rewardName == 'Follower Only Mode') {
		currentChatMode = 'Follower Only Mode';
    processRoomMode('followerOnly', message)
	}	else
	if(message.rewardName == 'Subscriber Only Mode') {
		currentChatMode = 'Subscriber Only Mode';
    processRoomMode('subscriberOnly', message)
	}	
	else {
		queue.push(message.rewardName);
		console.log(message.rewardName + ' added to the queue');
	}
}

function replaceTemplates(twitchMessage, modeMessage, rewardDuration, time_remaining) {
	let processedString = modeMessage;
	processedString = processedString.replace('{{ user_display_name }}', twitchMessage.userDisplayName);
	processedString = processedString.replace('{{ time_remaining }}', time_remaining);
	processedString = processedString.replace('{{ reward_duration }}', rewardDuration);
	return processedString;
}

function processRoomMode(mode, message) {
	let startMessage = '',
			endMessage = '',
			addMessage = '', 
	    remainMessage = '';

  timers[mode] += config.rewards[mode].rewardDurationInSeconds;
  
	if(intervals[mode] === null) {
		startMessage = replaceTemplates(message, messages[mode].startMessage, 
				config.rewards[mode].rewardDurationInSeconds, timers[mode])
		console.log(startMessage);
    chatClient.say(channelName, startMessage);
		chatClient.enableEmoteOnly(channelName);

		intervals[mode] = setInterval(function() {
			timers[mode]--;
			if((timers[mode] % rewards[mode].rewardDurationInSeconds) === 0 && timers[mode] !== 0) {
				remainMessage = replaceTemplates(message, messages[mode].remainingMessage, 
					config.rewards[mode].rewardDurationInSeconds, timers[mode])
				console.log(remainMessage);
				chatClient.say(channelName, remainMessage);
			}else 
			if (timers[mode] === 0) {
				clearInterval(intervals[mode]);
				intervals[mode] = null;
				chatClient.disableEmoteOnly(channelName);
				endMessage = replaceTemplates(message, messages[mode].endMessage, 
					config.rewards[mode].rewardDurationInSeconds, timers[mode])
        chatClient.say(channelName, endMessage)
        console.log(channelName, endMessage);
			}
		},1000);
	}
	else
	{
		addMessage = replaceTemplates(message, messages[mode].addMessage, 
      config.rewards[mode].rewardDurationInSeconds, timers[mode]);
    console.log(addMessage);
		chatClient.say(channelName, addMessage)
	}    
}

const listenerRedemption = await pubSubClient.onRedemption(userId, (message) => {
	processRedempton(message);
});

console.log('Waiting for chatroom redemptions');

