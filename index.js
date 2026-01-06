// index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Command collection
client.commands = new Collection();

// Dynamically load all command files from /commands
const commandsPath = path.join('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commandsArray = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(pathToFileURL(filePath).href); // <-- FIXED
    if (!command.default || !command.default.data || !command.default.execute) {
        console.warn(`Skipping ${file}, invalid command structure.`);
        continue;
    }
    client.commands.set(command.default.data.name, command.default);
    commandsArray.push(command.default.data.toJSON());
}

// Register slash commands with Discord
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`Registering ${commandsArray.length} slash commands...`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commandsArray }
        );
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

// Event listener: bot ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Event listener: interaction create
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.warn(`No command matching ${interaction.commandName} found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error executing that command.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
        }
    }
});

// Login to Discord
client.login(process.env.TOKEN);
