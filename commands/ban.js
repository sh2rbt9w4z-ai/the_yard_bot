import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to ban')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Delete message history (0-7 days)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const days = interaction.options.getInteger('days') || 0;

        if (!member) return interaction.reply({ content: 'Member not found.', ephemeral: true });

        try {
            await member.ban({ deleteMessageDays: days });
            await interaction.reply({ content: `Banned ${member.user.tag}.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to ban member.', ephemeral: true });
        }
    }
};
