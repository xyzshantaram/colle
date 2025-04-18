import { error } from "../utils/error.ts";
import { decodeBase64 } from "@std/encoding";
import { NHttp } from "@nhttp/nhttp";
import { ColleOptions } from "../types.ts";
import { checkToken } from "../middleware/auth.ts";
import * as storage from "../storage.ts";

export function registerFileRoutes(app: NHttp, opts: ColleOptions) {
    const { kv, cryptoKey } = opts;

    app.post(
        "/file",
        checkToken(cryptoKey),
        async ({ response, state, request }) => {
            const body = await request.json();
            const username = state.user?.username;
            if (!username) return error(response)("Unauthorized", 401);
            const type = request.headers.get("Content-Type");
            if (!type) {
                return error(response)("Content type of file must be specified!");
            }
            const { uuid } = await storage.saveFileRecord(kv, {
                uploader: username,
                data: body.contents,
                metadata: body.metadata,
                type,
            });
            return { uuid };
        },
    );

    app.delete(
        "/file",
        checkToken(cryptoKey),
        async ({ request, state, response }) => {
            const body = await request.json();
            const username = state.user?.username;
            if (!username) return error(response)("Unauthorized", 401);
            if (!body.uuid) return error(response)("UUID must be specified!");
            const file = await storage.getFileRecord(kv, body.uuid);
            if (!file || file.uploader !== username) {
                return error(response)("File not found.", 404);
            }
            await storage.deleteFileRecord(kv, body.uuid);
            return { message: "ok" };
        },
    );

    app.get("/file", ({ response }) => {
        return error(response)("UUID must be specified!");
    });

    const getFile = async (uuid: string) => {
        if (!uuid) throw "UUID must be specified!";
        const file = await storage.getFileRecord(kv, uuid);
        if (!file) throw "No such file.";
        return file;
    };

    app.get(
        "/file/:uuid",
        async ({ params, response }) => {
            try {
                return await getFile(params.uuid);
            } catch (s) {
                if (s instanceof Error) {
                    return error(response)(s.message, 400);
                }
                return error(response)("Unknown error fetching file metadata.", 400);
            }
        },
    );

    app.get("/view/:uuid", async ({ params, response }) => {
        const entry = await kv.get<FileRecord>(["files", params.uuid]);
        if (!entry.value) return error(response)("File not found", 404);
        const file = entry.value;

    app.get("/contents/:uuid", async ({ params, response }) => {
        const file = await storage.getFileRecord(kv, params.uuid);
        if (!file) return error(response)("File not found", 404);
        const isImage = file.type.startsWith("image");
        return response
            .header("Content-Type", isImage ? file.type : "text/plain")
            .send(
                isImage ? decodeBase64(file.data.split(",")[1]) : file.data,
            );
    });

    app.get("/files", checkToken(cryptoKey), async ({ state, response }) => {
        const username = state.user?.username;
        if (!username) return error(response)("Unauthorized", 401);
        const files = [];
        for await (const { uuid, record } of storage.listFileRecords(kv, { uploader: username })) {
            files.push({
                ...record,
                uuid,
                data: undefined,
            });
        }
        return files;
    });
}
