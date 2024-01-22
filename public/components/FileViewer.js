import { cf, fatal, getName } from "../deps.js";
import { highlight as macrolight, HL_KEYWORDS } from "https://esm.sh/macrolight@1.5.0";

const highlight = (contents, lang) => {
    return macrolight(contents, {
        keywords: HL_KEYWORDS[lang],
        styles: {
            string: "color: forestgreen",
            punctuation: "color: #404040",
            comment: "color: #404040"
        }
    })
}

export const FileViewer = async (client, uuid = "") => {
    try {
        const file = uuid ? await client.getFile(uuid) : undefined;
        const [elt] = cf.nu('#file-viewer.hidden');

        if (file) {
            const textMode = !file.type.startsWith('image');
            const hlMode = textMode ? (file.metadata.language || file.type.split('/')[1]) : undefined;
            const displayContents = textMode ?
                (hlMode && hlMode !== 'plain' ? highlight(file.data, hlMode) : file.data)
                : cf.html`<img src="${file.data}" alt="${file.metadata?.description || "No alt text provided."}">`;

            cf.extend(elt, {
                raw: true,
                gimme: ['.delete-link'],
                c: cf.html`
            <h2>Viewing paste ${getName(file)} by ${file.uploader}</h2>
            <div class='${textMode ? 'text-wrapper' : 'image-wrapper'}'>${cf.r(displayContents)}</div>
            `
            });

            elt.classList.remove('hidden');
        }

        return [elt];
    }
    catch (e) {
        return await fatal(e?.message || 'Error getting file.');
    }
}