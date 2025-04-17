import Random from "x/random";
import { decodeBase64 } from "@std/encoding";
import * as nhttp from "@nhttp/nhttp";
import serveStatic from "@nhttp/nhttp/serve-static";
import * as bcrypt from "@felix/bcrypt";
import * as jwt from "@zaubrik/djwt";
import lmdb from "lmdb";

interface ColleOptions {
    db: lmdb.Database;
    pass: string;
    cryptoKey: CryptoKey;
    env: "PROD" | "DEBUG";
}

const JwtHeader: jwt.Header = {
    alg: "HS512",
    typ: "JWT",
};

export const createApp = async ({ env, db, pass, cryptoKey }: ColleOptions) => {
    const app = nhttp.nhttp({
        bodyParser: false,
    });

    app.use(serveStatic("./public"));
    const r = new Random();

    const error =
        (response: nhttp.HttpResponse) => (message: string, code = 400) =>
            response.status(code).json({ message });

    const contents = await Deno.readTextFile("./public/index.html");

    app.use((rev, next) => {
        rev.response.setHeader("Access-Control-Allow-Origin", "*");
        rev.response.setHeader(
            "Access-Control-Allow-Methods",
            "GET, PUT, POST",
        );
        rev.response.setHeader(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept",
        );
        return next();
    });

    app.get("/", async ({ response }) => {
        if (env == "DEBUG") {
            response.html(await Deno.readTextFile("./public/index.html"));
        } else response.html(contents);
    });

    app.post("/signup-code", async ({ request, response }) => {
        const body = await request.json();
        if (!body.pass || body.pass !== pass) {
            return error(response)("Invalid or missing admin password.");
        }

        const code = r.string(6);
        await db.put(["signup-codes", code], true);

        return { code };
    });

    app.post("/sign-up", async ({ request, response }) => {
        const body = await request.json();
        if (!body.username || !body.password || !body.code) {
            return error(response)("Not enough parameters for signup.");
        }
        if (db.get(["users", body.username])) {
            return error(response)("User exists.");
        }
        if (!db.get(["signup-codes", body.code])) {
            return error(response)("Signup code does not exist.");
        }

        await db.remove(["signup-codes", body.code]);
        await db.put(["users", body.username], {
            password: await bcrypt.hash(body.password),
        });

        return { message: "ok" };
    });

    app.post("/sign-in", async ({ request, response }) => {
        const body = await request.json();
        if (!body.username || !body.password) {
            return error(response)("Invalid username or password.");
        }
        const user = db.get(["users", body.username]);

        if (!user || !(await bcrypt.verify(body.password, user.password))) {
            return error(response)("Invalid username or password.");
        }

        const token = await jwt.create(JwtHeader, {
            username: body.username,
            exp: jwt.getNumericDate(7 * 24 * 60 * 60),
        }, cryptoKey);

        return { token };
    });

    const checkToken = async (
        token: string | null,
    ): Promise<[string, null] | [null, jwt.Payload]> => {
        if (!token) return ["Missing auth token.", null];
        const parts = token.split(" ");
        if (!parts[1]) return [`Token format: "Bearer <token>"`, null];
        try {
            const payload = await jwt.verify(parts[1], cryptoKey);
            return [null, payload];
        } catch (e) {
            console.error(e);
            return ["Missing or expired token", null];
        }
    };

    app.get("/whoami", async ({ headers, response }) => {
        const token = headers.get("Authorization");
        const [msg, result] = await checkToken(token);
        if (msg) return error(response)(msg);
        return { username: result!.username };
    });

    const upload = nhttp.multipart.upload({ name: "contents" });

    app.post("/file", upload, async ({ response, headers, request }) => {
        const body = await request.formData();
        const token = headers.get("Authorization");
        const [msg, result] = await checkToken(token);
        if (msg) return error(response)(msg);

        const uuid = crypto.randomUUID();
        const type = headers.get("Content-Type");
        if (!type) {
            return error(response)("Content type of file must be specified!");
        }

        const metadata = body.get("metadata")?.toString() || undefined;

        const username = result!.username as string;
        const pastesKey = ["pastes", username];
        const pastes = db.get(pastesKey) || [];
        pastes.push(uuid);
        await db.put(pastesKey, pastes);

        await db.put(["files", uuid], {
            uploader: username,
            data: body.get("contents"),
            metadata,
            type,
        });

        return { uuid };
    });

    app.delete("/file", async ({ request, headers, response }) => {
        const body = await request.json();
        const token = headers.get("Authorization");
        const [msg, result] = await checkToken(token);
        if (msg) return error(response)(msg);
        const username = result!.username as string;

        if (!body.uuid) return error(response)("UUID must be specified!");
        const file = db.get(["files", body.uuid]);

        if (!file || file.uploader !== username) {
            return error(response)("File not found.", 404);
        }

        const pastes = db.get(["pastes", username]) || [];
        const idx = pastes.indexOf(body.uuid);
        if (idx >= 0) pastes.splice(idx, 1);
        await db.put(["pastes", username], pastes);

        await db.remove(["files", body.uuid]);
        return {
            message: "ok",
        };
    });

    app.get("/file", ({ response }) => {
        return error(response)("UUID must be specified!");
    });

    const getFile = (uuid: string) => {
        if (!uuid) throw "UUID must be specified!";
        const file = db.get(["files", uuid]);
        if (!file) throw "No such file.";
        return {
            ...file,
            metadata: JSON.parse(file.metadata || "null"),
        };
    };

    app.get("/file/:uuid", ({ params, response }) => {
        try {
            return getFile(params.uuid);
        } catch (s) {
            return error(response)(`${s}`, 400);
        }
    });

    app.get("/view/:uuid", ({ params, response }) => {
        try {
            const file = getFile(params.uuid);
            const isImage = file.type.startsWith("image");
            response
                .header("Content-Type", isImage ? file.type : "text/plain")
                .send(
                    isImage ? decodeBase64(file.data.split(",")[1]) : file.data,
                );
        } catch (e) {
            response.status(500).html(`
            <html><head><title>colle - Error</title></head>
            <body>
            <h1>Error</h1>
            <pre><code>${e}</code></pre>
            <p>Sorry about that.</p>
            </body>
            </html>
            `);
        }
    });

    app.get("/files", async ({ headers, response }) => {
        const token = headers.get("Authorization");
        const [msg, result] = await checkToken(token);
        if (msg) return error(response)(msg);

        const username = result!.username as string;
        const pastes: string[] = db.get(["pastes", username]) || [];

        return (await db.getMany(pastes.map((paste) => ["files", paste])))
            .filter(Boolean)
            .map((value, idx) => ({
                ...value,
                uuid: pastes[idx],
                data: undefined,
                metadata: JSON.parse(value.metadata),
            }));
    });

    return app;
};
