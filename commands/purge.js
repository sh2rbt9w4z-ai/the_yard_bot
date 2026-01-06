import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of messages from a channel')
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (max 100)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: 'You can only delete between 1 and 100 messages.', ephemeral: true });
    }

    try {
      // Delete messages (including command message)
      const messages = await interaction.channel.messages.fetch({ limit: amount + 1 });
      await interaction.channel.bulkDelete(messages, true);
      await interaction.reply({ content: `Deleted ${messages.size - 1} messages.`, ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to purge messages. Make sure they are not older than 14 days.', ephemeral: true });
    }
  }
};
