import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(option => option
      .setName('target')
      .setDescription('Member to warn')
      .setRequired(true))
    .addStringOption(option => option
      .setName('reason')
      .setDescription('Reason for warning')
      .setRequired(true)),

  async execute(interaction) {
    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason');

    // Log somewhere or database if needed
    console.log(`WARN: ${member.user.tag} - ${reason}`);

    await interaction.reply({ content: `You have warned ${member.user.tag} for: ${reason}`, ephemeral: true });
  }
};
