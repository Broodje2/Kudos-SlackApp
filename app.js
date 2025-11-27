import 'dotenv/config';
import { App } from '@slack/bolt';
import registerListeners from "./listenerers/index.js";

const url = "https://kudos-api.guusn.nl";
// const url = "http://localhost:3000";

/**
 * This sample slack application uses SocketMode.
 * For the companion getting started setup guide, see:
 * https://tools.slack.dev/bolt-js/getting-started/
 */

// Initializes your app with your bot token and app token
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

registerListeners(app);

app.command("/help", async ({ ack, client, body }) => {
  await ack();
  // console.log("Help command invoked by user:", body.user_id);
  // console.log("In channel:", body.channel_id);

  await client.chat.postEphemeral({
    channel: body.channel_id,
    user: body.user_id,
    text: `🎉 <@${body.user_id}> showed the helps command`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "All the commands",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Here's a list of all available commands and what they do:",
        },
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• /kudos - Send kudos to a teammates",
        },
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• /leaderboard - Check the leaderboard",
        },
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• /mykudos - Shows the (giveaway)kudos you currently have",
        },
      },
       { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• /shop - Browse the kudos shop",
        },
      },
    ],
  });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  app.logger.info("⚡️ Bolt app is running!");
})();
