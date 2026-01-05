import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

const debtPath = path.join('./data/debts.json');
const playersPath = path.join('./data/players.json');
fs.ensureFileSync(debtPath);
fs.ensureFileSync(playersPath);

export default {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Trade items or cash with another player')
    .addUserOption(opt => opt.setName('target').setDescription('Player to trade with').setRequired(true))
    .addStringOption(opt => opt.setName('item').setDescription('Item name or cash').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to trade').setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const targetId = interaction.options.getUser('target').id;
    const itemName = interaction.options.getString('item');
    const amount = interaction.options.getInteger('amount');

    if (userId === targetId) return interaction.reply({ content: 'You cannot trade with yourself.', ephemeral: true });

    let players = fs.readJsonSync(playersPath, { throws: false }) || {};
    players[userId] ??= { inventory: [], cash: 10 };
    players[targetId] ??= { inventory: [], cash: 10 };

    let debts = fs.readJsonSync(debtPath, { throws: false }) || [];

    if (itemName.toLowerCase() === 'cash') {
      if (players[userId].cash < amount) return interaction.reply({ content: 'Not enough cash.', ephemeral: true });
      players[userId].cash -= amount;
      players[targetId].cash += amount;
    } else {
      const playerInv = players[userId].inventory;
      const count = playerInv.filter(i => i.toLowerCase() === itemName.toLowerCase()).length;
      if (count < amount) return interaction.reply({ content: 'Not enough items.', ephemeral: true });

      for (let i = 0; i < amount; i++) {
        const idx = playerInv.findIndex(i => i.toLowerCase() === itemName.toLowerCase());
        playerInv.splice(idx, 1);
        players[targetId].inventory.push(itemName);
      }
    }

    fs.writeJsonSync(playersPath, players);

    return interaction.reply({ content: `Trade completed: ${amount} ${itemName} sent to ${interaction.options.getUser('target').tag}.`, ephemeral: true });
  }
};
