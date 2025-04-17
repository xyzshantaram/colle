import * as nhttp from "@nhttp/nhttp";

export const upload = nhttp.multipart.upload({ name: "contents" });
