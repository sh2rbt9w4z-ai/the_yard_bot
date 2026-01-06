import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove the Segregation role from a member')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('Member to unmute')
        .setRequired(true)),
  
  async execute(interaction) {
    const member = interaction.options.getMember('target');
    const roleId = process.env.SEGREGATION_ROLE_ID;
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) return interaction.reply({ content: 'Segregation role not found!', ephemeral: true });

    try {
      await member.roles.remove(role);
      await interaction.reply({ content: `${member.user.tag} has been unmuted.`, ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to unmute member.', ephemeral: true });
    }
  }
};
