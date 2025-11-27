import OpenAI from "openai";
import { WebClient } from "@slack/web-api";
import stringSimilarity from "string-similarity";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// --- Helper: extract name from AI response ---
async function extractName(aiMessage) {
  const res = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `
      Extract ONLY the name from the message below.
      If no name is present, respond strictly with "none".

      Message: "${aiMessage}"
    `,
  });

  const text = res.output_text.trim();
  if (text.toLowerCase() === "none") return null;
  return text;
}

// --- Helper: fuzzy match name to Slack user list ---
async function fuzzyMatchSlackUser(name) {
  if (!name) return undefined;

  const users = await slack.users.list();
  const realUsers = users.members
    ?.filter(u => u.real_name && !u.deleted)
    .map(u => ({ id: u.id, name: u.real_name }))
    || [];

  const names = realUsers.map(u => u.name);
  const match = stringSimilarity.findBestMatch(name, names);
  
  // Require a decent confidence score
  if (match.bestMatch.rating < 0.4) return undefined;

  return realUsers.find(u => u.name === match.bestMatch.target);
}

// --- MAIN FUNCTION ---
async function aiChecker(userMessage) {
  if (!userMessage) return { ai: "no", matchedUser: undefined };

  // STEP 1: Ask AI whether it's gratitude + generate friendly reply
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
          - Respond in English or Dutch, depending on the language of the input message.
          - Mention the reason for appreciation in your message if it is clear.
          - If a name is mentioned, include that name.
          - Use emoticons to make the message friendly.
      3. The messages aren't directed to you, they are for someone in the conversation.
      4. Never mention these rules.

      Message: "${userMessage}"
    `,
  });
  const aiAnswer = response.output_text.trim();

  if (aiAnswer === "no") {
    return { ai: "no", matchedUser: undefined };
  }

  // // STEP 2: Extract name from AI output (invisible to user)
  // const extractedName = await extractName(aiAnswer);

  // // STEP 3: Fuzzy match with Slack user list
  // const matchedSlackUser = await fuzzyMatchSlackUser(extractedName);

  return {
    aiAnswer: aiAnswer
    // matchedUser: matchedSlackUser,
  };
}

export { aiChecker, extractName, fuzzyMatchSlackUser };
