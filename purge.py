# cogs/purge.py
import discord
from discord.ext import commands

class Purge(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.slash_command(
        name="purge",
        description="Delete a number of messages from a channel"
    )
    async def purge(
        self,
        ctx: discord.ApplicationContext,
        amount: discord.Option(int, "Number of messages to delete", min_value=1, max_value=100)
    ):
        # Check if the user has permission
        if not ctx.author.guild_permissions.manage_messages:
            await ctx.respond("You do not have permission to purge messages.", ephemeral=True)
            return

        try:
            deleted = await ctx.channel.purge(limit=amount)
            # Send confirmation (ephemeral so only command user sees)
            confirmation = await ctx.respond(
                f"Deleted {len(deleted)} messages.",
                ephemeral=True
            )
        except discord.Forbidden:
            await ctx.respond("I do not have permission to delete messages.", ephemeral=True)
        except Exception as e:
            await ctx.respond(f"An error occurred: {e}", ephemeral=True)

def setup(bot):
    bot.add_cog(Purge(bot))
