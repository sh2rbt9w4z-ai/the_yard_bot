# cogs/echo.py
import discord
from discord.ext import commands

class Echo(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @discord.app_commands.command(name="echo", description="Make the bot repeat what you say")
    async def echo(self, interaction: discord.Interaction, message: str):
        await interaction.response.send_message(message, ephemeral=True)

async def setup(bot):
    await bot.add_cog(Echo(bot))
