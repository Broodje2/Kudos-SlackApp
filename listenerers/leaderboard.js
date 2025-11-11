function leaderboard(app) {
  app.command("/leaderboard", async ({ ack, body, client, say }) => {
    await ack();

    try {
      // const userInfo = await client.users.info({ user: user.slack_id });
      // const username = userInfo.user.profile.display_name || userInfo.user.name;
      // await say(`*• ${username}*\n Kudos: ${user.total_kudos}`);

      const response = await fetch(`${url}/leaderboard`);
      const data = await response.json();

      const now = new Date();
      const toLocaleDateString = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      await say({
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              //  text: `Hey there <@${message.user}>!`,
              text: `Leaderboard 🏆 - ${toLocaleDateString}`,
            },
          },
          { type: "divider" },
        ],
      });
      // await say(`Leaderboard:`);
      for (let i = 0; i < data.length; i++) {
        const userInfo = await client.users.info({ user: data[i].slack_id });
        console.log(userInfo);
        const username =
          userInfo.user.profile.display_name || userInfo.user.name;
        await say(`${username} - Kudos: ${data[i].total_kudos}`);
      }
    } catch (error) {
      console.error(error);
      await say("Kon de user niet ophalen 😿");
    }
  });
}

export { leaderboard };
