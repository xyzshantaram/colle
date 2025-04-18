import { cf } from "../deps.js";

const inputId = cf.ids('colle-input');

export const Field = ({ name, type = 'text', label, classes = [], value, elt }) => {
    const id = inputId();
    const labelHtml = label ? cf.html`<label for="${id}">${label}</label>` : "";
    const inputHtml = cf.html`<input type="${type}" id="${id}" name="${name}" ${value ? `value=${value}` : ''}>`;

    const builder = cf.nu('div.form-group');
    for (const c of classes) builder.cls(c);
    if (type === 'submit') builder.cls('submit-group');

    if (!elt) return builder.html(labelHtml + inputHtml).gimme('input').done();

    const [built] = builder.done();
    cf.insert(elt, { into: built });
    return [built];
}