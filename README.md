# discord.js-vending-machine and Backup
 discord.jsで作成した自販機BOT

依頼受け付けています

**Discord:田中#1204**

詳しくはDMしてください。

BOTサンプル
[招待リンク](https://discord.com/api/oauth2/authorize?client_id=1058258279651868792&permissions=8&scope=applications.commands%20bot)


# テスト環境
<p> 
Node.js(v19)<br>
npm(v9.1.3)<br>
axios(v1.2.1)<br>
date-fns-tz(v1.3.7)<br>
discord.js(v14.7.1)<br>
ejs(v3.1.8)<br>
express(v4.18.2)<br>
mariadb(v3.0.2)<br>
uuid(v9.0.0)<br>
moment(v2.29.4)<br>
windows(11)<br>
</p>

 # 初回
 コマンドラインにて

 `npm install`

 と打ち必要なmoduleをインストールします。

`config.json`でいろいろ設定します

[SQLはmariadbです(各自で鯖立ててください)](#sqlの立ち上げ方)

初回起動時は`func.dbsetup()`と`index.js`内の**readyイベント**内に書いてください(コメントアウトしてあるのでそれ参考に)

[Discorddevサイト](https://discord.com/developers/applications/)で**リダイレクトURL**を`http://(https://)ドメイン/login`にしてください。

![例](https://cdn.discordapp.com/attachments/1010035784667119659/1062354147929751603/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f313035343332333935383039363333393030352f313035383236343333383238323037303132362f696d6167652e706e673f77696474683d31343430266865696768743d363033.png "例")

スコープをindentifyとguilds.joinにチェックしたURLを取得し、config.jsonに書き込む

![例](https://cdn.discordapp.com/attachments/1010035784667119659/1062353262252146688/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f313035343332333935383039363333393030352f313035383236353031393830313934383138302f696d6167652e706e673f77696474683d31333936266865696768743d363730.png "例")

シークレットとIDはここで取得できます。

![image.png](https://cdn.discordapp.com/attachments/1010035784667119659/1062353315368812584/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f313035343332333935383039363333393030352f313035383236353635343833323134343430352f696d6167652e706e673f77696474683d31333731266865696768743d363731.png)

TOKENはここです

![image.png](https://cdn.discordapp.com/attachments/1010035784667119659/1062353429483229274/image.png)


`node index.js`で起動できます。

コマンドについてはスラッシュコマンドなので起動すればわかると思います。

`func.js`に独自の関数あります(SQLの操作はそっち使ったほうが楽？かも)


# SQLの立ち上げ方
[windows](https://www.trifields.jp/how-to-install-mariadb-on-windows-2440)

[linux](https://libproc.com/install-mariadb-on-linux-and-create-database/)

テーブル名、ユーザー名、パスワード、ホストが必要になります(rootでもいいですけどお勧めはしないです)

# その他
コマンドリスト＆説明はこちらです。
![image.png](https://cdn.discordapp.com/attachments/1010035784667119659/1062353692625473606/68747470733a2f2f63646e2e646973636f72646170702e636f6d2f6174746163686d656e74732f313036313937373930353234363234393033302f313036323331383434323431353339343839362f696d6167652e706e67.png)

```
BackUp系

backup_account (options)
backupアカウントの操作です削除や作成ログイン(accountBANされたとき用)があります。

backup_panel (options)
backup用の認証パネルを作成します。
このパネルのボタンを押したユーザーのバックアップができます。

backup_start (guildid)
backupをしたいギルド(サーバー)のIDを入力してください。

Shop系

shop_account (options)
PayPayとDiscordを紐づけます。(電話番号などは保存されませんので安心してください。)
サインインアップまたはサインインを選んでください。
サインアップは初回登録者用サインインはアカウントBANされたときやパスワード変えたとき用です。

shop_additem (options)
商品を追加するコマンドです。
カテゴリーはパネルを置く時に分けられるようにします。値段は一番最後に指定されたものになります。

shop_delete (options)
商品またはshopアカウントを削除します。(注:backupアカウントではありません)

shop_activate
shopで商品を販売する(shop_additemコマンドを打つ)際に必要です。
月単位で課金されていきます。(取り消しは不可です。)

shop_log (options)
指定したチャンネルに取引ログを送信します。内容はカテゴリー名、商品名、値段、商品内容、ユーザータグです。

shop_panel (option)
指定したカテゴリーの商品を買えるパネルを表示します。

その他

help
この画面です。
```
**logコマンド実行の様子**

![image.png](https://cdn.discordapp.com/attachments/1010035784667119659/1062353704138842174/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f313036313937373930343030383932393334302f313036323332303037343833343332313431392f696d6167652e706e67.png)

**商品選択画面の様子**

![image.png](https://cdn.discordapp.com/attachments/1010035784667119659/1062353725395583026/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f313036313937373930343030383932393334302f313036323332303037353236363334323931322f696d6167652e706e67.png)

**エラーの例**

![image.png](https://cdn.discordapp.com/attachments/1010035784667119659/1062353731355689040/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f313036313937373930343030383932393334302f313036323332303037353631303237313831362f696d6167652e706e67.png)

**商品パネル**

![image.png](https://cdn.discordapp.com/attachments/1010035784667119659/1062353751362519040/68747470733a2f2f6d656469612e646973636f72646170702e6e65742f6174746163686d656e74732f313036313937373930343030383932393334302f313036323332303638313533313939383237392f696d6167652e706e67.png)


# ライセンス

<h3>著作者表示</h3>

<h3>非営利のみ</h3>

<h3>ライセンスの継承</h3>

![ライセンス](https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Cc-by-nc-sa_icon.svg/1280px-Cc-by-nc-sa_icon.svg.png "コモンズライセンス")
