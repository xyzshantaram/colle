import { NHttp } from "@nhttp/nhttp";
import { error } from "../utils/error.ts";
import { ColleOptions } from "../types.ts";
import { checkToken } from "../middleware/auth.ts";
import * as storage from "../storage.ts";
import { getName, ViewTemplate } from "./view.ts";
import { renderText } from "../utils/render.ts";

const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();

export function registerFileRoutes(app: NHttp, opts: ColleOptions) {
    const { kv, cryptoKey } = opts;

    app.post(
        "/file",
        checkToken(cryptoKey),
        async ({ response, state, request }) => {
            const body = await request.formData();
            const username = state.user?.username;
            if (!username) return error(response)("Unauthorized", 401);
            const rawContent = body.get("contents");
            let type = "text/plain";

            const asBlob: Uint8Array | null = await (() => {
                if (rawContent instanceof File) {
                    type = rawContent.type;
                    return rawContent.bytes();
                } else if (typeof rawContent === "string") {
                    return Promise.resolve(encoder.encode(rawContent));
                }
                return null;
            })();

            const rawMeta = body.get("metadata");
            const metadata = typeof rawMeta === "string" ? JSON.parse(rawMeta) : null;

            if (!asBlob) return error(response)(`Invalid format for "contents"`, 400);
            if (!rawMeta) return error(response)(`Invalid format for "metadata"`, 400);

            const { uuid } = await storage.saveFileRecord(kv, {
                uploader: username,
                metadata,
                type,
                data: asBlob,
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
            const file = await storage.getFileMeta(kv, body.uuid);
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

    app.get("/view/:uuid", async ({ params, response, search }) => {
        const file = await storage.getFileRecord(kv, params.uuid);
        if (!file) return error(response)("File not found", 404);
        const isImg = file.type.startsWith("image");

        let ext = "txt";
        const { name } = file.metadata;
        if (typeof name === "string") {
            if (name.includes(".")) ext = name.split(".").at(-1) || "txt";
        }
        const searchParams = new URLSearchParams(search || "");
        const hl = searchParams.get("hl");
        if (hl) ext = hl;
        const contents = isImg ? undefined : renderText(ext, decoder.decode(file.data));

        return response.status(200).html(ViewTemplate({
            file,
            isImg,
            url: "/contents/" + params.uuid,
            contents,
            name: getName(file, true),
        }));
    });

    app.get("/contents/:uuid", async ({ params, response }) => {
        const file = await storage.getFileRecord(kv, params.uuid);
        if (!file) return error(response)("File not found", 404);
        const isImage = file.type.startsWith("image");
        return response
            .header("Content-Type", isImage ? file.type : "text/plain")
            .send(file.data);
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
