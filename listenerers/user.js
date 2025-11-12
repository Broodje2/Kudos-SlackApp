const url = "https://kudos-api.guusn.nl";

function getUser(app) {
  app.command("/getuser", async ({ ack, body, say }) => {
    await ack();

    try {
      const userId = body.user_id;
      const response = await fetch(`${url}/user/${userId}`);
      const data = await response.json();

      await say(`Username van ${userId}: ${data.username} 😺`);
    } catch (error) {
      console.error(error);
      await say("Kon de user niet ophalen 😿");
    }
  });
}

function registerAccount(app) {
  app.command("/registeraccount", async ({ ack, body, say }) => {
    await ack();
    const username = body.user_name;
    const userId = body.user_id;
    console.log(`Registering account for ${username} with ID ${userId}`);

    try {
      // console.log('Sending account registration request...');
      const response = await fetch(`${url}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slack_name: username, slack_id: userId }),
      });

      if (response.ok) {
        await say(`Account voor ${username} is toegevoegd! 🎉`);
      } else {
        await say(`Kon het account voor ${username} niet toevoegen. 😿`);
      }
    } catch (error) {
      console.error(error);
      // await say("Er is een fout opgetreden bij het toevoegen van het account. 😿");
      await say(`${error}`);
    }
  });
}




function sync(app) {
  app.command("/sync", async ({ ack, body, client }) => {
    await ack();

    try {
      const botUserId = (await client.auth.test()).user_id;
      const channelId = body.channel_id;
      console.log(`🔄 Syncing all members in channel ${channelId}...`);

      const membersResult = await client.conversations.members({ channel: channelId });
      const memberIds = membersResult.members;
      console.log(`Found ${memberIds.length} members in channel ${channelId}`);

      for (const userId of memberIds) {
        if (userId === botUserId) continue;

        const userInfo = await client.users.info({ user: userId });
        const username = userInfo.user.profile.display_name || userInfo.user.name;
        console.log(`Syncing user: ${username} (${userId})`);

        try {
          // Check of de user bestaat
          const res = await fetch(`${url}/user/${userId}`);

          if (res.ok) {
            // Als user bestaat -> update naam
            const updateRes = await fetch(`${url}/user`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slack_id: userId, new_name: username }),
            });
            if (updateRes.ok) {
              console.log(`✅ Updated ${username} (${userId})`);
            } else {
              console.warn(`⚠️ Failed to update ${username} (${userId})`);
            }
          } else {
            // Als user niet bestaat -> maak nieuwe user aan
            const createRes = await fetch(`${url}/user`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slack_name: username, slack_id: userId }),
            });
            if (createRes.ok) {
              console.log(`Created ${username} (${userId})`);
            } else {
              console.warn(`Failed to create ${username} (${userId})`);
            }
          }
        } catch (err) {
          console.error(`Error syncing ${username} (${userId}):`, err);
        }
      }

      await client.chat.postMessage({
        channel: channelId,
        text: `✅ Alle leden van dit kanaal zijn gesynchroniseerd met de database.`,
      });
    } catch (error) {
      console.error("⚠️ Error in /sync command:", error);
      await client.chat.postMessage({
        channel: body.channel_id,
        text: `❌ Er is een fout opgetreden tijdens het synchroniseren: ${error.message}`,
      });
    }
  });
}


function autoSync(app) {
  app.event("member_joined_channel", async ({ event, client }) => {
    try {
      const botUserId = (await client.auth.test()).user_id;
      const channelId = event.channel;
      const joinedUserId = event.user;
      if (joinedUserId === botUserId) {
        console.log(
          `🤖 Bot joined channel ${channelId}, syncing all members...`
        );

        const membersResult = await client.conversations.members({
          channel: channelId,
        });
        const memberIds = membersResult.members;
        console.log(
          `Found ${memberIds.length} members in channel ${channelId}`
        );
        array.forEach((memberIds) => {
          console.log(memberIds);
        });

        for (const userId of memberIds) {
        if (userId === botUserId) continue;

        const userInfo = await client.users.info({ user: userId });
        const username = userInfo.user.profile.display_name || userInfo.user.name;
        console.log(`Syncing user: ${username} (${userId})`);

        try {
          // Check of de user bestaat
          const res = await fetch(`${url}/user/${userId}`);

          if (res.ok) {
            // Als user bestaat -> update naam
            const updateRes = await fetch(`${url}/user`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slack_id: userId, new_name: username }),
            });
            if (updateRes.ok) {
              console.log(`Updated ${username} (${userId})`);
            } else {
              console.warn(`Failed to update ${username} (${userId})`);
            }
          } else {
            // Als user niet bestaat -> maak nieuwe user aan
            const createRes = await fetch(`${url}/user`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slack_name: username, slack_id: userId }),
            });
            if (createRes.ok) {
              console.log(`Created ${username} (${userId})`);
            } else {
              console.warn(`Failed to create ${username} (${userId})`);
            }
          }
        } catch (err) {
          console.error(`Error syncing ${username} (${userId}):`, err);
        }
      }

        await client.chat.postMessage({
          channel: channelId,
          text: `Alle leden van dit kanaal zijn toegevoegd aan de database.`,
        });
      } else {
        // 👤 Gewone gebruiker is toegevoegd → voeg enkel die user toe
        const userInfo = await client.users.info({ user: joinedUserId });
        const slack_name =
          userInfo.user.profile.display_name || userInfo.user.name;
        const slack_id = joinedUserId;

        const response = await fetch(`${url}/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slack_name, slack_id }),
        });

        if (response.ok) {
          console.log(`Added user ${slack_name} (${slack_id})`);
          await client.chat.postMessage({
            channel: channelId,
            text: `🎉 Welkom <@${slack_id}>! Je account is toegevoegd.`,
          });
        } else {
          const errorText = await response.text();
          console.error(`Kon ${slack_name} niet toevoegen: ${errorText}`);
        }
      }
    } catch (error) {
      console.error("Error in member_joined_channel:", error);
    }
  });
}

export { getUser, registerAccount, sync, autoSync };
