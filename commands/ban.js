import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to ban')
        .setRequired(true)
    )
    .setIntegerOption(opt =>
      opt.setName('days')
        .setDescription('Delete message history (0-7 days)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('user');
    const days = interaction.options.getInteger('days') || 0;

    if (!member) {
      return interaction.reply({ content: 'Member not found.', ephemeral: true });
    }

    try {
      await member.ban({ deleteMessageDays: days });
      await interaction.reply({ content: `Successfully banned ${member.user.tag}.` });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to ban member.', ephemeral: true });
    }
  }
};
