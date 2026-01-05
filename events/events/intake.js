const { EmbedBuilder } = require('discord.js');

const NAMES = ['Razor', 'Brick', 'Lockjaw', 'Crowbar', 'Static'];
const CHARGES = ['Armed Robbery', 'Drug Trafficking', 'Felony Assault'];

module.exports = (client) => {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'intake_confirm') return;

    try {
      const member = interaction.member;
      const blocks = ['c1', 'c2', 'c3'];
      const block = blocks[Math.floor(Math.random() * blocks.length)];
      const role = interaction.guild.roles.cache.find(r => r.name === block);
      if (role) await member.roles.add(role);

      const nickname = NAMES[Math.floor(Math.random() * NAMES.length)];
      await member.setNickname(nickname);

      const mugshots = interaction.guild.channels.cache.find(c => c.name === 'mugshots');
      if (mugshots) {
        const embed = new EmbedBuilder()
          .setTitle('📸 Mugshot')
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: 'Inmate', value: nickname },
            { name: 'Charge', value: CHARGES[Math.floor(Math.random() * CHARGES.length)] },
            { name: 'Cell', value: block.toUpperCase() }
          );
        await mugshots.send({ embeds: [embed] });
      }

      await interaction.message.delete();
      await interaction.reply({ content: 'Booking complete.', ephemeral: true });

    } catch (err) {
      console.error('INTAKE ERROR:', err);
    }
  });
};
