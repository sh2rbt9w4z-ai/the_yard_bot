import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Trade with another inmate')
    .addUserOption(opt => opt.setName('target').setDescription('Who to trade with').setRequired(true))
    .addStringOption(opt => opt.setName('item').setDescription('Item to trade').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to trade').setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const targetId = interaction.options.getUser('target').id;
    const item = interaction.options.getString('item').toLowerCase();
    const amount = interaction.options.getInteger('amount');

    const dataPath = path.join('./data', 'trades.json');
    await fs.ensureFile(dataPath);
    let trades = await fs.readJson(dataPath).catch(() => ({}));

    if (!trades[userId]) trades[userId] = {};
    if (!trades[targetId]) trades[targetId] = {};

    if (!trades[userId][item]) trades[userId][item] = 0;
    trades[userId][item] -= amount;

    if (!trades[targetId][item]) trades[targetId][item] = 0;
    trades[targetId][item] += amount;

    await fs.writeJson(dataPath, trades);

    await interaction.reply({ content: `Traded ${amount} x ${item} with ${interaction.options.getUser('target').tag}`, ephemeral: true });
  }
};
