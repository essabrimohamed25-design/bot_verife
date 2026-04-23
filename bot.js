// bot.js
// A professional Discord verification system with Darija modal, role assignment, and logging.
// Deployable on Railway, using only environment variables.

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Load environment variables
const token = process.env.BOT_TOKEN;
const panelChannelId = process.env.VERIFY_PANEL_CHANNEL_ID;
const verifyRoleId = process.env.VERIFY_ROLE_ID;
const logChannelId = process.env.LOG_CHANNEL_ID;

// Basic validation for environment variables
if (!token) throw new Error("Missing BOT_TOKEN environment variable.");
if (!panelChannelId) throw new Error("Missing VERIFY_PANEL_CHANNEL_ID environment variable.");
if (!verifyRoleId) throw new Error("Missing VERIFY_ROLE_ID environment variable.");
if (!logChannelId) throw new Error("Missing LOG_CHANNEL_ID environment variable.");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Required for role assignment
        GatewayIntentBits.GuildMessages,
    ]
});

// Constant button custom ID
const VERIFY_BUTTON_ID = 'verify_modal_button';

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const panelChannel = client.channels.cache.get(panelChannelId);
    if (!panelChannel) {
        console.error(`❌ Channel with ID ${panelChannelId} not found. Verify panel not sent.`);
        return;
    }

    // Check if panel already exists in the last 50 messages to avoid spamming on restarts
    try {
        const messages = await panelChannel.messages.fetch({ limit: 50 });
        const hasPanel = messages.some(msg => msg.author.id === client.user.id && msg.components?.some(row => row.components?.some(comp => comp.customId === VERIFY_BUTTON_ID)));
        if (hasPanel) {
            console.log("📌 Verify panel already exists in the channel, skipping send.");
            return;
        }
    } catch (error) {
        console.warn("Could not fetch recent messages, sending panel anyway.", error);
    }

    // Create the verify button
    const verifyButton = new ButtonBuilder()
        .setCustomId(VERIFY_BUTTON_ID)
        .setLabel('VERIFY')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✅'); // adds a small professional touch

    const row = new ActionRowBuilder().addComponents(verifyButton);

    // Professional embed with the required image
    const embed = new EmbedBuilder()
        .setColor(0x2B2D31) // Discord dark theme-like color
        .setTitle('🔐 Verification Required')
        .setDescription('Please click the **VERIFY** button below and fill out the form to gain access to the server.')
        .setImage('https://media.discordapp.net/attachments/1462437612647088335/1482006389843824670/content.png')
        .setFooter({ text: 'Verification System' })
        .setTimestamp();

    await panelChannel.send({ embeds: [embed], components: [row] });
    console.log(`✅ Verify panel sent to channel ${panelChannelId}`);
});

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== VERIFY_BUTTON_ID) return;

    // Create modal with questions in Darija
    const modal = new ModalBuilder()
        .setCustomId('verify_modal')
        .setTitle('التّحقق | Verification');

    // Question 1: chno smytk
    const nameInput = new TextInputBuilder()
        .setCustomId('user_name')
        .setLabel('🔹 chno smytk')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('9leb smiytek')
        .setRequired(true);

    // Question 2: ch7al f3mrk
    const ageInput = new TextInputBuilder()
        .setCustomId('user_age')
        .setLabel('🔹 ch7al f 3mrk')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('X years')
        .setRequired(true);

    // Question 3: chno consol li 3ndk (PC / Phone)
    const deviceInput = new TextInputBuilder()
        .setCustomId('user_device')
        .setLabel('🔹 chno consol li 3ndk (PC / Phone)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('PC or Phone')
        .setRequired(true);

    // Add inputs to modal rows
    const firstRow = new ActionRowBuilder().addComponents(nameInput);
    const secondRow = new ActionRowBuilder().addComponents(ageInput);
    const thirdRow = new ActionRowBuilder().addComponents(deviceInput);
    modal.addComponents(firstRow, secondRow, thirdRow);

    await interaction.showModal(modal);
});

// Handle modal submission
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'verify_modal') return;

    // Get answers from modal fields
    const name = interaction.fields.getTextInputValue('user_name');
    const age = interaction.fields.getTextInputValue('user_age');
    const device = interaction.fields.getTextInputValue('user_device');

    // Defer reply to give time for role assignment
    await interaction.deferReply({ ephemeral: true });

    try {
        // Assign verify role
        const member = interaction.member;
        const role = interaction.guild.roles.cache.get(verifyRoleId);
        if (!role) {
            console.error(`❌ Role with ID ${verifyRoleId} not found.`);
            await interaction.editReply({ content: '❌ Verification role not found. Please contact an administrator.', ephemeral: true });
            return;
        }

        await member.roles.add(role);
        console.log(`✅ Assigned role ${role.name} to ${member.user.tag}`);

        // Success message to user
        await interaction.editReply({ content: `✅ **تم التحقق بنجاح !**\nمرحبا بك ${name}`, ephemeral: true });

        // Prepare log embed
        const logEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📋 New Verification Log')
            .setDescription(`**User:** ${member.user} (${member.user.tag})\n**User ID:** ${member.user.id}`)
            .addFields(
                { name: '📝 Name (chno smytk)', value: name, inline: true },
                { name: '🎂 Age (ch7al f 3mrk)', value: age, inline: true },
                { name: '🖥️ Device (PC/Phone)', value: device, inline: true },
                { name: '✅ Role Assigned', value: `<@&${verifyRoleId}>`, inline: false }
            )
            .setFooter({ text: 'Verification System' })
            .setTimestamp();

        // Send log to log channel
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] });
        } else {
            console.error(`❌ Log channel with ID ${logChannelId} not found.`);
        }

    } catch (error) {
        console.error('Error assigning role or sending logs:', error);
        await interaction.editReply({ content: '❌ An error occurred during verification. Please try again later.', ephemeral: true });
    }
});

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

client.login(token);
