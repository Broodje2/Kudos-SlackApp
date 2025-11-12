const url = "https://kudos-api.guusn.nl";

const thanksArray = [
  "Thank",
  "Thanks",
  "thx",
  "tx",
  "thnks",
  "ty",
  "appreciated",
  "Thanks anyway",
  "Cheers",
  "Ta",
  "I owe you",
  "Iou",
  "i.o.u",
  "i.o.u.",
  "lifesaver",
  "grateful",
  "thankful",
  "thankfully",
  "Bless you",
  "Respect",
  "Big love",
  "Props",
  "Appreciate",
  "Love ya for this",
  "That means a lot",
  "That’s so kind of you",

  "Dank",
  "Dankjewel",
  "Dankuwel",
  "Bedankt",
  "Hartelijk dank",
  "waardeer",
  "Ik stel het op prijs",
  "dankbaar",
  "merci",
  "heel lief van je",
  "Superlief",
  "Top",
  "Je bent een held",
  "Je bent geweldig",
];

function kudosRecommendation(app) {
  // Listens to incoming messages that contain "hello"
  app.message(async ({ message, say, ack }) => {
    console.log("iemand stuurde een bericht");
    try {
      if (!message.text || message.subtype === "bot_message") return;
      const raw = message && message.text ? message.text : "";
      const msg = String(raw).toLowerCase();

      const foundThanks = thanksArray.some((word) =>
        msg.includes(word.toLowerCase())
      );

      if (foundThanks) {
        // say() sends a message to the channel where the event was triggered
        await say({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Thank you detected!!! Give Kudos to the amazing person?`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Give Kudos",
                },
                action_id: "button_click",
              },
            },
          ],
          text: `Hey there <@${message.user}>!`,
        });
      }
    } catch (err) {
      console.error("Error in message handler:", err);
    }
  });

  app.action("button_click", async ({ ack, body, client }) => {
    // Acknowledge the action
    await ack();

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "give_kudos_modal",
        title: { type: "plain_text", text: "Give someone kudos" },
        submit: { type: "plain_text", text: "Share" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "doer_of_good_deeds_block",
            label: {
              type: "plain_text",
              text: "Whose deeds are deemed worthy of a kudo?",
            },
            element: {
              type: "users_select",
              action_id: "doer_of_good_deeds",
              initial_user: "U09JQCAF8AV",
            },
          },
          {
            type: "input",
            block_id: "kudo_channel_block",
            label: {
              type: "plain_text",
              text: "Where should this message be shared?",
            },
            element: {
              type: "conversations_select",
              action_id: "kudo_channel",
              initial_conversation: "C09QPC7SPSR",
            },
          },
          {
            type: "input",
            block_id: "kudo_amount_block",
            label: {
              type: "plain_text",
              text: "How many kudos do you want to give?",
            },
            element: {
              type: "plain_text_input",
              action_id: "kudo_points",
              multiline: true,
              initial_value: "1",
            },
          },
          {
            type: "input",
            block_id: "kudo_message_block",
            label: { type: "plain_text", text: "What would you like to say?" },
            element: {
              type: "plain_text_input",
              action_id: "kudo_message",
              multiline: true,
              initial_value: "Test",
            },
          },
        ],
      },
    });
  });
}
function giveKudos(app) {
  app.command("/givekudos", async ({ ack, body, client }) => {
    await ack();

    // Open a modal
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "give_kudos_modal",
        title: { type: "plain_text", text: "Give someone kudos" },
        submit: { type: "plain_text", text: "Share" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "doer_of_good_deeds_block",
            label: {
              type: "plain_text",
              text: "Whose deeds are deemed worthy of a kudo?",
            },
            element: {
              type: "users_select",
              action_id: "doer_of_good_deeds",
              initial_user: "U09JQCAF8AV",
            },
          },
          {
            type: "input",
            block_id: "kudo_channel_block",
            label: {
              type: "plain_text",
              text: "Where should this message be shared?",
            },
            element: {
              type: "conversations_select",
              action_id: "kudo_channel",
              initial_conversation: "C09QPC7SPSR",
            },
          },
          {
            type: "input",
            block_id: "kudo_amount_block",
            label: {
              type: "plain_text",
              text: "How many kudos do you want to give?",
            },
            element: {
              type: "plain_text_input",
              action_id: "kudo_points",
              multiline: true,
              initial_value: "1",
            },
          },
          {
            type: "input",
            block_id: "kudo_message_block",
            label: { type: "plain_text", text: "What would you like to say?" },
            element: {
              type: "plain_text_input",
              action_id: "kudo_message",
              multiline: true,
              initial_value: "Test",
            },
          },
        ],
      },
    });
  });
}

function viewKudosModal(app) {
  app.view("give_kudos_modal", async ({ ack, body, view, client }) => {
    await ack();

    const destination_id =
      view.state.values.doer_of_good_deeds_block.doer_of_good_deeds
        .selected_user;
    const channel =
      view.state.values.kudo_channel_block.kudo_channel.selected_conversation;
    const reason = view.state.values.kudo_message_block.kudo_message.value;
    const amount = view.state.values.kudo_amount_block.kudo_points.value;
    const origin_id = body.user.id;

    try {
      // console.log('Sending account registration request...');
      const response = await fetch(`${url}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_slack_id: origin_id,
          origin_kudos_type: "giveaway",
          destination_slack_id: destination_id,
          destination_kudos_type: "kudos",
          amount: amount,
          reason: reason,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log(
          `Transaction of ${amount} kudos from ${origin_id} to ${destination_id} recorded.`
        );
        await client.chat.postMessage({
          channel: channel,
          text: `🎉 Kudos! 🎉`, // fallback text for notifications
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `🎉 *Kudos!* 🎉\n<@${destination_id}> has received *${amount}* kudo(s) from <@${origin_id}>!\n\n*Reason:* ${reason}`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Also give kudos",
                },
                action_id: "button_click_kudos",
                value: JSON.stringify({
                  to: destination_id,
                }),
              },
            },
          ],
        });
      } else {
        console.error(`Failed: ${response.status} - ${responseData.error}`);
        await client.chat.postMessage({
          channel: channel,
          text: `Kon de transactie niet uitvoeren: ${
            responseData.error || "Onbekende fout"
          } 😿`,
        });
      }
    } catch (error) {
      console.error(error);
      await client.chat.postMessage({
        channel: channel,
        text: `Er is een fout opgetreden bij het uitvoeren van de transactie. 😿`,
      });
    }
  });

  app.action("button_click_kudos", async ({ ack, body, client }) => {
    // Acknowledge the action
    await ack();

    const data = JSON.parse(body.actions[0].value);

    const { to } = data;

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "also_give_kudos_modal",
        title: { type: "plain_text", text: "Give someone kudos" },
        submit: { type: "plain_text", text: "Share" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "doer_of_good_deeds_block",
            label: {
              type: "plain_text",
              text: "Whose deeds are deemed worthy of a kudo?",
            },
            element: {
              type: "users_select",
              action_id: "doer_of_good_deeds",
              initial_user: to,
            },
          },
          {
            type: "input",
            block_id: "kudo_channel_block",
            label: {
              type: "plain_text",
              text: "Where should this message be shared?",
            },
            element: {
              type: "conversations_select",
              action_id: "kudo_channel",
              initial_conversation: "C09K5NA0PNU",
            },
          },
          {
            type: "input",
            block_id: "kudo_amount_block",
            label: {
              type: "plain_text",
              text: "How many kudos do you want to give?",
            },
            element: {
              type: "plain_text_input",
              action_id: "kudo_points",
              multiline: true,
              initial_value: "1",
            },
          },
          {
            type: "input",
            block_id: "kudo_message_block",
            label: { type: "plain_text", text: "What would you like to say?" },
            element: {
              type: "plain_text_input",
              action_id: "kudo_message",
              multiline: true,
              initial_value: "Test",
            },
          },
        ],
      },
    });
  });

  app.view("also_give_kudos_modal", async ({ ack, body, view, client }) => {
    await ack();

    const destination_id =
      view.state.values.doer_of_good_deeds_block.doer_of_good_deeds
        .selected_user;
    const channel =
      view.state.values.kudo_channel_block.kudo_channel.selected_conversation;
    const reason = view.state.values.kudo_message_block.kudo_message.value;
    const amount = view.state.values.kudo_amount_block.kudo_points.value;
    const origin_id = body.user.id;

    try {
      // console.log('Sending account registration request...');
      const response = await fetch(`${url}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_slack_id: origin_id,
          origin_kudos_type: "giveaway",
          destination_slack_id: destination_id,
          destination_kudos_type: "kudos",
          amount: amount,
          reason: reason,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log(
          `Transaction of ${amount} kudos from ${origin_id} to ${destination_id} recorded.`
        );
        await client.chat.postMessage({
          channel: channel,
          text: `🎉 Kudos! 🎉`, // fallback text for notifications
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `🎉 *Kudos!* 🎉\n<@${destination_id}> has received *${amount}* kudo(s) from <@${origin_id}>!\n\n*Reason:* ${reason}`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Also give kudos",
                },
                action_id: "button_click_kudos",
              },
            },
          ],
        });
      } else {
        console.error(`Failed: ${response.status} - ${responseData.error}`);
        await client.chat.postMessage({
          channel: channel,
          text: `Kon de transactie niet uitvoeren: ${
            responseData.error || "Onbekende fout"
          } 😿`,
        });
      }
    } catch (error) {
      console.error(error);
      await client.chat.postMessage({
        channel: channel,
        text: `Er is een fout opgetreden bij het uitvoeren van de transactie. 😿`,
      });
    }
  });
}

function checkGiveawayKudos(app) {
  app.command("/giveawaykudos", async ({ ack, body, client, say }) => {
    await ack();

    try {
      const response = await fetch(
        `${url}/user/${body.user_id}/kudos/giveaway`
      );
      const data = await response.json();
      const userInfo = await client.users.info({ user: body.user_id });
      const username = userInfo.user.profile.display_name || userInfo.user.name;
      await say(`${username} - giveaway-kudos: ${data.total_kudos}`);
    } catch (error) {
      console.error(error);
      await say("Kon de user niet ophalen 😿");
    }
  });
}

export { giveKudos, kudosRecommendation, viewKudosModal, checkGiveawayKudos };