import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echo a message')
    .addStringOption(option => option
      .setName('message')
      .setDescription('Message to echo')
      .setRequired(true)),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    await interaction.reply({ content: message, ephemeral: true });
  }
};
