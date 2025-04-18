import * as nhttp from "@nhttp/nhttp";
import serveStatic from "@nhttp/nhttp/serve-static";

import cors from "@nhttp/nhttp/cors";
import { registerUserRoutes } from "./handlers/user.ts";
import { registerFileRoutes } from "./handlers/file.ts";
import type { ColleOptions } from "./types.ts";

export const createApp = async ({ env, kv, pass, cryptoKey }: ColleOptions) => {
    const app = nhttp.nhttp({ bodyParser: false });
    app.use(cors({ origin: "*" }));
    app.use(serveStatic("./public"));

    const contents = await Deno.readTextFile("./public/index.html");

    app.get("/", async ({ response }) => {
        if (env == "DEBUG") {
            response.html(await Deno.readTextFile("./public/index.html"));
        } else response.html(contents);
    });

    registerUserRoutes(app, { kv, pass, cryptoKey, env });
    registerFileRoutes(app, { kv, pass, cryptoKey, env });

    return app;
};
