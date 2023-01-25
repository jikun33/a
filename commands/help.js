const { SlashCommandBuilder } = require('discord.js');
const func = require('../func');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('コマンドのヘルプ画面です。'),
    async execute(interaction) {
        const get_data = await func.dbget({ table: "token", v: "userid" });
        const datas = get_data.map(c => c);
        await interaction.reply({ embeds: [{ title: "help", description: "```BackUp系```\n**backup_account (options)**\nbackupアカウントの操作です。削除や作成ログイン(accountBANされたとき用)があります。\n\n**backup_panel (options)**\nbackup用の認証パネルを作成します。\nこのパネルのボタンを押したユーザーのバックアップができます。\n\n**backup_start (guildid)**\nbackupをしたいギルド(サーバー)のIDを入力してください。\n\n**backup_start_all パスワード**\nすべての人を参加させます。(パスワードはBOT運営にて)\n\n```Shop系```\n**shop_account (options)**\nPayPayとDiscordを紐づけます。(電話番号などは保存されませんので安心してください。)\nサインインアップまたはサインインを選んでください。\nサインアップは初回登録者用サインインはアカウントBANされたときやパスワード変えたとき用です。\n\n**shop_additem (options)**\n商品を追加するコマンドです。\nカテゴリーはパネルを置く時に分けられるようにします。値段は一番最後に指定されたものになります。\n商品内容は半角空白で区切ると複数選択できます。\n\n**shop_delete (options)**\n商品またはshopアカウントを削除します。(注:backupアカウントではありません)\n\n**shop_activate**\nshopで商品を販売する(shop_additemコマンドを打つ)際に必要です。\n月単位で課金されていきます。(取り消しは不可です。)\n\n**shop_log (options)**\n指定したチャンネルに取引ログを送信します。内容はカテゴリー名、商品名、値段、商品内容、ユーザータグです。\n\n**shop_panel (option)**\n指定したカテゴリーの商品を買えるパネルを表示します。\n\n**shop_balance_check**\nコマンド実行者の所持金を表示します。\n\n```その他```\n**help**\nこの画面です。\n\n**ticket (options)**\nチケットを作成します。\n\n" + `認証人数数:${datas.length}\n\n制作\n田中#1204(依頼受付中)`, color: 0x3aeb34 }], ephemeral: true });
    }
};