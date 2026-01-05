import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(opt => opt.setName('target').setDescription('User to ban').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(target.id);

    if (!member.bannable) return interaction.reply({ content: 'Cannot ban this member.', ephemeral: true });
    await member.ban({ reason: 'Banned by command', days: 1 });

    return interaction.reply({ content: `Banned ${target.tag}`, ephemeral: true });
  }
};
