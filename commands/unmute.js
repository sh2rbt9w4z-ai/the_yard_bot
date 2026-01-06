import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a member (remove segregation role)')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to unmute')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('user');
    const role = interaction.guild.roles.cache.get(process.env.SEGREGATION_ROLE);

    if (!member || !role) {
      return interaction.reply({ content: 'Member or Segregation role not found.', ephemeral: true });
    }

    try {
      await member.roles.remove(role);
      await interaction.reply({ content: `${member.user.tag} has been unmuted.` });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to unmute member.', ephemeral: true });
    }
  }
};
