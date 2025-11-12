const url = "https://kudos-api.guusn.nl";

// function getUser(app) {
//   app.command("/getuser", async ({ ack, body, say }) => {
//     await ack();

//     try {
//       const userId = body.user_id;
//       const response = await fetch(`${url}/user/${userId}`);
//       const data = await response.json();

//       await say(`Username van ${userId}: ${data.username} 😺`);
//     } catch (error) {
//       console.error(error);
//       await say("Kon de user niet ophalen 😿");
//     }
//   });
// }

// function registerAccount(app) {
//   app.command("/registeraccount", async ({ ack, body, say }) => {
//     await ack();
//     const username = body.user_name;
//     const userId = body.user_id;
//     console.log(`Registering account for ${username} with ID ${userId}`);

//     try {
//       SyncUser(username, userId);
//       await say(`Account geregistreerd voor ${username} 🎉`);
//     } catch (error) {
//       console.error(error);
//       await say("Kon het account niet registreren 😿");
//     }
//   });
// }

// function sync(app) {
//   app.command("/sync", async ({ ack, body, client }) => {
//     await ack();

//     try {
//       const botUserId = (await client.auth.test()).user_id;
//       const channelId = body.channel_id;
//       console.log(`🔄 Syncing all members in channel ${channelId}...`);

//       const membersResult = await client.conversations.members({ channel: channelId });
//       const memberIds = membersResult.members;
//       console.log(`Found ${memberIds.length} members in channel ${channelId}`);

//       for (const userId of memberIds) {
//         if (userId === botUserId) continue;

//         const userInfo = await client.users.info({ user: userId });
//         const username = userInfo.user.profile.display_name || userInfo.user.name;

//         SyncUser(username, userId);
//       }
//       await client.chat.postMessage({
//         channel: channelId,
//         text: `Alle leden van dit kanaal zijn toegevoegd/geupdate.`,
//       });
//     } catch (error) {
//       console.error("Error in /sync command:", error);
//     }
//   });
// }

function userChanged(app) {
  app.event("user_change", async ({ event }) => {
    try {
      const user = event.user;
      const slack_name = user.profile.display_name || user.name;
      const slack_id = user.id;

      SyncUser(slack_name, slack_id);
    } catch (error) {
      console.error("Error in user_change event:", error);
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
        console.log(`Bot joined channel ${channelId}, syncing all members...`);

        const membersResult = await client.conversations.members({ channel: channelId });
        const memberIds = membersResult.members;
        console.log(`Found ${memberIds.length} members in channel ${channelId}`);

        for (const userId of memberIds) {
          console.log(`Processing user ID: ${userId}`);
          if (userId === botUserId) continue;

          const userInfo = await client.users.info({ user: userId });
          const username = userInfo.user.profile.display_name || userInfo.user.name;
          console.log(`Syncing user: ${username} (${userId})`);

          SyncUser(username, userId);
        }
      } else {
        //Gewone gebruiker is toegevoegd -> voeg enkel die user toe
        const userInfo = await client.users.info({ user: joinedUserId });
        const slack_name = userInfo.user.profile.display_name || userInfo.user.name;
        const slack_id = joinedUserId;

        SyncUser(slack_name, slack_id);
      }
    } catch (error) {
      console.error("Error in member_joined_channel event:", error);
    }
  });
}

function SyncUser(slack_name, slack_id) {
  console.log(`Syncing user: ${slack_name} (${slack_id})`);
  const userExists = fetch(`${url}/user/${slack_id}`).then((res) => res.ok);
  if (userExists) {
    // Update user
    fetch(`${url}/user`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slack_id, new_name: slack_name }),
    });
    console.log(`User ${slack_name} updated.`);
  } else {
    // Create user
    fetch(`${url}/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slack_name, slack_id }),
    });
    console.log(`User ${slack_name} created.`);
  }
}

// export { getUser, registerAccount, sync, autoSync, userChanged };
export {autoSync, userChanged };
