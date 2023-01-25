const func = require("./func");
const axios = require('axios');
let user = [];
module.exports = {
    aut: async data => {
        if (user[data.id]) return 2;
        const check = await func.dbget({ table: "paypay", v: `name="${data.name}"` });
        user[data.id] = { ps: data.ps, uid: data.uidd, name: data.name, id: data.id, client_uuid: data.client_uuid, device_uuid: data.device_uuid, rid: data.rid };
        if (check[0]?.name) return 1;
        const check2 = await func.dbget({ table: "paypay", v: `id="${data.id}"` });
        if (check2[0]?.name) return { code: 3, name: check2[0].name };
        setTimeout(() => delete user[data.id], 60 * 1000);
    },
    otp: async id => {
        const data = user[id];
        delete user[id]
        if (!data) return false;
        return data;
    }
}