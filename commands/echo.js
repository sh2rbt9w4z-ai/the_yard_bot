import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echo a message back')
    .addStringOption(opt => 
      opt.setName('message')
        .setDescription('Message to echo')
        .setRequired(true)
    ),

  async execute(interaction) {
    const msg = interaction.options.getString('message');
    await interaction.reply({ content: msg });
  }
};
