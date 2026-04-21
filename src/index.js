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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userMessage }],
    });

    const reply = response.content[0].text;

    // Discord の文字数制限 2000 文字を超える場合は分割して送信
    if (reply.length <= 2000) {
      await message.reply(reply);
    } else {
      const chunks = reply.match(/[\s\S]{1,2000}/g) ?? [];
      await message.reply(chunks[0]);
      for (const chunk of chunks.slice(1)) {
        await message.channel.send(chunk);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
