import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../config.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove the segregation role from a user')
    .addUserOption(opt => opt.setName('target').setDescription('User to unmute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(target.id);
    const role = interaction.guild.roles.cache.get(config.roles.segregation);

    await member.roles.remove(role);
    return interaction.reply({ content: `Unmuted ${target.tag}`, ephemeral: true });
  }
};
