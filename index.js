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
const close_button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('๐ใใฑใใใ้ใใ').setStyle(ButtonStyle.Danger));
const close_button1 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_close').setLabel('๐ใใฑใใใ้ใใ').setStyle(ButtonStyle.Danger).setDisabled(true));
const cancel_button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_cancel').setLabel('โใญใฃใณใปใซ').setStyle(ButtonStyle.Danger));
globalThis.client = client;
client.commands = new Collection();
app.listen(setting.port);
app.use(express.static('./views'));
app.use("/login", require("./router/login.js"));
app.set("view engine", "ejs");
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) { client.commands.set(command.data.name, command) } else console.log(`[ๆณจๆ] ${filePath} ใฎใใญใใใฃใ็กๅนใงใ.`);
};
client.once("ready", async () => {
    await func.dbsetup()ใใ//ๅๅใฎใฟ
    client.user.setPresence({ activities: [{ name: `${setting.discord.name}`, type: ActivityType.Streaming }], status: 'dnd' });
    if (new Date().getHours() == 3) await tokenup.refresh(func);
    setInterval(() => {
        if (new Date().getHours() == 3) tokenup.refresh(func);
    }, 3300 * 1000);
    await client.application.commands.set(client.commands.map(d => d.data), "");
    console.log(`${client.user.username}ใ่ตทๅใใพใใใ`);
});
client.on("messageCreate", async message => {
    if (!message.content.includes("https://pay.paypay.ne.jp/")) return;
    const auto = await func.dbget({ table: "auto", v: `guildid="${interaction.guildId}"` });
    if (!auto[0]?.channelid == message.channel.id) return;
    const link = message.content.replace("https://pay.paypay.ne.jp/", "");
    const header = { "Content-Type": "application/json", Authorization: `Bearer ${setting.paypay.token}`, "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0", "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": uuid.v4(), Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": uuid.v4() }
    const response = await axios.get(`https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?verificationCode=${link}&payPayLang=ja`, { headers: header }).catch(e => { console.log(`Paypayใชใณใฏ่งฃๆใจใฉใผ:${e.message}`) });
    if (!response?.data?.header) return await message.channel.send({ embeds: [{ title: "ใจใฉใผ", description: `BOT็ฎก็่ใซๅใๅใใใฆใใ?ใใใ`, color: 0x3aeb34 }], ephemeral: true });
    if (response.data.header.resultCode == "S9999") return await message.channel.send({ embeds: [{ title: "ใจใฉใผ", description: `ใชใณใฏใ็กๅนใพใใฏๆ้ๅใใงใใ`, color: 0x3aeb34 }], ephemeral: true });
    if (response.data.header.resultCode == "S0000") {
        if (response.data.payload.orderStatus == "SUCCESS") return await message.channel.send({ embeds: [{ title: "ใจใฉใผ", description: `ๅใๅใๆธใฟใฎใชใณใฏใงใใ`, color: 0x3aeb34 }], ephemeral: true });
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
            if (r.data.header.resultCode == "S9999") return await message.channel.send({ embeds: [{ title: "ใจใฉใผ", description: `ใในใณใผใใ้้ใฃใฆใใพใใ`, color: 0x3aeb34 }], ephemeral: true });
            if (r.data.header.resultCode == "S0000") {
                await interaction.channel.setTopic("success");
                await message.channel.send({ embeds: [{ title: "ใ็ฅใใ", description: `${response.data.payload.pendingP2PInfo.amount}ๅๅใๅใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
            };
            if (r.data.header.resultCode == "S5000") {
                await message.channel.send({ embeds: [{ title: "ใจใฉใผ", description: `PayPayใตใผใใผใงใจใฉใผใ็บ็ใใพใใใ\n่ฉณ็ดฐ:${r.data.header.resultMessage}\nๆฐๆ้ใใใฆใใไธๅบฆใ่ฉฆใใใ?ใใใ`, color: 0x3aeb34 }], ephemeral: true });
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
                await cloned.send({ embeds: [{ title: "Nuke", description: `${interaction.user}ใใใฃใณใใซใใฎใญใฐใๅจใฆๅ้คใใพใใใ`, color: 0x3aeb34 }] });
                await interaction.channel.delete();
            };
            if (interaction.customId == "ticket_button") {
                const new_channel = await interaction.guild.channels.create({ name: `๏ฟค๐ซ-${interaction.user.username}๏ฟค`, permissionOverwrites: [{ id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] });
                await new_channel.send({ embeds: [{ title: "ใๅใๅใใ", description: "ในใฟใใใๆฅใใพใงใๅพใกใใ?ใใใ", color: 0x3aeb34 }], components: [close_button] });
                await new_channel.send({ content: `${interaction.member}` })
                await interaction.reply({ embeds: [{ title: "Ticket", description: `ใใฑใใใไฝๆใใพใใใ\nใใฃใณใใซใ้ใใฆ่ณชๅใชใฉใใ่จๅฅใใ?ใใใ\n${new_channel}`, color: 0x3aeb34 }], ephemeral: true });
            };
            if (interaction.customId == "ticket_close") {
                const channel = await interaction.channel.messages.fetch({ after: '0', limit: 1 });
                const message = await interaction.channel.messages.fetch(channel.map(x => x.id)[0]);
                await message.edit({ embeds: [{ title: "ใๅใๅใใ", description: "ในใฟใใใๆฅใใพใงใๅพใกใใ?ใใใ", color: 0x3aeb34 }], components: [close_button1] });
                await interaction.reply({ embeds: [{ title: "Ticket", description: "5็งๅพใซใใฑใใใๅ้คใใใพใใ\nใญใฃใณใปใซใใใซใฏไธ่จใฎใญใฃใณใปใซใใฟใณใๆผใใฆใใ?ใใใ", color: 0x3aeb34 }], components: [cancel_button], ephemeral: true });
                func.delete_timer({ action: interaction.channel, type: "delete" });
            };
            if (interaction.customId == "ticket_cancel") {
                func.delete_timer({ action: interaction.channel, type: "cancel" });
                const channel = await interaction.channel.messages.fetch({ after: '0', limit: 1 });
                const message = await interaction.channel.messages.fetch(channel.map(x => x.id)[0]);
                await message.edit({ embeds: [{ title: "ใๅใๅใใ", description: "ในใฟใใใๆฅใใพใงใๅพใกใใ?ใใใ", color: 0x3aeb34 }], components: [close_button] });
                await interaction.reply({ embeds: [{ title: "Ticket", description: "ใใฑใใใฎๅ้คใใญใฃใณใปใซใใใพใใใ", color: 0x3aeb34 }], ephemeral: true });
            };
            if (interaction.customId.startsWith("buy")) {
                const id = interaction.customId.split(",")[1];
                const category = interaction.customId.split(",")[2];
                const check = await func.dbget({ table: "paypay", v: `id="${id}"` });
                if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `่ฒฉๅฃฒ่ใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const items = await func.dbget({ table: "goods", v: `username="${check[0]?.name}" and category="${category}"` });
                if (!items[0]?.username) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅๅใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const goods = items.map(c => { return { name: c.name, amount: c.amount } });
                if (!goods[0]?.name) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅๅใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const selectdata = items.map(data => { return { label: data.name.slice(0, 15), description: `${data.amount}ๅใงใ`, value: data.id } })
                const select = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('buy')
                            .setPlaceholder('ไฝใ้ธๆใใใฆใใพใใ')
                            .addOptions(selectdata),
                    );
                await interaction.reply({ embeds: [{ title: "shop", description: `${goods.map(data => `**${data.name}**\n${data.amount}ๅ`).join("\n\n")}`, color: 0x3aeb34 }], components: [select], ephemeral: true });
            };
            if (interaction.customId.startsWith("send")) {
                const id = interaction.customId.split(",")[1];
                const check = await func.dbget({ table: "paypay", v: `id="${id}"` });
                if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `้้ๅใฎใขใซใฆใณใใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const modal = new ModalBuilder()
                    .setCustomId(`send,${id}`)
                    .setTitle('้้');
                const link = new TextInputBuilder()
                    .setCustomId('link')
                    .setLabel("ใชใณใฏ")
                    .setRequired(true)
                    .setPlaceholder('https://pay.paypay.ne.jp/123456789ABCDEFG')
                    .setStyle(TextInputStyle.Short);
                const pass = new TextInputBuilder()
                    .setCustomId('pass')
                    .setLabel("ใในใณใผใ")
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
                if (!check[0]?.name) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `่ฒฉๅฃฒ่ใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const items = await func.dbget({ table: "goods", v: `username="${check[0]?.name}" and category="${category}"` });
                if (!items[0]?.username) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅๅใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const goods = items.map(c => c.id);
                const name = items.map(c => { return { name: c.name, id: c.id } });
                if (!goods[0]) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅๅใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const datas = await func.dbget({ table: "inventory", v: `id="${goods.join('" or id="')}"` });
                await interaction.reply({ embeds: [{ title: "shop", description: `${name.map(data => `**${data.name}**\n${datas.filter(c => c.id == data.id).length}ๅ`).join("\n\n")}`, color: 0x3aeb34 }], ephemeral: true });
            };
        };
        if (interaction.isStringSelectMenu()) {
            const buy = interaction.values[0];
            const item = await func.dbget({ table: "inventory", v: `id="${buy}"` });
            if (!item[0]?.id) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅจๅบซๅใ`, color: 0x3aeb34 }], ephemeral: true });
            const modal = new ModalBuilder()
                .setCustomId(`buy,${item[0]?.id}`)
                .setTitle('ๆฏๆใใ');
            const link = new TextInputBuilder()
                .setCustomId('link')
                .setLabel("ใชใณใฏ")
                .setRequired(true)
                .setPlaceholder('https://pay.paypay.ne.jp/123456789ABCDEFG')
                .setStyle(TextInputStyle.Short);
            const pass = new TextInputBuilder()
                .setCustomId('pass')
                .setLabel("ใในใณใผใ")
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
                if (!goods[0]?.id) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅๅๆๅ?ฑใ่ชญใฟ่พผใใพใใใงใใ`, color: 0x3aeb34 }], ephemeral: true });
                const blink = interaction.fields.getTextInputValue("link")
                if (!blink.includes("https://pay.paypay.ne.jp/")) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใชใณใฏใ็กๅนใงใใ`, color: 0x3aeb34 }], ephemeral: true });
                const link = blink.replace("https://pay.paypay.ne.jp/", "");
                const pass = interaction.fields.getTextInputValue('pass');
                const item = await func.dbget({ table: "inventory", v: `id="${id}"` });
                if (!item[0]?.id) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅจๅบซๅใ`, color: 0x3aeb34 }], ephemeral: true });
                const paypay = await func.dbget({ table: "paypay", v: `name="${goods[0].username}"` });
                if (!paypay[0]?.name) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `่ฒฉๅฃฒ่ใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const header = { "Content-Type": "application/json", Authorization: `Bearer ${paypay[0].token}`, "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0", "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": uuid.v4(), Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": uuid.v4() }
                const response = await axios.get(`https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?verificationCode=${link}&payPayLang=ja`, { headers: header }).catch(e => { console.log(`Paypayใชใณใฏ่งฃๆใจใฉใผ:${e.message}`) });
                if (!response?.data?.header) await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅบๅ่ใฎPayPayใขใซใฆใณใใ็กๅนใงใใ(้ฃๆบใๅใใฆใใพใ)\nๅบๅ่ใซใใไธๅบฆpaypayใซ"Singin"ใใใใใซ้ฃ็ตกใใฆใใ?ใใใ\nๆณจ:SingUpใงใฏใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S9999") await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใชใณใฏใ็กๅนใพใใฏๆ้ๅใใงใใ`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S0000") {
                    if (response.data.payload.orderStatus == "SUCCESS") return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅใๅใๆธใฟใฎใชใณใฏใงใใ`, color: 0x3aeb34 }], ephemeral: true });
                    if (response.data.payload.orderStatus == "PENDING") {
                        if (response.data.payload.pendingP2PInfo.amount !== Number(goods[0].amount)) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `้้กใไธ่ดใใพใใ`, color: 0x3aeb34 }], ephemeral: true });
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
                        if (r.data.header.resultCode == "S9999") return interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใในใณใผใใ้้ใฃใฆใใพใใ`, color: 0x3aeb34 }], ephemeral: true });
                        if (r.data.header.resultCode == "S0000") {
                            await func.dbdelete({ table: "inventory", v: `id="${item[0]?.id}" and item="${item[0].item}" limit 1` })
                            await interaction.reply({ embeds: [{ title: "่ณผๅฅๅฎไบ", description: `${item[0].item}`, color: 0x3aeb34 }], ephemeral: true });
                            const log = await func.dbget({ table: "log", v: `guildid="${interaction.guildId}"` });
                            if (!log[0]?.channelid) return;
                            await Promise.all(log.map(async c => {
                                if (!c?.channelid) return;
                                await interaction.guild.channels.cache.get(`${c.channelid}`).send({ embeds: [{ title: `่ณผๅฅ้็ฅ`, description: `${interaction.user.tag}ใ่ณผๅฅใๅฎไบใใพใใใ\nๅๅๅ:${goods[0]?.name || "ๆๅ?ฑใฎๅๅพใซๅคฑๆใใพใใใ"}\nๅคๆฎต:${goods[0]?.amount || "ๆๅ?ฑใฎๅๅพใซๅคฑๆใใพใใใ"}\nใซใใดใชใผ:${goods[0]?.category || "ๆๅ?ฑใฎๅๅพใซๅคฑๆใใพใใใ"}`, color: 0x3aeb34 }] })
                                    .catch(async () => await func.dbdelete({ table: "log", v: `channelid="${c.channelid}"` }));
                            }));
                        };
                        if (r.data.header.resultCode == "S5000") {
                            await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `PayPayใตใผใใผใงใจใฉใผใ็บ็ใใพใใใ\n่ฉณ็ดฐ:${r.data.header.resultMessage}\nๆฐๆ้ใใใฆใใไธๅบฆใ่ฉฆใใใ?ใใใ`, color: 0x3aeb34 }], ephemeral: true });
                        };
                    };
                };
            };
            if (interaction.customId.startsWith("send")) {
                const id = interaction.customId.split(",")[1];
                const blink = interaction.fields.getTextInputValue("link")
                if (!blink.includes("https://pay.paypay.ne.jp/")) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใชใณใฏใ็กๅนใงใใ`, color: 0x3aeb34 }], ephemeral: true });
                const link = blink.replace("https://pay.paypay.ne.jp/", "");
                const pass = interaction.fields.getTextInputValue('pass');
                const paypay = await func.dbget({ table: "paypay", v: `id="${id}"` });
                if (!paypay[0]?.name) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `้้ๅใฎใขใซใฆใณใใฎๆๅ?ฑใ่ฆใคใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const header = { "Content-Type": "application/json", Authorization: `Bearer ${paypay[0].token}`, "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0", "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": uuid.v4(), Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": uuid.v4() }
                const response = await axios.get(`https://app4.paypay.ne.jp/bff/v2/getP2PLinkInfo?verificationCode=${link}&payPayLang=ja`, { headers: header }).catch(e => { console.log(`Paypayใชใณใฏ่งฃๆใจใฉใผ:${e.message}`) });
                if (!response?.data?.header) await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `้้ๅใฎPayPayใขใซใฆใณใใ็กๅนใงใใ(้ฃๆบใๅใใฆใใพใ)\n้้ใฎไบบใซใใไธๅบฆpaypayใซ"Singin"ใใใใใซ้ฃ็ตกใใฆใใ?ใใใ\nๆณจ:SingUpใงใฏใใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S9999") await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใชใณใฏใ็กๅนใพใใฏๆ้ๅใใงใใ`, color: 0x3aeb34 }], ephemeral: true });
                if (response.data.header.resultCode == "S0000") {
                    if (response.data.payload.orderStatus == "SUCCESS") return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ๅใๅใๆธใฟใฎใชใณใฏใงใใ`, color: 0x3aeb34 }], ephemeral: true });
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
                        if (r.data.header.resultCode == "S9999") return interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใในใณใผใใ้้ใฃใฆใใพใใ`, color: 0x3aeb34 }], ephemeral: true });
                        if (r.data.header.resultCode == "S0000") {
                            await interaction.reply({ embeds: [{ title: "้้ๅฎไบ", description: `${response.data.payload.pendingP2PInfo.amount}ๅ`, color: 0x3aeb34 }], ephemeral: true });
                            const log = await func.dbget({ table: "log", v: `guildid="${interaction.guildId}"` });
                            if (!log[0]?.channelid) return;
                            await Promise.all(log.map(async c => {
                                if (!c?.channelid) return;
                                await interaction.guild.channels.cache.get(`${c.channelid}`).send({ embeds: [{ title: `้้้็ฅใ`, description: `${interaction.user}ใใ้้ใใใพใใ\n้้ก:${response.data.payload.pendingP2PInfo.amount}ๅ`, color: 0x3aeb34 }] })
                                    .catch(async () => await func.dbdelete({ table: "log", v: `channelid="${c.channelid}"` }));
                            }));
                        };
                        if (r.data.header.resultCode == "S5000") {
                            await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `PayPayใตใผใใผใงใจใฉใผใ็บ็ใใพใใใ\n่ฉณ็ดฐ:${r.data.header.resultMessage}\nๆฐๆ้ใใใฆใใไธๅบฆใ่ฉฆใใใ?ใใใ`, color: 0x3aeb34 }], ephemeral: true });
                        };
                    };
                };
            };
            if (interaction.customId.startsWith("pay")) {
                const id = interaction.customId.split(",")[1];
                const data = await paypayfunc.otp(id);
                if (!data) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใฟใคใ?ใขใฆใใใพใใใ\nใใไธๅบฆใ่ฉฆใใใ?ใใใ`, color: 0x3aeb34 }], ephemeral: true })
                const aut = interaction.fields.getTextInputValue('aut');
                const header = { "Client-Mode": "NORMAL", "Client-OS-Version": "13.3.0", "Client-Type": "PAYPAYAPP", "Network-Status": "WIFI", "System-Locale": "ja", "Client-Version": "3.50.0", "Is-Emulator": "false", "Device-Name": "iPhone8,1", "Client-UUID": data.client_uuid, Timezone: "Asia/Tokyo", "Client-OS-Type": "IOS", "Device-UUID": data.device_uuid };
                const response = await axios.post("https://app4.paypay.ne.jp/bff/v1/signInWithSms", { payPayLang: "ja", otp: aut, otpReferenceId: data.rid }, { headers: header }).catch(e => { console.log(`otp่ช่จผใซๅคฑๆใใพใใใ\n่ฉณ็ดฐ:${e.message}`) });
                if (!response) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใชใฏใจในใใซๅคฑๆใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                if (response.error?.backendResultCode) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `OTP่ช่จผใซๅคฑๆใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                const check = await func.dbget({ table: "paypay", v: `name="${data.name}"` });
                if (check[0]?.name) {
                    const set = await func.dbupdate({ table: "paypay", set: `pass="${data.ps}",token="${response.data.payload.accessToken}",id="${data.id}"`, v: `name="${data.name}"` });
                    if (!set) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใใผใฟใฎไฟๅญใซๅคฑๆใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                    await interaction.reply({ embeds: [{ title: "ใ็ฅใใ", description: `่จญๅฎใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                } else {
                    const set = await func.dbset({ table: "paypay", v: `"${data.name}","${data.ps}","${response.data.payload.accessToken}","${data.id}"` });
                    if (!set) return await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใใผใฟใฎไฟๅญใซๅคฑๆใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                    await interaction.reply({ embeds: [{ title: "ใ็ฅใใ", description: `่จญๅฎใใพใใใ`, color: 0x3aeb34 }], ephemeral: true });
                };
            };
        };
    } catch (error) {
        console.error(`ใณใใณใใๅฎ่กใใ้ใจใฉใผใ็บ็ใใพใใ\n่ฉณ็ดฐ:${error}\nใณใใณใๅฎ่ก่:${interaction.user.tag}`);
        await interaction.reply({ embeds: [{ title: "ใจใฉใผ", description: `ใณใใณใใๅฎ่กใใ้ใจใฉใผใ็บ็ใใพใใ\n่ฉณ็ดฐ:${error}`, color: 0x3aeb34 }], ephemeral: true }).catch(() => { });
    };
});
client.login(setting.discord.token)