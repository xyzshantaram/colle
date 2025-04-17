import { assert, assertEquals, assertMatch } from "@std/assert";
import { delay } from "@std/async";
import { createApp } from "./src/app.ts";
import { Colle } from "./src/Colle.js";

Deno.test("colle api tests (with client)", async (t) => {
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

    const colle = new Colle(BASE);

    await t.step("generate signup code", async () => {
        signupCode = await colle.genSignupCode(pass);
        assertEquals(typeof signupCode, "string");
    });

    await t.step(
        "generate signup code with wrong pass should fail",
        async () => {
            try {
                await colle.genSignupCode("not");
                assert(false, "Should throw for wrong admin pass");
            } catch (err) {
                assert(
                    /invalid or missing admin password/i.test(
                        JSON.stringify(err),
                    ),
                    "Should throw correct error",
                );
            }
        },
    );

    await t.step("Signup with correct code should work", async () => {
        try {
            await colle.signUp(testUsername, testPassword, signupCode);
        } catch {
            assert(false, "Signup failed");
        }
    });

    await t.step("Signup with incorrect code should fail", async () => {
        try {
            await colle.signUp("fail_user", "fail_password", "WRONGCODE");
            assert(false, "Signup should fail with incorrect code");
        } catch (err) {
            assert(
                /signup code does not exist/i.test(JSON.stringify(err)),
                `Expected error about signup code, got: ${JSON.stringify(err)}`,
            );
        }
    });

    await t.step("Signin should succeed", async () => {
        await colle.signIn(testUsername, testPassword);
        jwt = colle.getToken()!;
        assertMatch(jwt ?? "", /^[\w-]+\.[\w-]+\.[\w-]+$/);
    });

    await t.step("Uploading files should succeed", async () => {
        const file = await Deno.readTextFile("/etc/hosts");
        fileUuid = await colle.upload(file, "text/plain", { name: "hosts.txt" });
        assert(typeof fileUuid === "string");
    });

    await t.step("Listing files should succeed", async () => {
        const files = await colle.listFiles();
        assert(Array.isArray(files));
        assert(
            files.some((f: any) => f.uuid === fileUuid),
            `Should include uploaded file ${fileUuid}`,
        );
    });

    await t.step("GET file metadata", async () => {
        const file: Record<string, any> = await colle.getFile(fileUuid);
        assertEquals(file.uploader, testUsername);
    });

    await t.step("GET file with missing UUID should fail", async () => {
        try {
            await colle.getFile("");
        } catch (err) {
            assert(
                `${err}`.toLowerCase().includes("uuid"),
                "Message should be about incorrect UUID",
            );
            assert(false, "Getting file with missing UUID should fail");
        }
    });

    await t.step("Downloading file should work", async () => {
        const res = await fetch(`${BASE}/view/${fileUuid}`);
        assert(res.ok);
        const text = await res.text();
        assert(text.length > 0, "Should return file content");
    });

    await t.step("Delete file should work", async () => {
        await colle.deleteFile(fileUuid);
        // Confirm delete by listing again
        const files = await colle.listFiles();
        assert(!files.some((f: any) => f.uuid === fileUuid), "File should be deleted");
    });

    ac.abort();
    kv.close();
});
