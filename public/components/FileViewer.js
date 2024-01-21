import { cf, message, fatal } from "../deps.js";
import { highlight, HL_KEYWORDS } from "https://esm.sh/macrolight@1.5.0";


export const FileViewer = async (client, uuid = "") => {
    try {
        const file = uuid ? await client.getFile(uuid) : undefined;
        const [elt] = cf.nu('#file-viewer.hidden');

        if (file) {
            const textMode = !file.type.startsWith('image');
            const hlMode = textMode ? (file.metadata.language || file.type.split('/')[1]) : undefined;
            const displayContents = textMode ?
                (hlMode && hlMode !== 'plain' ? highlight(file.data, { keywords: HL_KEYWORDS[hlMode] }) : file.data)
                : cf.html`<img src="${file.data}" alt="${file.metadata?.description || "No alt text provided."}">`;

            const [_, deleteLink] = cf.extend(elt, {
                raw: true,
                gimme: ['.delete-link'],
                c: cf.html`
            <h2>Viewing file</h2>
            <div class='${textMode ? 'text-wrapper' : 'image-wrapper'}'>${cf.r(displayContents)}</div>
            <ul class='options-wrapper'>
                <li><a class="delete-link" href="javascript:void(0)">Delete</a></li>
            </ul>
            `
            });

            deleteLink.onclick = async () => {
                await client.deleteFile(uuid);
                await message('Deleted successfully.');
            }
            elt.classList.remove('hidden');
        }

        return [elt];
    }
    catch (e) {
        return await fatal(e?.message || 'Error getting file.');
    }
}