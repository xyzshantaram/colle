import Random from "https://deno.land/x/random@v1.1.2/Random.js";
import { nhttp, lmdb, bcrypt, jwt } from "./deps.ts";

interface ColleOptions {
    db: lmdb.Database,
    pass: string,
    cryptoKey: CryptoKey
}

const JwtHeader: jwt.Header = {
    alg: "HS512",
    typ: "JWT"
}

export const createApp = ({ db, pass, cryptoKey }: ColleOptions) => {
    const app = nhttp.nhttp({
        bodyParser: { json: "5mb" }
    });

    const r = new Random();

    const error = (response: nhttp.HttpResponse) =>
        (message: string, code = 400) => response.status(code).json({ message });

    app.post('/signup-code', async ({ body, response }) => {
        if (!body.pass || body.pass !== pass) return error(response)("Invalid or missing admin password.");

        const code = r.string(6);
        await db.put(['signup-codes', code], true);

        return { code };
    })

    app.post('/sign-up', async ({ body, response }) => {
        if (!body.username || !body.password || !body.code) return error(response)("Not enough parameters for signup.");
        if (db.get(['users', body.username])) return error(response)("User exists.");
        if (!db.get(['signup-codes', body.code])) return error(response)("Signup code does not exist.");

        await db.remove(['signup-codes', body.code]);
        await db.put(['users', body.username], { password: await bcrypt.hash(body.password) });

        return { message: 'ok' };
    });

    app.post('/sign-in', async ({ body, response }) => {
        if (!body.username || !body.password) return error(response)("Invalid username or password.");
        const user = db.get(['users', body.username]);

        if (!user || !(await bcrypt.compare(body.password, user.password))) {
            return error(response)("Invalid username or password.");
        }

        const token = await jwt.create(JwtHeader, {
            username: body.username,
            exp: jwt.getNumericDate(60 * 60)
        }, cryptoKey);

        return { token };
    })

    const checkToken = async (token: string | null): Promise<[string, null] | [null, jwt.Payload]> => {
        if (!token) return ["Missing auth token.", null];
        const parts = token.split(" ");
        if (!parts[1]) return [`Token format: "Bearer <token>"`, null];
        try {
            const payload = await jwt.verify(parts[1], cryptoKey);
            return [null, payload];
        }
        catch (e) {
            console.error(e);
            return ["Missing or expired token", null];
        }
    }

    app.post("/file", async ({ body, response, headers }) => {
        const token = headers.get("Authorization");
        const [msg, result] = await checkToken(token);
        if (msg) return error(response)(msg);

        const uuid = crypto.randomUUID();
        const type = headers.get("Content-Type");
        if (!type) return error(response)("Content type of file must be specified!");

        const metadata = body.metadata ? JSON.stringify(body.metadata) : undefined;

        await db.put(["files", uuid], {
            uploader: result!.username,
            data: body.contents,
            metadata,
            type
        });
        return { uuid };
    })

    app.delete("/file", async ({ body, headers, response }) => {
        const token = headers.get("Authorization");
        const [msg, _] = await checkToken(token);
        if (msg) return error(response)(msg);

        if (!body.uuid) return error(response)("UUID must be specified!");

        await db.remove(["files", body.uuid]);
        return {
            message: "ok"
        }
    })

    app.get("/file", ({ response }) => {
        return error(response)("UUID must be specified!");
    })

    app.get("/file/:uuid", ({ params, response }) => {
        if (!params.uuid) return error(response)("UUID must be specified!");
        const file = db.get(["files", params.uuid]);
        if (!file) return error(response)("Not found", 404);
        return {
            ...file,
            metadata: JSON.parse(file.metadata)
        };
    })

    return app;
}