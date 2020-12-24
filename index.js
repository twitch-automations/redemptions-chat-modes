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
	if(message.rewardName === config.rewards.emoteOnly.rewardName && (currentChatMode === 'emoteOnly' || currentChatMode === null)) {
    currentChatMode = 'emoteOnly';
    processRoomMode('emoteOnly', message)
	}	else
	if(message.rewardName === config.rewards.followerOnly.rewardName && (currentChatMode === 'followerOnly' || currentChatMode === null)) {
		currentChatMode = 'followerOnly';
    processRoomMode('followerOnly', message)
	}	else
	if(message.rewardName === config.rewards.subscriberOnly.rewardName && (currentChatMode === 'subscriberOnly' || currentChatMode === null)) {
		currentChatMode = 'subscriberOnly';
    processRoomMode('subscriberOnly', message)
	}	
	else {
		queue.push(message);
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

function processQueue() {
  if(queue.length === 0) {
    console.log('Queue is empty, waiting for redemptions...');
  } else {
    console.log('Processing the queue...');
    let processQueue = [...queue];
    queue = [];
    processQueue.forEach((message, idx) => {
      processRedempton(message);
    });
  }
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
        currentChatMode = null;
        chatClient.say(channelName, endMessage)
        console.log(channelName, endMessage);
        processQueue();
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

console.log('Waiting for chatroom redemptions...');