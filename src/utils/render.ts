import { marked } from "./marked.ts";
import { macrolight } from "./macrolight.ts";
import { html } from "campfire";

export const renderText = (ext: string, contents: string) => {
    switch (ext) {
        case "md":
            return marked.parse(contents);
        case "txt":
            return html`<pre>${contents}</pre>`;
        default:
            return `<pre><code>${macrolight(contents, ext)}</code></pre>`;
    }
};
