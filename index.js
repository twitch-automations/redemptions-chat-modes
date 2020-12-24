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
    startMessage: '{{ user_display_name }} has enabled emote only mode!',
    remainingMessage: '{{ time_remaining }} seconds left follower only mode!',
		addMessage: '{{ user_display_name }} added {{ reward_duration }} seconds to emote only mode',
    endMessage: 'Emote only mode disabled'
  },
  followerOnly: {
    startMessage: '{{ user_display_name }} has enabled follower only mode!',
    remainingMessage: '{{ time_remaining }} seconds left follower only mode!',
		addMessage: '{{ user_display_name }} added {{ reward_duration }} seconds to subscriber only mode',
    endMessage: 'Follower mode disabled'
  },
  subscriberOnly: {
    startMessage: '{{ user_display_name }} has enabled subscriber only only mode!',
		remainingMessage: '{{ time_remaining }} seconds left subscriber only mode!',
		addMessage: '{{ user_display_name }} added {{ reward_duration }} seconds to subscriber only mode',
    endMessage: 'Subscriber mode disabled'
  }
};

let currentChatMode = null;
let queue = [];

function replaceTemplates(twitchMessage, modeMessage, rewardDuration, time_remaining) {
	let processedString = modeMessage;
	processedString = processedString.replace('{{ user_display_name }}', twitchMessage.userDisplayName);
	processedString = processedString.replace('{{ time_remaining }}', time_remaining);
	processedString = processedString.replace('{{ reward_duration }}', rewardDuration);
	return processedString;
}

function processRedempton(message) {
	console.log(message.rewardName + ' redeemed by ' + message.userDisplayName);

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
	let startMessage = '',
			endMessage = '',
			addMessage = '', 
	    remainMessage = '';

	timers.emoteOnly += config.rewards.emoteOnly.rewardDurationInSeconds;
	if(intervals.emoteOnly === null) {
		startMessage = replaceTemplates(message, messages.emoteOnly.startMessage, 
				config.rewards.emoteOnly.rewardDurationInSeconds, timers.emoteOnly)
		console.log(startMessage);
    chatClient.say(channelName, startMessage);
		chatClient.enableEmoteOnly(channelName);

		intervals.emoteOnly = setInterval(function() {
			timers.emoteOnly--;
			if((timers.emoteOnly % rewards.emoteOnly.rewardDurationInSeconds) === 0 && timers.emoteOnly !== 0) {
				remainMessage = replaceTemplates(message, messages.emoteOnly.remainingMessage, 
					config.rewards.emoteOnly.rewardDurationInSeconds, timers.emoteOnly)
				console.log(remainMessage);
				chatClient.say(channelName, remainMessage);
			}else 
			if (timers.emoteOnly === 0) {
				clearInterval(intervals.emoteOnly);
				intervals.emoteOnly = null;
				chatClient.disableEmoteOnly(channelName);
				endMessage = replaceTemplates(message, messages.emoteOnly.endMessage, 
					config.rewards.emoteOnly.rewardDurationInSeconds, timers.emoteOnly)
        chatClient.say(channelName, endMessage)
        console.log(channelName, endMessage);
			}
		},1000);
	}
	else
	{
		addMessage = replaceTemplates(message, messages.emoteOnly.addMessage, 
			config.rewards.emoteOnly.rewardDurationInSeconds, timers.emoteOnly)
		chatClient.say(channelName, addMessage)
	}    
}

function followerOnlyMode(message) {
	let startMessage = '',
			endMessage = '',
			addMessage = '', 
	    remainMessage = '';

	timers.followerOnly += config.rewards.followerOnly.rewardDurationInSeconds;
	if(intervals.followerOnly === null) {
		startMessage = replaceTemplates(message, messages.followerOnly.startMessage, 
			config.rewards.followerOnly.rewardDurationInSeconds, timers.followerOnly)
		console.log(startMessage);
		chatClient.say(channelName, startMessage);
		chatClient.enableFollowersOnly(channelName);
		intervals.followerOnly = setInterval(function() {
			timers.followerOnly--;
			if((timers.followerOnly % rewards.followerOnly.rewardDurationInSeconds) === 0 && timers.followerOnly !== 0) {
				remainMessage = replaceTemplates(message, messages.followerOnly.remainingMessage, 
					config.rewards.followerOnly.rewardDurationInSeconds, timers.followerOnly)
				console.log(remainMessage);
				chatClient.say(channelName, remainMessage);
      }
			if (timers.followerOnly === 0) {
				clearInterval(intervals.followerOnly);
				intervals.followerOnly = null;
				chatClient.enableFollowersOnly(channelName);
				endMessage = replaceTemplates(message, messages.followerOnly.endMessage, 
					config.rewards.followerOnly.rewardDurationInSeconds, timers.followerOnly)
        chatClient.say(channelName, endMessage)
        console.log(channelName, endMessage);
			}
		},1000);
	}
	else
	{
		addMessage = replaceTemplates(message, messages.followerOnly.addMessage, 
			config.rewards.followerOnly.rewardDurationInSeconds, timers.emoteOnly)
		chatClient.say(channelName, addMessage)
	}    
}

function subscriberOnlyMode(message) {
	let startMessage = '',
			endMessage = '',
			addMessage = '', 
	    remainMessage = '';

	timers.subscriberOnly += config.rewards.subscriberOnly.rewardDurationInSeconds;
	if(intervals.subscriberOnly === null) {
		startMessage = replaceTemplates(message, messages.subscriberOnly.startMessage, 
			config.rewards.subscriberOnly.rewardDurationInSeconds, timers.followerOnly)
		console.log(startMessage);
		chatClient.say(channelName, startMessage);

		chatClient.enableSubsOnly(channelName);
		intervals.subscriberOnly = setInterval(function() {
			timers.subscriberOnly--;
			if((timers.subscriberOnly % rewards.subscriberOnly.rewardDurationInSeconds) === 0 && timers.subscriberOnly !== 0) {
				remainMessage = replaceTemplates(message, messages.subscriberOnly.remainingMessage, 
					config.rewards.subscriberOnly.rewardDurationInSeconds, timers.subscriberOnly)
				console.log(remainMessage);
				chatClient.say(channelName, remainMessage);
			}
			if (timers.subscriberOnly === 0) {
				clearInterval(intervals.subscriberOnly);
				intervals.subscriberOnly = null;
				chatClient.disableSubsOnly(channelName);
				endMessage = replaceTemplates(message, messages.subscriberOnly.endMessage, 
					config.rewards.subscriberOnly.rewardDurationInSeconds, timers.subscriberOnly)
        chatClient.say(channelName, endMessage)
        console.log(channelName, endMessage);

			}
		},1000);
	}
	else
	{
		addMessage = replaceTemplates(message, messages.subscriberOnly.addMessage, 
			config.rewards.subscriberOnly.rewardDurationInSeconds, timers.subscriberOnly)
		chatClient.say(channelName, addMessage)
	}    
}

const listenerRedemption = await pubSubClient.onRedemption(userId, (message) => {
	processRedempton(message);
});