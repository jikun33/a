const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const func = require('../func');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop_panel')
        .addStringOption(option => option.setName("category").setDescription("カテゴリー名(50文字)").setRequired(true))
        .setDMPermission(false)
        .setDescription('shopを表示します。'),
    async execute(interaction) {
        if (interaction.options.getString("category").length > 50) return await interaction.reply({ embeds: [{ title: "エラー", description: `カテゴリー名は50字以内にしてください。`, color: 0x3aeb34 }], ephemeral: true });
        const check = await func.dbget({ table: "paypay", v: `id="${interaction.user.id}"` });
        if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `paypayにサインアップしてください。`, color: 0x3aeb34 }], ephemeral: true });
        const items = await func.dbget({ table: "goods", v: `category="${interaction.options.getString("category")}" and username="${check[0]?.name}"` });
        const goods = items.map(c => { return { name: c.name, amount: c.amount } });
        if (!goods[0]) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`buy,${interaction.user.id},${interaction.options.getString("category")}`)
                    .setLabel('購入')
                    .setStyle(ButtonStyle.Primary),
            )
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ch,${interaction.user.id},${interaction.options.getString("category")}`)
                    .setLabel('在庫確認')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({ embeds: [{ title: "shop", description: `${goods.map(data => `${data.name}\n${data.amount}円`).join("\n\n")}`, color: 0x3aeb34 }], components: [button] });
    }
};