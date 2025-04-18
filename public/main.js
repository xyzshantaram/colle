import { Colle } from "https://deno.land/x/colle@2.2.0/src/Colle.js";
import { AuthController } from "./components/AuthController.js";
import { CodeGenerator } from "./components/CodeGenerator.js";
import { Uploader } from "./components/Uploader.js";
import { MARIO_TAPS, listenForRhythm } from "./deps.js";
import { initTabs } from "./tabs.js";


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

    const [codegen] = setupCodeGenerator(client);
    const [auth, username] = await AuthController(client);
    const [uploader] = Uploader(client, username);

    root.append(auth, codegen, uploader);
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