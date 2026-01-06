// index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection, SlashCommandBuilder, PermissionsBitField } from 'discord.js';
import fs from 'fs';
import path from 'path';

// ========== CONFIGURATION ==========
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

// Role IDs
const ROLE_INMATE = process.env.ROLE_INMATE; // e.g., '123456789012345678'
const ROLE_C1 = process.env.ROLE_C1;
const ROLE_C2 = process.env.ROLE_C2;
const ROLE_C3 = process.env.ROLE_C3;
const ROLE_SEGREGATION = process.env.ROLE_SEGREGATION;

// Channel IDs
const CHANNEL_BOOKING = process.env.CHANNEL_BOOKING;
const CHANNEL_MUGSHOTS = process.env.CHANNEL_MUGSHOTS;

// ========== CLIENT SETUP ==========
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Command collection
client.commands = new Collection();

// ========== SLASH COMMAND DEFINITIONS ==========
const commands = [
    // -------------------- MODERATION --------------------
    {
        data: new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kick a member')
            .addUserOption(opt => opt.setName('target').setDescription('Member to kick').setRequired(true)),
        async execute(interaction) {
            const target = interaction.options.getUser('target');
            const member = await interaction.guild.members.fetch(target.id);
            if (!member.kickable) return interaction.reply({ content: 'Cannot kick this member.', ephemeral: true });
            await member.kick();
            await interaction.reply({ content: `${target.tag} was kicked.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban a member')
            .addUserOption(opt => opt.setName('target').setDescription('Member to ban').setRequired(true)),
        async execute(interaction) {
            const target = interaction.options.getUser('target');
            const member = await interaction.guild.members.fetch(target.id);
            if (!member.bannable) return interaction.reply({ content: 'Cannot ban this member.', ephemeral: true });
            await member.ban();
            await interaction.reply({ content: `${target.tag} was banned.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Mute a member')
            .addUserOption(opt => opt.setName('target').setDescription('Member to mute').setRequired(true)),
        async execute(interaction) {
            const target = interaction.options.getUser('target');
            const member = await interaction.guild.members.fetch(target.id);
            const role = interaction.guild.roles.cache.get(ROLE_SEGREGATION);
            await member.roles.add(role);
            await interaction.reply({ content: `${target.tag} has been muted.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Unmute a member')
            .addUserOption(opt => opt.setName('target').setDescription('Member to unmute').setRequired(true)),
        async execute(interaction) {
            const target = interaction.options.getUser('target');
            const member = await interaction.guild.members.fetch(target.id);
            const role = interaction.guild.roles.cache.get(ROLE_SEGREGATION);
            await member.roles.remove(role);
            await interaction.reply({ content: `${target.tag} has been unmuted.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('echo')
            .setDescription('Echo a message')
            .addStringOption(opt => opt.setName('text').setDescription('Message to echo').setRequired(true)),
        async execute(interaction) {
            const text = interaction.options.getString('text');
            await interaction.reply({ content: text });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Warn a member')
            .addUserOption(opt => opt.setName('target').setDescription('Member to warn').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('Reason for warn').setRequired(true)),
        async execute(interaction) {
            const target = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason');
            await interaction.reply({ content: `${target.tag} has been warned: ${reason}`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('purge')
            .setDescription('Delete messages')
            .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages').setRequired(true)),
        async execute(interaction) {
            const amount = interaction.options.getInteger('amount');
            const channel = interaction.channel;
            await channel.bulkDelete(amount, true);
            await interaction.reply({ content: `Deleted ${amount} messages.`, ephemeral: true });
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('papers')
            .setDescription('Check your jail papers and charges'),
        async execute(interaction) {
            // Placeholder for user database
            const data = { charge: 'Petty Theft', time: '2 months' };
            await interaction.reply({
                content: `Your papers:\nCharge: ${data.charge}\nTime Serving: ${data.time}`,
                ephemeral: true
            });
        }
    }
    // -------------------- ADD MORE COMMANDS HERE --------------------
];

// Register commands into collection
for (const cmd of commands) {
    client.commands.set(cmd.data.name, cmd);
}

// ========== EVENT HANDLERS ==========
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Handle slash command interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        if (!interaction.replied) await interaction.reply({ content: 'Error executing command.', ephemeral: true });
    }
});

// ========== MEMBER JOIN ==========
client.on('guildMemberAdd', async (member) => {
    // Auto-give inmate role
    const role = member.guild.roles.cache.get(ROLE_INMATE);
    if (role) await member.roles.add(role);

    // Send booking message
    const channel = member.guild.channels.cache.get(CHANNEL_BOOKING);
    if (!channel) return;
    const msg = await channel.send({ content: `${member.user}, click the reaction to get booked!` });
    await msg.react('✅');
});

// ========== REACTION HANDLER ==========
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.message.channel.id !== CHANNEL_BOOKING) return;
    if (reaction.emoji.name !== '✅') return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);

    // Assign a random cell block role
    const cellRoles = [ROLE_C1, ROLE_C2, ROLE_C3];
    const chosenRoleId = cellRoles[Math.floor(Math.random() * cellRoles.length)];
    const chosenRole = guild.roles.cache.get(chosenRoleId);

    if (chosenRole) await member.roles.add(chosenRole);

    // Assign a random nickname
    const nicknames = ['Sparky', 'Brick', 'Ace', 'Shadow', 'Snake', 'Tank', 'Hawk', 'Viper', 'Rico', 'Jax'];
    const newNick = nicknames[Math.floor(Math.random() * nicknames.length)];
    await member.setNickname(newNick);

    // Post mugshot
    const mugshotChannel = guild.channels.cache.get(CHANNEL_MUGSHOTS);
    if (mugshotChannel) {
        await mugshotChannel.send({
            content: `New inmate booked: ${member.user.tag}\nCharge: Petty Theft\nTime Serving: 2 months`,
            files: [member.user.displayAvatarURL({ format: 'png', size: 512 })]
        });
    }

    // Delete booking message
    await reaction.message.delete().catch(() => {});
});

// ========== LOGIN ==========
client.login(TOKEN);
