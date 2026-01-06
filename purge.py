import discord
from discord.ext import commands

class Purge(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @discord.slash_command(
        name="purge",
        description="Delete a number of messages from the current channel"
    )
    async def purge(self, ctx: discord.ApplicationContext, amount: discord.Option(int, "Number of messages to delete")):
        # Check for permissions
        if not ctx.author.guild_permissions.manage_messages:
            await ctx.respond("You do not have permission to purge messages.", ephemeral=True)
            return

        # Delete messages
        deleted = await ctx.channel.purge(limit=amount)
        await ctx.respond(f"Deleted {len(deleted)} messages.", ephemeral=True)

# Setup function to load the cog
def setup(bot):
    bot.add_cog(Purge(bot))
