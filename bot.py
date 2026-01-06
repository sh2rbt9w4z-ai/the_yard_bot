import os
from discord.ext import commands
import discord

bot = commands.Bot(command_prefix="/", intents=discord.Intents.all())

async def load_cogs():
    for filename in os.listdir("./cogs"):
        if filename.endswith(".py"):
            await bot.load_extension(f"cogs.{filename[:-3]}")
            print(f"Loaded cog: {filename}")

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")
    await load_cogs()
    print("All cogs loaded.")

bot.run(os.getenv("TOKEN"))
