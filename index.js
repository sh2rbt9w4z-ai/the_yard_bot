// index.js
import 'dotenv/config'; // Make sure you installed dotenv: npm i dotenv
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { moderationCommands } from './commands/moderation.js'; // the array we just made

// Create a new client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Commands collection
client.commands = new Collection();

// Register moderation commands
for (const cmd of moderationCommands) {
  client.commands.set(cmd.data.name, cmd);
}

// Ready event
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
  }
});

// Login
client.login(process.env.TOKEN);
