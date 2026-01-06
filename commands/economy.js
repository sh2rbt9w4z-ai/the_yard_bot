import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Do your assigned work to earn cash'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      // Example economy logic
      // Here you would fetch/update the user's balance in your database
      const earned = Math.floor(Math.random() * 50) + 10;

      await interaction.reply({
        content: `You worked hard and earned $${earned}!`,
        ephemeral: true
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to process work.', ephemeral: true });
    }
  }
};
