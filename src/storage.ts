// src/kv.ts

import { FileRecord } from "./types.ts";

// Store a file record and return the generated UUID
export async function saveFileRecord(
    kv: Deno.Kv,
    { uploader, data, metadata, type }: FileRecord,
): Promise<{ uuid: string }> {
    const uuid = crypto.randomUUID();
    await kv.set(["files", uuid], {
        uploader,
        data,
        metadata,
        type,
    });
    return { uuid };
}

// Get a file record by UUID
export async function getFileRecord(
    kv: Deno.Kv,
    uuid: string,
): Promise<FileRecord | null> {
    const { value } = await kv.get<FileRecord>(["files", uuid]);
    if (!value) return null;
    return {
        ...value,
        metadata: value.metadata,
    };
}

// Delete a file record by UUID
export async function deleteFileRecord(
    kv: Deno.Kv,
    uuid: string,
): Promise<boolean> {
    const { value: file } = await kv.get<FileRecord>(["files", uuid]);
    if (!file) return false;
    await kv.delete(["files", uuid]);
    return true;
}

// List file records, optionally filter by uploader
export async function* listFileRecords(
    kv: Deno.Kv,
    filter?: { uploader?: string },
): AsyncGenerator<{ uuid: string; record: FileRecord }> {
    for await (const entry of kv.list<FileRecord>({ prefix: ["files"] })) {
        const [, uuid] = entry.key;
        if (filter?.uploader && entry.value.uploader !== filter.uploader) continue;
        yield {
            uuid: String(uuid),
            record: {
                ...entry.value,
                metadata: entry.value.metadata,
            },
        };
    }
}
