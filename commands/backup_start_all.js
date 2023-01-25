const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
const axios = require('axios');
const setting = require("../config.json");
const sleep = waitTime => new Promise(resolve => setTimeout(resolve, waitTime));
let wait;
module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup_start_all')
        .setDMPermission(false)
        .addStringOption(option => option.setName("password").setDescription("パスワードを入力してください").setRequired(true))
        .setDescription('認証メンバー全員を復元します。'),
    async execute(interaction) {
        if (wait) return await interaction.reply({ embeds: [{ title: "エラー", description: `別の人が実行中です。`, color: 0x3aeb34 }], ephemeral: true });
        if (interaction.options.getString("password") !== setting.password) return await interaction.reply({ embeds: [{ title: "エラー", description: `パスワードが間違っています。`, color: 0x3aeb34 }], ephemeral: true });
        await interaction.reply({ embeds: [{ title: "お知らせ", description: `処理中...`, color: 0x3aeb34 }], ephemeral: true });
        wait = true;
        const get_data = await func.dbget({ table: "token", v: "userid" });
        const datas = get_data.map(c => c);
        await Promise.all(datas.map(async token => {
            await interaction.editReply({ embeds: [{ title: "お知らせ", description: `ID:${token.userid}にリクエスト送信中...`, color: 0x3aeb34 }], ephemeral: true });
            await sleep(2000);
            const data = await axios.post("https://discord.com/api/oauth2/token", {
                'client_id': setting.discord.clientid,
                'client_secret': setting.discord.clientsecret,
                'grant_type': 'refresh_token',
                'refresh_token': token.token
            }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', "Accept-Encoding": "gzip,deflate,compress" } })
                .catch(async e => {
                    console.log(`TOKEN更新エラー:${e.message}`);
                    await func.dbdelete({ table: `token`, v: `userid="${token.userid}"` });
                });
            if (!data?.data) {
                await interaction.editReply({ embeds: [{ title: "お知らせ", description: `リクエストに失敗`, color: 0x3aeb34 }], ephemeral: true });
            } else {
                const update = await func.dbupdate({ table: `token`, set: `token="${data.data.refresh_token}"`, v: `userid="${token.userid}"` });
                if (!update) return await interaction.reply({ embeds: [{ title: "エラー", description: "データの更新に失敗しました。", color: 0x3aeb34 }], ephemeral: true });
                const user = await axios.get('https://discordapp.com/api/users/@me', { headers: { "Authorization": `Bearer ${data.data.access_token}`, "Accept-Encoding": "gzip,deflate,compress" } });
                await axios.put(`https://discord.com/api/guilds/${interaction.guildId}/members/${user.data.id}`, { access_token: data.data.access_token }, {
                    headers: {
                        authorization: `Bot ${setting.discord.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            };
        }));
        wait = false;
        await interaction.editReply({ embeds: [{ title: "お知らせ", description: `完了。`, color: 0x3aeb34 }], ephemeral: true });
    }
};