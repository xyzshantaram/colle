import { Handler } from "@nhttp/nhttp";

export const cors: Handler = (rev, next) => {
    rev.response.setHeader("Access-Control-Allow-Origin", "*");
    rev.response.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST");
    rev.response.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept",
    );
    return next();
};
