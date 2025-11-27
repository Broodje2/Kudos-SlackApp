const url = "https://kudos-api.guusn.nl";

import { aiChecker, extractName, fuzzyMatchSlackUser } from "./ai.js";
// let LastKudosData = { aiAnswer: "bla bla bla", matchedSlackUserID: "U09HW1A2YR5" };
let aiAnswer = "";
let matchedSlackUser = { id: undefined, name: undefined };
let channelID = undefined;

function kudosRecommendation(app) {
  // Listens to incoming messages that contain "hello"
  app.message(async ({ message, say, ack }) => {
    channelID = message.channel;
    try {
      if (!message.text || message.subtype === "bot_message") return;

      const { aiAnswer } = await aiChecker(message.text);

      if (aiAnswer !== "no" || aiAnswer !== undefined) {
        matchedSlackUser = await extractName(message.text);
        // console.log("Matched Slack User:", matchedSlackUser);
        // console.log("Extracted Name:", matchedSlackUser?.id === undefined ? "undefined" : matchedSlackUser.name);
        matchedSlackUser = await fuzzyMatchSlackUser(matchedSlackUser);
        if (!matchedSlackUser) {
          // console.log("No suitable Slack user match found.");
          matchedSlackUser = { id: undefined, name: undefined };
        }
        // console.log("Matched Slack User ID:", matchedSlackUser?.id);
        // LastKudosData = { aiAnswer, matchedSlackUserID };
        // console.log("LastKudosData updated HIERO:", LastKudosData);
        // say() sends a message to the channel where the event was triggered
        await say({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${aiAnswer}`,
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

    // channelID = body.channel_id;
    console.log("Channel ID:", channelID);

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
              initial_user: matchedSlackUser.id === "" ? "none" : matchedSlackUser.id,
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
              initial_conversation: channelID,
            },
          },
          {
            type: "input",
            block_id: "numeric_select",
            label: {
              type: "plain_text",
              text: "How many kudos do you want to give?",
            },
            element: {
              type: "static_select",
              action_id: "number_pick",
              placeholder: {
                type: "plain_text",
                text: "How many kudos do you want to give?"
              },
              options: [
                { text: { type: "plain_text", text: "1" }, value: "1" },
                { text: { type: "plain_text", text: "2" }, value: "2" },
                { text: { type: "plain_text", text: "3" }, value: "3" },
                { text: { type: "plain_text", text: "4" }, value: "4" },
                { text: { type: "plain_text", text: "5" }, value: "5" }
              ]
            }
          },
          {
            type: "input",
            block_id: "kudo_message_block",
            label: { type: "plain_text", text: "What would you like to say?" },
            element: {
              type: "plain_text_input",
              action_id: "kudo_message",
              multiline: true,
              initial_value: "Thank you for your help!",
            },
          },
        ],
      },
    });
  });
}
function giveKudos(app) {
  app.command("/kudos", async ({ ack, body, client }) => {
    await ack();
    channelID = body.channel_id;

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
              initial_user: matchedSlackUser.id === "" ? undefined : matchedSlackUser.id,
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
              initial_conversation: channelID,
            },
          },
          {
            type: "input",
            block_id: "numeric_select",
            label: {
              type: "plain_text",
              text: "How many kudos do you want to give?",
            },
            element: {
              type: "static_select",
              action_id: "number_pick",
              placeholder: {
                type: "plain_text",
                text: "How many kudos do you want to give?"
              },
              options: [
                { text: { type: "plain_text", text: "1" }, value: "1" },
                { text: { type: "plain_text", text: "2" }, value: "2" },
                { text: { type: "plain_text", text: "3" }, value: "3" },
                { text: { type: "plain_text", text: "4" }, value: "4" },
                { text: { type: "plain_text", text: "5" }, value: "5" }
              ],
              initial_option: { text: { type: "plain_text", text: "1" }, value: "1" }
            }
          }
          ,
          {
            type: "input",
            block_id: "kudo_message_block",
            label: { type: "plain_text", text: "What would you like to say?" },
            element: {
              type: "plain_text_input",
              action_id: "kudo_message",
              multiline: true,
              initial_value: "Thank you for your help!",
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
                  text: "Give Kudos",
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
          text: `Kon de transactie niet uitvoeren: ${responseData.error || "Onbekende fout"
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
            block_id: "numeric_select",
            label: {
              type: "plain_text",
              text: "How many kudos do you want to give?",
            },
            element: {
              type: "static_select",
              action_id: "number_pick",
              placeholder: {
                type: "plain_text",
                text: "How many kudos do you want to give?"
              },
              options: [
                { text: { type: "plain_text", text: "1" }, value: "1" },
                { text: { type: "plain_text", text: "2" }, value: "2" },
                { text: { type: "plain_text", text: "3" }, value: "3" },
                { text: { type: "plain_text", text: "4" }, value: "4" },
                { text: { type: "plain_text", text: "5" }, value: "5" }
              ]
            }
          },
          {
            type: "input",
            block_id: "kudo_message_block",
            label: { type: "plain_text", text: "What would you like to say?" },
            element: {
              type: "plain_text_input",
              action_id: "kudo_message",
              multiline: true,
              initial_value: "Thank you for your help!",
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
          text: `Kon de transactie niet uitvoeren: ${responseData.error || "Onbekende fout"
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
  app.command("/mykudos", async ({ ack, body, client, say }) => {
    await ack();

    try {
      const giveawayResponse = await fetch(
        `${url}/user/${body.user_id}/kudos/giveaway`
      );
      const kudosResponse = await fetch(
        `${url}/user/${body.user_id}/kudos/kudos`
      );
      const giveawwayData = await giveawayResponse.json();
      const kudosData = await kudosResponse.json();
      console.log(giveawwayData, kudosData);

      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: body.user_id,
        text: "Your kudos summary",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `⭐ *${body.user_name}'s Kudos Summary* ⭐
      
      🎁 *Giveaway Kudos:* ${giveawwayData.total_kudos}
      💛 *Regular Kudos:* ${kudosData.total_kudos}`
            }
          }
        ],
        text: "User kudos summary"
      });

      // await say(`${username} - giveaway-kudos: ${giveawwayData.total_kudos} kudos, regular kudos: ${kudosData.total_kudos} kudos.`);
    } catch (error) {
      console.error(error);
      await say("Kon de user niet ophalen 😿");
    }
  });
}

export { giveKudos, kudosRecommendation, viewKudosModal, checkGiveawayKudos };