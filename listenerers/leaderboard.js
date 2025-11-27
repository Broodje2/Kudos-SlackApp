const url = "https://kudos-api.guusn.nl";

function leaderboard(app) {
  app.command("/leaderboard", async ({ ack, body, client, say }) => {
    await ack();

    try {
      // const userInfo = await client.users.info({ user: user.slack_id });
      // const username = userInfo.user.profile.display_name || userInfo.user.name;
      // await say(`*• ${username}*\n Kudos: ${user.total_kudos}`);

      const response = await fetch(`${url}/leaderboard/currentTimeframe`);
      const data = await response.json();

      const now = new Date();
      const toLocaleDateString = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      
      // Build all leaderboard lines as text (one big message)
      const lines = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const userInfo = await client.users.info({ user: item.slack_id });
        const username =
          userInfo.user.profile.display_name || userInfo.user.name;

        lines.push(`*${i + 1}. ${username}* – Kudos: ${item.total_kudos}`);
      }

      // One single ephemeral message, visible only to the user
      await client.chat.postEphemeral({
        channel: body.channel_id,     // works in any channel the command is used
        user: body.user_id,          // only visible to the requester
        text: `Leaderboard 🏆 - ${toLocaleDateString}\n\n${lines.join("\n")}`,
      });
    } catch (error) {
      console.error("Error in /leaderboard:", error);
      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: body.user_id,
        text: "Kon de leaderboard niet ophalen 😿",
      });
    }
  });
}

export { leaderboard };
