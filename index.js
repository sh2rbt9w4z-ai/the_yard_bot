const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Your bot's Application ID
const GUILD_ID = process.env.GUILD_ID;   // Your server ID (for testing commands)

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Pod roles and inmate names
const pods = ["c1", "c2", "c3"];
const inmateNames = ["Ghost", "Brick", "Razor", "Diesel", "Smokes", "Chains", "Spike"];

// Helper to generate random inmate nickname
function randomName() {
  const name = inmateNames[Math.floor(Math.random() * inmateNames.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${name}-${number}`;
}

// --- Slash Commands ---
const commands = [
  // Echo command
  new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Echoes back your message")
    .addStringOption(option =>
      option.setName("message")
            .setDescription("The message to echo")
            .setRequired(true)
    ),

  // Reroll command
  new SlashCommandBuilder()
    .setName("reroll")
    .setDescription("Reroll a user's pod and nickname")
    .addUserOption(option =>
      option.setName("target")
            .setDescription("User to reroll")
            .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// Register slash commands with Discord
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Refreshing slash commands...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Commands registered!");
  } catch (err) {
    console.error(err);
  }
})();

// --- Member Join Handler ---
client.on("guildMemberAdd", async member => {
  try {
    // Random nickname
    await member.setNickname(randomName());

    // Random pod role
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

  // Echo command
  if (interaction.commandName === "echo") {
    const msg = interaction.options.getString("message");
    await interaction.reply(`You said: ${msg}`);
  }

  // Reroll command
  if (interaction.commandName === "reroll") {
    const targetUser = interaction.options.getUser("target");
    const member = await interaction.guild.members.fetch(targetUser.id);

    const newPod = pods[Math.floor(Math.random() * pods.length)];
    const podRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === newPod.toLowerCase());
    const inmateRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === "inmate");

    const rolesToAdd = [];
    if (inmateRole) rolesToAdd.push(inmateRole);
    if (podRole) rolesToAdd.push(podRole);

    if (rolesToAdd.length > 0) await member.roles.set(rolesToAdd); // remove old pod, assign new
    await member.setNickname(randomName());

    await interaction.reply(`Rerolled ${member.user.tag}: new pod is **${newPod}** and nickname updated.`);
  }
});

// --- Ready Event ---
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
