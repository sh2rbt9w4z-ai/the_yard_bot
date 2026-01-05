// index.js
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.log("ERROR: TOKEN or GUILD_ID not set!");
  process.exit();
}

const MUGSHOTS_CHANNEL = 'mugshots';
const DB_FILE = '/tmp/inmates.json';

// ----------------- LOAD DB -----------------
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}');
let inmates = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

// ----------------- CONFIG -----------------
const NICKNAMES = [
  "Shadow","Ghost","Raven","Viper","Falcon","Hawk","Wolf","Panther",
  "Cobra","Jaguar","Lion","Tiger","Bear","Fox","Coyote","Eagle",
  "Grizzly","Nightmare","Phantom","Blaze","Scorpion","Venom","Rogue",
  "Bullet","Fang","Crusher","Steel","Stone","Ice","Thunder","Storm",
  "Saber","Blizzard","Bolt","Spike","Claw","Frost","Ghostface",
  "Onyx","Sable","Reaper","Shade"
];

const CHARGES = [
  "Contraband","Assault","Disrespecting CO","Theft","Vandalism",
  "Disorderly Conduct","Possession of Drugs","Escape Attempt","Harassment",
  "Weapons Possession","Insubordination","Forgery","Arson"
];

const CELLS = ["c1","c2","c3"]; // lowercase

// ----------------- CLIENT -----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ----------------- MODERATION COMMANDS WITH DEBUG -----------------
client.on('messageCreate', async message => {
  if (!message.content.startsWith('/')) return;
  const args = message.content.slice(1).split(/ +/);
  const cmd = args.shift().toLowerCase();
  const member = message.mentions.members.first();

  console.log(`Command received: /${cmd} by ${message.author.tag}`);

  try {
    // ---------- MUTE/UNMUTE ----------
    if (cmd === 'mute' && message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const role = message.guild.roles.cache.find(r => r.name === 'Segregation');
      if (role && member) {
        console.log(`Adding Segregation role to ${member.user.tag}`);
        await member.roles.add(role);
      }
    }
    if (cmd === 'unmute' && message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const role = message.guild.roles.cache.find(r => r.name === 'Segregation');
      if (role && member) {
        console.log(`Removing Segregation role from ${member.user.tag}`);
        await member.roles.remove(role);
      }
    }

    // ---------- ECHO ----------
    if (cmd === 'echo') {
      if (!args.length) return;
      console.log(`Echoing message: ${args.join(' ')}`);
      try {
        await message.channel.send(args.join(' '));
        await message.delete();
        console.log('Echo successful');
      } catch (err) {
        console.log('Echo error:', err);
        await message.channel.send('Failed to echo your message.');
      }
    }

    // ---------- BAN ----------
    if (cmd === 'ban' && message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      if (!member) {
        console.log('Ban failed: no member mentioned');
        return message.reply('Please mention a member to ban.');
      }
      console.log(`Attempting to ban: ${member.user.tag}`);
      try {
        await member.ban({ reason: args.join(' ') || 'No reason provided' });
        console.log(`Ban successful: ${member.user.tag}`);
        await message.channel.send(`${member.user.tag} has been banned.`);
      } catch (err) {
        console.log('Ban error:', err);
        await message.channel.send(`Failed to ban ${member.user.tag}.`);
      }
    }

    // ---------- KICK ----------
    if (cmd === 'kick' && message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      if (!member) {
        console.log('Kick failed: no member mentioned');
        return message.reply('Please mention a member to kick.');
      }
      console.log(`Attempting to kick: ${member.user.tag}`);
      try {
        await member.kick(args.join(' ') || 'No reason provided');
        console.log(`Kick successful: ${member.user.tag}`);
        await message.channel.send(`${member.user.tag} has been kicked.`);
      } catch (err) {
        console.log('Kick error:', err);
        await message.channel.send(`Failed to kick ${member.user.tag}.`);
      }
    }

    // ---------- PURGE ----------
    if (cmd === 'purge' && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      const amount = parseInt(args[0]) || 0;
      if (amount > 0) {
        console.log(`Purging ${amount} messages in ${message.channel.name}`);
        try {
          await message.channel.bulkDelete(amount + 1, true);
          const confirmMsg = await message.channel.send(`Deleted ${amount} messages.`);
          setTimeout(() => confirmMsg.delete().catch(() => {}), 3000);
        } catch (err) { console.log('Purge error:', err); }
      }
    }

    // ---------- WARN (professional) ----------
    if (cmd === 'warn' && message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      if (!member) return message.reply('Please mention a member to warn.').then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

      const reason = args.join(' ') || 'No reason provided';
      await message.delete().catch(() => {}); // delete your prompt immediately

      console.log(`Warning ${member.user.tag} for reason: ${reason}`);

      try {
        await member.send(`⚠️ You have received a warning in **${message.guild.name}**.\n**Reason:** ${reason}`);
      } catch (err) { console.log('Could not DM member for warn:', err); }

      const modLogChannel = message.guild.channels.cache.find(c => c.name === 'mod-log');
      if (modLogChannel) {
        modLogChannel.send(`✅ **${member.user.tag}** was warned by **${message.author.tag}**.\n**Reason:** ${reason}`);
      }
    }

  } catch (err) {
    console.log('Command processing error:', err);
  }
});

