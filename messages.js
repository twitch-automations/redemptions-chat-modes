export const messages = {
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