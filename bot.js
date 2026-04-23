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
  InteractionType,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

let lastPanel = null;

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(process.env.VERIFY_PANEL_CHANNEL_ID);

    setInterval(async () => {
      try {
        // مسح القديمة
        if (lastPanel) await lastPanel.delete().catch(() => {});

        // Embed
        const embed = new EmbedBuilder()
          .setTitle("🔐 VERIFY SYSTEM")
          .setDescription("ضغط على الزر باش تدير verification")
          .setColor(0x00ff00)
          .setImage("https://media.discordapp.net/attachments/1462437612647088335/1482006389843824670/content.png");

        // Button
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("verify_btn")
            .setLabel("VERIFY")
            .setStyle(ButtonStyle.Success)
        );

        // إرسال
        lastPanel = await channel.send({
          embeds: [embed],
          components: [row]
        });

        console.log("🔄 Panel updated");

      } catch (err) {
        console.error("❌ Panel Error:", err);
      }
    }, 60000); // كل دقيقة

  } catch (err) {
    console.error("❌ Channel Error:", err);
  }
});

// INTERACTIONS
client.on("interactionCreate", async (interaction) => {

  // زر VERIFY
  if (interaction.isButton() && interaction.customId === "verify_btn") {
    const modal = new ModalBuilder()
      .setCustomId("verify_modal")
      .setTitle("Verification");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("name")
          .setLabel("chno smytk")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("age")
          .setLabel("ch7al f3mrk")
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("device")
          .setLabel("chno consol li 3ndk")
          .setStyle(TextInputStyle.Short)
      )
    );

    return interaction.showModal(modal);
  }

  // بعد submit
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "verify_modal") {
    try {
      const name = interaction.fields.getTextInputValue("name");
      const age = interaction.fields.getTextInputValue("age");
      const device = interaction.fields.getTextInputValue("device");

      const role = interaction.guild.roles.cache.get(process.env.VERIFY_ROLE_ID);

      // Checks
      if (!role) {
        return interaction.reply({ content: "❌ Role ما لقاهاش", ephemeral: true });
      }

      if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({ content: "❌ البوت ما عندوش Manage Roles", ephemeral: true });
      }

      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({ content: "❌ خاص role تكون تحت البوت", ephemeral: true });
      }

      // إعطاء الرول
      await interaction.member.roles.add(role);

      // رسالة نجاح
      await interaction.reply({
        content: `✅ مرحبا بك ${interaction.user}`,
        ephemeral: true
      });

      // LOGS
      const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

      const logEmbed = new EmbedBuilder()
        .setTitle("📊 Verification")
        .setColor(0x00ff00)
        .addFields(
          { name: "User", value: `${interaction.user} (${interaction.user.id})` },
          { name: "Name", value: name },
          { name: "Age", value: age },
          { name: "Device", value: device }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });

    } catch (err) {
      console.error("❌ Verify Error:", err);
      await interaction.reply({
        content: "❌ وقع مشكل ف verification",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);
