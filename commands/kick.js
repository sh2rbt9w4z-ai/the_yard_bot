import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(opt => opt.setName('target').setDescription('User to kick').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(target.id);

    if (!member.kickable) return interaction.reply({ content: 'Cannot kick this member.', ephemeral: true });
    await member.kick('Kicked by command');

    return interaction.reply({ content: `Kicked ${target.tag}`, ephemeral: true });
  }
};
