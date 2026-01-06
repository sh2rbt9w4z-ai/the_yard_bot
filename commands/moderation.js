import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

export const moderationCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a user from the server')
      .addUserOption(option =>
        option.setName('target')
          .setDescription('User to ban')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason for ban')
          .setRequired(false)),
    async execute(interaction) {
      try {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
          return interaction.reply({ content: 'You do not have permission to ban members.', ephemeral: true });

        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(user.id);
        await member.ban({ reason });

        await interaction.reply({ content: `${user.tag} has been banned. Reason: ${reason}`, ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to ban user.', ephemeral: true });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a user from the server')
      .addUserOption(option =>
        option.setName('target')
          .setDescription('User to kick')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason for kick')
          .setRequired(false)),
    async execute(interaction) {
      try {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
          return interaction.reply({ content: 'You do not have permission to kick members.', ephemeral: true });

        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const member = await interaction.guild.members.fetch(user.id);
        await member.kick(reason);

        await interaction.reply({ content: `${user.tag} has been kicked. Reason: ${reason}`, ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to kick user.', ephemeral: true });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Mute a user by adding the segregation role')
      .addUserOption(option =>
        option.setName('target')
          .setDescription('User to mute')
          .setRequired(true)),
    async execute(interaction) {
      try {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
          return interaction.reply({ content: 'You do not have permission to mute members.', ephemeral: true });

        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id);
        const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'segregation');
        if (!role) return interaction.reply({ content: 'Segregation role not found.', ephemeral: true });

        await member.roles.add(role);
        await interaction.reply({ content: `${target.tag} has been muted.`, ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to mute user.', ephemeral: true });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('unmute')
      .setDescription('Unmute a user by removing the segregation role')
      .addUserOption(option =>
        option.setName('target')
          .setDescription('User to unmute')
          .setRequired(true)),
    async execute(interaction) {
      try {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
          return interaction.reply({ content: 'You do not have permission to unmute members.', ephemeral: true });

        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id);
        const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'segregation');
        if (!role) return interaction.reply({ content: 'Segregation role not found.', ephemeral: true });

        await member.roles.remove(role);
        await interaction.reply({ content: `${target.tag} has been unmuted.`, ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to unmute user.', ephemeral: true });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Delete a number of messages from a channel')
      .addIntegerOption(option =>
        option.setName('amount')
          .setDescription('Number of messages to delete')
          .setRequired(true)),
    async execute(interaction) {
      try {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
          return interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });

        const amount = interaction.options.getInteger('amount');
        const fetched = await interaction.channel.messages.fetch({ limit: amount + 1 });
        await interaction.channel.bulkDelete(fetched, true);

        await interaction.reply({ content: `Deleted ${amount} messages.`, ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to purge messages.', ephemeral: true });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('echo')
      .setDescription('Bot will repeat your message')
      .addStringOption(option =>
        option.setName('message')
          .setDescription('Message to repeat')
          .setRequired(true)),
    async execute(interaction) {
      try {
        const msg = interaction.options.getString('message');
        await interaction.reply({ content: msg, ephemeral: false });
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to echo message.', ephemeral: true });
      }
    }
  },

  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn a user')
      .addUserOption(option =>
        option.setName('target')
          .setDescription('User to warn')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason for the warning')
          .setRequired(true)),
    async execute(interaction) {
      try {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
          return interaction.reply({ content: 'You do not have permission to warn members.', ephemeral: true });

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        // Delete the command message immediately
        if (interaction.channel && interaction.deferred === false) {
          await interaction.deleteReply().catch(() => {});
        }

        // Send ephemeral message to moderator confirming
        await interaction.reply({
          content: `You warned ${target.tag}. Reason: ${reason}`,
          ephemeral: true
        });

        // Optionally, log the warning to a moderation log channel
        const logChannel = interaction.guild.channels.cache.get(process.env.MOD_LOG_CHANNEL);
        if (logChannel) {
          await logChannel.send(`${target.tag} has been warned by ${interaction.user.tag}. Reason: ${reason}`);
        }
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: 'Failed to warn user.', ephemeral: true });
      }
    }
  }
];
