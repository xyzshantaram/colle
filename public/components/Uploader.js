import { cf } from "../deps.js";

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

export const Uploader = (client, open = false) => {
    const fileData = new cf.Store({});

    const [elt, textarea, uploadField, txtUpload, img, imgUpload, input, description] =
        cf.nu("details#uploader.tabs.hidden", {
            raw: true,
            gimme: ['textarea', '#upload-filename', '.upload-text', '.upload-img-preview', '.upload-img', 'input[type=file]', '.upload-description'],
            c: cf.html`
        <summary><h2>Upload a file<h2></summary>

        <div class=tab-buttons>
            <button type=button class='tab-button' data-tabname="Text">Text</button>
            <button type=button class='tab-button' data-tabname="Image">Image</button>
        </div>

        <div class=tab-content data-tabname="Text">
            <div class=text-upload-area>
                <div class=upload-controls>
                    <div class="form-group">
                        <label for=upload-filename>Filename (optional)</label>
                        <input id=upload-filename type=text name=upload-filename placeholder="None">
                    </div>
                </div>
                <textarea></textarea>
                <div class="form-group submit-group">
                    <button type=button class=upload-text>Upload</button>
                </div>
            </div>
        </div>
        <div class=tab-content data-tabname="Image">
            <div class="form-group">
                <label for=upload-description>Image description (optional)</label>
                <input class=upload-description type=text name=upload-description placeholder="None">
            </div>
            <div class=upload-img-wrapper>
                <input type=file accept="image/png, image/jpeg, image/webp">
                <img class=upload-img-preview>
            </div>
            <div class="form-group submit-group">
                <button type=button class=upload-img>Upload</button>
            </div>
        </div>
        `,
            a: { 'data-tabset-name': 'Upload' }
        });

    elt.toggleAttribute('open', open);

    textarea.oninput = () => {
        fileData.update({
            contents: textarea.value,
            type: 'text/plain'
        })
    }

    fileData.on('update', (val) => {
        if (val.isImg) {
            img.src = val.contents;
        }
    })

    const handleFile = async (file) => {
        if (file && ["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            fileData.update({
                contents: await blobToBase64(file),
                type: file.type,
                isImg: true
            });
            elt.querySelector('.tab-button[data-tabname="Image"]').click();
        }
    }

    globalThis.addEventListener('paste', async e => await handleFile(e.clipboardData.files[0]));
    input.onchange = async _ => await handleFile(input.files[0]);

    imgUpload.onclick = txtUpload.onclick = async () => {
        const language = (_ => {
            if (fileData.value.isImg) return;
            const trimmedName = uploadField.value.trim();
            if (!trimmedName) return;
            const split = trimmedName.split('.');
            if (split.at(-1) === trimmedName) return;
            return split.at(-1);
        })();

        const uuid = await client.upload(fileData.value.contents, fileData.value.type, {
            language,
            description: description.value || undefined
        });

        window.location = client.makeUrl(`/?view=${uuid}`);
    }
    return [elt];
}