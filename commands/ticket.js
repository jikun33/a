const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .addStringOption(option => option.setName("title").setDescription("タイトルを設定"))
        .addStringOption(option => option.setName("description").setDescription("説明を設定"))
        .addStringOption(option => option.setName("label").setDescription("ボタンの名前"))
        .addAttachmentOption(option => option.setName("image").setDescription("表示したい画像"))
        .setDMPermission(false)
        .setDescription('チケットを作成します'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ embeds: [{ title: "エラー", description: "管理者権限が不足しています。", color: 0x3aeb34 }], ephemeral: true });
        const options = interaction.options;
        const ticket_button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_button')
                    .setLabel(options.getString("label") || '🎫チケット発行')
                    .setStyle(ButtonStyle.Success)
            );
        await interaction.reply({ embeds: [{ title: options.getString("title") || "お問い合わせ", description: options.getString("description") || "サポートとのチケットを発行します。\n発行後、メンションしたチャンネルにて質問などをご記入ください。", color: 0x3aeb34, image: { url: options.getAttachment("image")?.attachment } }], components: [ticket_button] });
    },
};