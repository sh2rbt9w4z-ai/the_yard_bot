import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echo a message')
    .addStringOption(opt => opt
      .setName('message')
      .setDescription('Message to echo')
      .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const msg = interaction.options.getString('message');
    await interaction.reply({ content: msg });
  }
};
