import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../config.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Give the segregation role to a user')
    .addUserOption(opt => opt.setName('target').setDescription('User to mute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(target.id);
    const role = interaction.guild.roles.cache.get(config.roles.segregation);

    await member.roles.add(role);
    return interaction.reply({ content: `Muted ${target.tag}`, ephemeral: true });
  }
};
