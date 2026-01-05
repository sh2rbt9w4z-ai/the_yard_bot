const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db.json');

// ---------- Helpers ----------
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---------- Data ----------
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
              { name: 'kitchen', value: 'kitchen' },
              { name: 'laundry', value: 'laundry' },
              { name: 'janitor', value: 'janitor' },
              { name: 'library', value: 'library' },
              { name: 'commissary', value: 'commissary' }
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
    const db = readDB();
    const userId = interaction.user.id;

    if (!db.users[userId]) {
      db.users[userId] = { cash: 0, items: {} };
    }

    const user = db.users[userId];
    const sub = interaction.options.getSubcommand();

    // INVENTORY
    if (sub === 'inventory') {
      const items = Object.keys(user.items).length
        ? Object.entries(user.items)
            .map(([i, q]) => `${i}: ${q}`)
            .join('\n')
        : 'None';

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
      writeDB(db);

      return interaction.reply(
        `You bought **${item}** for **$${price}**.\nRemaining balance: **$${user.cash}**`
      );
    }

    // JOB
    if (sub === 'job') {
      const job = interaction.options.getString('name');
      const pay = JOBS[job];

      user.cash += pay;
      writeDB(db);

      return interaction.reply(
        `You worked **${job}** and earned **$${pay}**.\nNew balance: **$${user.cash}**`
      );
    }
  }
};
