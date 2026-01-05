import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';

const dbPath = path.join('./data/players.json');
fs.ensureFileSync(dbPath);

const SKILLS = ['agility', 'strength', 'smarts', 'personality'];
const MAX_LEVEL = 6;
const COOLDOWN = 30 * 60 * 1000; // 30 minutes

export default {
  data: new SlashCommandBuilder()
    .setName('train')
    .setDescription('Train a skill to gain XP')
    .addStringOption(opt =>
      opt.setName('skill')
        .setDescription('Skill to train')
        .setRequired(true)
        .addChoices(
          { name: 'Agility', value: 'agility' },
          { name: 'Strength', value: 'strength' },
          { name: 'Smarts', value: 'smarts' },
          { name: 'Personality', value: 'personality' }
        )),

  async execute(interaction) {
    const userId = interaction.user.id;
    let players = fs.readJsonSync(dbPath, { throws: false }) || {};
    players[userId] ??= { skills: {}, lastTrain: {} };

    const skill = interaction.options.getString('skill');

    // Check cooldown
    const now = Date.now();
    const last = players[userId].lastTrain[skill] || 0;
    if (now - last < COOLDOWN) {
      const remaining = Math.ceil((COOLDOWN - (now - last)) / 60000);
      return interaction.reply({ content: `You must wait ${remaining} more minutes to train ${skill}.`, ephemeral: true });
    }

    // Initialize skill
    players[userId].skills[skill] ??= { xp: 0, level: 1 };

    // XP gain
    const xpGain = 1; // slow growth
    let skillData = players[userId].skills[skill];
    skillData.xp += xpGain;

    // Level up logic
    const xpNeeded = skillData.level * 2; // XP required increases per level
    if (skillData.xp >= xpNeeded && skillData.level < MAX_LEVEL) {
      skillData.level += 1;
      skillData.xp = 0;
      players[userId].lastTrain[skill] = now;
      fs.writeJsonSync(dbPath, players);
      return interaction.reply({ content: `You trained **${skill}**! You leveled up to **${skillData.level}**!`, ephemeral: true });
    }

    players[userId].lastTrain[skill] = now;
    fs.writeJsonSync(dbPath, players);
    return interaction.reply({ content: `You trained **${skill}** and gained ${xpGain} XP! Level: ${skillData.level}`, ephemeral: true });
  }
};
