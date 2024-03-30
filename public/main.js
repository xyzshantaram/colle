import { Colle } from "https://deno.land/x/colle@2.0.1/src/Colle.js";
import { AuthController } from "./components/AuthController.js";
import { CodeGenerator } from "./components/CodeGenerator.js";
import { Uploader } from "./components/Uploader.js";
import { FileViewer } from "./components/FileViewer.js";
import { MARIO_TAPS, listenForRhythm } from "./deps.js";

export const initTabs = () => {
    const tabWrappers = Array.from(document.querySelectorAll('.tabs'));
    tabWrappers.forEach(wrapper => {
        let tabSet = '';
        if (!wrapper.getAttribute('data-tabset-name')) throw new Error('No tab set name provided');
        else tabSet = wrapper.getAttribute('data-tabset-name');

        const tabs =
            Array.from(wrapper.querySelector(':scope>.tab-buttons').querySelectorAll('.tab-button'));
        const tabBodies =
            Array.from(wrapper.querySelectorAll(':scope>.tab-content'));

        tabs.forEach((tab) => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('selected'));
                tab.classList.add('selected');
                tabBodies.forEach(body => body.style.display = 'none');

                const name = tab.getAttribute('data-tabname');
                const content = document.querySelector(`.tab-content[data-tabname="${name}"]`);
                if (content) {
                    content.style.display = 'block';
                }

                globalThis.dispatchEvent(new CustomEvent('tabchange', {
                    detail: { name, tabSet }
                }));
            }
        })

        tabs[0].click();
    })
}

const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let nextKonamiPos = 0;

const setupCodeGenerator = (client) => {
    const [elt, hidden] = CodeGenerator(client);
    const toggleVis = () => hidden.update(!hidden.value);
    globalThis.addEventListener('konami', toggleVis);
    listenForRhythm(MARIO_TAPS, document.querySelector('h1'), 100, toggleVis);

    return [elt];
}

const init = async () => {
    const client = new Colle();
    const root = document.querySelector('#root');

    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');

    const [codegen] = setupCodeGenerator(client);
    const [auth, authed] = await AuthController(client);
    const [uploader] = Uploader(client, !view);
    authed.on('update', v => uploader.classList.toggle('hidden', !v));

    const [fileView] = await FileViewer(client, view);

    root.append(auth, codegen, uploader, fileView);

    initTabs();
}

document.addEventListener('keyup', function (e) {
    if (e.key == konamiSequence[nextKonamiPos]) {
        nextKonamiPos += 1;
        if (nextKonamiPos == konamiSequence.length) {
            nextKonamiPos = 0;
            const event = new Event('konami');
            globalThis.dispatchEvent(event);
        }
    } else {
        nextKonamiPos = 0;
    }
});

globalThis.addEventListener('DOMContentLoaded', init);