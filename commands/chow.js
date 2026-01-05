import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';
import config from '../config.json' assert { type: 'json' };

const trayDBPath = path.join('./data/trays.json');
fs.ensureFileSync(trayDBPath);
let trayDB = fs.readJsonSync(trayDBPath, { throws: false }) || {};

export default {
  data: new SlashCommandBuilder()
    .setName('claimtray')
    .setDescription('Claim your tray for the current meal'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = new Date();
    const hour = now.getHours();
    let meal = null;
    if (hour >= 6 && hour < 12) meal = 'breakfast';
    else if (hour >= 12 && hour < 18) meal = 'lunch';
    else meal = 'dinner';

    const today = now.toISOString().split('T')[0];
    trayDB[today] ??= {};
    trayDB[today][meal] ??= [];

    if (trayDB[today][meal].includes(userId)) {
      return interaction.reply({ content: `You already claimed your ${meal} tray today.`, ephemeral: true });
    }

    trayDB[today][meal].push(userId);
    fs.writeJsonSync(trayDBPath, trayDB);

    // Give tray item in inventory
    const inventoryPath = path.join('./data/players.json');
    let players = fs.readJsonSync(inventoryPath, { throws: false }) || {};
    players[userId] ??= { inventory: [] };
    players[userId].inventory ??= [];
    const trayNames = {
      breakfast: 'Biscuits & Gravy',
      lunch: 'Cheeseburger',
      dinner: 'Spaghetti & Meatballs'
    };
    players[userId].inventory.push(trayNames[meal]);
    fs.writeJsonSync(inventoryPath, players);

    return interaction.reply({ content: `You claimed your ${meal} tray: ${trayNames[meal]}.`, ephemeral: true });
  }
};
