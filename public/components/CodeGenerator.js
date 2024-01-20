import { message } from "https://esm.sh/cf-alert@0.4.1";
import { cf } from "../deps.js"

export const CodeGenerator = (client) => {
    const hidden = new cf.Store(true);
    const [elt, form, results] = cf.nu('div#code-generator-wrapper.modal.hidden', {
        raw: true,
        gimme: ['form', 'ul'],
        c: cf.html`
        <div id=code-generator>
            <h2>Huzzah! You discovered the secret menu!</h2>
            <p>Sadly, that's not enough... you need the password too.</p>
            <form>
                <div class='form-group'>
                    <label for=admin-password>Password</label>
                    <input type=password name=admin-password id=admin-password>
                </div>

                <div class='form-group submit-group'>
                    <input type=submit value=Submit>
                </div>
            </form>

            <ul class=results></ul>
        </div>
        `
    })

    form.onsubmit = async (e) => {
        e.preventDefault();
        const pass = form.querySelector("#admin-password").value.trim();
        try {
            const result = await client.genSignupCode(pass);
            results.append(cf.nu('li', { c: result }));
        }
        catch (e) {
            await message(e.message);
        }
    }

    globalThis.addEventListener('keydown', (e) => {
        if (!hidden.value && e.key === 'Escape') hidden.update(!hidden.value);
    })

    hidden.on('update', (val) => elt.classList.toggle('hidden', val));

    return [elt, hidden];
}