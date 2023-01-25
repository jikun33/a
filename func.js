const setting = require('./config.json');
const tmp = new Set();
const mariadb = require('mariadb');
const pool = mariadb.createPool({ host: setting.db.host, user: setting.db.user, password: setting.db.pass, database: setting.db.name });
let conn;
function getEndOfMonth(year, month) {
    var endDate = new Date(year, month, 0);
    return endDate.getDate();
}
pool.getConnection()
    .then(first => conn = first)
    .catch(err => console.log(`接続エラー:${err}`));
module.exports = {
    delete_timer: channel => {
        if (channel.type == "delete") setTimeout(() => {
            if (tmp.has(channel.action.id)) return tmp.delete(channel.action.id);
            channel.action.delete().catch(() => { });
        }, 5 * 1000);
        if (channel.type == "cancel") tmp.add(channel.action.id);
    },
    dbset: async data => {
        const db = await conn.query(`insert into ${data.table} values (${data.v});`).catch(e => { console.log(`insert中のエラー:${e}`) });
        if (!db) return false;
        return true;
    },
    dbget: async data => {
        const db = await conn.query(`select * from ${data.table} where ${data.v};`).catch(e => { console.log(`select中のエラー:${e}`) });
        if (!db) return false;
        return db;
    },
    dbdelete: async data => {
        const db = await conn.query(`DELETE FROM ${data.table} WHERE ${data.v};`).catch(e => { console.log(`delete中のエラー:${e}`) });
        if (!db) return false;
        return true;
    },
    dbtable: async data => {
        const db = await conn.query(`create table ${data.table} (${data.v});`).catch(e => { console.log(`create中のエラー:${e}`) });
        if (!db) return false;
        return true;
    },
    dbtabledrop: async data => {
        const db = await conn.query(`drop table ${data.table};`).catch(e => { console.log(`drop中のエラー:${e}`) });
        if (!db) return false;
        return true;
    },
    dbtablecheck: async data => {
        const db = await conn.query(`SELECT 1 FROM ${data.table} LIMIT 1;`).catch(() => { });
        if (!db) return false;
        return true;
    },
    dbcheck: async data => {
        const db = await conn.query(`select * from ${data}`).catch(e => { console.log(`select中のエラー:${e}`) });
        console.log(db)
    },
    dbupdate: async data => {
        const db = await conn.query(`update ${data.table} set ${data.set} where ${data.v};`).catch(e => { console.log(`update中のエラー:${e}`) });
        if (!db) return false;
        return true;
    },
    dbsetup: async () => {
        await conn.query(`create table auto (guildid text,channelid text,userid text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//auto
        await conn.query(`create table verify (guildid text,roleid text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//認証
        await conn.query(`create table backup (username text,guildid text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//backup
        await conn.query(`create table token (userid text,token text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//tokens
        await conn.query(`create table users (userid text,username text,pass text,subsc date);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//user
        await conn.query(`create table vending (name text,username text,item text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//自販機
        await conn.query(`create table guild (guildid text,userid text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//backup(guild)
        await conn.query(`create table paypay (name text,pass text,token text,id text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//paypay(guild)
        await conn.query(`create table inventory (id text,item text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//inventory
        await conn.query(`create table goods (name text,amount bigint,username text,id text,category text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//goods
        await conn.query(`create table account (name text,pass text,id text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//account
        await conn.query(`create table subsc (name text,subsc date);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//account subsc
        await conn.query(`create table log (guildid text,channelid text);`).catch(e => { console.log(`テーブル作成のエラー:${e}`) });//log
    },
    dbgettable: async () => {
        return await conn.query("show tables;");
    },
    getAddMonthDate: (year, month, day, add) => {
        const addMonth = month + add;
        const endDate = getEndOfMonth(year, addMonth);
        if (day > endDate) {
            day = endDate;
        } else day = day - 1;
        const addMonthDate = new Date(year, addMonth - 1, day);
        return addMonthDate;
    },
    nowdate: data => {
        let now;
        if (!data) now = new Date();
        if (data) now = new Date(data);
        return [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    },
    isHanEisu(str) {
        str = (str == null) ? "" : str;
        if (str.match(/^[A-Za-z0-9]*$/)) return true;
        return false;
    }
}