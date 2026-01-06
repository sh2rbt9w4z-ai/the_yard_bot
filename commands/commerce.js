import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('commerce')
    .setDescription('Buy items from the store')
    .addStringOption(opt => opt.setName('item').setDescription('Item to buy').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Quantity').setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const item = interaction.options.getString('item').toLowerCase();
    const amount = interaction.options.getInteger('amount');
    const storeItems = ['honey bun', 'cheetos', 'ramen', 'candy', 'soda', 'chips', 'gum', 'cookies'];

    if (!storeItems.includes(item)) {
      return interaction.reply({ content: 'Item not available.', ephemeral: true });
    }

    const dataPath = path.join('./data', 'commerce.json');
    await fs.ensureFile(dataPath);
    let inventory = await fs.readJson(dataPath).catch(() => ({}));

    if (!inventory[userId]) inventory[userId] = {};

    if (!inventory[userId][item]) inventory[userId][item] = 0;
    inventory[userId][item] += amount;

    await fs.writeJson(dataPath, inventory);

    await interaction.reply({ content: `You bought ${amount} x ${item}!`, ephemeral: true });
  }
};
