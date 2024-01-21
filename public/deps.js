import cf from "https://esm.sh/campfire.js@4.0.0-alpha2";
import { confirm, message, input, fatal } from "https://esm.sh/cf-alert@0.4.1";

const getName = (file, quoted = true) => {
    const name = file.metadata.name || file.metadata.description;
    if (!name) return 'Untitled Paste';
    if (quoted) return `"${name}"`;
    return name;
}

export { cf, confirm, message, input, fatal, getName };