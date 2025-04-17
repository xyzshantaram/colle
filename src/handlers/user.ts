import { error } from "../utils/error.ts";
import * as bcrypt from "@felix/bcrypt";
import * as jwt from "@zaubrik/djwt";
import type { NHttp } from "@nhttp/nhttp";
import type { ColleOptions, UserRecord } from "../types.ts";

const JwtHeader: jwt.Header = {
    alg: "HS512",
    typ: "JWT",
};

export function registerUserRoutes(app: NHttp, opts: ColleOptions) {
    const { kv, pass, cryptoKey } = opts;

    app.post("/signup-code", async ({ request, response }) => {
        const body = await request.json();
        if (!body.pass || body.pass !== pass) {
            return error(response)("Invalid or missing admin password.");
        }

        const code = crypto.randomUUID().slice(0, 6);
        await kv.set(["signup-codes", code], true);

        return { code };
    });

    app.post("/sign-up", async ({ request, response }) => {
        const body = await request.json();
        if (!body.username || !body.password || !body.code) {
            return error(response)("Not enough parameters for signup.");
        }
        const { value: userExists } = await kv.get(["users", body.username]);
        if (userExists) {
            return error(response)("User exists.");
        }
        const { value: codeExists } = await kv.get(["signup-codes", body.code]);
        if (!codeExists) {
            return error(response)("Signup code does not exist.");
        }

        await kv.delete(["signup-codes", body.code]);
        await kv.set(["users", body.username], {
            password: await bcrypt.hash(body.password),
        });

        return { message: "ok" };
    });

    app.post("/sign-in", async ({ request, response }) => {
        const body = await request.json();
        if (!body.username || !body.password) {
            return error(response)("Invalid username or password.");
        }
        const { value: user } = await kv.get<UserRecord>([
            "users",
            body.username,
        ]);

        if (!user || !(await bcrypt.verify(body.password, user.password))) {
            return error(response)("Invalid username or password.");
        }

        const token = await jwt.create(JwtHeader, {
            username: body.username,
            exp: jwt.getNumericDate(7 * 24 * 60 * 60),
        }, cryptoKey);

        return { token };
    });

    app.get("/whoami", async (rev) => {
        const { headers, response } = rev;
        const token = headers.get("Authorization");
        if (!token) return error(response)("Missing auth token.");
        const parts = token.split(" ");
        if (!parts[1]) return error(response)("Token format: 'Bearer <token>'");
        try {
            const payload = await jwt.verify(parts[1], cryptoKey);
            return { username: payload.username };
        } catch (_e) {
            return error(response)("Missing or expired token");
        }
    });
}
