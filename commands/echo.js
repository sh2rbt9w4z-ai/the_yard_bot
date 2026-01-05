export default {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echo a message')
    .addStringOption(opt => opt.setName('message').setDescription('Message to echo').setRequired(true)),

  async execute(interaction) {
    const message = interaction.options.getString('message');

    // Respond immediately
    await interaction.reply({ content: message });
  }
};
