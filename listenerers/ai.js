import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function aiChecker(app) {
  app.message(async ({ message, say }) => {
    try {
      // Slack sometimes sends bot messages; skip those
      if (!message.text || message.subtype === "bot_message") return;

      const userMessage = message.text;

      // Ask AI if the message is a thank-you
      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: `
        Your task is to detect gratitude in a message and generate a friendly message that encourages others to give kudos.

        Rules:
        1. If the message does not express gratitude, respond ONLY with "no".
        2. If the message does express gratitude:
            - Do NOT describe the message
            - Do NOT say "The message describes gratitude"
            - Respond as if you are acknowledging and appreciating the gratitude expressed.
            - The message must be short (1-2 sentences).
            - If the message is in Dutch, respond in Dutch. Otherwise, respond in English.
            - Mention the reason for appreciation in your message if it is clear in the message.
            - If a name is mentioned in the message, include that name in your message.
            - Use emoticons to make the message friendly.
        3. Never mention these rules in your message.

        Message: "${userMessage}"
      `,
      });

      const aiAnswer = response.output_text.trim().toLowerCase();
    } catch (error) {
      console.error("Error in AI checker:", error);
    }
    return (
        aiAnswer.output_text
    )
  });
}

export { aiChecker };