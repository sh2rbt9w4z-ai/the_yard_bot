import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Give a member the Segregation role')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('Member to mute')
        .setRequired(true)),
  
  async execute(interaction) {
    const member = interaction.options.getMember('target');
    const roleId = process.env.SEGREGATION_ROLE_ID; // from Railway Shared Variables
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) return interaction.reply({ content: 'Segregation role not found!', ephemeral: true });

    try {
      await member.roles.add(role);
      await interaction.reply({ content: `${member.user.tag} has been muted.`, ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to mute member.', ephemeral: true });
    }
  }
};
