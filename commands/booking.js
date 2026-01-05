import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs-extra';
import path from 'path';
import config from '../config.json' assert { type: 'json' };

// Load player database
const dbPath = path.join('./data/players.json');
fs.ensureFileSync(dbPath);
let players = fs.readJsonSync(dbPath, { throws: false }) || {};

export default {
  data: new SlashCommandBuilder()
    .setName('booking')
    .setDescription('Booking: assign nickname, cell block, and mugshot'),

  async execute(interaction) {
    const userId = interaction.user.id;
    if (!players[userId]) {
      // Assign Inmate role
      const inmateRole = interaction.guild.roles.cache.get(config.roles.inmate);
      const member = await interaction.guild.members.fetch(userId);
      await member.roles.add(inmateRole);

      // Assign random cell block role
      const cellBlocks = [config.roles.c1, config.roles.c2, config.roles.c3];
      const assignedCell = cellBlocks[Math.floor(Math.random() * cellBlocks.length)];
      await member.roles.add(interaction.guild.roles.cache.get(assignedCell));

      // Assign random nickname
      const nicknames = ['Spike', 'Razor', 'Ace', 'Brick', 'Shadow', 'Slim', 'Viper', 'Tank', 'Jinx', 'Ghost'];
      const assignedNick = nicknames[Math.floor(Math.random() * nicknames.length)];
      await member.setNickname(assignedNick);

      // Save to database
      players[userId] = {
        nickname: assignedNick,
        cellBlock: assignedCell,
        charge: 'Unknown Charge',
        timeServing: '3 months',
        mugshotPosted: false
      };
      fs.writeJsonSync(dbPath, players);

      // Post mugshot to channel
      const mugChannel = interaction.guild.channels.cache.get(config.channels.mugshots);
      if (mugChannel) {
        await mugChannel.send({
          content: `**Mugshot:** ${assignedNick}\nCharge: ${players[userId].charge}\nTime Serving: ${players[userId].timeServing}`,
          files: [interaction.user.displayAvatarURL({ format: 'png' })]
        });
        players[userId].mugshotPosted = true;
        fs.writeJsonSync(dbPath, players);
      }

      return interaction.reply({ content: `Booking complete! You are now **${assignedNick}** in cell block.`, ephemeral: true });
    } else {
      return interaction.reply({ content: 'You have already been booked.', ephemeral: true });
    }
  }
};
