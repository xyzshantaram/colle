import { assert, assertEquals, assertMatch } from "@std/assert";
import { delay } from "@std/async";
import { createApp } from "./src/app.ts";

Deno.test("colle api tests", async (t) => {
    const tempKvPath = await Deno.makeTempFile();
    const kv = await Deno.openKv(tempKvPath);

    const pass = "test_admin_pass_" + crypto.randomUUID();
    const testUsername = "shantaram";
    const testPassword = "testing";
    const env = "DEBUG";
    const PORT = 3001;
    const BASE = `http://localhost:${PORT}`;

    const key = await crypto.subtle.generateKey(
        { name: "HMAC", hash: "SHA-512" },
        true,
        ["sign", "verify"],
    );

    const ac = new AbortController();
    const app = await createApp({ kv, pass, cryptoKey: key, env });
    app.listen({ port: PORT, signal: ac.signal });
    await delay(350);
    let signupCode = "";
    let jwt = "";
    let fileUuid = "";

    await t.step("generate signup code", async () => {
        const res = await fetch(`${BASE}/signup-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pass }),
        });
        assert(res.ok, "Should succeed for correct admin pass");
        const data = await res.json();
        assertEquals(typeof data.code, "string");
        signupCode = data.code;
    });

    await t.step(
        "generate signup code with wrong pass should fail",
        async () => {
            const res = await fetch(`${BASE}/signup-code`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pass: "not" }),
            });
            assert(!res.ok, "Should fail for wrong admin pass");
            const data = await res.json();
            assert(/invalid|missing/.test(data.message?.toLowerCase()));
        },
    );

    await t.step("Signup with correct code should work", async () => {
        const res = await fetch(`${BASE}/sign-up`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: testUsername,
                password: testPassword,
                code: signupCode,
            }),
        });
        const data = await res.json();
        assert(res.ok, `Signup should succeed: ${JSON.stringify(data)}`);
        assertEquals(data.message, "ok");
    });

    await t.step("Signup with incorrect code should fail", async () => {
    const res = await fetch(`${BASE}/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "fail_user",
            password: "fail_password",
            code: "WRONGCODE",
        }),
    });
    const data = await res.json();
    assert(!res.ok, "Signup should fail with incorrect code");
    assert(
        (data.message || "").toLowerCase().includes("signup code"),
        `Expected error about signup code, got: ${JSON.stringify(data)}`
    );
});

    await t.step("Signin should succeed", async () => {
        {
            const res = await fetch(`${BASE}/sign-in`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: testUsername,
                    password: testPassword,
                }),
            });
            const data = await res.json();
            assert(res.ok, `Sign in must succeed: ${JSON.stringify(data)}`);
            assertMatch(data.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);
            jwt = data.token;
        }
    });

    await t.step("Uploading files should succeed", async () => {
        const fileBytes = await Deno.readFile("/etc/hosts");
        const form = new FormData();
        form.append("contents", new Blob([fileBytes]), "hosts.txt");
        const res = await fetch(`${BASE}/file`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${jwt}`,
            },
            body: form,
        });
        const data = await res.json();
        assert(res.ok, `File upload must succeed: ${JSON.stringify(data)}`);
        assert(typeof data.uuid === "string");
        fileUuid = data.uuid;
    });

    await t.step("Listing files should succeed", async () => {
        const res = await fetch(`${BASE}/files`, {
            headers: { "Authorization": `Bearer ${jwt}` },
        });
        assert(res.ok, "List files should succeed");
        const files = await res.json();
        assert(
            files.some((f: any) => f.uuid === fileUuid),
            `Should include uploaded file ${fileUuid}`,
        );
    });

    await t.step("GET file metadata", async () => {
        const res = await fetch(`${BASE}/file/${fileUuid}`, {
            headers: { "Authorization": `Bearer ${jwt}` },
        });
        assert(res.ok, "GET file should succeed");
        const file = await res.json();
        assertEquals(file.uploader, testUsername);
    });

    await t.step("GET file with missing UUID should fail", async () => {
        const res = await fetch(`${BASE}/file`);
        assert(!res.ok, "Should fail");
        const data = await res.json();
        assert(data.message?.toLowerCase().includes("uuid"));
    });

    await t.step("Downloading file should work", async () => {
        const res = await fetch(`${BASE}/view/${fileUuid}`);
        assert(res.ok);
        const text = await res.text();
        assert(text.length > 0, "Should return file content");
    });

    await t.step("Delete file should work", async () => {
        const res = await fetch(`${BASE}/file`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ uuid: fileUuid }),
        });
        const data = await res.json();
        assert(res.ok, JSON.stringify(data));
        assertEquals(data.message, "ok");
    });

    ac.abort();
    kv.close();
});
