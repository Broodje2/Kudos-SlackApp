const url = "https://kudos-api.guusn.nl";

function shop(app) {
  app.command("/shop", async ({ ack, body, client }) => {
    await ack();

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "shop_modal",
        title: { type: "plain_text", text: "The Shop" },
        close: { type: "plain_text", text: "Cancel" },
        submit: { type: "plain_text", text: "Buy" },
        private_metadata: JSON.stringify({ selected_item: null }), // track selection
        blocks: [
          {
            type: "section",
            block_id: "shop_selection",
            text: { type: "mrkdwn", text: "*Select what you want to buy:*" },
          },
          {
            type: "actions",
            block_id: "shop_buttons",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "🍪 Buy a Cookie (10 kudos)",
                },
                action_id: "shop_item_cookie",
                value: JSON.stringify({ id: "cookie", cost: 10 }),
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "🎵 Decide the Music (20 kudos)",
                },
                action_id: "shop_item_music",
                value: JSON.stringify({ id: "music", cost: 20 }),
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "📍 Choose Team Activity Location (50 kudos)",
                },
                action_id: "shop_item_activity",
                value: JSON.stringify({ id: "activity", cost: 50 }),
              },
            ],
          },
        ],
      },
    });

    app.action(/shop_item_/, async ({ ack, body, client }) => {
      await ack();

      const selected = JSON.parse(body.actions[0].value);
      const { id, cost } = selected;
      const view = body.view;

      // Update buttons to show which one was selected
      const updatedButtons = view.blocks
        .find((b) => b.block_id === "shop_buttons")
        .elements.map((el) => {
          const data = JSON.parse(el.value);
          return {
            ...el,
            text: {
              type: "plain_text",
              text: data.id === id ? `✅ ${el.text.text}` : el.text.text,
            },
            style: data.id === id ? "primary" : "default",
          };
        });

      await client.views.update({
        view_id: view.id,
        hash: view.hash,
        view: {
          ...view,
          private_metadata: JSON.stringify({ selected_item: id, cost }),
          blocks: view.blocks.map((b) =>
            b.block_id === "shop_buttons"
              ? { ...b, elements: updatedButtons }
              : b
          ),
        },
      });
    });

    app.view("shop_modal", async ({ ack, body, view, client }) => {
      await ack();

      const metadata = view.private_metadata
        ? JSON.parse(view.private_metadata)
        : {};
      const origin_id = body.user.id;
      const { selected_item, cost } = metadata;

      if (!selected_item) {
        await client.chat.postEphemeral({
          channel: body.user.id,
          user: body.user.id,
          text: "⚠️ You must select an item before buying!",
        });
        return;
      }

      try {
        const response = await fetch(`${url}/transaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin_slack_id: origin_id,
            origin_kudos_type: "purchase",
            destination_slack_id: "SHOP_SYSTEM",
            destination_kudos_type: selected_item,
            amount: cost,
            reason: `Bought ${selected_item} from the shop`,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          await client.chat.postMessage({
            channel: body.user.id,
            text: `🛍️ You bought *${selected_item}* for *${cost} kudos*! 🎉`,
          });
        } else {
          await client.chat.postMessage({
            channel: body.user.id,
            text: `❌ Purchase failed: ${data.error || "Unknown error"}`,
          });
        }
      } catch (err) {
        console.error(err);
        await client.chat.postMessage({
          channel: body.user.id,
          text: "😿 There was an error processing your purchase.",
        });
      }
    });
  });
}

export { shop };
