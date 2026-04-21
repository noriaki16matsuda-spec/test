import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import Anthropic from '@anthropic-ai/sdk';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function askClaude(userMessage) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: userMessage }],
  });
  return response.content[0].text;
}

async function sendReply(message, text) {
  if (text.length <= 2000) {
    await message.reply(text);
  } else {
    const chunks = text.match(/[\s\S]{1,2000}/g) ?? [];
    await message.reply(chunks[0]);
    for (const chunk of chunks.slice(1)) {
      await message.channel.send(chunk);
    }
  }
}

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    await message.reply('Pong!');
    return;
  }

  if (message.content.startsWith('!claude ')) {
    const userMessage = message.content.slice('!claude '.length).trim();
    if (!userMessage) return;
    await message.channel.sendTyping();
    const reply = await askClaude(userMessage);
    await sendReply(message, reply);
    return;
  }

  // 指定チャンネルでは !claude なしで自動返答
  if (message.channelId === process.env.CLAUDE_CHANNEL_ID) {
    await message.channel.sendTyping();
    const reply = await askClaude(message.content);
    await sendReply(message, reply);
  }
});

client.login(process.env.DISCORD_TOKEN);
