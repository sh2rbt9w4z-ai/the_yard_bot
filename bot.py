import os
import discord
from discord.ext import commands
import asyncio

# Intents
intents = discord.Intents.all()

# Initialize bot
bot = commands.Bot(command_prefix="!", intents=intents)

# Function to load all cogs in the cogs/ folder
async def load_cogs():
    cogs_dir = "cogs"
    for filename in os.listdir(cogs_dir):
        if filename.endswith(".py"):
            cog_name = filename[:-3]
            try:
                await bot.load_extension(f"{cogs_dir}.{cog_name}")
                print(f"Loaded cog: {filename}")
            except Exception as e:
                print(f"Failed to load cog {filename}: {e}")

# Event: on_ready
@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")
    await load_cogs()
    print("All cogs loaded.")

# Run the bot
TOKEN = os.getenv("TOKEN")  # Must be set in Railway / environment variables
if not TOKEN:
    raise ValueError("TOKEN environment variable is missing!")

bot.run(TOKEN)
