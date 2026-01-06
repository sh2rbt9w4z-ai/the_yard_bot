import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Test if the bot is alive'),

  async execute(interaction) {
    await interaction.reply({
      content: 'Pong.',
      ephemeral: true
    });
  }
};
