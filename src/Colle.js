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
     * Deletes a file from the server.
     * @param {string} uuid - The UUID of the file to delete.
     * @returns {Promise<void>} A promise that resolves if the delete succeeded.
     * @throws {object} Throws an object with an error message if not authed 
     * or the file wasn't found.
     */
    async deleteFile(uuid) {
        if (!this.token) throw { message: "Not authed!" };
        const res = await fetch(this._makeUrl("file"), {
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
        const res = await fetch("/signup-code", {
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
     * keys: `name` (optional), `type` (the content type of the file), `contents`
     * (the file contents), and `uploader` (the username of the uploader).
     * @throws {object} Throws an object with an error message if the instance has
     * not been authed with signIn().
     */
    async getFile(uuid) {
        if (!this.token) throw { message: "Not authed!" };
        return await fetch(this._makeUrl(`file/${uuid}`)).then(res => res.json());
    }

    /**
     * Auths the current class instance to the server.
     * @param {string} username - The username for signing in.
     * @param {string} password - The password for signing in.
     * @returns {Promise<void>} A promise that resolves when sign-in is successful.
     * @throws {object} Throws the response object if there is an error.
     */
    async signIn(username, password) {
        const res = await fetch("/sign-in", {
            method: "POST",
            body: JSON.stringify({ username, password })
        }).then(v => v.json());

        if (res.message !== "ok") {
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
        const res = await fetch("/sign-up", {
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
        const res = await fetch(this._makeUrl("file"), {
            method: "POST",
            body: JSON.stringify({ contents, metadata }),
            headers: {
                Authorization: "Bearer " + this.token,
                'Content-Type': type
            }
        }).then(res => res.json());

        if (!res.uuid) throw res;
        return res.uuid;
    }

    /**
     * Creates a full URL for a given route by appending it to the root URL.
     * @private
     * @param {string} route - The route to append to the root URL.
     * @returns {string} The full URL.
     */
    _makeUrl(route) {
        return this.root + "/" + route;
    }
}