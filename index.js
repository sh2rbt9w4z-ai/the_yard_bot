import discord
from discord.ext import commands, tasks
import json, random, aiohttp, aiofiles, time
from PIL import Image, ImageDraw, ImageFont
import os

# ----------------- CONFIG -----------------
TOKEN = "YOUR_BOT_TOKEN"  # Replace with your bot token
GUILD_ID = YOUR_GUILD_ID  # Replace with your server ID (integer)
INTAKE_CHANNEL = "intake"
MUGSHOTS_CHANNEL = "mugshots"
# -----------------------------------------

intents = discord.Intents.all()
bot = commands.Bot(command_prefix='/', intents=intents)

# Load or create inmate database
if os.path.exists("inmates.json"):
    with open("inmates.json", "r") as f:
        inmates = json.load(f)
else:
    inmates = {}

SERVER_NAMES = ["The Yard", "Blockhouse", "Ironcell"]
CHARGES = ["Contraband", "Assault", "Disrespecting CO"]
CELLS = ["c1", "c2", "c3"]  # lowercase as requested

# ----------------- MODERATION -----------------
@bot.command()
@commands.has_permissions(manage_roles=True)
async def mute(ctx, member: discord.Member):
    role = discord.utils.get(ctx.guild.roles, name="Segregation")
    if role:
        await member.add_roles(role)
        await ctx.send(f"{member.mention} has been muted (Segregation).")
    else:
        await ctx.send("Segregation role not found!")

@bot.command()
@commands.has_permissions(manage_roles=True)
async def unmute(ctx, member: discord.Member):
    role = discord.utils.get(ctx.guild.roles, name="Segregation")
    if role:
        await member.remove_roles(role)
        await ctx.send(f"{member.mention} has been unmuted.")
    else:
        await ctx.send("Segregation role not found!")

@bot.command()
async def echo(ctx, *, message):
    await ctx.message.delete()
    await ctx.send(message)

@bot.command()
@commands.has_permissions(ban_members=True)
async def ban(ctx, member: discord.Member, *, reason=None):
    await member.ban(reason=reason)
    await ctx.send(f"{member.mention} has been banned.")

@bot.command()
@commands.has_permissions(kick_members=True)
async def kick(ctx, member: discord.Member, *, reason=None):
    await member.kick(reason=reason)
    await ctx.send(f"{member.mention} has been kicked.")

@bot.command()
@commands.has_permissions(manage_messages=True)
async def purge(ctx, amount: int):
    await ctx.channel.purge(limit=amount + 1)
    await ctx.send(f"Deleted {amount} messages.", delete_after=5)

@bot.command()
@commands.has_permissions(kick_members=True)
async def warn(ctx, member: discord.Member, *, reason="Please follow the rules."):
    await ctx.send(f"{member.mention}, warning: {reason}")

# ----------------- BOOKING -----------------
async def create_mugshot(member, charge, time_serving_days):
    # Download avatar safely
    try:
        avatar_url = member.avatar.url
    except:
        avatar_url = None

    if avatar_url:
        async with aiohttp.ClientSession() as session:
            async with session.get(str(avatar_url)) as resp:
                if resp.status == 200:
                    fp = f"temp_{member.id}.png"
                    f = await aiofiles.open(fp, mode='wb')
                    await f.write(await resp.read())
                    await f.close()
                else:
                    fp = None
    else:
        fp = None

    # Create image
    if fp and os.path.exists(fp):
        img = Image.open(fp).convert("RGBA")
    else:
        img = Image.new("RGBA", (256, 256), (50, 50, 50, 255))

    draw = ImageDraw.Draw(img)

    # Load font safely
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()

    weeks = time_serving_days // 7
    remaining_days = time_serving_days % 7
    text = f"Charge: {charge}\nTime Serving: {weeks}w {remaining_days}d"

    draw.multiline_text((10, 10), text, fill=(255, 0, 0), font=font)
    final_fp = f"mugshot_{member.id}.png"
    img.save(final_fp)
    return final_fp

@bot.event
async def on_member_join(member):
    try:
        role = discord.utils.get(member.guild.roles, name="Inmate")
        if role:
            await member.add_roles(role)
    except Exception as e:
        print(f"Error assigning Inmate role: {e}")

    try:
        intake_channel = discord.utils.get(member.guild.channels, name=INTAKE_CHANNEL)
        if intake_channel:
            msg = await intake_channel.send(
                f"Welcome {member.mention}! React with ✅ to be booked into a cell."
            )
            await msg.add_reaction("✅")
        else:
            print(f"Intake channel '{INTAKE_CHANNEL}' not found.")
    except Exception as e:
        print(f"Error sending intake message: {e}")

