require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.VERIFY_PANEL_CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setTitle("🔐 Verify System")
    .setDescription("ضغط على الزر باش تدير verification")
    .setColor(0x00ff00)
    .setImage("https://media.discordapp.net/attachments/1462437612647088335/1482006389843824670/content.png");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("verify")
      .setLabel("VERIFY")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [embed], components: [row] });
});

client.on("interactionCreate", async (interaction) => {
  // زر VERIFY
  if (interaction.isButton() && interaction.customId === "verify") {
    const modal = new ModalBuilder()
      .setCustomId("verify_modal")
      .setTitle("Verification");

    const name = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("chno smytk")
      .setStyle(TextInputStyle.Short);

    const age = new TextInputBuilder()
      .setCustomId("age")
      .setLabel("ch7al f3mrk")
      .setStyle(TextInputStyle.Short);

    const device = new TextInputBuilder()
      .setCustomId("device")
      .setLabel("chno consol li 3ndk")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(
      new ActionRowBuilder().addComponents(name),
      new ActionRowBuilder().addComponents(age),
      new ActionRowBuilder().addComponents(device)
    );

    await interaction.showModal(modal);
  }

  // ملي يجاوب
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "verify_modal") {
    const name = interaction.fields.getTextInputValue("name");
    const age = interaction.fields.getTextInputValue("age");
    const device = interaction.fields.getTextInputValue("device");

    const role = interaction.guild.roles.cache.get(process.env.VERIFY_ROLE_ID);

    try {
      await interaction.member.roles.add(role);

      // message نجاح
      await interaction.reply({
        content: `✅ مرحبا بك ${interaction.user}`,
        ephemeral: true
      });

      // logs
      const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

      const logEmbed = new EmbedBuilder()
        .setTitle("📊 New Verification")
        .setColor(0x00ff00)
        .addFields(
          { name: "User", value: `${interaction.user} (${interaction.user.id})` },
          { name: "Name", value: name },
          { name: "Age", value: age },
          { name: "Device", value: device }
        )
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] });

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: "❌ وقع مشكل، تاصل بالإدارة",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);
