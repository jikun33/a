const { PermissionsBitField, Client, GatewayIntentBits, Collection, ActionRowBuilder, StringSelectMenuBuilder, ActivityType, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], rest: 60000 });
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const setting = require('./config.json');
const func = require('./func.js');
const tokenup = require('./tokenupdate.js');
const express = require('express');
const paypayfunc = require('./paypayfunc');
const uuid = require('uuid');
const moment = require("moment");
const app = express();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const close_button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒チケットを閉じる').setStyle(ButtonStyle.Danger));
const close_button1 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒チケットを閉じる').setStyle(ButtonStyle.Danger).setDisabled(true));
const cancel_button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_cancel').setLabel('✖キャンセル').setStyle(ButtonStyle.Danger));
globalThis.client = client;
client.commands = new Collection();
app.listen(setting.port);
app.use(express.static('./views'));
app.use("/login", require("./router/login.js"));
app.set("view engine", "ejs");
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) { client.commands.set(command.data.name, command) } else console.log(`[注意] ${filePath} のプロパティが無効です.`);
};
client.once("ready", async () => {
    await func.dbsetup()　　//初回のみ
    client.user.setPresence({ activities: [{ name: `${setting.discord.name}`, type: ActivityType.Streaming }], status: 'dnd' });
    if (new Date().getHours() == 3) await tokenup.refresh(func);
    setInterval(() => {
        if (new Date().getHours() == 3) tokenup.refresh(func);
    }, 3300 * 1000);
    await client.application.commands.set(client.commands.map(d => d.data), "");
    console.log(`${client.user.username}を起動しました。`);
});
client.on("messageCreate", async message => {
    if (!message.content.includes("https://pay.paypay.ne.jp/")) return;
    const auto = await func.dbget({ table: "auto", v: `guildid="${interaction.guildId}"` });
    if (!auto[0]?.channelid == message.channel.id) return;
    const link = message.content.replace("https://pay.paypay.ne.jp/", "");
    const header = { "Content-Type": "application/json", Authorization: `Bearer ${setting.paypay.token}`, "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0", "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": uuid.v4(), Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": uuid.v4() }
    const response = await axios.get(`https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?verificationCode=${link}&payPayLang=ja`, { headers: header }).catch(e => { console.log(`Paypayリンク解析エラー:${e.message}`) });
    if (!response?.data?.header) return await message.channel.send({ embeds: [{ title: "エラー", description: `BOT管理者に問い合わせてください。`, color: 0x3aeb34 }], ephemeral: true });
    if (response.data.header.resultCode == "S9999") return await message.channel.send({ embeds: [{ title: "エラー", description: `リンクが無効または期限切れです。`, color: 0x3aeb34 }], ephemeral: true });
    if (response.data.header.resultCode == "S0000") {
        if (response.data.payload.orderStatus == "SUCCESS") return await message.channel.send({ embeds: [{ title: "エラー", description: `受け取り済みのリンクです。`, color: 0x3aeb34 }], ephemeral: true });
        if (response.data.payload.orderStatus == "PENDING") {
            let r = await axios.post("https://app4.paypay.ne.jp/bff/v2/acceptP2PSendMoneyLink?payPayLang=ja",
                {
                    verificationCode: String(link),
                    passcode: "",
                    requestId: uuid.v4().toUpperCase(),
                    requestAt: moment(new Date()).tz("Asia/Tokyo").format("YYYY-MM-DDTHH:mm:ss+0900"),
                    iosMinimumVersion: "2.55.0", androidMinimumVesrsion: "2.55.0",
                    orderId: response.data.payload.message.data.orderId,
                    senderChannelUrl: response.data.payload.message.chatRoomId,
                    senderMessageId: response.data.payload.message.messageId,
                }, { headers: header });
            if (r.data.header.resultCode == "S9999") return await message.channel.send({ embeds: [{ title: "エラー", description: `パスコードが間違っています。`, color: 0x3aeb34 }], ephemeral: true });
            if (r.data.header.resultCode == "S0000") {
                await interaction.channel.setTopic("success");
                await message.channel.send({ embeds: [{ title: "お知らせ", description: `${response.data.payload.pendingP2PInfo.amount}円受け取りました。`, color: 0x3aeb34 }], ephemeral: true });
            };
            if (r.data.header.resultCode == "S5000") {
                await message.channel.send({ embeds: [{ title: "エラー", description: `PayPayサーバーでエラーが発生しました。\n詳細:${r.data.header.resultMessage}\n数時間おいてもう一度お試しください。`, color: 0x3aeb34 }], ephemeral: true });
            };
        };
    };
});
client.on("interactionCreate", async interaction => {
    if (interaction.user.bot) return;
    try {
        if (interaction.isChatInputCommand()) await interaction.client.commands.get(interaction.commandName).execute(interaction);
        if (interaction.isButton()) {
            if (interaction.customId == "delete_channel") {
                const cloned = await interaction.channel.clone();
                await cloned.setPosition(interaction.channel.position);
                await cloned.send({ embeds: [{ title: "Nuke", description: `${interaction.user}がチャンネルをのログを全て削除しました。`, color: 0x3aeb34 }] });
                await interaction.channel.delete();
            };
            if (interaction.customId == "ticket_button") {
                const new_channel = await interaction.guild.channels.create({ name: `￤🎫-${interaction.user.username}￤`, permissionOverwrites: [{ id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] });
                await new_channel.send({ embeds: [{ title: "お問い合わせ", description: "スタッフが来るまでお待ちください。", color: 0x3aeb34 }], components: [close_button] });
                await new_channel.send({ content: `${interaction.member}` })
                await interaction.reply({ embeds: [{ title: "Ticket", description: `チケットを作成しました。\nチャンネルを開いて質問などをご記入ください。\n${new_channel}`, color: 0x3aeb34 }], ephemeral: true });
            };
            if (interaction.customId == "ticket_close") {
                const channel = await interaction.channel.messages.fetch({ after: '0', limit: 1 });
                const message = await interaction.channel.messages.fetch(channel.map(x => x.id)[0]);
                await message.edit({ embeds: [{ title: "お問い合わせ", description: "スタッフが来るまでお待ちください。", color: 0x3aeb34 }], components: [close_button1] });
                await interaction.reply({ embeds: [{ title: "Ticket", description: "5秒後にチケットが削除されます。\nキャンセルするには下記のキャンセルボタンを押してください。", color: 0x3aeb34 }], components: [cancel_button], ephemeral: true });
                func.delete_timer({ action: interaction.channel, type: "delete" });
            };
            if (interaction.customId == "ticket_cancel") {
                func.delete_timer({ action: interaction.channel, type: "cancel" });
                const channel = await interaction.channel.messages.fetch({ after: '0', limit: 1 });
                const message = await interaction.channel.messages.fetch(channel.map(x => x.id)[0]);
                await message.edit({ embeds: [{ title: "お問い合わせ", description: "スタッフが来るまでお待ちください。", color: 0x3aeb34 }], components: [close_button] });
                await interaction.reply({ embeds: [{ title: "Ticket", description: "チケットの削除がキャンセルされました。", color: 0x3aeb34 }], ephemeral: true });
            };
            if (interaction.customId.startsWith("buy")) {
                const id = interaction.customId.split(",")[1];
                const category = interaction.customId.split(",")[2];
                const check = await func.dbget({ table: "paypay", v: `id="${id}"` });
                if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `販売者の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const items = await func.dbget({ table: "goods", v: `username="${check[0]?.name}" and category="${category}"` });
                if (!items[0]?.username) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const goods = items.map(c => { return { name: c.name, amount: c.amount } });
                if (!goods[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const selectdata = items.map(data => { return { label: data.name.slice(0, 15), description: `${data.amount}円です`, value: data.id } })
                const select = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('buy')
                            .setPlaceholder('何も選択されていません')
                            .addOptions(selectdata),
                    );
                await interaction.reply({ embeds: [{ title: "shop", description: `${goods.map(data => `**${data.name}**\n${data.amount}円`).join("\n\n")}`, color: 0x3aeb34 }], components: [select], ephemeral: true });
            };
            if (interaction.customId.startsWith("send")) {
                const id = interaction.customId.split(",")[1];
                const check = await func.dbget({ table: "paypay", v: `id="${id}"` });
                if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `送金先のアカウントの情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const modal = new ModalBuilder()
                    .setCustomId(`send,${id}`)
                    .setTitle('送金');
                const link = new TextInputBuilder()
                    .setCustomId('link')
                    .setLabel("リンク")
                    .setRequired(true)
                    .setPlaceholder('https://pay.paypay.ne.jp/123456789ABCDEFG')
                    .setStyle(TextInputStyle.Short);
                const pass = new TextInputBuilder()
                    .setCustomId('pass')
                    .setLabel("パスコード")
                    .setRequired(false)
                    .setPlaceholder('1234')
                    .setMaxLength(4)
                    .setStyle(TextInputStyle.Short);
                const linkActionRow = new ActionRowBuilder().addComponents(link);
                const passActionRow = new ActionRowBuilder().addComponents(pass);
                modal.addComponents(linkActionRow, passActionRow);
                await interaction.showModal(modal);
            };
            if (interaction.customId.startsWith("ch")) {
                const id = interaction.customId.split(",")[1];
                const category = interaction.customId.split(",")[2];
                const check = await func.dbget({ table: "paypay", v: `id="${id}"` });
                if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `販売者の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const items = await func.dbget({ table: "goods", v: `username="${check[0]?.name}" and category="${category}"` });
                if (!items[0]?.username) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const goods = items.map(c => c.id);
                const name = items.map(c => { return { name: c.name, id: c.id } });
                if (!goods[0]) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const datas = await func.dbget({ table: "inventory", v: `id="${goods.join('" or id="')}"` });
                await interaction.reply({ embeds: [{ title: "shop", description: `${name.map(data => `**${data.name}**\n${datas.filter(c => c.id == data.id).length}個`).join("\n\n")}`, color: 0x3aeb34 }], ephemeral: true });
            };
        };
        if (interaction.isStringSelectMenu()) {
            const buy = interaction.values[0];
            const item = await func.dbget({ table: "inventory", v: `id="${buy}"` });
            if (!item[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `在庫切れ`, color: 0x3aeb34 }], ephemeral: true });
            const modal = new ModalBuilder()
                .setCustomId(`buy,${item[0]?.id}`)
                .setTitle('支払い。');
            const link = new TextInputBuilder()
                .setCustomId('link')
                .setLabel("リンク")
                .setRequired(true)
                .setPlaceholder('https://pay.paypay.ne.jp/123456789ABCDEFG')
                .setStyle(TextInputStyle.Short);
            const pass = new TextInputBuilder()
                .setCustomId('pass')
                .setLabel("パスコード")
                .setRequired(false)
                .setPlaceholder('1234')
                .setMaxLength(4)
                .setStyle(TextInputStyle.Short);
            const linkActionRow = new ActionRowBuilder().addComponents(link);
            const passActionRow = new ActionRowBuilder().addComponents(pass);
            modal.addComponents(linkActionRow, passActionRow);
            await interaction.showModal(modal);
        };
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith("buy")) {
                const id = interaction.customId.split(",")[1];
                const goods = await func.dbget({ table: "goods", v: `id="${id}"` });
                if (!goods[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `商品情報を読み込めませんでした`, color: 0x3aeb34 }], ephemeral: true });
                const blink = interaction.fields.getTextInputValue("link")
                if (!blink.includes("https://pay.paypay.ne.jp/")) return await interaction.reply({ embeds: [{ title: "エラー", description: `リンクが無効です。`, color: 0x3aeb34 }], ephemeral: true });
                const link = blink.replace("https://pay.paypay.ne.jp/", "");
                const pass = interaction.fields.getTextInputValue('pass');
                const item = await func.dbget({ table: "inventory", v: `id="${id}"` });
                if (!item[0]?.id) return await interaction.reply({ embeds: [{ title: "エラー", description: `在庫切れ`, color: 0x3aeb34 }], ephemeral: true });
                const paypay = await func.dbget({ table: "paypay", v: `name="${goods[0].username}"` });
                if (!paypay[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `販売者の情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const header = { "Content-Type": "application/json", Authorization: `Bearer ${paypay[0].token}`, "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0", "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": uuid.v4(), Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": uuid.v4() }
                const response = await axios.get(`https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?verificationCode=${link}&payPayLang=ja`, { headers: header }).catch(e => { console.log(`Paypayリンク解析エラー:${e.message}`) });
                if (!response?.data?.header) await interaction.reply({ embeds: [{ title: "エラー", description: `出品者のPayPayアカウントが無効です。(連携が切れています)\n出品者にもう一度paypayに"Singin"するように連絡してください。\n注:SingUpではありません。`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S9999") await interaction.reply({ embeds: [{ title: "エラー", description: `リンクが無効または期限切れです。`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S0000") {
                    if (response.data.payload.orderStatus == "SUCCESS") return await interaction.reply({ embeds: [{ title: "エラー", description: `受け取り済みのリンクです。`, color: 0x3aeb34 }], ephemeral: true });
                    if (response.data.payload.orderStatus == "PENDING") {
                        if (response.data.payload.pendingP2PInfo.amount !== Number(goods[0].amount)) return await interaction.reply({ embeds: [{ title: "エラー", description: `金額が一致しません`, color: 0x3aeb34 }], ephemeral: true });
                        let r = await axios.post("https://app4.paypay.ne.jp/bff/v2/acceptP2PSendMoneyLink?payPayLang=ja",
                            {
                                verificationCode: String(link),
                                passcode: String(pass),
                                requestId: uuid.v4().toUpperCase(),
                                requestAt: moment(new Date()).tz("Asia/Tokyo").format("YYYY-MM-DDTHH:mm:ss+0900"),
                                iosMinimumVersion: "2.55.0", androidMinimumVesrsion: "2.55.0",
                                orderId: response.data.payload.message.data.orderId,
                                senderChannelUrl: response.data.payload.message.chatRoomId,
                                senderMessageId: response.data.payload.message.messageId,
                            }, { headers: header });
                        if (r.data.header.resultCode == "S9999") return interaction.reply({ embeds: [{ title: "エラー", description: `パスコードが間違っています。`, color: 0x3aeb34 }], ephemeral: true });
                        if (r.data.header.resultCode == "S0000") {
                            await func.dbdelete({ table: "inventory", v: `id="${item[0]?.id}" and item="${item[0].item}" limit 1` })
                            await interaction.reply({ embeds: [{ title: "購入完了", description: `${item[0].item}`, color: 0x3aeb34 }], ephemeral: true });
                            const log = await func.dbget({ table: "log", v: `guildid="${interaction.guildId}"` });
                            if (!log[0]?.channelid) return;
                            await Promise.all(log.map(async c => {
                                if (!c?.channelid) return;
                                await interaction.guild.channels.cache.get(`${c.channelid}`).send({ embeds: [{ title: `購入通知`, description: `${interaction.user.tag}が購入を完了しました。\n商品名:${goods[0]?.name || "情報の取得に失敗しました。"}\n値段:${goods[0]?.amount || "情報の取得に失敗しました。"}\nカテゴリー:${goods[0]?.category || "情報の取得に失敗しました。"}`, color: 0x3aeb34 }] })
                                    .catch(async () => await func.dbdelete({ table: "log", v: `channelid="${c.channelid}"` }));
                            }));
                        };
                        if (r.data.header.resultCode == "S5000") {
                            await interaction.reply({ embeds: [{ title: "エラー", description: `PayPayサーバーでエラーが発生しました。\n詳細:${r.data.header.resultMessage}\n数時間おいてもう一度お試しください。`, color: 0x3aeb34 }], ephemeral: true });
                        };
                    };
                };
            };
            if (interaction.customId.startsWith("send")) {
                const id = interaction.customId.split(",")[1];
                const blink = interaction.fields.getTextInputValue("link")
                if (!blink.includes("https://pay.paypay.ne.jp/")) return await interaction.reply({ embeds: [{ title: "エラー", description: `リンクが無効です。`, color: 0x3aeb34 }], ephemeral: true });
                const link = blink.replace("https://pay.paypay.ne.jp/", "");
                const pass = interaction.fields.getTextInputValue('pass');
                const paypay = await func.dbget({ table: "paypay", v: `id="${id}"` });
                if (!paypay[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `送金先のアカウントの情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
                const header = { "Content-Type": "application/json", Authorization: `Bearer ${paypay[0].token}`, "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0", "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": uuid.v4(), Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": uuid.v4() }
                const response = await axios.get(`https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?verificationCode=${link}&payPayLang=ja`, { headers: header }).catch(e => { console.log(`Paypayリンク解析エラー:${e.message}`) });
                if (!response?.data?.header) await interaction.reply({ embeds: [{ title: "エラー", description: `送金先のPayPayアカウントが無効です。(連携が切れています)\n送金の人にもう一度paypayに"Singin"するように連絡してください。\n注:SingUpではありません。`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S9999") await interaction.reply({ embeds: [{ title: "エラー", description: `リンクが無効または期限切れです。`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S0000") {
                    if (response.data.payload.orderStatus == "SUCCESS") return await interaction.reply({ embeds: [{ title: "エラー", description: `受け取り済みのリンクです。`, color: 0x3aeb34 }], ephemeral: true });
                    if (response.data.payload.orderStatus == "PENDING") {
                        let r = await axios.post("https://app4.paypay.ne.jp/bff/v2/acceptP2PSendMoneyLink?payPayLang=ja",
                            {
                                verificationCode: String(link),
                                passcode: String(pass),
                                requestId: uuid.v4().toUpperCase(),
                                requestAt: moment(new Date()).tz("Asia/Tokyo").format("YYYY-MM-DDTHH:mm:ss+0900"),
                                iosMinimumVersion: "2.55.0", androidMinimumVesrsion: "2.55.0",
                                orderId: response.data.payload.message.data.orderId,
                                senderChannelUrl: response.data.payload.message.chatRoomId,
                                senderMessageId: response.data.payload.message.messageId,
                            }, { headers: header });
                        if (r.data.header.resultCode == "S9999") return interaction.reply({ embeds: [{ title: "エラー", description: `パスコードが間違っています。`, color: 0x3aeb34 }], ephemeral: true });
                        if (r.data.header.resultCode == "S0000") {
                            await interaction.reply({ embeds: [{ title: "送金完了", description: `${response.data.payload.pendingP2PInfo.amount}円`, color: 0x3aeb34 }], ephemeral: true });
                            const log = await func.dbget({ table: "log", v: `guildid="${interaction.guildId}"` });
                            if (!log[0]?.channelid) return;
                            await Promise.all(log.map(async c => {
                                if (!c?.channelid) return;
                                await interaction.guild.channels.cache.get(`${c.channelid}`).send({ embeds: [{ title: `送金通知。`, description: `${interaction.user}から送金されました\n金額:${response.data.payload.pendingP2PInfo.amount}円`, color: 0x3aeb34 }] })
                                    .catch(async () => await func.dbdelete({ table: "log", v: `channelid="${c.channelid}"` }));
                            }));
                        };
                        if (r.data.header.resultCode == "S5000") {
                            await interaction.reply({ embeds: [{ title: "エラー", description: `PayPayサーバーでエラーが発生しました。\n詳細:${r.data.header.resultMessage}\n数時間おいてもう一度お試しください。`, color: 0x3aeb34 }], ephemeral: true });
                        };
                    };
                };
            };
            if (interaction.customId.startsWith("pay")) {
                const id = interaction.customId.split(",")[1];
                const data = await paypayfunc.otp(id);
                if (!data) return await interaction.reply({ embeds: [{ title: "エラー", description: `タイムアウトしました。\nもう一度お試しください。`, color: 0x3aeb34 }], ephemeral: true })
                const aut = interaction.fields.getTextInputValue('aut');
                const header = { "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": data.client_uuid, Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": data.device_uuid };
                const response = await axios.post("https://app4.paypay.ne.jp/bff/v1/signInWithSms", { payPayLang: "ja", otp: aut, otpReferenceId: data.rid }, { headers: header }).catch(e => { console.log(`otp認証に失敗しました。\n詳細:${e.message}`) });
                if (!response) return await interaction.reply({ embeds: [{ title: "エラー", description: `リクエストに失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                if (response.error?.backendResultCode) return await interaction.reply({ embeds: [{ title: "エラー", description: `OTP認証に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                const check = await func.dbget({ table: "paypay", v: `name="${data.name}"` });
                if (check[0]?.name) {
                    const set = await func.dbupdate({ table: "paypay", set: `pass="${data.ps}",token="${response.data.payload.accessToken}",id="${data.id}"`, v: `name="${data.name}"` });
                    if (!set) return await interaction.reply({ embeds: [{ title: "エラー", description: `データの保存に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                    await interaction.reply({ embeds: [{ title: "お知らせ", description: `設定しました。`, color: 0x3aeb34 }], ephemeral: true });
                } else {
                    const set = await func.dbset({ table: "paypay", v: `"${data.name}","${data.ps}","${response.data.payload.accessToken}","${data.id}"` });
                    if (!set) return await interaction.reply({ embeds: [{ title: "エラー", description: `データの保存に失敗しました。`, color: 0x3aeb34 }], ephemeral: true });
                    await interaction.reply({ embeds: [{ title: "お知らせ", description: `設定しました。`, color: 0x3aeb34 }], ephemeral: true });
                };
            };
        };
    } catch (error) {
        console.error(`コマンドを実行する際エラーが発生しました\n詳細:${error}\nコマンド実行者:${interaction.user.tag}`);
        await interaction.reply({ embeds: [{ title: "エラー", description: `コマンドを実行する際エラーが発生しました\n詳細:${error}`, color: 0x3aeb34 }], ephemeral: true }).catch(() => { });
    };
});
client.login(setting.discord.token)