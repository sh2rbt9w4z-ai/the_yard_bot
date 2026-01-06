import fs from 'fs';
import path from 'path';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';

// Create client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});

// Command collection
client.commands = new Collection();

// Load commands from /commands folder
const commandsPath = path.join('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (!command.default?.data || !command.default?.execute) {
    console.log(`Skipping invalid command file: ${file}`);
    continue;
  }
  client.commands.set(command.default.data.name, command.default);
}

// Register slash commands to the guild
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const commandsArray = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());

try {
  console.log('Registering slash commands...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commandsArray }
  );
  console.log('Slash commands registered!');
} catch (err) {
  console.error('Failed to register commands:', err);
}

// Interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error('Error executing command:', err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
  }
});

// Ready event
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Login
client.login(process.env.TOKEN);
