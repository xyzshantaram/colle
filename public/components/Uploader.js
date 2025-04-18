import { cf, fatal } from "../deps.js";
import { Field } from "./Field.js";

function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

const TabButton = (name) =>
    cf.html`<button type=button class=tab-button data-tabname="${name}">${name}</button>`;

const Tabs = (...names) => `<div class=tab-buttons>${names.map(TabButton).join('\n')}</div>`;

const ImageUpload = (onChange, data) => {
    const [elt, input, img] = cf.nu('div.upload-img-wrapper')
        .gimme('input', 'img')
        .html`<input type=file accept="image/png, image/jpeg, image/webp">
           <img class=upload-img-preview>`
        .done();

    data.on('update', async ({ value }) => value.isImg && (img.src = await blobToBase64(value.contents)));
    input.onchange = async _ => await onChange(input.files[0]);

    return [elt];
}

const handleUpload = async (client, fileData) => {
    const { filename, description, contents, isImg } = fileData.current();
    console.log(fileData.current())
    const language = (!isImg) && filename && filename.includes('.')
        ? filename.split('.').at(-1) : undefined;

    fatal("Uploading, you will be redirected...", "Info");

    const uuid = await client.upload(contents, {
        name: !isImg ? filename : undefined,
        language,
        description
    });

    globalThis.location = client.makeUrl(`/view/${uuid}`);
}

const SubmitButton = (name, client, fileData) => Field({
    type: 'submit',
    elt: cf.nu('button')
        .on('click', () => handleUpload(client, fileData))
        .attr('type', 'button')
        .cls(`upload-${name}`)
        .content('Upload')
        .ref()
})[0]

export const Uploader = (client, username) => {
    const fileData = cf.store({ value: {} });

    const [uploadName, filenameInput] = Field({ name: 'upload-filename', label: "Filename (optional)" });
    const [uploadDesc, descInput] = Field({ name: 'upload-description', label: "Image description (optional)" });
    const textSubmit = SubmitButton('text', client, fileData);
    const imgSubmit = SubmitButton('img', client, fileData);

    const handleFileChange = (file) => {
        if (file && ["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            fileData.update({
                contents: file,
                type: file.type,
                description: descInput.value.trim(),
                isImg: true
            });
            elt.querySelector('.tab-button[data-tabname="Image"]').click();
        }
    }

    const [image] = ImageUpload(handleFileChange, fileData);

    const [elt, textarea] =
        cf.nu('details#uploader.tabs')
            .children({
                textSubmit,
                imgSubmit,
                filenameInput,
                uploadDesc,
                uploadName,
                image
            })
            .attr('data-tabset-name', 'Upload')
            .deps({ username })
            .gimme('textarea')
            .render(({ username }, { b }) => b.cls('hidden', !username)
                .html`<summary><h2>Upload a file<h2></summary>
                    ${cf.r(Tabs("Text", "Image"))}
                    <div class=tab-content data-tabname="Text">
                        <div class=text-upload-area>
                            <div class=upload-controls>
                                <cf-slot name='uploadName'></cf-slot>
                            </div>
                            <textarea></textarea>
                            <cf-slot name='textSubmit'></cf-slot>
                        </div>
                    </div>

                    <div class=tab-content data-tabname="Image">
                        <cf-slot name='uploadDesc'></cf-slot>
                        <cf-slot name="image"></cf-slot>
                        <cf-slot name='imgSubmit'></cf-slot>
                    </div>
                `)
            .done();

    elt.toggleAttribute('open', open);

    textarea.onchange = () => {
        fileData.update({
            contents: textarea.value,
            type: 'text/plain',
            filename: filenameInput.value.trim()
        })
    }

    fileData.on('update', (val) => {
        if (val.isImg) {
            previewImg.src = val.contents;
        }
    })

    globalThis.addEventListener('paste', async e => await handleFileChange(e.clipboardData.files[0]));

    return [elt];
}