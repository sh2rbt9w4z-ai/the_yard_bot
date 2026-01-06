import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete a number of messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (max 100)')
                .setRequired(true)
        ),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100) return interaction.reply({ content: 'Amount must be between 1 and 100.', ephemeral: true });

        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            await interaction.channel.bulkDelete(messages, true);
            await interaction.reply({ content: `Deleted ${messages.size} messages.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to delete messages.', ephemeral: true });
        }
    }
};
