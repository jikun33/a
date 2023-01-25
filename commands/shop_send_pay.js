const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const func = require('../func');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop_send_panel')
        .setDMPermission(false)
        .setDescription('送金パネルを表示します。'),
    async execute(interaction) {
        const check = await func.dbget({ table: "paypay", v: `id="${interaction.user.id}"` });
        if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `paypayにサインアップしてください。`, color: 0x3aeb34 }], ephemeral: true });
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`send,${interaction.user.id}`)
                    .setLabel('送金')
                    .setStyle(ButtonStyle.Primary),
            )

        await interaction.reply({ embeds: [{ title: "送金", description: `下のボタンを押して送金できます。`, color: 0x3aeb34 }], components: [button] });
    }
};