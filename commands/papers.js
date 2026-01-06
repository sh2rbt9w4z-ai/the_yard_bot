import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('papers')
    .setDescription('View your in-game inmate profile'),

  async execute(interaction) {
    const member = interaction.member;

    // Example info — expand later with XP, cell block, etc.
    const info = `**Name:** ${member.displayName}
**Roles:** ${member.roles.cache.map(r => r.name).join(', ')}
**Joined:** ${member.joinedAt.toDateString()}`;

    await interaction.reply({ content: info, ephemeral: true });
  }
};
