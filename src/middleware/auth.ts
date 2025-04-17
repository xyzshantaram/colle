import { Handler } from "@nhttp/nhttp";
import * as jwt from "@zaubrik/djwt";

export const checkToken = (cryptoKey: CryptoKey): Handler => async (rev, next) => {
    const token = rev.headers.get("Authorization");
    if (!token) {
        return rev.response.status(401).json({
            message: "Missing auth token.",
        });
    }

    const parts = token.split(" ");
    if (!parts[1]) {
        return rev.response.status(401).json({
            message: 'Token format: "Bearer <token>"',
        });
    }

    try {
        const payload = await jwt.verify(parts[1], cryptoKey);
        rev.state = { ...rev.state, user: payload };
        return next();
    } catch (e) {
        console.error(e);
        return rev.response.status(401).json({
            message: "Missing or expired token",
        });
    }
};
