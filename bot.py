import os
import discord
from discord.ext import commands
from discord import app_commands

# Load token from environment variable
TOKEN = os.environ.get("TOKEN")
if TOKEN is None:
    raise ValueError("No TOKEN found in environment variables!")

intents = discord.Intents.default()
intents.message_content = True  # optional depending on bot needs

bot = commands.Bot(command_prefix="!", intents=intents)

# Load cogs
async def load_cogs():
    for filename in os.listdir("./cogs"):
        if filename.endswith(".py"):
            await bot.load_extension(f"cogs.{filename[:-3]}")

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")
    print("------")
    await load_cogs()
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} commands")
    except Exception as e:
        print(f"Failed to sync commands: {e}")

bot.run(TOKEN)
