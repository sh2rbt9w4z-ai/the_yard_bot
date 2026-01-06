import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of messages from the channel')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: 'You must provide a number between 1 and 100.', ephemeral: true });
    }

    try {
      // Fetch messages to delete
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      await interaction.channel.bulkDelete(messages, true);

      // Reply ephemeral so the message itself disappears from others
      await interaction.reply({ content: `Deleted ${messages.size} messages.`, ephemeral: true });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to delete messages.', ephemeral: true });
    }
  }
};
