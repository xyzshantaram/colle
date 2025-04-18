import { KvToolbox } from "@kitsonk/kv-toolbox";

export interface ColleOptions {
    kv: KvToolbox;
    pass: string;
    cryptoKey: CryptoKey;
    env: "PROD" | "DEBUG";
}

// New: Holds only metadata (not contents)
export interface FileMeta {
    uploader: string;
    type: string;
    metadata: Record<string, string | number | boolean>;
}

// Full record (includes contents as Uint8Array)
export interface FileRecord extends FileMeta {
    data: string;
}

export interface UserRecord {
    password: string;
}