// ----------------- BOOKING (Server Thread per Player) -----------------
client.on('guildMemberAdd', async member => {
  try {
    const guild = member.guild;
    const intakeChannel = guild.channels.cache.find(c => c.name === 'intake');
    if (!intakeChannel) return;

    const inmateRole = guild.roles.cache.find(r => r.name === 'Inmate');
    if (inmateRole) await member.roles.add(inmateRole);

    const bookingMessage = await intakeChannel.send(
      `${member}, react with ✅ to be booked!`
    );

    const thread = await bookingMessage.startThread({
      name: `Booking - ${member.user.username}`,
      autoArchiveDuration: 60,
      type: 11,
      invitable: false
    });

    await thread.members.add(member.id);
    await bookingMessage.react('✅');

    const filter = (reaction, user) =>
      reaction.emoji.name === '✅' && user.id === member.id;

    const collector = bookingMessage.createReactionCollector({
      filter,
      max: 1,
      time: 15 * 60 * 1000
    });

    collector.on('collect', async () => {
      const guildMember = await guild.members.fetch(member.id);

      // --- NICKNAME ---
      const usedNicknames = Object.values(inmates).map(i => i.nickname);
      const availableNicknames = NICKNAMES.filter(n => !usedNicknames.includes(n));
      let nickname = availableNicknames.length
        ? availableNicknames[Math.floor(Math.random() * availableNicknames.length)]
        : NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)] + Date.now();

      await guildMember.setNickname(nickname).catch(() => {});

      // --- CELL ROLE ---
      const cellRoleName = CELLS[Math.floor(Math.random() * CELLS.length)];
      const cellRole = guild.roles.cache.find(r => r.name === cellRoleName);
      if (cellRole && !guildMember.roles.cache.has(cellRole.id)) await guildMember.roles.add(cellRole);

      // --- CHARGE & MUGSHOT ---
      const charge = CHARGES[Math.floor(Math.random() * CHARGES.length)];
      const timeServingDays = Math.floor(Math.random() * 90) + 1;
      const timeServingMs = timeServingDays * 24 * 60 * 60 * 1000;

      const mugshotsChannel = guild.channels.cache.find(c => c.name === MUGSHOTS_CHANNEL);
      if (mugshotsChannel) {
        await mugshotsChannel.send({
          content: `Charge: ${charge}\nTime Serving: ${timeServingDays} days`,
          files: [guildMember.displayAvatarURL({ extension: 'png', size: 256 })]
        });
      }

      // --- SAVE TO DB ---
      inmates[member.id] = { nickname, cell: cellRoleName, charge, timeServingMs, startTime: Date.now() };
      fs.writeFileSync(DB_FILE, JSON.stringify(inmates, null, 2));

      try {
        await guildMember.send(`You have been booked!\nNickname: ${nickname}\nCharge: ${charge}\nTime Serving: ${timeServingDays} days`);
      } catch {}

      thread.delete().catch(() => {});
      bookingMessage.delete().catch(() => {});
    });

  } catch (err) {
    console.log('Server booking error:', err);
  }
});

// ----------------- SENTENCE CHECKER -----------------
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of Object.entries(inmates)) {
    if (now - data.startTime >= data.timeServingMs) {
      const guild = client.guilds.cache.get(GUILD_ID);
      const member = guild?.members.cache.get(id);
      if (member) {
        const inmateRole = guild.roles.cache.find(r => r.name === 'Inmate');
        const rolesToRemove = member.roles.cache.filter(r => ['c1','c2','c3'].includes(r.name.toLowerCase()));
        member.roles.remove(rolesToRemove);
        if (inmateRole && !member.roles.cache.has(inmateRole.id)) member.roles.add(inmateRole);
        try { member.send('Your sentence is served! Return to #intake to be re-assigned.'); } catch {}
      }
      delete inmates[id];
      fs.writeFileSync(DB_FILE, JSON.stringify(inmates, null, 2));
    }
  }
}, 60*1000);

// ----------------- MYINFO -----------------
client.on('messageCreate', async message => {
  if (message.content.toLowerCase() !== '/myinfo') return;
  const data = inmates[message.author.id];
  if (!data) return message.channel.send('You are not currently booked. Go to #intake.');

  const remainingMs = Math.max(0, data.timeServingMs - (Date.now() - data.startTime));
  const days = Math.floor(remainingMs / (1000*60*60*24));
  const hours = Math.floor((remainingMs % (1000*60*60*24)) / (1000*60*60));
  const minutes = Math.floor((remainingMs % (1000*60*60)) / (1000*60));

  message.channel.send(`📋 **Your Info**\nNickname: ${data.nickname}\nCell: ${data.cell.toUpperCase()}\nCharge: ${data.charge}\nTime Remaining: ${days}d ${hours}h ${minutes}m`);
});

// ----------------- LOGIN -----------------
client.once('ready', () => { console.log(`Logged in as ${client.user.tag}`); });
client.login(TOKEN);
