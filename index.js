import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from './config.json' assert { type: 'json' };

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Reaction]
});

// Commands Collection
client.commands = new Collection();
const commandsPath = path.join('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const { default: command } = await import(filePath);
  if (command && command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// Event: Ready
client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Event: Interaction Create
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
  }
});

client.login(config.token);

const slashCommands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (!command?.data?.name || !command?.execute) {
    console.warn(
      `[WARNING] Skipping ${file}: missing data or execute()`
    );
    continue;
  }

  client.commands.set(command.data.name, command);
  slashCommands.push(command.data.toJSON());
}

// ---------------- REGISTER SLASH COMMANDS ----------------
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: slashCommands }
    );
    console.log('Slash commands registered.');
  } catch (error) {
    console.error('Slash command registration failed:', error);
  }
})();

// ---------------- EVENTS ----------------
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'An error occurred while executing this command.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'An error occurred while executing this command.',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
