import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(opt => 
      opt.setName('user')
        .setDescription('User to kick')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('user');

    if (!member) {
      return interaction.reply({ content: 'Member not found.', ephemeral: true });
    }

    try {
      await member.kick();
      await interaction.reply({ content: `Successfully kicked ${member.user.tag}.` });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to kick member.', ephemeral: true });
    }
  }
};