@bot.event
async def on_raw_reaction_add(payload):
    if payload.user_id == bot.user.id:
        return

    try:
        guild = bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id)
        intake_channel = discord.utils.get(guild.channels, name=INTAKE_CHANNEL)

        if not intake_channel or payload.channel_id != intake_channel.id or str(payload.emoji) != "✅":
            return

        # Assign random info
        server_name = random.choice(SERVER_NAMES)
        cell = random.choice(CELLS)
        charge = random.choice(CHARGES)
        time_serving_days = random.randint(1, 90)
        time_serving_seconds = time_serving_days * 24 * 60 * 60

        # Update nickname
        try:
            await member.edit(nick=f"{server_name} | {cell.upper()}")
        except:
            pass

        # Create mugshot
        final_fp = await create_mugshot(member, charge, time_serving_days)
        mugshots_channel = discord.utils.get(guild.channels, name=MUGSHOTS_CHANNEL)
        if mugshots_channel and os.path.exists(final_fp):
            with open(final_fp, "rb") as f:
                msg = await mugshots_channel.send(file=discord.File(f))
            mugshot_url = msg.attachments[0].url
        else:
            mugshot_url = None

        # Save inmate data
        inmates[str(member.id)] = {
            "server_name": server_name,
            "cell": cell,
            "charge": charge,
            "time_serving": time_serving_seconds,
            "start_time": time.time(),
            "mugshot_url": mugshot_url
        }
        with open("inmates.json", "w") as f:
            json.dump(inmates, f, indent=4)

        # Notify inmate
        try:
            await member.send(
                f"You have been booked!\nServer Name: {server_name}\nCell: {cell.upper()}\nCharge: {charge}\nTime Serving: {time_serving_days} days"
            )
        except:
            pass

        # Remove Inmate role, add Cell role
        inmate_role = discord.utils.get(guild.roles, name="Inmate")
        cell_role = discord.utils.get(guild.roles, name=cell)
        if inmate_role:
            await member.remove_roles(inmate_role)
        if cell_role:
            await member.add_roles(cell_role)

    except Exception as e:
        print(f"Error in reaction handler: {e}")

# ----------------- SENTENCE CHECKER -----------------
@tasks.loop(minutes=1)
async def sentence_checker():
    now = time.time()
    guild = bot.get_guild(GUILD_ID)
    if not guild:
        print("Guild not found!")
        return

    for user_id, data in list(inmates.items()):
        elapsed = now - data.get("start_time", now)
        if elapsed >= data["time_serving"]:
            member = guild.get_member(int(user_id))
            if member:
                inmate_role = discord.utils.get(guild.roles, name="Inmate")
                roles_to_remove = [r for r in member.roles if r.name.lower() in ["c1","c2","c3","segregation"]]
                if roles_to_remove:
                    await member.remove_roles(*roles_to_remove)
                if inmate_role:
                    await member.add_roles(inmate_role)
                try:
                    await member.send("Your sentence is served! Return to #intake to be re-assigned.")
                except:
                    pass

            # Remove from DB
            inmates.pop(user_id)
            with open("inmates.json", "w") as f:
                json.dump(inmates, f, indent=4)

@sentence_checker.before_loop
async def before_checker():
    await bot.wait_until_ready()

sentence_checker.start()

# ----------------- MYINFO COMMAND -----------------
@bot.command()
async def myinfo(ctx):
    user_id = str(ctx.author.id)
    if user_id not in inmates:
        await ctx.send("You are not currently booked. Go to #intake to start your sentence.")
        return

    data = inmates[user_id]
    cell = data.get("cell", "Unknown").upper()
    charge = data.get("charge", "Unknown")
    time_serving = data.get("time_serving", 0)
    start_time = data.get("start_time", 0)
    elapsed = time.time() - start_time
    remaining_seconds = max(0, time_serving - elapsed)

    days = int(remaining_seconds // (24*60*60))
    hours = int((remaining_seconds % (24*60*60)) // 3600)
    minutes = int((remaining_seconds % 3600) // 60)

    await ctx.send(
        f"📋 **Your Info**\n"
        f"Cell: {cell}\n"
        f"Charge: {charge}\n"
        f"Time Remaining: {days}d {hours}h {minutes}m"
    )

# ----------------- RUN BOT -----------------
bot.run(TOKEN)
