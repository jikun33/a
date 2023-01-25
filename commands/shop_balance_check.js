const { SlashCommandBuilder } = require('discord.js');
const func = require('../func.js');
const axios = require('axios');
const uuid = require('uuid');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop_balance_check')
        .setDMPermission(false)
        .setDescription('残高を表示します。'),
    async execute(interaction) {
        const paypay = await func.dbget({ table: "paypay", v: `id="${interaction.user.id}"` });
        if (!paypay[0]?.name) return await interaction.reply({ embeds: [{ title: "エラー", description: `PayPayの情報が見つかりません。`, color: 0x3aeb34 }], ephemeral: true });
        const header = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${paypay[0].token}`,
            "User-Agent": "PaypayApp/3.31.202202181001 CFNetwork/1126 Darwin/19.5.0",
            "Client-Mode": "NORMAL",
            "Client-OS-Version": "13.3.0",
            "Client-Type": "PAYPAYAPP",
            "Network-Status": "WIFI",
            "System-Locale": "ja",
            "Client-Version": "3.50.0",
            "Is-Emulator": "false",
            "Device-Name": "iPhone8,1",
            "Client-UUID": uuid.v4().toUpperCase(),
            Timezone: "Asia/Tokyo",
            "Client-OS-Type": "IOS",
            "Device-UUID": uuid.v4().toUpperCase()
        };
        const { data } = await axios.get(`https://app4.paypay.ne.jp/bff/v1/getBalanceInfo?includeKycInfo=false&includePending=false&includePendingBonusLite=false&noCache=true&payPayLang=ja`, { headers: header })
        if (data.header.resultCode === "S0000") {
            console.log(data)
            const summ = data?.payload?.walletSummary;
            const deta = data?.payload?.walletDetail;
            await interaction.reply({ embeds: [{ title: "所持金", description: `**概要**\n合計金額:${summ.allTotalBalanceInfo?.balance||"0"}  (${summ.allTotalBalanceInfo?.currency||"0"})\nトータル金額:${summ.totalBalanceInfo?.balance||"0"}   (${summ.totalBalanceInfo?.currency||"0"})\n譲渡可能金額:${summ.transferableBalanceInfo?.balance||"0"}   (${summ.transferableBalanceInfo?.currency||"0"})\nPayPayマネー:${summ.payoutableBalanceInfo?.balance||"0"}   (${summ.payoutableBalanceInfo?.currency||"0"})\n\n**詳細**\nemoney金額:${deta.emoneyBalanceInfo?.balance||"0"}   (${deta.emoneyBalanceInfo?.currency||"0"})\nプリペイド金額:${deta.prepaidBalanceInfo?.balance||"0"}   (${deta.prepaidBalanceInfo?.currency||"0"})\nキャッシュバック金額:${deta.cashBackBalanceInfo?.balance||"0"}   (${deta.cashBackBalanceInfo?.currency||"0"})\n期限切れのキャッシュバック:${deta.cashBackExpirableBalanceInfo?.balance||"0"}   (${deta.cashBackExpirableBalanceInfo?.currency||"0"})`, color: 0x3aeb34 }] });
        } else {
            await interaction.reply({ embeds: [{ title: "お知らせ", description: `リクエストに失敗しました。`, color: 0x3aeb34 }] });
        };
    },
};