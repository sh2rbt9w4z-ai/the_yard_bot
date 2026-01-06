import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

export default {
    data: new SlashCommandBuilder()
        .setName('booking')
        .setDescription('Initiate booking for a new inmate'),
    async execute(interaction) {
        const guild = interaction.guild;
        const member = interaction.member;

        // Roles from env
        const inmateRole = guild.roles.cache.get(process.env.INMATE_ROLE);
        const c1Role = guild.roles.cache.get(process.env.C1_ROLE);
        const c2Role = guild.roles.cache.get(process.env.C2_ROLE);
        const c3Role = guild.roles.cache.get(process.env.C3_ROLE);

        // Give inmate role if not already
        if (!member.roles.cache.has(inmateRole.id)) {
            await member.roles.add(inmateRole);
        }

        // Reaction Role Button
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`book_${member.id}`)
                .setLabel('Start Booking')
                .setStyle(ButtonStyle.Primary)
        );

        const msg = await interaction.reply({
            content: 'Click below to start your booking (only you can click this)',
            components: [button],
            ephemeral: true
        });

        // Collector
        const filter = i => i.customId === `book_${member.id}` && i.user.id === member.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 600000, max: 1 });

        collector.on('collect', async i => {
            // Random cell block
            const cellBlocks = [c1Role, c2Role, c3Role];
            const assignedBlock = cellBlocks[Math.floor(Math.random() * cellBlocks.length)];

            // Assign roles (keep inmate role)
            await member.roles.add(assignedBlock);

            // Random nickname
            const nicknames = ['Shadow', 'Spike', 'Ace', 'Razor', 'Ghost', 'Brick', 'Viper', 'Tank', 'Frost', 'Hawk'];
            const chosenNick = nicknames[Math.floor(Math.random() * nicknames.length)];
            await member.setNickname(chosenNick);

            // Random charge/time
            const charges = ['Theft', 'Assault', 'Contraband', 'Escape Attempt', 'Disorderly Conduct', 'Vandalism', 'Drug Possession'];
            const chosenCharge = charges[Math.floor(Math.random() * charges.length)];
            const timeServing = `${Math.floor(Math.random() * 3) + 1} month(s)`;

            // Post mugshot to #mugshots
            const mugshotsChannel = guild.channels.cache.get(process.env.MUGSHOTS_CHANNEL);
            await mugshotsChannel.send({
                content: `**Mugshot:** ${member.user.tag}\n**Charge:** ${chosenCharge}\n**Time Serving:** ${timeServing}`,
                files: [member.user.displayAvatarURL({ extension: 'png', size: 512 })]
            });

            await i.update({ content: `Booking complete! You are now ${chosenNick} and assigned to ${assignedBlock.name}`, components: [] });
        });
    }
};
