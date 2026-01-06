from discord.ext import commands

class Purge(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="purge", help="Delete a number of messages")
    async def purge(self, ctx, amount: int):
        if ctx.author.guild_permissions.manage_messages:
            deleted = await ctx.channel.purge(limit=amount)
            await ctx.send(f"Deleted {len(deleted)} messages.", delete_after=5)
        else:
            await ctx.send("You do not have permission to use this command.", delete_after=5)

async def setup(bot):
    await bot.add_cog(Purge(bot))
