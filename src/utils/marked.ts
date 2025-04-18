import { marked, Renderer, Tokens } from "marked";
import { escape, template } from "campfire";
import { macrolight } from "./macrolight.ts";

const TABLE_MARKUP = template(`\
<div class='table-wrapper'>
<table>
<thead>
{{{ header }}}
</thead>
<tbody>
{{{ body }}}
</tbody>
</table>
</div>
`);

const TableCell = (cell: Tokens.TableCell, tag = "td") => {
    const alignAttr = cell.align ? ` align="${cell.align}"` : "";
    return `<${tag}${alignAttr}>${cell.text}</${tag}>`;
};

const renderer: Partial<Renderer> = {
    image: ({ href, title, text }) => {
        const out = [`<div class='img-wrapper'><img src='${href}' alt='${text}'`];
        if (title) {
            out.push(` title=${title}`);
        }
        out.push(
            ">",
            `<span aria-hidden='true' class='img-description'>${text}</span>`,
            "</div>",
        );
        return out.join("");
    },
    code: ({ text, lang, escaped }) => {
        const langMatches = (lang || "").match(/\S*/);
        if (langMatches) {
            lang = langMatches[0];
        }
        if (lang) {
            text = macrolight(text, lang);
            escaped = true;
        }
        return `\n<pre><code>${(escaped ? text : escape(text))}</code></pre>\n`;
    },
    table: ({ header, rows }: Tokens.Table) => {
        const headerHtml = `<tr>${header.map((cell) => TableCell(cell, "th")).join("")}</tr>`;
        const bodyHtml = rows.map((row) =>
            `<tr>${row.map((cell) => TableCell(cell)).join("")}</tr>`
        ).join("");

        return TABLE_MARKUP({
            header: headerHtml,
            body: bodyHtml,
        });
    },
    heading({ tokens, depth }) {
        const text = this.parser?.parseInline(tokens) || "";

        return `
            <div class='colle-heading-${depth}'>
              ${text}
            </div>`;
    },
};

marked.use({ renderer });
export { marked };
