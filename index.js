// index.js
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const Canvas = require('@napi-rs/canvas');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.log("ERROR: TOKEN or GUILD_ID not set in environment variables!");
  process.exit();
}

const INTAKE_CHANNEL = 'intake';
const MUGSHOTS_CHANNEL = 'mugshots';
const DB_FILE = '/tmp/inmates.json';

// ----------------- LOAD DB -----------------
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}');
let inmates = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

// ----------------- CONFIG -----------------
const SERVER_NAMES = [
  "The Yard", "Blockhouse", "Ironcell", "Stonewall", "Redbrick", "Copperwing",
  "North Wing", "South Wing", "East Block", "West Block", "Cedar Hall", "Pineblock",
  "Granite Cell", "Iron Gate", "Steel Hall", "Shadow Block", "Ash Wing", "Hawthorne",
  "Maple Block", "Oak Cell", "Birch Wing", "Elm Hall", "Falcon Yard", "Eagle Block",
  "Raven Cell", "Coyote Wing", "Wolf Block", "Bear Hall", "Lion Yard", "Tiger Cell",
  "Panther Block", "Hawk Wing", "Viper Cell", "Copper Cell", "Iron Yard", "Stone Hall",
  "Lead Block", "Brick Wing", "Rust Yard", "Steel Cell", "Cliff Hall", "Summit Block",
  "Canyon Wing", "Valley Cell", "Prairie Hall", "Harbor Yard", "Dock Block", "Forge Wing",
  "Tower Cell", "Gatehouse"
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

  if (cmd === 'mute' && message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    const role = message.guild.roles.cache.find(r => r.name === 'Segregation');
    if (role && member) await member.roles.add(role);
  }
  if (cmd === 'unmute' && message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    const role = message.guild.roles.cache.find(r => r.name === 'Segregation');
    if (role && member) await member.roles.remove(role);
  }
  if (cmd === 'echo') {
    message.delete();
    message.channel.send(args.join(' '));
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
      message.channel.send(`Deleted ${amount} messages.`).then(msg => setTimeout(() => msg.delete(), 5000));
    }
  }
  if (cmd === 'warn' && message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
    if (member) message.channel.send(`${member}, warning: ${args.join(' ') || 'Please follow the rules.'}`);
  }
});

// ----------------- BOOKING -----------------
async function createMugshot(member, charge, timeServingDays) {
  const canvas = Canvas.createCanvas(256, 256);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#323232';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Avatar
  try {
    const avatar = await Canvas.loadImage(member.displayAvatarURL({ extension: 'png' }));
    ctx.drawImage(avatar, 0, 0, 256, 256);
  } catch {}

  // Text
  ctx.fillStyle = 'red';
  ctx.font = '24px sans-serif';
  const weeks = Math.floor(timeServingDays / 7);
  const remainingDays = timeServingDays % 7;
  ctx.fillText(`Charge: ${charge}`, 10, 30);
  ctx.fillText(`Time: ${weeks}w ${remainingDays}d`, 10, 60);

  const filePath = `/tmp/mugshot_${member.id}.png`;
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  return filePath;
}

client.on('guildMemberAdd', async member => {
  try {
    const inmateRole = member.guild.roles.cache.find(r => r.name === 'Inmate');
    if (inmateRole) await member.roles.add(inmateRole);

    const intakeChannel = member.guild.channels.cache.find(c => c.name === INTAKE_CHANNEL);
    if (intakeChannel) {
      const msg = await intakeChannel.send(`Welcome ${member}! React with ✅ to be booked into a cell.`);
      await msg.react('✅');
    }
  } catch (e) { console.log(e); }
});

// ----------------- REACTION BOOKING -----------------
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.message.channel.name !== INTAKE_CHANNEL) return;
    if (reaction.emoji.name !== '✅') return;

    const guild = reaction.message.guild;
    const member = guild.members.cache.get(user.id);
    if (!member) return;

    const serverName = SERVER_NAMES[Math.floor(Math.random() * SERVER_NAMES.length)];
    const cell = CELLS[Math.floor(Math.random() * CELLS.length)];
    const charge = CHARGES[Math.floor(Math.random() * CHARGES.length)];
    const timeServingDays = Math.floor(Math.random() * 90) + 1;
    const timeServingMs = timeServingDays * 24 * 60 * 60 * 1000;

    // Nickname
    try { await member.setNickname(`${serverName} | ${cell.toUpperCase()}`); } catch {}

    // Mugshot
    const mugshotPath = await createMugshot(member, charge, timeServingDays);
    const mugshotsChannel = guild.channels.cache.find(c => c.name === MUGSHOTS_CHANNEL);
    if (mugshotsChannel && fs.existsSync(mugshotPath)) await mugshotsChannel.send({ files: [mugshotPath] });

    // Roles
    const inmateRole = guild.roles.cache.find(r => r.name === 'Inmate');
    const cellRole = guild.roles.cache.find(r => r.name === cell);
    if (inmateRole) await member.roles.remove(inmateRole);
    if (cellRole) await member.roles.add(cellRole);

    // Save to DB
    inmates[member.id] = { serverName, cell, charge, timeServingMs, startTime: Date.now() };
    fs.writeFileSync(DB_FILE, JSON.stringify(inmates, null, 2));

    try {
      await member.send(`You have been booked!\nServer: ${serverName}\nCell: ${cell.toUpperCase()}\nCharge: ${charge}\nTime Serving: ${timeServingDays} days`);
    } catch {}
  } catch (e) { console.log("Reaction booking error:", e); }
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
        if (inmateRole) member.roles.add(inmateRole);
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

  message.channel.send(`📋 **Your Info**\nCell: ${data.cell.toUpperCase()}\nCharge: ${data.charge}\nTime Remaining: ${days}d ${hours}h ${minutes}m`);
});

// ----------------- LOGIN -----------------
client.once('ready', () => { console.log(`Logged in as ${client.user.tag}`); });
client.login(TOKEN);
