import { message } from "https://esm.sh/cf-alert@0.4.1";
import { cf } from "../deps.js";
import { Field } from "./Field.js";

export const CodeGenerator = (client) => {
    const hidden = new cf.Store(true);
    const [password, passwordField] = Field({ name: 'cf-gen-password', type: 'password', label: 'Password' });
    const [submit] = Field({ name: 'cf-submit', type: 'submit', value: "Generate" });
    const results = cf.nu('ul.results').ref();

    const [elt, form] = cf.nu('div#code-generator-wrapper.modal.hidden')
        .gimme('form')
        .html`<div id=code-generator>
                <h2>Huzzah! You discovered the secret menu!</h2>
                <p>Sadly, that's not enough... you need the password too.</p>
                <form>
                    <cf-slot name=password></cf-slot>
                    <cf-slot name=submit></cf-slot>
                </form>
                
                <cf-slot name=results></cf-slot>
            </div>`
        .children({ submit, password, results })
        .done();

    form.onsubmit = async (e) => {
        e.preventDefault();
        const pass = passwordField.value.trim();
        try {
            const result = await client.genSignupCode(pass);
            results.append(cf.nu('li').content(result).ref());
        }
        catch (e) {
            await message(e.message);
        }
    }

    globalThis.addEventListener('keydown', (e) => {
        if (!hidden.current() && e.key === 'Escape') hidden.update(!hidden.current());
    })

    hidden.on('update', ({ value }) => elt.classList.toggle('hidden', value));

    return [elt, hidden];
}