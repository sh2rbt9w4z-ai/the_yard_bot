# cogs/ping.py
import discord
from discord.ext import commands

class Ping(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @discord.app_commands.command(name="ping", description="Check if the bot is alive")
    async def ping(self, interaction: discord.Interaction):
        await interaction.response.send_message(f"Pong! Latency: {round(self.bot.latency * 1000)}ms", ephemeral=True)

async def setup(bot):
    await bot.add_cog(Ping(bot))
