import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user with a reason')
    .addUserOption(opt => opt.setName('target').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    // Delete your command message immediately
    await interaction.deleteReply();

    // Send warning to user
    await interaction.followUp({ content: `You have been warned for: ${reason}`, ephemeral: true });

    // Log warning in server (optional)
    const logChannel = interaction.guild.channels.cache.get(interaction.guild.systemChannelId);
    logChannel?.send(`**${target.tag}** was warned by **${interaction.user.tag}** for: ${reason}`);
  }
};
