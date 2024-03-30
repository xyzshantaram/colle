import { cf, message } from "../deps.js";
import { UserPastes } from "./UserPastes.js";

export const AuthController = async (client) => {
    const store = new cf.Store(false);

    const [elt, indicator, form, signupLink, codeGroup, wrapper, codeField] = cf.nu('div#auth-controller', {
        raw: true,
        gimme: ['.auth-indicator', '.auth-form', '.signup-link', '.signup-code-group', '.auth-form-wrapper', '#auth-code'],
        c: cf.html`
        <div class='auth-indicator' tabindex=0>
            Not signed in.
        </div>

        <div class="auth-form-wrapper hidden">
            <form class='auth-form'>
                <div class=form-group>
                    <label for=auth-username>Username</label>
                    <input id=auth-username type=text name=username>
                </div>
                <div class=form-group>
                    <label for=auth-password>Password</label>
                    <input id=auth-password type=password name=password>
                </div>
                
                <a class='signup-link' href="javascript:void(0)">
                    Don't have an account?
                </a>
                <div class="form-group signup-code-group hidden">
                    <label for=auth-code>Signup code</label>
                    <input id=auth-code type=password name=code>
                </div>

                <div class="form-group submit-group">
                    <input type=submit value=Submit>
                </div>
            </form>
        </div>
        `
    });

    let wrapperVisible = false;

    indicator.onclick = () => {
        wrapper.classList.toggle('hidden', wrapperVisible);
        wrapperVisible = !wrapperVisible;
        if (store.value) {
            localStorage.removeItem('cached-token');
            window.location.reload();
        }
    }

    let codeGroupVisible = false;
    signupLink.onclick = () => {
        codeGroup.classList.toggle("hidden", codeGroupVisible);
        codeGroupVisible = !codeGroupVisible;
        signupLink.innerHTML = codeGroupVisible ? "Sign in" : "Don't have an account?";
        if (!codeGroupVisible) codeField.value = '';
    }

    const setSignedIn = async (username) => {
        indicator.innerHTML = `Signed in as ${username}`;
        store.update(true);
        wrapper.remove();
        indicator.title = 'Sign out';
        elt.append(...await UserPastes(client));
    }

    try {
        const token = localStorage.getItem('cached-token');
        if (token) {
            const username = await client.tryCachedToken(token);
            await setSignedIn(username);
        }
    }
    catch {
        console.log('Authing with cached token failed, proceeding silently...');
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const code = data.get('code')?.trim();
        const username = data.get('username')?.trim();
        const password = data.get('password')?.trim();

        try {
            if (code) {
                await client.signUp(username, password, code);
                signupLink.click();
                await message("Signed up successfully. You can now sign in as usual.");
            }
            else {
                await client.signIn(username, password);
                localStorage.setItem('cached-token', client.getToken());
                await setSignedIn(username);
            }
        }
        catch (e) {
            await message(e.message);
        }
    }

    return [elt, store];
}