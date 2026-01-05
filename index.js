const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionsBitField } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Bot Application ID
const GUILD_ID = process.env.GUILD_ID;   // Your server ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Pod roles and inmate names
const pods = ["c1", "c2", "c3"];
const inmateNames = ["Ghost", "Brick", "Razor", "Diesel", "Smokes", "Chains", "Spike"];

// Helper: random inmate nickname
function randomName() {
  const name = inmateNames[Math.floor(Math.random() * inmateNames.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${name}-${number}`;
}

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Echoes back your message")
    .addStringOption(option => option.setName("message").setDescription("The message to echo").setRequired(true)),

  new SlashCommandBuilder()
    .setName("reroll")
    .setDescription("Reroll a user's pod and nickname")
    .addUserOption(option => option.setName("target").setDescription("User to reroll").setRequired(true)),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server")
    .addUserOption(option => option.setName("target").setDescription("User to kick").setRequired(true))
    .addStringOption(option => option.setName("reason").setDescription("Reason for kick").setRequired(false)),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server")
    .addUserOption(option => option.setName("target").setDescription("User to ban").setRequired(true))
    .addStringOption(option => option.setName("reason").setDescription("Reason for ban").setRequired(false)),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a user by assigning segregation role")
    .addUserOption(option => option.setName("target").setDescription("User to mute").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a user by removing segregation role")
    .addUserOption(option => option.setName("target").setDescription("User to unmute").setRequired(true))
].map(cmd => cmd.toJSON());

// Register commands
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    console.log("Registering commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Commands registered!");
  } catch (err) {
    console.error(err);
  }
})();

// --- Member Join Handler ---
client.on("guildMemberAdd", async member => {
  try {
    await member.setNickname(randomName());

    const podName = pods[Math.floor(Math.random() * pods.length)];
    const podRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === podName.toLowerCase());
    const inmateRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === "inmate");

    const rolesToAdd = [];
    if (inmateRole) rolesToAdd.push(inmateRole);
    if (podRole) rolesToAdd.push(podRole);

    if (rolesToAdd.length > 0) await member.roles.add(rolesToAdd);

    console.log(`Assigned roles to ${member.user.tag}: ${rolesToAdd.map(r => r.name).join(", ")}`);
  } catch (err) {
    console.error(`Failed to assign roles to ${member.user.tag}:`, err);
  }
});

// --- Slash Command Handler ---
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const admin = interaction.member.permissions.has(
    PermissionsBitField.Flags.KickMembers | PermissionsBitField.Flags.BanMembers | PermissionsBitField.Flags.ManageRoles
  );

  // ECHO
  if (interaction.commandName === "echo") {
    const msg = interaction.options.getString("message");
    await interaction.reply(`You said: ${msg}`);
  }

  // REROLL
  if (interaction.commandName === "reroll") {
    if (!admin) return interaction.reply({ content: "You do not have permission.", ephemeral: true });
    const targetUser = interaction.options.getUser("target");
    const member = await interaction.guild.members.fetch(targetUser.id);

    const newPod = pods[Math.floor(Math.random() * pods.length)];
    const podRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === newPod.toLowerCase());
    const inmateRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === "inmate");

    const rolesToAdd = [];
    if (inmateRole) rolesToAdd.push(inmateRole);
    if (podRole) rolesToAdd.push(podRole);

    if (rolesToAdd.length > 0) await member.roles.set(rolesToAdd);
    await member.setNickname(randomName());

    await interaction.reply(`Rerolled ${member.user.tag}: new pod **${newPod}** and nickname updated.`);
  }

  // KICK
  if (interaction.commandName === "kick") {
    if (!admin) return interaction.reply({ content: "You do not have permission.", ephemeral: true });
    const targetUser = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "No reason provided";
    const member = await interaction.guild.members.fetch(targetUser.id);
    await member.kick(reason);
    await interaction.reply(`Kicked ${member.user.tag}: ${reason}`);
  }

  // BAN
  if (interaction.commandName === "ban") {
    if (!admin) return interaction.reply({ content: "You do not have permission.", ephemeral: true });
    const targetUser = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "No reason provided";
    await interaction.guild.members.ban(targetUser.id, { reason });
    await interaction.reply(`Banned ${targetUser.tag}: ${reason}`);
  }

  // MUTE (Segregation)
  if (interaction.commandName === "mute") {
    if (!admin) return interaction.reply({ content: "You do not have permission.", ephemeral: true });
    const targetUser = interaction.options.getUser("target");
    const member = await interaction.guild.members.fetch(targetUser.id);
    const muteRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "segregation");
    if (!muteRole) return interaction.reply({ content: "Segregation role not found.", ephemeral: true });
    await member.roles.add(muteRole);
    await interaction.reply(`${member.user.tag} has been muted (segregation).`);
  }

  // UNMUTE (Segregation)
  if (interaction.commandName === "unmute") {
    if (!admin) return interaction.reply({ content: "You do not have permission.", ephemeral: true });
    const targetUser = interaction.options.getUser("target");
    const member = await interaction.guild.members.fetch(targetUser.id);
    const muteRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "segregation");
    if (!muteRole) return interaction.reply({ content: "Segregation role not found.", ephemeral: true });
    await member.roles.remove(muteRole);
    await interaction.reply(`${member.user.tag} has been unmuted (segregation).`);
  }
});

// --- Ready Event ---
client.once("ready", () => console.log(`Logged in as ${client.user.tag}`));

client.login(TOKEN);
