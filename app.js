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

app.command("/help", async ({ ack, say }) => {
  await ack();

  await say({
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
          text: "• /kudo - Send kudos to a teammates",
          text: "• /givekudos - Send kudos to a teammates",
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
          text: "• /giveawaykudos -     Shows the amount of giveaway kudos of the user",
        },
      },
       { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• /sync -     Sync all users with database",
        },
      },
       { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• /getuser -     Get your user info from the database (for testing)",
        },
      },
       { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• /registeraccount -         Register account if not done correctly in /sync (or for testing)",
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
