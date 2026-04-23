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

    // Create modal
    const modal = new ModalBuilder()
        .setCustomId('verify_modal')
        .setTitle('Verification Form');

    // Question 1: Name
    const nameInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('chno smytk')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Write your name')
        .setRequired(true);

    // Question 2: Age
    const ageInput = new TextInputBuilder()
        .setCustomId('age')
        .setLabel('ch7al f3mrk')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Your age')
        .setRequired(true);

    // Question 3: Device
    const deviceInput = new TextInputBuilder()
        .setCustomId('device')
        .setLabel('chno consol li 3ndk (PC / Phone)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('PC or Phone')
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(ageInput),
        new ActionRowBuilder().addComponents(deviceInput)
    );

    await interaction.showModal(modal);
});

// Handle modal submit
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'verify_modal') return;

    const name = interaction.fields.getTextInputValue('name');
    const age = interaction.fields.getTextInputValue('age');
    const device = interaction.fields.getTextInputValue('device');

    await interaction.deferReply({ ephemeral: true });

    try {
        // Assign role
        const member = interaction.member;
        const role = interaction.guild.roles.cache.get(verifyRoleId);

        if (!role) {
            await interaction.editReply({ content: '❌ Verification role not found. Contact an admin.', ephemeral: true });
            return;
        }

        await member.roles.add(role);

        // Send success message
        await interaction.editReply({ content: `✅ Verified successfully! Welcome ${name}!`, ephemeral: true });

        // Send log
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📋 User Verified')
                .setDescription(`**User:** ${member.user} (${member.user.tag})\n**ID:** ${member.user.id}`)
                .addFields(
                    { name: '📝 Name', value: name, inline: true },
                    { name: '🎂 Age', value: age, inline: true },
                    { name: '💻 Device', value: device, inline: true }
                )
                .setFooter({ text: 'Verification System' })
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: '❌ An error occurred. Please try again.', ephemeral: true });
    }
});

client.login(token);
