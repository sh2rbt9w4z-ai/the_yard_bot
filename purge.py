import discord
from discord.ext import commands

class Purge(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.slash_command(name="purge", description="Delete a number of messages from this channel")
    async def purge(self, ctx, amount: int):
        # Check for manage messages permission
        if not ctx.author.guild_permissions.manage_messages:
            await ctx.respond("You don't have permission to use this command.", ephemeral=True)
            return

        # Limit amount to reasonable number
        if amount < 1 or amount > 100:
            await ctx.respond("You can purge between 1 and 100 messages.", ephemeral=True)
            return

        # Purge messages including the command message
        deleted = await ctx.channel.purge(limit=amount + 1)
        await ctx.respond(f"Deleted {len(deleted)-1} messages.", ephemeral=True)  # exclude the command message in count

# Setup cog
def setup(bot):
    bot.add_cog(Purge(bot))
