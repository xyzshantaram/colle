import { error } from "../utils/error.ts";
import { decodeBase64 } from "@std/encoding";
import { NHttp } from "@nhttp/nhttp";
import { ColleOptions, FileRecord } from "../types.ts";
import { checkToken } from "../middleware/auth.ts";

export function registerFileRoutes(app: NHttp, opts: ColleOptions) {
    const { kv, cryptoKey } = opts;

    app.post(
        "/file",
        checkToken(cryptoKey),
        async ({ response, state, body, request }) => {
            const username = state.user?.username;
            if (!username) return error(response)("Unauthorized", 401);
            const uuid = crypto.randomUUID();
            const type = request.headers.get("Content-Type");
            console.log(22, "content-type", type);
            console.log(body);
            if (!type) {
                return error(response)(
                    "Content type of file must be specified!",
                );
            }
            const metadata = body.metadata;
            console.log(29, "content-type", metadata);

            await kv.set(["files", uuid], {
                uploader: username,
                data: body.contents,
                metadata,
                type,
            });

            console.log(38, "success");
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
            const { value: file } = await kv.get<FileRecord>([
                "files",
                username,
                body.uuid,
            ]);
            if (!file || file.uploader !== username) {
                return error(response)("File not found.", 404);
            }
            await kv.delete(["files", username, body.uuid]);
            return { message: "ok" };
        },
    );

    app.get("/file", ({ response }) => {
        return error(response)("UUID must be specified!");
    });

    const getFile = async (username: string, uuid: string) => {
        if (!uuid) throw "UUID must be specified!";
        const { value: file } = await kv.get<FileRecord>([
            "files",
            username,
            uuid,
        ]);
        if (!file) throw "No such file.";
        return {
            ...file,
            metadata: JSON.parse(file.metadata || "null"),
        };
    };

    app.get(
        "/file/:uuid",
        checkToken(cryptoKey),
        async ({ params, state, response }) => {
            try {
                const username = state.user?.username;
                if (!username) return error(response)("Unauthorized", 401);
                return await getFile(username, params.uuid);
            } catch (s) {
                return error(response)(`${s}`, 400);
            }
        },
    );

    app.get("/view/:uuid", async ({ params, response }) => {
        for await (const entry of kv.list<FileRecord>({ prefix: ["files"] })) {
            if (entry.key[2] === params.uuid) {
                const file = entry.value;
                const isImage = file.type.startsWith("image");
                return response
                    .header("Content-Type", isImage ? file.type : "text/plain")
                    .send(
                        isImage ? decodeBase64(file.data.split(",")[1]) : file.data,
                    );
            }
        }
        response.status(404).html("File not found");
    });

    app.get("/files", checkToken(cryptoKey), async ({ state, response }) => {
        const username = state.user?.username;
        if (!username) return error(response)("Unauthorized", 401);
        const files = [];
        for await (
            const entry of kv.list<FileRecord>({ prefix: ["files", username] })
        ) {
            files.push({
                ...entry.value,
                uuid: entry.key[2],
                data: undefined,
                metadata: JSON.parse(entry.value.metadata ?? "null"),
            });
        }
        return files;
    });
}
