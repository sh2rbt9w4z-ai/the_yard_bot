import discord
from discord import app_commands
from discord.ext import commands
import os

GUILD_ID = int(os.getenv("GUILD_ID"))

class Ping(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="ping", description="Test if the bot is alive")
    async def ping(self, interaction: discord.Interaction):
        await interaction.response.send_message("Pong!", ephemeral=True)

async def setup(bot):
    await bot.add_cog(Ping(bot), guild=discord.Object(id=GUILD_ID))
