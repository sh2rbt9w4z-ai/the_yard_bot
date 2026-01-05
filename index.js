const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Pod roles
const pods = ["c1", "c2", "c3"];

// Random inmate names
const inmateNames = [
  "Ghost", "Brick", "Razor", "Diesel", "Smokes", "Chains", "Spike"
];

// Helper function to generate a random inmate name
function randomName() {
  const name = inmateNames[Math.floor(Math.random() * inmateNames.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${name}-${number}`;
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {
  try {
    // Set nickname
    await member.setNickname(randomName());

    // Pick random pod
    const podName = pods[Math.floor(Math.random() * pods.length)];

    // Find roles
    const podRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === podName.toLowerCase());
    const inmateRole = member.guild.roles.cache.find(r => r.name.toLowerCase() === "inmate");

    // Only add roles if they exist
    const rolesToAdd = [];
    if (inmateRole) rolesToAdd.push(inmateRole);
    if (podRole) rolesToAdd.push(podRole);

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd);
    }

    console.log(`Assigned roles to ${member.user.tag}: ${rolesToAdd.map(r => r.name).join(", ")}`);
  } catch (err) {
    console.error(`Failed to assign roles to ${member.user.tag}:`, err);
  }
});

client.login(process.env.TOKEN);
