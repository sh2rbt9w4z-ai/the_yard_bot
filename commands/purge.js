import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of messages')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const channel = interaction.channel;

    await channel.bulkDelete(amount, true);
    return interaction.reply({ content: `Deleted ${amount} messages.`, ephemeral: true });
  }
};
