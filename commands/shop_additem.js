const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
const { v4: uuidv4 } = require('uuid');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop_additem')
        .addStringOption(option => option.setName("category").setDescription("カテゴリー名(50文字)").setRequired(true))
        .addStringOption(option => option.setName("name").setDescription("商品名(50文字)").setRequired(true))
        .addStringOption(option => option.setName("item").setDescription("半角空白で複数(1商品当たり50文字)").setRequired(true))
        .addNumberOption(option => option.setName("amount").setDescription("値段を入力してください(最大10万)").setRequired(true))
        .setDescription('商品を追加します。'),
    async execute(interaction) {
        const option = interaction.options;
        if (option.getString("name").length > 50) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品名は50字以内にしてください。`, color: 0x3aeb34 }], ephemeral: true });
        if (option.getString("category").length > 50) return await interaction.reply({ embeds: [{ title: "エラー", description: `カテゴリー名は50字以内にしてください。`, color: 0x3aeb34 }], ephemeral: true });
        if (option.getNumber("amount") < 1) return await interaction.reply({ embeds: [{ title: "エラー", description: `値段は1円以上にしてください。`, color: 0x3aeb34 }], ephemeral: true });
        if (option.getNumber("amount") > 100000) return await interaction.reply({ embeds: [{ title: "エラー", description: `値段は10万以下にしてください。`, color: 0x3aeb34 }], ephemeral: true });
        const check = await func.dbget({ table: "paypay", v: `id="${interaction.user.id}"` });
        if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `paypayにサインアップまたはサインインしてください。`, color: 0x3aeb34 }], ephemeral: true });
        const subsc = await func.dbget({ table: "subsc", v: `name="${check[0]?.name}"` });
        if (!subsc[0]?.subsc) return await interaction.reply({ embeds: [{ title: "エラー", description: `サブスクが有効ではありません。`, color: 0x3aeb34 }], ephemeral: true });
        if (subsc[0]?.subsc <= new Date()) return await interaction.reply({ embeds: [{ title: "エラー", description: `サブスクの有効期限切れです。`, color: 0x3aeb34 }], ephemeral: true });
        const shop = await func.dbget({ table: "goods", v: `name="${option.getString("name")}" and username="${check[0]?.name}"` });
        const items = option.getString("item").split(" ");
        if (!shop[0]?.name) {
            const id = uuidv4();
            const sizecheck = await func.dbget({ table: "goods", v: `category="${option.getString("category")}" and username="${check[0]?.name}"` });
            if (sizecheck.map(c => c).length > 25) return interaction.reply({ embeds: [{ title: "エラー", description: `カテゴリー中の最大商品数は25個です。`, color: 0x3aeb34 }], ephemeral: true });
            const set = await func.dbset({ table: "goods", v: `"${option.getString("name")}","${option.getNumber("amount")}","${check[0]?.name}","${id}","${option.getString("category")}"` });
            if (!set) return await interaction.reply({ embeds: [{ title: "エラー", description: "データの保存に失敗しました。", color: 0x3aeb34 }], ephemeral: true });
            const bshop = await func.dbget({ table: "inventory", v: `id="${id}"` });
            const q = bshop.map(item => item).length;
            if ((q + items.length) > 500) return await interaction.reply({ embeds: [{ title: "エラー", description: `在庫最大数は500個です。`, color: 0x3aeb34 }], ephemeral: true });
            await Promise.all(items.map(async item => {
                if (item.length > 50) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品内容は50字以内にしてください。`, color: 0x3aeb34 }], ephemeral: true });
                const set2 = await func.dbset({ table: "inventory", v: `"${id}","${item}"` });
                if (!set2) return await interaction.reply({ embeds: [{ title: "エラー", description: "データの保存に失敗しました。", color: 0x3aeb34 }], ephemeral: true });
            }));
        } else {
            const id = shop[0].id;
            const bshop = await func.dbget({ table: "inventory", v: `id="${id}"` });
            const q = bshop.map(item => item).length;
            if ((q + items.length) > 500) return await interaction.reply({ embeds: [{ title: "エラー", description: `在庫最大数は500個です。`, color: 0x3aeb34 }], ephemeral: true });
            await Promise.all(items.map(async item => {
                if (item.length > 50) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品内容は50字以内にしてください。`, color: 0x3aeb34 }], ephemeral: true });
                const set3 = await func.dbset({ table: "inventory", v: `"${id}","${item}"` });
                if (!set3) return await interaction.reply({ embeds: [{ title: "エラー", description: "データの保存に失敗しました。", color: 0x3aeb34 }], ephemeral: true });
            }));
        };

        await interaction.reply({ embeds: [{ title: "お知らせ", description: `完了。`, color: 0x3aeb34 }], ephemeral: true });
    }
};