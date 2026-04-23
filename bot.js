const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuration - Channel IDs
const CONFIG = {
    VERIFY_PANEL_CHANNEL_ID: '1496890716973170718',
    LOG_CHANNEL_ID: '1496890948960125059',
    VERIFY_ROLE_ID: '1480969773402554381',
    IMAGE_URL: 'https://media.discordapp.net/attachments/1462437612647088335/1482006389843824670/content.png'
};

// Ready event
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online and ready!`);
    console.log(`📡 Bot is logged in and active`);
    
    // Optional: Send verify panel to the channel (uncomment if needed)
    // await sendVerifyPanel();
});

// Command to manually send the verify panel (use !verifypanel)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.content.toLowerCase() === '!verifypanel') {
        // Check if user has admin permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ You need administrator permissions to use this command.');
        }
        
        await sendVerifyPanelToChannel(message.channel);
        await message.reply('✅ Verify panel has been sent!');
    }
});

// Function to send verify panel
async function sendVerifyPanelToChannel(channel) {
    const embed = new EmbedBuilder()
        .setTitle('🌟 VERIFICATION CENTER')
        .setDescription(
            '### Welcome to the Community!\n\n' +
            'To gain access to the server and unlock all channels, please verify your identity.\n\n' +
            '**Why verify?**\n' +
            '• 🛡️ Keep the community safe from raiders and bots\n' +
            '• 🎯 Get access to exclusive content and events\n' +
            '• 🤝 Connect with verified members\n' +
            '• ⭐ Unlock all server features\n\n' +
            '---\n\n' +
            '### 📝 Instructions:\n' +
            'Click the **VERIFY** button below and fill out the short form.\n\n' +
            '*The process takes less than 30 seconds.*'
        )
        .setColor('#2B7A3E')
        .setImage(CONFIG.IMAGE_URL)
        .setFooter({ text: 'Verification System • Secure Access', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel('🔓 VERIFY NOW')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

    await channel.send({
        embeds: [embed],
        components: [button]
    });
}

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'verify_button') {
        // Create modal for verification
        const modal = new ModalBuilder()
            .setCustomId('verify_modal')
            .setTitle('🔐 Verification Form');

        // Name input
        const nameInput = new TextInputBuilder()
            .setCustomId('user_name')
            .setLabel('What is your name?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., John Doe or "Alex"')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(50);

        // Age input
        const ageInput = new TextInputBuilder()
            .setCustomId('user_age')
            .setLabel('How old are you?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., 21')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(3);

        // Device input
        const deviceInput = new TextInputBuilder()
            .setCustomId('user_device')
            .setLabel('Are you using PC or Mobile?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('PC / Mobile / Both')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(10);

        // Add inputs to modal rows
        const firstRow = new ActionRowBuilder().addComponents(nameInput);
        const secondRow = new ActionRowBuilder().addComponents(ageInput);
        const thirdRow = new ActionRowBuilder().addComponents(deviceInput);

        modal.addComponents(firstRow, secondRow, thirdRow);

        await interaction.showModal(modal);
    }
});

// Handle modal submissions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId === 'verify_modal') {
        // Get answers from modal
        const userName = interaction.fields.getTextInputValue('user_name');
        const userAge = interaction.fields.getTextInputValue('user_age');
        const userDevice = interaction.fields.getTextInputValue('user_device');
        
        // Defer reply to give time for processing
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Get the guild and member
            const guild = interaction.guild;
            const member = interaction.member;
            const role = guild.roles.cache.get(CONFIG.VERIFY_ROLE_ID);
            
            if (!role) {
                console.error('❌ Role not found! Check the role ID.');
                return await interaction.editReply({
                    content: '❌ Verification system error: Role not found. Please contact an administrator.',
                    ephemeral: true
                });
            }
            
            // Check if user already has the role
            if (member.roles.cache.has(CONFIG.VERIFY_ROLE_ID)) {
                return await interaction.editReply({
                    content: '✅ You are already verified! You already have access to the server.',
                    ephemeral: true
                });
            }
            
            // Assign the verify role
            await member.roles.add(role);
            
            // Send success message to user
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Verification Successful!')
                .setDescription(
                    `**Welcome to the community, ${member.user.username}!**\n\n` +
                    `You have been successfully verified and now have access to all channels.\n\n` +
                    `**Your responses:**\n` +
                    `• 📛 Name: \`${userName}\`\n` +
                    `• 🎂 Age: \`${userAge}\`\n` +
                    `• 💻 Device: \`${userDevice}\`\n\n` +
                    `✨ Enjoy your stay and feel free to introduce yourself!`
                )
                .setColor('#2B7A3E')
                .setFooter({ text: 'Verification System', iconURL: client.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.editReply({
                embeds: [successEmbed],
                ephemeral: true
            });
            
            // Send log to log channel
            const logChannel = guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
            
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📋 New Verification Log')
                    .setDescription(
                        `**User successfully verified!**\n\n` +
                        `**User Information:**\n` +
                        `• 👤 User Mention: ${member.user}\n` +
                        `• 📛 Username: \`${member.user.tag}\` (${member.user.id})\n` +
                        `• 🆔 User ID: \`${member.user.id}\`\n\n` +
                        `**Verification Answers:**\n` +
                        `• 📛 Name: \`${userName}\`\n` +
                        `• 🎂 Age: \`${userAge}\`\n` +
                        `• 💻 Device: \`${userDevice}\`\n\n` +
                        `**Time & Date:**\n` +
                        `• ⏰ ${new Date().toLocaleString()}`
                    )
                    .setColor('#00FF00')
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                    .setFooter({ text: `User ID: ${member.user.id}`, iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
                console.log(`✅ Log sent for ${member.user.tag}`);
            } else {
                console.error('❌ Log channel not found!');
            }
            
        } catch (error) {
            console.error('Error during verification:', error);
            await interaction.editReply({
                content: '❌ An error occurred during verification. Please try again or contact an administrator.',
                ephemeral: true
            });
        }
    }
});

// Error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
    console.error('❌ BOT_TOKEN not found in environment variables!');
    process.exit(1);
}

client.login(TOKEN);
