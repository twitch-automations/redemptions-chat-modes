// Library used to write this code.
// https://github.com/d-fischer/twitch

import { ApiClient } from 'twitch';
import { PubSubClient } from 'twitch-pubsub-client';
import { StaticAuthProvider } from 'twitch-auth';
import { ChatClient } from 'twitch-chat-client';
import { config } from './config.js';

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

const messages = {
  emoteOnly: {
    startMessage: ' has enabled emote only mode!',
    remainingMessage: ' seconds left follower only mode!',
    endMessage: 'Emote only mode disabled'
  },
  followerOnly: {
    startMessage: ' has enabled follower only mode!',
    remainingMessage: ' seconds left follower only mode!',
    endMessage: 'Follower mode disabled'
  },
  subscriberOnly: {
    startMessage: ' has enabled subscriber only only mode!',
    remainingMessage: ' seconds left follower only mode!',
    endMessage: 'Subscriber mode disabled'
  }
};

let currentChatMode = null;
let queue = [];

function processRedempton(message) {
	console.log(message.rewardName + ' redeemed...');

	if(message.rewardName == 'Emote Only Mode') {
		currentChatMode = 'Emote Only Mode';
		emoteOnlyMode(message);
	}	else
	if(message.rewardName == 'Follower Only Mode') {
		currentChatMode = 'Follower Only Mode';
		followerOnlyMode(message);
	}	else
	if(message.rewardName == 'Subscriber Only Mode') {
		currentChatMode = 'Subscriber Only Mode';
		subscriberOnlyMode(message);
	}	
	else {
		queue.push(message.rewardName);
		console.log(message.rewardName + ' added to the queue');
	}
}

function emoteOnlyMode(message) {
	timers.emoteOnly += config.rewards.emoteOnly.rewardDurationInSeconds;
	if(intervals.emoteOnly === null) {
    console.log(message.userDisplayName + messages.emoteOnly.startMessage);
    chatClient.say(channelName, message.userDisplayName + messages.emoteOnly.startMessage);
		chatClient.enableEmoteOnly(channelName);
		intervals.emoteOnly = setInterval(function() {
			timers.emoteOnly--;
			if((timers.emoteOnly % rewards.emoteOnly.rewardDurationInSeconds) === 0 && timers.emoteOnly !== 0) {
				console.log(timers.emoteOnly + messages.emoteOnly.remainingMessage);
				chatClient.say(channelName,  timers.emoteOnly + messages.emoteOnly.remainingMessage);
			}else 
			if (timers.emoteOnly === 0) {
				clearInterval(intervals.emoteOnly);
				intervals.emoteOnly = null;
				chatClient.disableEmoteOnly(channelName);
        chatClient.say(channelName,  messages.emoteOnly.endMessage)
        console.log(channelName, messages.emoteOnly.endMessage);
			}
		},1000);
	}
	else
	{
		console.log(config.rewards.emoteOnly.rewardDurationInSeconds + ' seconds added in emote only mode timer by ' + message.userDisplayName);
		chatClient.say(channelName, config.rewards.emoteOnly.rewardDurationInSeconds + ' seconds added in emote only mode timer by ' + message.userDisplayName);
	}    
}

function followerOnlyMode(message) {
	timers.followerOnly += config.rewards.followerOnly.rewardDurationInSeconds;
	if(intervals.followerOnly === null) {
    console.log(message.userDisplayName + messages.followerOnly.startMessage);
    chatClient.say(channelName, message.userDisplayName + messages.followerOnly.startMessage);
		chatClient.enableFollowersOnly(channelName);
		intervals.followerOnly = setInterval(function() {
			timers.followerOnly--;
			if((timers.followerOnly % rewards.followerOnly.rewardDurationInSeconds) === 0 && timers.followerOnly !== 0) {
				console.log(timers.followerOnly + messages.followerOnly.remainingMessage);
				chatClient.say(channelName,  timers.followerOnly + messages.followerOnly.remainingMessage);
      }
			if (timers.followerOnly < 0) {
				clearInterval(intervals.followerOnly);
				intervals.followerOnly = null;
				chatClient.enableFollowersOnly(channelName);
        chatClient.say(channelName, messages.followerOnly.endMessage)
        console.log(messages.followerOnly.endMessage);
			}
		},1000);
	}
	else
	{
		console.log(config.rewards.followerOnly.rewardDurationInSeconds + ' seconds added in follower only mode timer by ' + message.userDisplayName);
		chatClient.say(channelName, config.rewards.followerOnly.rewardDurationInSeconds + ' seconds added in follower only mode timer by ' + message.userDisplayName);
	}    
}

function subscriberOnlyMode(message) {
	timers.subscriberOnly += config.rewards.subscriberOnly.rewardDurationInSeconds;
	if(intervals.subscriberOnly === null) {
		console.log('Subscriber Only Mode Enabled');
		chatClient.enableSubsOnly(channelName);
		intervals.subscriberOnly = setInterval(function() {
			timers.subscriberOnly--;
			if((timers.subscriberOnly % rewards.subscriberOnly.rewardDurationInSeconds) === 0 && timers.subscriberOnly !== 0) {
				console.log(timers.subscriberOnly + messages.subscriberOnly.remainingMessage);
				chatClient.say(channelName,  timers.subscriberOnly + messages.subscriberOnly.remainingMessage);
			}
			if (timers.subscriberOnly < 0) {
				clearInterval(intervals.subscriberOnly);
				intervals.subscriberOnly = null;
				chatClient.disableSubsOnly(channelName);
        chatClient.say(channelName, messages.subscriberOnly.endMessage)
        console.log(messages.subscriberOnly.endMessage);
			}
		},1000);
	}
	else
	{
		console.log(config.rewards.subscriberOnly.rewardDurationInSeconds + ' seconds added in subscriber only mode timer');
		chatClient.say(channelName, rewardconfig.rewards.subscriberOnly.rewardDurationInSecondsTimerInteravalInSeconds + ' seconds added in subscriber only mode timer');
	}    
}

const listenerRedemption = await pubSubClient.onRedemption(userId, (message) => {
	processRedempton(message);
});