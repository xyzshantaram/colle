import { cf, message } from "../deps.js";
import { Field } from "./Field.js";
import { UserPastes } from "./UserPastes.js";
/** @import cf from "https://esm.sh/campfire.js@4.0.0-rc17" */

const AuthIndicator = (username, state, signOut) => cf
    .nu('.auth-indicator')
    .deps({ username })
    .on('click', () => {
        if (username.current()) return signOut();
        if (state.current() === 'hidden') state.update('signin');
    })
    .render(({ username }, { b }) =>
        b.content(username ? `Signed in as ${username}` : 'Not signed in.')
            .attr('title', username ? 'Sign out' : 'Sign in'))
    .ref();

const SignupLink = (state) => cf.nu('a.signup-link')
    .deps({ state })
    .attr('href', 'javascript:void(0)')
    .render(({ state }) => state === 'signup' ? "Sign in" : "Don't have an account?")
    .on('click', () => state.update(v => v === 'signup' ? 'signin' : 'signup'))
    .done();

const SignupForm = (client, children, setSignedIn, state) => cf.nu('form.auth-form')
    .children(children)
    .html``
    .deps({ state })
    .render(({ state }, { b }) => b.html`<cf-slot name="usernameField"></cf-slot>
        <cf-slot name="passwordField"></cf-slot>
        <cf-slot name='signupLink'></cf-slot>
        <cf-slot name="signupField"></cf-slot>
        <cf-slot name="submitField"></cf-slot>`
        .cls('hidden', state === 'hidden')
    )
    .on('submit', async function (e) {
        e.preventDefault();
        const data = new FormData(this);
        const code = data.get('signup-code')?.trim();
        const username = data.get('username')?.trim();
        const password = data.get('password')?.trim();

        try {
            if (code) {
                await client.signUp(username, password, code);
                await message("Signed up successfully. You can now sign in as usual.");
            }
            else {
                await client.signIn(username, password);
                localStorage.setItem('cached-token', client.getToken());
                await setSignedIn(username);
            }

            this.reset();
        }
        catch (e) {
            await message(e.message);
        }
    })
    .ref();

export const AuthController = async (client) => {
    /** values: signup, signin, hidden */
    const formState = cf.store({ value: 'signin' });
    const username = cf.store({ value: null });

    const [signupField] = cf.nu(Field({ name: 'signup-code', label: "Signup code" })[0])
        .deps({ formState })
        .render(({ formState }, { elt }) => {
            elt.classList.toggle('hidden', formState === 'signin')
        })
        .done();

    const signupLink = SignupLink(formState);

    const signOut = () => {
        localStorage.removeItem('cached-token');
        globalThis.location.reload();
    }

    const children = {
        signupField,
        signupLink,
        usernameField: Field({ name: 'username', label: 'Username' })[0],
        passwordField: Field({ name: 'password', label: "Password", type: "Password" })[0],
        submitField: Field({ name: 'submit', type: 'submit', value: "Submit" })[0],
    }

    const setSignedIn = async (user) => {
        username.update(user);
        formState.update('hidden');
        controller.append(...await UserPastes(client));
    }

    const [controller] = cf.nu('div#auth-controller')
        .deps({ formState })
        .children({
            form: SignupForm(client, children, setSignedIn, formState),
            indicator: AuthIndicator(username, formState, signOut)
        })
        .html`
        <cf-slot name="indicator"></cf-slot>
        <div class="auth-form-wrapper">
            <cf-slot name='form'></cf-slot>
        </div>
        `
        .done();

    try {
        const token = localStorage.getItem('cached-token');
        if (!token) throw 0;
        const username = await client.tryCachedToken(token);
        await setSignedIn(username);
    }
    catch {
        console.warn('Authing with cached token failed, proceeding silently...');
    }

    return [controller, username];
}