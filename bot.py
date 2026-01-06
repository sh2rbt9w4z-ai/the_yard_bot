import os
import discord
from discord.ext import commands

# Intents
intents = discord.Intents.all()

# Initialize bot
bot = commands.Bot(command_prefix="!", intents=intents)

# Event: on_ready
@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")

    # Explicitly load cogs
    try:
        await bot.load_extension("cogs.ping")
        print("Loaded cog: ping.py")
    except Exception as e:
        print(f"Failed to load ping.py: {e}")

    try:
        await bot.load_extension("cogs.echo")
        print("Loaded cog: echo.py")
    except Exception as e:
        print(f"Failed to load echo.py: {e}")

    try:
        await bot.load_extension("cogs.purge")
        print("Loaded cog: purge.py")
    except Exception as e:
        print(f"Failed to load purge.py: {e}")

    print("All explicitly loaded cogs finished.")

# Run the bot
TOKEN = os.getenv("TOKEN")  # Must be set in Railway / environment variables
if not TOKEN:
    raise ValueError("TOKEN environment variable is missing!")

bot.run(TOKEN)
