import { createApp } from "./app.ts";
import { lmdb } from "./deps.ts";

if (import.meta.main) {
    const db = lmdb.open({
        path: './colle.lmdb',
        compression: true
    });

    const pass = Deno.env.get("COLLE_ADMIN_PASS");
    if (!pass) {
        console.error("You need to set the admin password to use Colle.");
        Deno.exit(1);
    }

    let cryptoKey = db.get(['crypto-key']);
    if (!cryptoKey) {
        console.log("Generating new key...");
        const key = await crypto.subtle.generateKey(
            { name: "HMAC", hash: "SHA-512" },
            true,
            ["sign", "verify"]
        );

        cryptoKey = await crypto.subtle.exportKey('raw', key);
        await db.put(['crypto-key'], cryptoKey);
    }

    const app = createApp({
        db,
        pass,
        cryptoKey: await crypto.subtle.importKey(
            'raw',
            cryptoKey,
            { name: "HMAC", hash: "SHA-512" },
            true,
            ["sign", "verify"]
        )
    });
    const port = parseInt(Deno.env.get("COLLE_PORT") || '3000');

    app.listen(port, (err) => {
        if (err) {
            console.error(err);
            Deno.exit(1);
        }

        console.log("Listening on port", port);
    })
}

import { Colle } from "./Colle.js";
export { Colle };