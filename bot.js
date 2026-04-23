const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Environment variables
const token = process.env.BOT_TOKEN;
const panelChannelId = process.env.VERIFY_PANEL_CHANNEL_ID;
const verifyRoleId = process.env.VERIFY_ROLE_ID;
const logChannelId = process.env.LOG_CHANNEL_ID;

// Validate env variables
if (!token) throw new Error('Missing BOT_TOKEN');
if (!panelChannelId) throw new Error('Missing VERIFY_PANEL_CHANNEL_ID');
if (!verifyRoleId) throw new Error('Missing VERIFY_ROLE_ID');
if (!logChannelId) throw new Error('Missing LOG_CHANNEL_ID');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ]
});

const VERIFY_BUTTON_ID = 'verify_button';

client.once('ready', async () => {
    console.log(`✅ Bot online: ${client.user.tag}`);

    const channel = client.channels.cache.get(panelChannelId);
    if (!channel) {
        console.error(`❌ Channel ${panelChannelId} not found`);
        return;
    }

    // Delete old messages to keep clean
    try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(msg => msg.author.id === client.user.id);
        for (const msg of botMessages.values()) {
            await msg.delete().catch(() => {});
        }
    } catch (error) {
        // Ignore delete errors
    }

    // Create button
    const button = new ButtonBuilder()
        .setCustomId(VERIFY_BUTTON_ID)
        .setLabel('VERIFY')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

    const row = new ActionRowBuilder().addComponents(button);

    // Create embed
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🔐 Server Verification')
        .setDescription('Click the button below to verify your account and access the server.')
        .setImage('https://media.discordapp.net/attachments/1462437612647088335/1482006389843824670/content.png')
        .setFooter({ text: 'Verification System' })
        .setTimestamp();

    // Send panel
    await channel.send({ embeds: [embed], components: [row] });
    console.log(`✅ Verify panel sent to ${channel.name}`);
});

// Handle button click
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== VERIFY_BUTTON_ID) return;

    // Create modal - NO VALIDATION, accepts anything
    const modal = new ModalBuilder()
        .setCustomId('verify_modal')
        .setTitle('Verification - Please fill the form');

    // Question 1: Name - accepts ANY text
    const nameInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('chno smytk')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your name')
        .setRequired(true)
        .setMaxLength(100); // Only limit to prevent abuse, not validation

    // Question 2: Age - accepts ANY number or text
    const ageInput = new TextInputBuilder()
        .setCustomId('age')
        .setLabel('ch7al f3mrk')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your age')
        .setRequired(true)
        .setMaxLength(10);

    // Question 3: Device - accepts ANY text
    const deviceInput = new TextInputBuilder()
        .setCustomId('device')
        .setLabel('chno consol li 3ndk (PC / Phone)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('PC, Phone, Console, etc.')
        .setRequired(true)
        .setMaxLength(50);

    modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(ageInput),
        new ActionRowBuilder().addComponents(deviceInput)
    );

    await interaction.showModal(modal);
});

// Handle modal submit - ALWAYS accepts, NO validation errors
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'verify_modal') return;

    // Get answers - accept ANY input
    const name = interaction.fields.getTextInputValue('name') || 'Not provided';
    const age = interaction.fields.getTextInputValue('age') || 'Not provided';
    const device = interaction.fields.getTextInputValue('device') || 'Not provided';

    // Always defer reply to prevent timeout
    await interaction.deferReply({ ephemeral: true });

    try {
        // Assign role
        const member = interaction.member;
        const role = interaction.guild.roles.cache.get(verifyRoleId);

        if (!role) {
            await interaction.editReply({ 
                content: '⚠️ Verification role not found. Please contact an administrator.', 
                ephemeral: true 
            });
            return;
        }

        // Add role
        await member.roles.add(role);
        
        // Success message - ALWAYS works
        await interaction.editReply({ 
            content: `✅ **Verification successful!**\nWelcome to the server, ${name}!`, 
            ephemeral: true 
        });

        // Send log to log channel
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ User Verified')
                .setDescription(`**User:** ${member.user} (${member.user.tag})\n**User ID:** ${member.user.id}`)
                .addFields(
                    { name: '📝 Name', value: name, inline: true },
                    { name: '🎂 Age', value: age, inline: true },
                    { name: '💻 Device', value: device, inline: true }
                )
                .setFooter({ text: `Verified at` })
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
            console.log(`📊 Log sent for ${member.user.tag}`);
        }

    } catch (error) {
        // Even if error occurs, show friendly message
        console.error('Verification error:', error);
        
        // Try one more time to assign role
        try {
            await interaction.member.roles.add(verifyRoleId);
            await interaction.editReply({ 
                content: '✅ Verification successful! Welcome to the server!', 
                ephemeral: true 
            });
        } catch (retryError) {
            await interaction.editReply({ 
                content: '⚠️ There was a small issue, but your verification has been recorded. Please contact an admin if you dont get access in 1 minute.', 
                ephemeral: true 
            });
        }
    }
});

// Error handler to prevent crashes
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

client.login(token);
