import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

const MAX_LEVEL = 6;
const XP_PER_LEVEL = [0, 100, 250, 500, 800, 1200, 1600]; // XP thresholds for levels 1-6

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Check your stats, XP, and level'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const dataPath = path.join('./data', 'stats.json');

    await fs.ensureFile(dataPath);
    let stats = await fs.readJson(dataPath).catch(() => ({}));

    if (!stats[userId]) {
      stats[userId] = {
        agility: 0,
        strength: 0,
        smarts: 0,
        personality: 0,
        xp: 0,
        level: 1,
        lastActivity: {} // track cooldowns
      };
    }

    const s = stats[userId];

    // Determine level based on XP
    let newLevel = s.level;
    for (let lvl = MAX_LEVEL; lvl > 0; lvl--) {
      if (s.xp >= XP_PER_LEVEL[lvl]) {
        newLevel = lvl;
        break;
      }
    }
    s.level = newLevel;

    await fs.writeJson(dataPath, stats);

    await interaction.reply({
      content: `**Stats for ${interaction.user.tag}**\n` +
               `Level: ${s.level}\nXP: ${s.xp}/${XP_PER_LEVEL[s.level] || 'MAX'}\n` +
               `Agility: ${s.agility}\nStrength: ${s.strength}\nSmarts: ${s.smarts}\nPersonality: ${s.personality}`,
      ephemeral: true
    });
  }
};
