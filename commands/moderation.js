const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = (client) => {
  const commands = [

    new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason'))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason'))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Mute a member (Segregation)')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('unmute')
      .setDescription('Unmute a member')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('echo')
      .setDescription('Repeat a message privately')
      .addStringOption(o => o.setName('text').setDescription('Message').setRequired(true)),

    new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn a member discreetly')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Delete messages')
      .addIntegerOption(o =>
        o.setName('amount')
         .setDescription('Number of messages (1–100)')
         .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
      .setName('papers')
      .setDescription('View your inmate papers')
  ];

  client.application.commands.set(commands);

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      const { commandName } = interaction;

      if (commandName === 'kick') {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        await member.kick(reason);
        await interaction.reply({ content: `Kicked ${member.user.tag}`, ephemeral: true });
      }

      if (commandName === 'ban') {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        await member.ban({ reason });
        await interaction.reply({ content: `Banned ${member.user.tag}`, ephemeral: true });
      }

      if (commandName === 'mute') {
        const member = interaction.options.getMember('user');
        const role = interaction.guild.roles.cache.find(r => r.name === 'segregation');
        if (!role) throw new Error('Segregation role not found');

        await member.roles.add(role);
        await interaction.reply({ content: `${member.user.tag} muted`, ephemeral: true });
      }

      if (commandName === 'unmute') {
        const member = interaction.options.getMember('user');
        const role = interaction.guild.roles.cache.find(r => r.name === 'segregation');
        if (!role) throw new Error('Segregation role not found');

        await member.roles.remove(role);
        await interaction.reply({ content: `${member.user.tag} unmuted`, ephemeral: true });
      }

      if (commandName === 'echo') {
        const text = interaction.options.getString('text');
        await interaction.reply({ content: text });
      }

      if (commandName === 'warn') {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');

        await member.send(`⚠️ You have been warned:\n**Reason:** ${reason}`);
        await interaction.reply({ content: `Warning issued to ${member.user.tag}`, ephemeral: true });
      }

      if (commandName === 'purge') {
        const amount = interaction.options.getInteger('amount');

        if (amount < 1 || amount > 100)
          return interaction.reply({ content: 'Amount must be 1–100', ephemeral: true });

        const messages = await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `Deleted ${messages.size} messages`, ephemeral: true });
      }

      if (commandName === 'papers') {
        await interaction.reply({
          content: `📄 **Inmate Papers**\nName: ${interaction.user.tag}\nStatus: Active`,
          ephemeral: true
        });
      }

    } catch (err) {
      console.error('COMMAND ERROR:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'Command failed.', ephemeral: true });
      }
    }
  });
};
