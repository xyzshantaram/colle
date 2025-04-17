export interface ColleOptions {
    kv: Deno.Kv;
    pass: string;
    cryptoKey: CryptoKey;
    env: "PROD" | "DEBUG";
}

export interface FileRecord {
    uploader: string;
    data: string;
    metadata?: string;
    type: string;
}

export interface UserRecord {
    password: string;
}
