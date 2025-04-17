import { Handler } from "@nhttp/nhttp";
import * as jwt from "@zaubrik/djwt";
import { error } from "../utils/error.ts";

export const checkToken = (cryptoKey: CryptoKey): Handler => async (rev, next) => {
    const token = rev.headers.get("Authorization");
    if (!token) {
        return error(rev.response)("Missing auth token", 401);
    }

    const parts = token.split(" ");
    if (!parts[1]) {
        return error(rev.response)("Token format: 'Bearer <token>'", 401);
    }

    try {
        const payload = await jwt.verify(parts[1], cryptoKey);
        rev.state = { ...rev.state, user: payload };
        return next();
    } catch (e) {
        console.error(e);
        return error(rev.response)("Missing or expired token", 401);
    }
};
