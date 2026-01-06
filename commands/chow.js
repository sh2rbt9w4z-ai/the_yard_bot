import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('chow')
    .setDescription('Claim your meal tray (Breakfast, Lunch, Dinner)'),
  async execute(interaction) {
    const userId = interaction.user.id;
    const dataPath = path.join('./data', 'trays.json');

    await fs.ensureFile(dataPath);
    let trays = await fs.readJson(dataPath).catch(() => ({}));

    if (!trays[userId]) trays[userId] = {};

    const now = new Date();
    const hour = now.getHours();
    let meal;

    if (hour >= 8 && hour < 12) meal = 'Breakfast';
    else if (hour >= 12 && hour < 18) meal = 'Lunch';
    else if (hour >= 18 && hour < 23) meal = 'Dinner';
    else return interaction.reply({ content: 'No meal available right now.', ephemeral: true });

    if (trays[userId][meal])
      return interaction.reply({ content: `You already claimed ${meal}.`, ephemeral: true });

    trays[userId][meal] = true;
    await fs.writeJson(dataPath, trays);

    await interaction.reply({ content: `You claimed your ${meal} tray!`, ephemeral: true });
  }
};
