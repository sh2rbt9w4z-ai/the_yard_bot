import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('papers')
        .setDescription('View your papers (server info, roles, join date)'),
    async execute(interaction) {
        const member = interaction.member;

        const roles = member.roles.cache
            .filter(r => r.id !== interaction.guild.id)
            .map(r => r.name)
            .join(', ') || 'None';

        const embed = {
            color: 0x0099ff,
            title: `${member.user.tag}'s Papers`,
            fields: [
                { name: 'Nickname', value: member.nickname || member.user.username, inline: true },
                { name: 'Roles', value: roles, inline: true },
                { name: 'Joined At', value: member.joinedAt.toDateString(), inline: true },
            ]
        };

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
