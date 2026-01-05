// index.js
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.log("ERROR: TOKEN or GUILD_ID not set in environment variables!");
  process.exit();
}

const MUGSHOTS_CHANNEL = 'mugshots';
const DB_FILE = '/tmp/inmates.json';

// ----------------- LOAD DB -----------------
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}');
let inmates = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

// ----------------- CONFIG -----------------
const NICKNAMES = [
  "Shadow", "Ghost", "Raven", "Viper", "Falcon", "Hawk", "Wolf", "Panther",
  "Cobra", "Jaguar", "Lion", "Tiger", "Bear", "Fox", "Coyote", "Eagle",
  "Grizzly", "Nightmare", "Phantom", "Blaze", "Scorpion", "Venom", "Rogue",
  "Bullet", "Fang", "Crusher", "Steel", "Stone", "Ice", "Thunder", "Storm",
  "Saber", "Blizzard", "Bolt", "Spike", "Claw", "Frost", "Ghostface",
  "Onyx", "Sable", "Reaper", "Shade"
];

const CHARGES = [
  "Contraband", "Assault", "Disrespecting CO", "Theft", "Vandalism", 
  "Disorderly Conduct", "Possession of Drugs", "Escape Attempt", "Harassment",
  "Weapons Possession", "Insubordination", "Forgery", "Arson"
];

const CELLS = ["c1", "c2", "c3"]; // lowercase

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

// ----------------- MODERATION COMMANDS -----------------
client.on('messageCreate', async message => {
  if (!message.content.startsWith('/')) return;
  const args = message.content.slice(1).split(/ +/);
  const cmd = args.shift().toLowerCase();
  const member = message.mentions.members.first();

  try {
    if (cmd === 'mute' && message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const role = message.guild.roles.cache.find(r => r.name === 'Segregation');
      if (role && member) await member.roles.add(role);
    }
    if (cmd === 'unmute' && message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const role = message.guild.roles.cache.find(r => r.name === 'Segregation');
      if (role && member) await member.roles.remove(role);
    }
    if (cmd === 'echo') {
      await message.delete().catch(() => {});
      await message.channel.send(args.join(' '));
    }
    if (cmd === 'ban' && message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      if (member) await member.ban({ reason: args.join(' ') || 'No reason provided' });
    }
    if (cmd === 'kick' && message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      if (member) await member.kick(args.join(' ') || 'No reason provided');
    }
    if (cmd === 'purge' && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      const amount = parseInt(args[0]) || 0;
      if (amount > 0) {
        await message.channel.bulkDelete(amount + 1, true);
        const confirmMsg = await message.channel.send(`Deleted ${amount} messages.`);
        setTimeout(() => confirmMsg.delete().catch(() => {}), 3000);
      }
    }
    if (cmd === 'warn' && message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      if (member) message.channel.send(`${member}, warning: ${args.join(' ') || 'Please follow the rules.'}`);
    }
  } catch (e) {
    console.log("Command error:", e);
  }
});

// ----------------- BOOKING (DM) -----------------
client.on('guildMemberAdd', async member => {
  try {
    // Give Inmate role immediately
    const inmateRole = member.guild.roles.cache.find(r => r.name === 'Inmate');
    if (inmateRole) await member.roles.add(inmateRole);

    // Send booking DM
    const dm = await member.send(`Welcome to the server! React with ✅ to be booked.`);
    await dm.react('✅');

    const filter = (reaction, user) => reaction.emoji.name === '✅' && user.id === member.id;
    const collector = dm.createReactionCollector({ filter, max: 1, time: 15*60*1000 });

    collector.on('collect', async () => {
      // ----------------- UNIQUE NICKNAME -----------------
      const usedNicknames = Object.values(inmates).map(i => i.nickname);
      const availableNicknames = NICKNAMES.filter(n => !usedNicknames.includes(n));
      let nickname;
      if (availableNicknames.length > 0) {
        nickname = availableNicknames[Math.floor(Math.random() * availableNicknames.length)];
      } else {
        const base = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
        let suffix = 1;
        while (usedNicknames.includes(`${base}${suffix}`)) suffix++;
        nickname = `${base}${suffix}`;
      }

      try { await member.setNickname(nickname); } catch {}

      // ----------------- ASSIGN CELL ROLE -----------------
      const cellRoleName = CELLS[Math.floor(Math.random() * CELLS.length)];
      const cellRole = member.guild.roles.cache.find(r => r.name === cellRoleName);
      if (cellRole && !member.roles.cache.has(cellRole.id)) await member.roles.add(cellRole);

      // ----------------- ASSIGN CHARGE AND TIME -----------------
      const charge = CHARGES[Math.floor(Math.random() * CHARGES.length)];
      const timeServingDays = Math.floor(Math.random() * 90) + 1;
      const timeServingMs = timeServingDays * 24 * 60 * 60 * 1000;

      // ----------------- MUGSHOT -----------------
      const mugshotsChannel = member.guild.channels.cache.find(c => c.name === MUGSHOTS_CHANNEL);
      if (mugshotsChannel) {
        await mugshotsChannel.send({
          content: `Charge: ${charge}\nTime Serving: ${timeServingDays} days`,
          files: [member.displayAvatarURL({ extension: 'png', size: 256 })]
        });
      }

      // ----------------- SAVE TO DB -----------------
      inmates[member.id] = { nickname, cell: cellRoleName, charge, timeServingMs, startTime: Date.now() };
      fs.writeFileSync(DB_FILE, JSON.stringify(inmates, null, 2));

      // DM confirmation
      try {
        await member.send(`You have been booked!\nNickname: ${nickname}\nCharge: ${charge}\nTime Serving: ${timeServingDays} days`);
      } catch {}

      // Delete DM booking message
      dm.delete().catch(() => {});
    });

  } catch (e) { console.log("guildMemberAdd booking error:", e); }
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
        const rolesToRemove = member.roles.cache.filter(r => ['c1','c2','c3','Segregation'].includes(r.name.toLowerCase()));
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
