import os
import discord
from discord.ext import commands

# Make sure you set your TOKEN as an environment variable in Railway
TOKEN = os.getenv("TOKEN")  

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="/", intents=intents)

# Automatically load all cogs in ./cogs
async def load_cogs():
    for filename in os.listdir("./cogs"):
        if filename.endswith(".py"):
            try:
                await bot.load_extension(f"cogs.{filename[:-3]}")
                print(f"Loaded cog: {filename}")
            except Exception as e:
                print(f"Failed to load cog {filename}: {e}")

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")
    await load_cogs()
    print("All cogs loaded.")

# Run the bot
bot.run(TOKEN)
