import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';

export default {
    data: new SlashCommandBuilder()
        .setName('chow')
        .setDescription('Claim your meal tray'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const guild = interaction.guild;
        const trayDataFile = './data/trays.json';

        await fs.ensureFile(trayDataFile);
        let trays = await fs.readJson(trayDataFile).catch(() => ({}));

        if (!trays[userId]) trays[userId] = {};

        const now = new Date();
        const hour = now.getHours();
        let meal;

        if (hour >= 8 && hour < 12) meal = 'Breakfast';
        else if (hour >= 12 && hour < 18) meal = 'Lunch';
        else if (hour >= 18 && hour < 23) meal = 'Dinner';
        else return interaction.reply({ content: 'No meal available right now.', ephemeral: true });

        if (trays[userId][meal]) return interaction.reply({ content: `You already claimed ${meal}.`, ephemeral: true });

        trays[userId][meal] = true;
        await fs.writeJson(trayDataFile, trays);

        await interaction.reply({ content: `You claimed your ${meal} tray!`, ephemeral: true });
    }
};
