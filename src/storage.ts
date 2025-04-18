import { ColleOptions, FileMeta, FileRecord } from "./types.ts";

const getMeta = async (kv: ColleOptions["kv"], key: Deno.KvKey) => {
    const entry = await kv.get<FileMeta>(key);
    if (!entry.value) return null;
    return entry.value;
};

const getContents = async (kv: ColleOptions["kv"], key: Deno.KvKey) => {
    const entry = await kv.getBlob(key);
    if (!entry.value) return null;
    return entry.value; // Uint8Array
};

// Store a file record and return the generated UUID
export async function saveFileRecord(
    kv: ColleOptions["kv"],
    { uploader, data, metadata, type }: FileRecord,
): Promise<{ uuid: string }> {
    const uuid = crypto.randomUUID();
    await kv.set(["files", uuid], { uploader, type, metadata });
    await kv.setBlob(["contents", uuid], data);
    return { uuid };
}

export async function getFileMeta(kv: ColleOptions["kv"], uuid: string) {
    return await getMeta(kv, ["files", uuid]);
}

// Get a file record by UUID (merges meta and binary)
export async function getFileRecord(
    kv: ColleOptions["kv"],
    uuid: string,
): Promise<FileRecord | null> {
    const meta = await getMeta(kv, ["files", uuid]);
    if (!meta) return null;
    const data = await getContents(kv, ["contents", uuid]);
    if (!data) return null;
    return { ...meta, data };
}

// Delete a file record by UUID (from both meta and contents)
export async function deleteFileRecord(
    kv: ColleOptions["kv"],
    uuid: string,
): Promise<boolean> {
    const meta = await getMeta(kv, ["files", uuid]);
    if (!meta) return false;
    await kv.delete(["files", uuid]);
    await kv.delete(["contents", uuid]);
    return true;
}

// List file records' metadata (efficient, no blobs)
export async function* listFileRecords(
    kv: ColleOptions["kv"],
    filter?: { uploader?: string },
): AsyncGenerator<{ uuid: string; record: FileMeta }> {
    for await (const { key } of kv.list({ prefix: ["files"] })) {
        const [, uuid] = key;
        const meta = await getMeta(kv, key);
        if (!meta) continue;
        if (filter?.uploader && meta.uploader !== filter.uploader) continue;
        yield { uuid: String(uuid), record: meta };
    }
}
