import { openKvToolbox } from "@kitsonk/kv-toolbox";
import { createApp } from "./src/app.ts";

if (import.meta.main) {
    const kv = await openKvToolbox({ path: Deno.env.get("COLLE_DB_PATH") || "./colle.db" });

    const pass = Deno.env.get("COLLE_ADMIN_PASS");
    if (!pass) {
        console.error("You need to set the admin password to use Colle.");
        Deno.exit(1);
    }

    const keyEntry = await kv.get<ArrayBuffer>(["crypto-key"]);
    let cryptoKey = keyEntry.value;
    if (!cryptoKey) {
        console.info("Generating new key...");
        const key = await crypto.subtle.generateKey(
            { name: "HMAC", hash: "SHA-512" },
            true,
            ["sign", "verify"],
        );
        cryptoKey = await crypto.subtle.exportKey("raw", key);
        await kv.set(["crypto-key"], cryptoKey);
    }

    const env = (Deno.env.get("COLLE_ENV") || "PROD") as ("PROD" | "DEBUG");

    const app = await createApp({
        env,
        kv,
        pass,
        cryptoKey: await crypto.subtle.importKey(
            "raw",
            cryptoKey,
            { name: "HMAC", hash: "SHA-512" },
            true,
            ["sign", "verify"],
        ),
    });
    const port = parseInt(Deno.env.get("COLLE_PORT") || "3000");

    app.listen(port, (err) => {
        if (err) {
            console.error(err);
            Deno.exit(1);
        }

        console.info("Listening on port", port);
    });
}

import { Colle } from "./src/Colle.js";
export { Colle };
