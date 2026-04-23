=require("dotenv").config();
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

let lastPanel = null;

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.VERIFY_PANEL_CHANNEL_ID);

  setInterval(async () => {
    try {
      if (lastPanel) await lastPanel.delete().catch(() => {});

      const embed = new EmbedBuilder()
        .setTitle("🔐 VERIFY SYSTEM")
        .setDescription("ضغط على الزر باش تدير verification")
        .setColor(0x00ff00)
        .setImage("https://media.discordapp.net/attachments/1462437612647088335/1482006389843824670/content.png");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("verify_btn")
          .setLabel("VERIFY")
          .setStyle(ButtonStyle.Success)
      );

      lastPanel = await channel.send({
        embeds: [embed],
        components: [row]
      });

    } catch (err) {
      console.error("❌ Panel Error:", err);
    }
  }, 60000); // كل دقيقة
});

// interactions
client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton() && interaction.customId === "verify_btn") {
    const modal = new ModalBuilder()
      .setCustomId("verify_modal")
      .setTitle("Verification");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("name").setLabel("chno smytk").setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("age").setLabel("ch7al f3mrk").setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("device").setLabel("chno consol li 3ndk").setStyle(TextInputStyle.Short)
      )
    );

    return interaction.showModal(modal);
  }

  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "verify_modal") {
    try {
      const role = interaction.guild.roles.cache.get(process.env.VERIFY_ROLE_ID);

      // 🔴 تحقق من role
      if (!role) {
        return interaction.reply({
          content: "❌ role ما لقاهاش",
          ephemeral: true
        });
      }

      // 🔴 تحقق من permissions
      if (!interaction.guild.members.me.permissions.has("ManageRoles")) {
        return interaction.reply({
          content: "❌ البوت ما عندوش Manage Roles",
          ephemeral: true
        });
      }

      // 🔴 تحقق من position
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          content: "❌ خاص role تكون تحت البوت",
          ephemeral: true
        });
      }

      await interaction.member.roles.add(role);

      await interaction.reply({
        content: `✅ مرحبا بك ${interaction.user}`,
        ephemeral: true
      });

      // logs
      const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

      const embed = new EmbedBuilder()
        .setTitle("📊 Verification")
        .setColor(0x00ff00)
        .addFields(
          { name: "User", value: `${interaction.user}` },
          { name: "ID", value: interaction.user.id }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] });

    } catch (err) {
      console.error("❌ Verify Error:", err);

      await interaction.reply({
        content: "❌ مشكل تقني، تأكد من الرول وpermissions",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);
