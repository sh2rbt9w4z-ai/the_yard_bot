import { SlashCommandBuilder } from 'discord.js';
import config from '../config.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('co')
    .setDescription('CO commands')
    .addSubcommand(sub =>
      sub.setName('report')
        .setDescription('Write a report')
        .addUserOption(opt => opt.setName('target').setDescription('Player').setRequired(true))
        .addStringOption(opt => opt.setName('content').setDescription('Report content').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('addtime')
        .setDescription('Add time to a player')
        .addUserOption(opt => opt.setName('target').setDescription('Player').setRequired(true))
        .addIntegerOption(opt => opt.setName('days').setDescription('Days to add').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('addcharge')
        .setDescription('Add a charge')
        .addUserOption(opt => opt.setName('target').setDescription('Player').setRequired(true))
        .addStringOption(opt => opt.setName('charge').setDescription('Charge name').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('search')
        .setDescription('Search placeholder for contraband (future)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(target?.id);

    if (!interaction.member.roles.cache.has(config.roles.co)) {
      return interaction.reply({ content: 'You do not have CO permissions.', ephemeral: true });
    }

    if (sub === 'report') {
      const content = interaction.options.getString('content');
      const reportChannel = interaction.guild.channels.cache.get(config.channels.report);
      reportChannel?.send(`**Report by ${interaction.user.tag} on ${target.tag}:**\n${content}`);
      return interaction.reply({ content: 'Report submitted.', ephemeral: true });
    }

    if (sub === 'addtime') {
      const days = interaction.options.getInteger('days');
      // Here you would add logic to update player's timeServing
      return interaction.reply({ content: `Added ${days} days to ${target.tag}'s sentence.`, ephemeral: true });
    }

    if (sub === 'addcharge') {
      const charge = interaction.options.getString('charge');
      // Here you would add logic to update player's charge
      return interaction.reply({ content: `Added charge "${charge}" to ${target.tag}.`, ephemeral: true });
    }

    if (sub === 'search') {
      return interaction.reply({ content: 'Search command placeholder for future contraband system.', ephemeral: true });
    }
  }
};
