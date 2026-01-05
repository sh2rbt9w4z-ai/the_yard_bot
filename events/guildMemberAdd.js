module.exports = (client) => {
  client.on('guildMemberAdd', async member => {
    try {
      const inmate = member.guild.roles.cache.find(r => r.name === 'Inmate');
      if (inmate) await member.roles.add(inmate);
    } catch (err) {
      console.error('JOIN ERROR:', err);
    }
  });
};
