const { SlashCommandBuilder } = require('discord.js');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const db = new Low(
  new JSONFile(path.join(__dirname, '../db.json'))
);

// COMMISSARY STORE
const STORE = {
  "ramen": 3,
  "honey bun": 5,
  "cheetos": 4,
  "doritos": 4,
  "candy bar": 3,
  "cookies": 4,
  "beef jerky": 8,
  "summer sausage": 10,
  "pickle pack": 2,
  "soda": 3,
  "juice pouch": 3,
  "coffee pack": 5,
  "hot cocoa": 4,
  "soap": 3,
  "toothbrush": 2,
  "toothpaste": 3,
  "deodorant": 6,
  "lotion": 4,
  "playing cards": 6,
  "dice": 5,
  "notebook": 5,
  "pencil": 2,
  "book": 10,
  "radio": 25,
  "headphones": 30
};

// JOBS
const JOBS = {
  kitchen: 6,
  laundry: 7,
  janitor: 9,
  library: 10,
  commissary: 12
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Prison work and commissary')
    .addSubcommand(sub =>
      sub
        .setName('job')
        .setDescription('Work a prison job')
        .addStringOption(opt =>
          opt
            .setName('name')
            .setDescription('Job to work')
            .setRequired(true)
            .addChoices(
              ...Object.keys(JOBS).map(j => ({ name: j, value: j }))
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('buy')
        .setDescription('Buy an item from commissary')
        .addStringOption(opt =>
          opt
            .setName('item')
            .setDescription('Item to buy')
            .setRequired(true)
            .addChoices(
              ...Object.keys(STORE).map(i => ({ name: i, value: i }))
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('inventory')
        .setDescription('View your cash and items')
    ),

  async execute(interaction) {
    await db.read();
    if (!db.data) db.data = { users: {} };

    const userId = interaction.user.id;
    if (!db.data.users[userId]) {
      db.data.users[userId] = { cash: 0, items: {} };
    }

    const user = db.data.users[userId];

    const sub = interaction.options.getSubcommand();

    // INVENTORY
    if (sub === 'inventory') {
      const items =
        Object.entries(user.items)
          .map(([item, qty]) => `${item}: ${qty}`)
          .join('\n') || 'None';

      return interaction.reply(
        `💰 Cash: **$${user.cash}**\n📦 Items:\n${items}`
      );
    }

    // BUY
    if (sub === 'buy') {
      const item = interaction.options.getString('item');
      const price = STORE[item];

      if (user.cash < price) {
        return interaction.reply({
          content: `You need $${price}. You have $${user.cash}.`,
          ephemeral: true
        });
      }

      user.cash -= price;
      user.items[item] = (user.items[item] || 0) + 1;
      await db.write();

      return interaction.reply(
        `You bought **${item}** for **$${price}**. Remaining balance: **$${user.cash}**`
      );
    }

    // WORK JOB
    if (sub === 'job') {
      const job = interaction.options.getString('name');
      const pay = JOBS[job];

      user.cash += pay;
      await db.write();

      return interaction.reply(
        `You worked **${job}** and earned **$${pay}**.\nNew balance: **$${user.cash}**`
      );
    }
  }
};
    );
  }
};
