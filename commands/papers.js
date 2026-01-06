import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('papers')
    .setDescription('Check your jail papers and charges'),

  async execute(interaction) {
    try {
      // Load from database or JSON
      const userId = interaction.user.id;
      // Example: get user's info
      const data = { charge: 'Petty Theft', time: '2 months' }; // Replace with real DB logic

      await interaction.reply({
        content: `Your papers:\nCharge: ${data.charge}\nTime Serving: ${data.time}`,
        ephemeral: true
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to load papers.', ephemeral: true });
    }
  }
};
