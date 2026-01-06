import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true)
        ),
    async execute(interaction) {
        const member = interaction.options.getMember('user');
        if (!member) return interaction.reply({ content: 'Member not found.', ephemeral: true });

        try {
            await member.kick();
            await interaction.reply({ content: `Kicked ${member.user.tag}.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to kick member.', ephemeral: true });
        }
    }
};
