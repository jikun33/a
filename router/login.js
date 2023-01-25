
const axios = require('axios');
const router = require("express").Router();
const setting = require('../config.json');
const func = require("../func");
const client = globalThis.client;

router.get('/', async (req, res) => {
    try {
        if (!req?.query?.code) return res.render("./login.ejs", { content: { title: "エラー", content: "パラメーター不足", url: "https://cdn.discordapp.com/attachments/1010769751334727680/1066605959411150868/favicon.png" } });
        axios.post("https://discord.com/api/oauth2/token", {
            'client_id': setting.discord.clientid,
            'client_secret': setting.discord.clientsecret,
            'grant_type': 'authorization_code',
            'code': `${req.query.code}`,
            'redirect_uri': setting.discord.siteurl,
        }, { headers: { "Accept-Encoding": "gzip,deflate,compress", 'Content-Type': 'application/x-www-form-urlencoded' } })
            .catch(() => { })
            .then(async data => {
                if (!data) return res.render("./login.ejs", { content: { title: "エラー", content: "認証に失敗しました。<br>不明なアクセス", url: "https://cdn.discordapp.com/attachments/1010769751334727680/1066605959411150868/favicon.png" } });
                if (!data?.data?.scope.split(" ")?.includes("guilds.join")) return res.render("./login.ejs", { content: { title: "エラー", content: "スコープ不足", url: "https://cdn.discordapp.com/attachments/1010769751334727680/1066605959411150868/favicon.png" } });
                if (!data?.data?.scope.split(" ")?.includes("identify")) return res.render("./login.ejs", { content: { title: "エラー", content: "スコープ不足", url: "https://cdn.discordapp.com/attachments/1010769751334727680/1066605959411150868/favicon.png" } });
                const user = await axios.get('https://discordapp.com/api/users/@me', { headers: { "Accept-Encoding": "gzip,deflate,compress", "Authorization": `Bearer ${data.data.access_token}` } });
                if (!user?.data?.id) return res.render("./login.ejs", { content: { title: "エラー", content: "貴方の情報が見つけ出せませんでした<br>もう一度行ってください。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                if (!req?.query?.state) return res.render("./login.ejs", { content: { title: "エラー", content: "Discordサーバーを見つけることができませんでした。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                const guild = req?.query?.state;
                const user_check = await func.dbget({ table: `guild`, v: `userid="${user.data.id}" and guildid="${guild}"` });
                if (!user_check[0]?.userid) {
                    const set = await func.dbset({ table: `guild`, v: `"${guild}","${user.data.id}"` });
                    if (!set) return res.render("./login.ejs", { content: { title: "エラー", content: "サーバーデータの保存に失敗しました。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                };
                const token_check = await func.dbget({ table: "token", v: `userid="${user.data.id}"` });
                if (token_check[0]?.userid) {
                    const set2 = await func.dbupdate({ table: `token`, set: `token="${data.data.refresh_token}"`, v: `userid="${user.data.id}"` });
                    if (!set2) return res.render("./login.ejs", { content: { title: "エラー", content: "アクセスデータの更新に失敗しました。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                } else {
                    const set2 = await func.dbset({ table: `token`, v: `${user.data.id},"${data.data.refresh_token}"` });
                    if (!set2) return res.render("./login.ejs", { content: { title: "エラー", content: "アクセスデータの保存に失敗しました。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                };
                const roleb = await func.dbget({ table: "verify", v: `guildid="${guild}"` });
                const rolea = String(roleb[0]?.roleid)?.replace("n", "");
                if (!rolea) return res.render("./login.ejs", { content: { title: "エラー", content: "対象サーバーに登録されているロールが見つかりませんでした。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                const check = await client.guilds.cache.get(guild);
                if (!check) return res.render("./login.ejs", { content: { title: "エラー", content: "対象のサーバーを見つけることができませんでした。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                const guilds = await client.guilds.cache.get(guild).members.fetch(user.data.id).catch(() => { });
                if (!guilds.roles) return res.render("./login.ejs", { content: { title: "エラー", content: "対象のサーバーであなたを見つけることができませんでした。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                const add = await guilds.roles?.add(rolea).catch(() => { });
                if (!add) return res.render("./login.ejs", { content: { title: "エラー", content: "ロール付与に失敗しました。", url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
                return res.render("./login.ejs", { content: { title: "ロール付与に成功しました", content: `詳細<br>付与サーバー${add.guild.name}<br>付与ユーザー:${add.user.username}#${add.user.discriminator}`, url: `https://cdn.discordapp.com/avatars/${user.data.id}/${user.data.avatar}.webp` } });
            });
    } catch (error) {
    }
});
module.exports = router;