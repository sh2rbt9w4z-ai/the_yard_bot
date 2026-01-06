# cogs/echo.py
from discord.ext import commands

class Echo(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.slash_command(name="echo", description="Make the bot repeat what you say")
    async def echo(self, ctx, message: str):
        await ctx.respond(message, ephemeral=True)

def setup(bot):
    bot.add_cog(Echo(bot))
