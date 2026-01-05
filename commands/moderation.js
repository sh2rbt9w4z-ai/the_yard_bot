import { SlashCommandBuilder } from 'discord.js';
import config from '../config.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('moderation')
    .setDescription('Moderation commands')
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Kick a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to kick').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Ban a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to ban').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('mute')
        .setDescription('Mute a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to mute').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('unmute')
        .setDescription('Unmute a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to unmute').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('purge')
        .setDescription('Delete messages')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('echo')
        .setDescription('Bot repeats your message')
        .addStringOption(opt => opt.setName('message').setDescription('Message to echo').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('warn')
        .setDescription('Warn a user')
        .addUserOption(opt => opt.setName('target').setDescription('User to warn').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('papers')
        .setDescription('View your info / inventory')),
  
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');
    const message = interaction.options.getString('message');
    const reason = interaction.options.getString('reason');

    // Example: kick
    if (sub === 'kick') {
      if (!target) return interaction.reply({ content: 'User not found.', ephemeral: true });
      const member = await interaction.guild.members.fetch(target.id);
      if (!member.kickable) return interaction.reply({ content: 'Cannot kick that user.', ephemeral: true });
      await member.kick(`Kicked by ${interaction.user.tag}`);
      return interaction.reply({ content: `${target.tag} has been kicked.`, ephemeral: true });
    }

    // Ban
    if (sub === 'ban') {
      if (!target) return interaction.reply({ content: 'User not found.', ephemeral: true });
      const member = await interaction.guild.members.fetch(target.id);
      if (!member.bannable) return interaction.reply({ content: 'Cannot ban that user.', ephemeral: true });
      await member.ban({ reason: `Banned by ${interaction.user.tag}` });
      return interaction.reply({ content: `${target.tag} has been banned.`, ephemeral: true });
    }

    // Mute
    if (sub === 'mute') {
      const member = await interaction.guild.members.fetch(target.id);
      const role = interaction.guild.roles.cache.get(config.roles.segregation);
      await member.roles.add(role);
      return interaction.reply({ content: `${target.tag} muted.`, ephemeral: true });
    }

    // Unmute
    if (sub === 'unmute') {
      const member = await interaction.guild.members.fetch(target.id);
      const role = interaction.guild.roles.cache.get(config.roles.segregation);
      await member.roles.remove(role);
      return interaction.reply({ content: `${target.tag} unmuted.`, ephemeral: true });
    }

    // Purge
    if (sub === 'purge') {
      const fetched = await interaction.channel.messages.fetch({ limit: amount });
      await interaction.channel.bulkDelete(fetched, true);
      return interaction.reply({ content: `Deleted ${fetched.size} messages.`, ephemeral: true });
    }

    // Echo
    if (sub === 'echo') {
      await interaction.reply({ content: message });
    }

    // Warn
    if (sub === 'warn') {
      await interaction.reply({ content: `${target.tag} warned for: ${reason}`, ephemeral: true });
    }

    // Papers (inventory placeholder)
    if (sub === 'papers') {
      await interaction.reply({ content: `Your info and inventory will appear here.`, ephemeral: true });
    }
  }
};
