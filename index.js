// index.js
const { Client, GatewayIntentBits, Partials, Collection, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const Canvas = require('@napi-rs/canvas'); // npm install @napi-rs/canvas
const path = require('path');

const TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const INTAKE_CHANNEL = 'intake';
const MUGSHOTS_CHANNEL = 'mugshots';
const DB_FILE = '/tmp/inmates.json'; // Railway safe path

// Load or create inmate database
let inmates = {};
if (fs.existsSync(DB_FILE)) {
  inmates = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

const SERVER_NAMES = ["The Yard", "Blockhouse", "Ironcell"];
const CHARGES = ["Contraband", "Assault", "Disrespecting CO"];
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
    if (role && member) {
      await member.roles.add(role);
      message.channel.send(`${member} has been muted (Segregation).`);
    }
  }
  if (cmd === 'unmute' && message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    const role = message.guild.roles.cache.find(r => r.name === 'Segregation');
    if (role && member) {
      await member.roles.remove(role);
      message.channel.send(`${member} has been unmuted.`);
    }
  }
  if (cmd === 'echo') {
    message.delete();
    message.channel.send(args.join(' '));
  }
  if (cmd === 'ban' && message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
    if (member) {
      await member.ban({ reason: args.join(' ') || 'No reason provided' });
      message.channel.send(`${member} has been banned.`);
    }
  }
  if (cmd === 'kick' && message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
    if (member) {
      await member.kick(args.join(' ') || 'No reason provided');
      message.channel.send(`${member} has been kicked.`);
    }
  }
  if (cmd === 'purge' && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    const amount = parseInt(args[0]) || 0;
    if (amount > 0) {
      await message.channel.bulkDelete(amount + 1, true);
      message.channel.send(`Deleted ${amount} messages.`).then(msg => setTimeout(() => msg.delete(), 5000));
    }
  }
  if (cmd === 'warn' && message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
    if (member) {
      message.channel.send(`${member}, warning: ${args.join(' ') || 'Please follow the rules.'}`);
    }
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
  } catch (e) {
    console.log(`No avatar for ${member.user.tag}`);
  }

  // Text
  ctx.fillStyle = 'red';
  ctx.font = '24px sans-serif';
  const weeks = Math.floor(timeServingDays / 7);
  const remainingDays = timeServingDays % 7;
  ctx.fillText(`Charge: ${charge}`, 10, 30);
  ctx.fillText(`Time: ${weeks}w ${remainingDays}d`, 10, 60);

  const filePath = `/tmp/mugshot_${member.id}.png`;
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
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

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.emoji.name !== '✅') return;

  if (reaction.message.channel.name !== INTAKE_CHANNEL) return;

  const guild = reaction.message.guild;
  const member = guild.members.cache.get(user.id);

  // Random assignment
  const serverName = SERVER_NAMES[Math.floor(Math.random() * SERVER_NAMES.length)];
  const cell = CELLS[Math.floor(Math.random() * CELLS.length)];
  const charge = CHARGES[Math.floor(Math.random() * CHARGES.length)];
  const timeServingDays = Math.floor(Math.random() * 90) + 1;
  const timeServingMs = timeServingDays * 24 * 60 * 60 * 1000;

  // Update nickname
  try { await member.setNickname(`${serverName} | ${cell.toUpperCase()}`); } catch {}

  // Mugshot
  const mugshotPath = await createMugshot(member, charge, timeServingDays);
  const mugshotsChannel = guild.channels.cache.find(c => c.name === MUGSHOTS_CHANNEL);
  if (mugshotsChannel && fs.existsSync(mugshotPath)) {
    await mugshotsChannel.send({ files: [mugshotPath] });
  }

  // Update roles
  const inmateRole = guild.roles.cache.find(r => r.name === 'Inmate');
  const cellRole = guild.roles.cache.find(r => r.name === cell);
  if (inmateRole) await member.roles.remove(inmateRole);
  if (cellRole) await member.roles.add(cellRole);

  // Save to DB
  inmates[member.id] = {
    serverName,
    cell,
    charge,
    timeServingMs,
    startTime: Date.now(),
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(inmates, null, 2));

  try {
    await member.send(`You have been booked!\nServer: ${serverName}\nCell: ${cell.toUpperCase()}\nCharge: ${charge}\nTime Serving: ${timeServingDays} days`);
  } catch {}
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
}, 60 * 1000);

// ----------------- MYINFO COMMAND -----------------
client.on('messageCreate', async message => {
  if (message.content.toLowerCase() === '/myinfo') {
    const data = inmates[message.author.id];
    if (!data) {
      message.channel.send('You are not currently booked. Go to #intake to start your sentence.');
      return;
    }
    const remainingMs = Math.max(0, data.timeServingMs - (Date.now() - data.startTime));
    const days = Math.floor(remainingMs / (1000*60*60*24));
    const hours = Math.floor((remainingMs % (1000*60*60*24)) / (1000*60*60));
    const minutes = Math.floor((remainingMs % (1000*60*60)) / (1000*60));

    message.channel.send(`📋 **Your Info**\nCell: ${data.cell.toUpperCase()}\nCharge: ${data.charge}\nTime Remaining: ${days}d ${hours}h ${minutes}m`);
  }
});

// ----------------- LOGIN -----------------
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
