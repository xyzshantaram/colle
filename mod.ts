import { createApp } from "./src/app.ts";
import { lmdb } from "./src/deps.ts";

if (import.meta.main) {
    const db = lmdb.open({
        path: './colle.lmdb',
        compression: true,
        dupSort: true,
        encoding: 'ordered-binary'
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

    const env = (Deno.env.get("COLLE_ENV") || "PROD") as "PROD" | "DEBUG";

    const app = await createApp({
        env,
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

import { Colle } from "./src/Colle.js";
export { Colle };