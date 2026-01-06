# bot.py
import os
import asyncio
import discord
from discord.ext import commands

TOKEN = os.environ.get("TOKEN")  # Make sure this environment variable is set in Railway

intents = discord.Intents.default()
intents.message_content = True  # Needed for reading messages if you later need them

bot = commands.Bot(command_prefix="!", intents=intents)

# Load cogs automatically
async def load_cogs():
    for filename in os.listdir("./cogs"):
        if filename.endswith(".py"):
            await bot.load_extension(f"cogs.{filename[:-3]}")

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")
    await load_cogs()
    print("All cogs loaded.")

async def main():
    async with bot:
        await bot.start(TOKEN)

asyncio.run(main())
