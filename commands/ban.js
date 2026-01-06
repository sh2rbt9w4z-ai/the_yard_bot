import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option => option
      .setName('target')
      .setDescription('The member to ban')
      .setRequired(true))
    .addStringOption(option => option
      .setName('reason')
      .setDescription('Reason for ban')
      .setRequired(false)),

  async execute(interaction) {
    const member = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!member.bannable) {
      return interaction.reply({ content: 'I cannot ban this member.', ephemeral: true });
    }

    try {
      await member.ban({ reason });
      await interaction.reply({ content: `Banned ${member.user.tag} for: ${reason}`, ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to ban member.', ephemeral: true });
    }
  }
};
