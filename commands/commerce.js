import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

const dbPath = path.join('./data/players.json');
fs.ensureFileSync(dbPath);

const store = [
  { item: 'Honey Bun', cost: 1 },
  { item: 'Cheetos', cost: 2 },
  { item: 'Ramen', cost: 1 },
  { item: 'Candy', cost: 1 },
  { item: 'Soda', cost: 2 }
];

export default {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the store')
    .addStringOption(opt => opt.setName('item').setDescription('Item to buy').setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    let players = fs.readJsonSync(dbPath, { throws: false }) || {};
    players[userId] ??= { inventory: [], cash: 10 };
    const player = players[userId];

    const itemName = interaction.options.getString('item');
    const storeItem = store.find(i => i.item.toLowerCase() === itemName.toLowerCase());
    if (!storeItem) return interaction.reply({ content: 'Item not found.', ephemeral: true });

    if (player.cash < storeItem.cost) return interaction.reply({ content: 'Not enough cash.', ephemeral: true });

    player.cash -= storeItem.cost;
    player.inventory.push(storeItem.item);
    fs.writeJsonSync(dbPath, players);

    return interaction.reply({ content: `You bought **${storeItem.item}** for $${storeItem.cost}.`, ephemeral: true });
  }
};
