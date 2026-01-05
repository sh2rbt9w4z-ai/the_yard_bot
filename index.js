import discord
from discord.ext import commands, tasks
import json, random, aiohttp, aiofiles, time
from PIL import Image, ImageDraw, ImageFont

# ----------------- CONFIG -----------------
TOKEN = "YOUR_BOT_TOKEN"
GUILD_ID = YOUR_GUILD_ID  # replace with your server ID
INTAKE_CHANNEL = "intake"
MUGSHOTS_CHANNEL = "mugshots"
# -----------------------------------------

intents = discord.Intents.all()
bot = commands.Bot(command_prefix='/', intents=intents)

# Load or create inmate database
try:
    with open("inmates.json", "r") as f:
        inmates = json.load(f)
except:
    inmates = {}

SERVER_NAMES = ["The Yard", "Blockhouse", "Ironcell"]
CHARGES = ["Contraband", "Assault", "Disrespecting CO"]
CELLS = ["C1", "C2", "C3"]

# ----------------- MODERATION -----------------
@bot.command()
@commands.has_permissions(manage_roles=True)
async def mute(ctx, member: discord.Member):
    role = discord.utils.get(ctx.guild.roles, name="Segregation")
    await member.add_roles(role)
    await ctx.send(f"{member.mention} has been muted (Segregation).")

@bot.command()
@commands.has_permissions(manage_roles=True)
async def unmute(ctx, member: discord.Member):
    role = discord.utils.get(ctx.guild.roles, name="Segregation")
    await member.remove_roles(role)
    await ctx.send(f"{member.mention} has been unmuted.")

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
    async with aiohttp.ClientSession() as session:
        async with session.get(str(member.avatar.url)) as resp:
            if resp.status == 200:
                fp = f"temp_{member.id}.png"
                f = await aiofiles.open(fp, mode='wb')
                await f.write(await resp.read())
                await f.close()

    img = Image.open(fp).convert("RGBA")
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("arial.ttf", 24)
    weeks = time_serving_days // 7
    remaining_days = time_serving_days % 7
    text = f"Charge: {charge}\nTime Serving: {weeks}w {remaining_days}d"
    draw.multiline_text((10, 10), text, fill=(255, 0, 0), font=font)
    final_fp = f"mugshot_{member.id}.png"
    img.save(final_fp)
    return final_fp

@bot.event
async def on_member_join(member):
    # Auto assign Inmate role
    role = discord.utils.get(member.guild.roles, name="Inmate")
    await member.add_roles(role)

    # Booking message in #intake
    intake_channel = discord.utils.get(member.guild.channels, name=INTAKE_CHANNEL)
    msg = await intake_channel.send(
        f"Welcome {member.mention}! React with ✅ to be booked into a cell."
    )
    await msg.add_reaction("✅")

@bot.event
async def on_raw_reaction_add(payload):
    if payload.user_id == bot.user.id:
        return

    guild = bot.get_guild(payload.guild_id)
    member = guild.get_member(payload.user_id)
    intake_channel = discord.utils.get(guild.channels, name=INTAKE_CHANNEL)

    if payload.channel_id != intake_channel.id or str(payload.emoji) != "✅":
        return

    # Random assignments
    server_name = random.choice(SERVER_NAMES)
    cell = random.choice(CELLS)
    charge = random.choice(CHARGES)
    time_serving_days = random.randint(1, 90)  # 1-90 days
    time_serving_seconds = time_serving_days * 24 * 60 * 60

    # Update nickname
    try:
        await member.edit(nick=f"{server_name} | {cell}")
    except:
        pass

    # Create mugshot with overlay
    final_fp = await create_mugshot(member, charge, time_serving_days)
    mugshots_channel = discord.utils.get(guild.channels, name=MUGSHOTS_CHANNEL)
    with open(final_fp, "rb") as f:
        msg = await mugshots_channel.send(file=discord.File(f))
    mugshot_url = msg.attachments[0].url

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
    await member.send(
        f"You have been booked!\nServer Name: {server_name}\nCell: {cell}\nCharge: {charge}\nTime Serving: {time_serving_days} days"
    )

    # Remove Inmate role, add Cell role
    await member.remove_roles(discord.utils.get(guild.roles, name="Inmate"))
    await member.add_roles(discord.utils.get(guild.roles, name=cell))

# ----------------- SENTENCE CHECKER -----------------
@tasks.loop(minutes=1)
async def sentence_checker():
    now = time.time()
    guild = bot.get_guild(GUILD_ID)
    for user_id, data in list(inmates.items()):
        elapsed = now - data.get("start_time", now)
        if elapsed >= data["time_serving"]:
            member = guild.get_member(int(user_id))
            if member:
                inmate_role = discord.utils.get(guild.roles, name="Inmate")
                roles_to_remove = [r for r in member.roles if r != inmate_role and r != guild.default_role]
                await member.remove_roles(*roles_to_remove)
                await member.add_roles(inmate_role)
                await member.send("Your sentence is served! Return to #intake to be re-assigned.")

            # Remove from DB
            inmates.pop(user_id)
            with open("inmates.json", "w") as f:
                json.dump(inmates, f, indent=4)

@sentence_checker.before_loop
async def before_checker():
    await bot.wait_until_ready()

sentence_checker.start()

# ----------------- RUN BOT -----------------
bot.run(TOKEN)
