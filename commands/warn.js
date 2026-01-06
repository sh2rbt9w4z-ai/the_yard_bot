import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user with a reason')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to warn')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for warning')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!member) {
      return interaction.reply({ content: 'User not found.', ephemeral: true });
    }

    try {
      // Send DM to warned user
      await member.send(`You have been warned in **${interaction.guild.name}** for: **${reason}**`);

      // Reply to moderator privately
      await interaction.reply({ content: `Successfully warned ${member.user.tag} for: ${reason}`, ephemeral: true });
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'Failed to warn user. They may have DMs off.', ephemeral: true });
      }
    }
  }
};
