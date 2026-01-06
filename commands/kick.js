import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option => option
      .setName('target')
      .setDescription('The member to kick')
      .setRequired(true))
    .addStringOption(option => option
      .setName('reason')
      .setDescription('Reason for kick')
      .setRequired(false)),

  async execute(interaction) {
    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!member.kickable) {
      return interaction.reply({ content: 'I cannot kick this member.', ephemeral: true });
    }

    try {
      await member.kick(reason);
      await interaction.reply({ content: `Kicked ${member.user.tag} for: ${reason}`, ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to kick member.', ephemeral: true });
    }
  }
};
