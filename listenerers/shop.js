const url = "https://kudos-api.guusn.nl";

function shop(app) {
  app.command("/shop", async ({ ack, body, client, say }) => {
    await ack();

    var shopData = [
      { id: "cookie", label: "🍪 Cookie", price: 10 },
      { id: "music", label: "🎵 Music", price: 20 },
      { id: "activity", label: "📍 Activity", price: 50 },
    ];

    var userData = [];
    var username = "";
    var selectedButton = [];

    try {
      const response = await fetch(`${url}/shop/products`);
      shopData = await response.json();
    } catch (error) {
      console.error(error);
      await say("Kon de shop products niet ophalen 😿");
    }

    try {
      const response = await fetch(`${url}/user/${body.user_id}/kudos/kudos`);
      const kudosData = await response.json();

      userData = {
        slack_id: body.user_id,
        ...kudosData,
      };

      const userInfo = await client.users.info({ user: body.user_id });
      username = userInfo.user.profile.display_name || userInfo.user.name;
    } catch (error) {
      console.error(error);
      await say("Kon de user niet ophalen 😿");
    }


    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "shop_modal",
        title: { type: "plain_text", text: "The Shop" },
        close: { type: "plain_text", text: "Cancel" },
        submit: { type: "plain_text", text: "Buy" },
        private_metadata: JSON.stringify({ selected: [] }), // track selection
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Welcome to the shop, ${username}!* \nYou have *${userData.total_kudos} kudos* available.`,
            },
          },
          {
            type: "section",
            block_id: "shop_selection",
            text: { type: "mrkdwn", text: "*Select what you want to buy:*" },
          },
          {
            type: "actions",
            block_id: "shop_buttons",
            elements: shopData.map((item) => ({
              type: "button",
              text: {
                type: "plain_text",
                text: `${item.name} - ${item.price} kudos`,
              },
              value: JSON.stringify({
                name: item.name,
                price: item.price,
                id: item.id,
                description: item.description,
              }),
              action_id: `shop_item_${item.name}`,
            })),
          },
        ],
      },
    });

    app.action(/shop_item_/, async ({ ack, body, view, client }) => {
      await ack();

      try {
        const clicked = JSON.parse(body.actions[0].value);
        const view = body.view;
        const metadata = view.private_metadata
          ? JSON.parse(view.private_metadata)
          : { selected: [] };

        // normalize metadata.selected to a Set of ids (primitives), not objects
        const selected = new Set(
          Array.isArray(metadata.selected)
            ? metadata.selected.map((s) =>
              s && typeof s === "object" ? s.id : s
            )
            : []
        );

        if (selected.has(clicked.name)) {
          selected.delete(clicked.name);
        } else {
          selected.add(clicked.name);
        }

        try {
          const clicked = JSON.parse(body.actions[0].value);
          const view = body.view;
          const metadata = view.private_metadata
            ? JSON.parse(view.private_metadata)
            : { selected: [] };

          // normalize metadata.selected to a Set of ids
          const selected = new Set(
            Array.isArray(metadata.selected)
              ? metadata.selected.map((s) => (s && typeof s === "object" ? s.id : s))
              : []
          );

          if (selected.has(clicked.name)) {
            selected.delete(clicked.name);
          } else {
            selected.add(clicked.name);
            selectedButton = clicked; // track the latest selected item
          }

          // Update buttons to reflect selection state
          const buttonsBlock = view.blocks.find((b) => b.block_id === "shop_buttons");
          const updatedButtons = buttonsBlock.elements.map((item) => {
            const data = JSON.parse(item.value);
            const isSelected = selected.has(data.name);
            return {
              ...item,
              text: {
                type: "plain_text",
                text: isSelected
                  ? `✅ ${data.name} - ${data.price} kudos`
                  : `${data.name} - ${data.price} kudos`,
              },
              style: isSelected ? "primary" : undefined,
            };
          });

          const updatedBlocks = view.blocks.map((block) =>
            block.block_id === "shop_buttons" ? { ...block, elements: updatedButtons } : block
          );

          await client.views.update({
            view_id: view.id,
            hash: view.hash,
            view: {
              type: "modal",
              callback_id: view.callback_id,
              title: view.title,
              close: view.close,
              submit: view.submit,
              private_metadata: JSON.stringify({ selected: [...selected] }),
              blocks: updatedBlocks,
            },
          });
        } catch (error) {
          console.error(error);
        }

        // 3️⃣ Handle modal submission (Buy)
        app.view("shop_modal", async ({ ack, body, view, client }) => {
          await ack();

          if (!selectedButton) return;

          if (userData.total_kudos >= selectedButton.price) {
            try {
              const response = await fetch(`${url}/transaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  origin_slack_id: userData.slack_id,
                  origin_kudos_type: "kudos",
                  destination_slack_id: null,
                  destination_kudos_type: "kudos",
                  amount: selectedButton.price,
                  reason: "buying " + selectedButton.name + " from shop",
                }),
              });

              if (response.ok) {
                await client.chat.postMessage({
                  channel: body.user.id,
                  text: `🎉 You bought *${selectedButton.name}* from the shop!`,
                });
              } else {
                await client.chat.postMessage({
                  channel: body.user.id,
                  text: `⚠️ Transaction failed to buy *${selectedButton.name}* from the shop.`,
                });
              }
            } catch (error) {
              console.error("Error during transaction:", error);
              await client.chat.postMessage({
                channel: body.user.id,
                text: `⚠️ Something went wrong with buying the *${selectedButton.name}* from the shop.`,
              });
            }
          } else {
            await client.chat.postMessage({
              channel: body.user.id,
              text: `⚠️ You don't have sufficient balance to buy the *${selectedButton.name}* from the shop.`,
            });
          }
        });
      }
      catch (error) {
        console.error(error);
      }
    });
  });
}

  export { shop };
