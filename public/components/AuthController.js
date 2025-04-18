import { cf, message } from "../deps.js";
import { Field } from "./Field.js";
import { UserPastes } from "./UserPastes.js";
/** @import cf from "https://esm.sh/campfire.js@4.0.0-rc17" */

const AuthIndicator = (username, state) => cf
    .nu('.auth-indicator')
    .deps({ username })
    .on('click', () => state.current() === 'hidden' && state.update('signin'))
    .render(({ username }, { b }) =>
        b.content(username ? 'Not signed in.' : `Signed in as ${username}`)
            .attr('title', username ? 'Sign out' : 'Sign in'))
    .ref();

const SignupLink = (state) => cf.nu('a.signup-link')
    .deps({ state })
    .attr('href', 'javascript:void(0)')
    .render(({ state }) => state === 'signup' ? "Sign in" : "Don't have an account?")
    .on('click', () => {
        state.update(v => v === 'signup' ? 'signin' : 'signup');
        console.log(state.current());
    })
    .done();

export const AuthController = async (client) => {
    /** values: signup, signin, hidden */
    const formState = cf.store({ value: 'signin' });
    const username = cf.store({ value: null });

    const [signupField] = cf.nu(Field({ name: 'signup-code', label: "Signup code" }))
        .deps({ formState })
        .render(({ formState }, { elt }) => {
            elt.classList.toggle('hidden', formState === 'signin')
        })
        .done();

    const signupLink = SignupLink(formState);

    const children = {
        signupField,
        signupLink,
        usernameField: Field({ name: 'username', label: 'Username' }),
        passwordField: Field({ name: 'password', label: "Password", type: "Password" }),
        submitField: Field({ name: 'submit', type: 'submit', value: "Submit" }),
        indicator: AuthIndicator(username, formState)
    }


    const [controller, form] = cf.nu('div#auth-controller')
        .gimme('.auth-form')
        .deps({ formState })
        .children(children)
        .render(({ formState }, { b }) => b.html`
        <cf-slot name="indicator"></cf-slot>
        <div class="auth-form-wrapper ${formState === 'hidden' ? 'hidden' : ''}">
            <form class='auth-form'>
                <cf-slot name="usernameField"></cf-slot>
                <cf-slot name="passwordField"></cf-slot>
                <cf-slot name='signupLink'></cf-slot>
                <cf-slot name="signupField"></cf-slot>
                <cf-slot name="submitField"></cf-slot>
            </form>
        </div>
        `)
        .done();


    const setSignedIn = async (user) => {
        username.update(user);
        formState.update('hidden');
        controller.append(...await UserPastes(client));
    }

    try {
        const token = localStorage.getItem('cached-token');
        if (token) {
            const username = await client.tryCachedToken(token);
            await setSignedIn(username);
        }
    }
    catch {
        console.warn('Authing with cached token failed, proceeding silently...');
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

    return [controller, username];
}