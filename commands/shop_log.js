const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop_log')
        .setDMPermission(false)
        .addStringOption(option => option.setName("use").setDescription("操作を選択してください。").addChoices({ name: 'add', value: 'add' }, { name: 'delete', value: 'delete' }).setRequired(true))
        .addChannelOption(option => option.setName("log_channel").setDescription("logを残したいチャンネルを選択してください。").setRequired(true))
        .setDescription('指定のチャンネルに取引logを送信します。'),
    async execute(interaction) {
        if (interaction.options.getString("use") === "add") {
            const check = await func.dbset({ table: "log", v: `"${interaction.guildId}","${interaction.options.getChannel("log_channel").id}"` });
            if (!check) return await interaction.reply({ embeds: [{ title: "エラー", description: `データの保存に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
            await interaction.reply({ embeds: [{ title: "完了", description: `${interaction.options.getChannel("log_channel")}にlogを残します。`, color: 0x3aeb34 }], ephemeral: true });
        };
        if (interaction.options.getString("use") === "delete") {
            const check = await func.dbdelete({ table: "log", v: `channelid="${interaction.options.getChannel("log_channel").id}"` });
            if (!check) return await interaction.reply({ embeds: [{ title: "エラー", description: `データの削除に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
            await interaction.reply({ embeds: [{ title: "完了", description: `${interaction.options.getChannel("log_channel")}のlogの更新を止めました。`, color: 0x3aeb34 }], ephemeral: true });
        };
    }
};