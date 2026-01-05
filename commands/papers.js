import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

const dbPath = path.join('./data/players.json');
fs.ensureFileSync(dbPath);

export default {
  data: new SlashCommandBuilder()
    .setName('papers')
    .setDescription('View your info and inventory'),

  async execute(interaction) {
    const userId = interaction.user.id;
    let players = fs.readJsonSync(dbPath, { throws: false }) || {};
    const player = players[userId];

    if (!player) return interaction.reply({ content: 'You have no records yet.', ephemeral: true });

    const inventory = player.inventory?.join(', ') || 'Nothing';
    return interaction.reply({
      content: `**Nickname:** ${player.nickname || 'Unknown'}\n**Cell Block:** ${player.cellBlock || 'Unknown'}\n**Charge:** ${player.charge || 'Unknown'}\n**Time Serving:** ${player.timeServing || 'Unknown'}\n**Inventory:** ${inventory}`,
      ephemeral: true
    });
  }
};
