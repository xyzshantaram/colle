import { KvToolbox } from "@kitsonk/kv-toolbox";

export interface ColleOptions {
    kv: KvToolbox;
    pass: string;
    cryptoKey: CryptoKey;
    env: "PROD" | "DEBUG";
}

export interface FileMeta {
    uploader: string;
    type: string;
    metadata: Record<string, string | number | boolean>;
}

export interface FileRecord extends FileMeta {
    data: Uint8Array;
}

export interface UserRecord {
    password: string;
}
