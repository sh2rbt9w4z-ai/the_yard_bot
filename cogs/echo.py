# cogs/echo.py
import discord
from discord import app_commands
from discord.ext import commands

class Echo(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="echo", description="Make the bot repeat what you say")
    @app_commands.describe(message="The message to echo")
    async def echo(self, interaction: discord.Interaction, message: str):
        await interaction.response.send_message(message, ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Echo(bot))
