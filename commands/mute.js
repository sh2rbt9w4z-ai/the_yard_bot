import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member (give segregation role)')
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to mute')
                .setRequired(true)
        ),
    async execute(interaction) {
        const member = interaction.options.getMember('user');
        const role = interaction.guild.roles.cache.get(process.env.SEGREGATION_ROLE);
        if (!member || !role) return interaction.reply({ content: 'Member or role not found.', ephemeral: true });

        try {
            await member.roles.add(role);
            await interaction.reply({ content: `${member.user.tag} has been muted.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to mute member.', ephemeral: true });
        }
    }
};
