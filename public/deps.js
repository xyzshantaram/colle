import cf from "https://esm.sh/campfire.js@4.0.0-rc17";
import { confirm, message, input, fatal } from "https://esm.sh/cf-alert@0.4.1";
import { listenForRhythm, generatePattern } from './rhythm-listener.js';

export const MARIO_TAPS = generatePattern(70, [100, 250, 250, 100, 300, 500]);

export { cf, confirm, message, input, fatal, listenForRhythm };