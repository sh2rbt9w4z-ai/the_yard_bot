import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('co')
    .setDescription('CO command: add time, charge, or search')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('user').setDescription('Target inmate').setRequired(true))
    .addStringOption(opt => opt.setName('action').setDescription('Action: addtime/addcharge/search').setRequired(true))
    .addStringOption(opt => opt.setName('value').setDescription('Amount or reason').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const action = interaction.options.getString('action');
    const value = interaction.options.getString('value') || '';

    if (!target) return interaction.reply({ content: 'Member not found.', ephemeral: true });

    // CO actions - placeholders
    switch (action) {
      case 'addtime':
        await interaction.reply({ content: `${target.user.tag} has received ${value} added to their sentence.`, ephemeral: true });
        break;
      case 'addcharge':
        await interaction.reply({ content: `${target.user.tag} has been charged: ${value}`, ephemeral: true });
        break;
      case 'search':
        const chance = Math.random();
        const result = chance < 0.7 ? 'Contraband found!' : 'No contraband.';
        await interaction.reply({ content: `Search result for ${target.user.tag}: ${result}`, ephemeral: true });
        break;
      default:
        await interaction.reply({ content: 'Unknown action.', ephemeral: true });
    }
  }
};
