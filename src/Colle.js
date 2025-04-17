/**
 * Colle pastebin client class.
 */
export class Colle {
    /**
     * Creates a client instance.
     * @param {string} [root="/"] - The root URL for Colle. Defaults to "/",
     * set it to wherever your instance is if you're not hosting the frontend
     * from the same server as the backend.
     */
    constructor(root = "/") {
        /**
         * The root URL for Colle.
         * @type {string}
         */
        this.root = root;

        /**
         * Authentication token.
         * @type {string | null}
         */
        this.token = null;
    }

    /**
     * Try authenticating with a token you've cached elsewhere.
     * Uses the token for future requests if it is valid, throws otherwise.
     * @param {string} token The token to try.
     * @returns The username, if the token is valid.
     */
    async tryCachedToken(token) {
        const res = await fetch(this.makeUrl('/whoami'), { headers: { Authorization: "Bearer " + token } });
        if (res.ok) {
            this.token = token;
            return res.json().then(json => json.username);
        }

        throw await res.json();
    }

    /**
     * Deletes a file from the server.
     * @param {string} uuid - The UUID of the file to delete.
     * @returns {Promise<void>} A promise that resolves if the delete succeeded.
     * @throws {object} Throws an object with an error message if not authed 
     * or the file wasn't found.
     */
    async deleteFile(uuid) {
        if (!this.token) throw { message: "Not authed!" };
        const res = await fetch(this.makeUrl("/file"), {
            method: "DELETE",
            body: JSON.stringify({ uuid }),
            headers: {
                Authorization: "Bearer " + this.token
            }
        }).then(res => res.json());
        if (res.message !== "ok") throw res;
    }

    /**
     * Generates a signup code for Colle.
     * @param {string} pass - The Colle admin password (environment value COLLE_ADMIN_PASS).
     * @returns {Promise<string>} A promise that resolves with the generated signup code.
     * @throws {object} Throws an object with an error message if code creation fails.
     */
    async genSignupCode(pass) {
        const res = await fetch(this.makeUrl("/signup-code"), {
            method: "POST",
            body: JSON.stringify({ pass })
        }).then(v => v.json());

        if (!res.code) throw res;
        return res.code;
    }

    /**
     * Gets a file from Colle.
     * @param {string} uuid - The UUID of the file to retrieve.
     * @returns {Promise<object>} A promise that resolves with the file info. Available
     * keys: `metadata` (optional), `type` (the content type of the file), `contents`
     * (the file contents), and `uploader` (the username of the uploader).
     * @throws {object} Throws an object with an error message if the instance has
     * not been authed with signIn().
     */
    async getFile(uuid) {
        const res = await fetch(this.makeUrl(`/file/${uuid}`)).then(res => res.json());
        if (res.message) throw res;
        return res;
    }

    /**
     * Auths the current class instance to the server.
     * @param {string} username - The username for signing in.
     * @param {string} password - The password for signing in.
     * @returns {Promise<void>} A promise that resolves when sign-in is successful.
     * @throws {object} Throws the response object if there is an error.
     */
    async signIn(username, password) {
        const res = await fetch(this.makeUrl("/sign-in"), {
            method: "POST",
            body: JSON.stringify({ username, password })
        }).then(v => v.json());

        if (!res.token) {
            throw res;
        }

        this.token = res.token;
    }

    /**
     * Signs up to Colle with a username, password, and signup code.
     * @param {string} username - The username for signing up.
     * @param {string} password - The password for signing up.
     * @param {string} code - The signup code for registration.
     * @returns {Promise<void>} A promise that resolves when signup is successful.
     * @throws {object} Throws an object with an error message if signup fails.
     */
    async signUp(username, password, code) {
        if (!username || !password || !code) throw {
            'message': "Enter your username, password, and a signup code."
        };
        const res = await fetch(this.makeUrl("/sign-up"), {
            method: "POST",
            body: JSON.stringify({ username, password, code })
        }).then(v => v.json());

        if (res.message !== "ok") {
            throw res;
        }
    }

    /**
     * Uploads a file to Colle.
     * @param {string} contents - The contents of the file to upload, either as plaintext or
     * encoded as base64.
     * @param {string} type - The content type of the file.
     * @param {object} [metadata=undefined] - Any miscellaneous metadata you wish to include
     * about the file. For example, syntax highlight language, or filename.
     * @returns {Promise<string>} A promise that resolves with the UUID of the uploaded file.
     * @throws {object} Throws an object with an error message if the upload fails.
     */
    async upload(contents, type, metadata) {
        if (!this.token) throw { message: "Not authed!" };
        const data = new FormData();
        data.set('contents', contents);
        data.set('type', type);
        data.set('metadata', JSON.stringify(metadata));
        const res = await fetch(this.makeUrl("/file"), {
            method: "POST",
            body: data,
            headers: {
                Authorization: "Bearer " + this.token,
            }
        }).then(res => res.json());

        if (!res.uuid) throw res;
        return res.uuid;
    }

    /**
     * List the files for the currently authenticated user.
     * @returns The list of files, or an object containing an error message.
     */
    listFiles() {
        if (!this.token) throw { message: "Not authed!" };
        const res = fetch(this.makeUrl('/files'), {
            headers: { Authorization: "Bearer " + this.token }
        }).then(res => res.json());
        if (res.message) throw res;
        return res;
    }

    /**
     * Creates a full URL for a given route by appending it to the root URL.
     * @param {string} route - The route to append to the root URL.
     * @returns {string} The full URL.
     */
    makeUrl(route) {
        if (this.root === "/") {
            return this.root + route.slice(1, route.length);
        }
        return this.root + route;
    }

    /**
     * Get the token from the client's internal state.
     * @returns The token.
     */
    getToken() {
        return this.token;
    }
}