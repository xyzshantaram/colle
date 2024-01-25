const isWithin = (n, min, max) => {
    return n >= min && n <= max;
}

const checkTouch = (touch, pattern, idx, tolerance) => {
    const target = pattern[idx];

    if (idx != 0) {
        if (!isWithin(touch.timeSinceLast, target.delay - tolerance, target.delay + tolerance)) {
            return false;
        }
    }

    return touch.duration > target.duration - tolerance;
}

export const listenForRhythm = (pattern, root, tolerance = 15, callback) => {
    const elt = typeof root === 'string' ?
        document.querySelector(root) : (typeof root === 'object' ? root : window);
    const touches = [];
    let currentTouch = 0;
    let patternIdx = 0;

    elt.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touches[currentTouch] ||= { at: performance.now() };
    });

    elt.addEventListener('touchend', (e) => {
        e.preventDefault();
        const now = performance.now();
        const t = touches[currentTouch];
        t.duration = now - t.at;
        if (currentTouch !== 0) {
            t.timeSinceLast = t.at -
                (touches[currentTouch - 1].at + touches[currentTouch - 1].duration);
        }

        if (checkTouch(t, pattern, patternIdx, tolerance)) patternIdx += 1;
        else patternIdx = 0;

        if (patternIdx === pattern.length) {
            callback();
            patternIdx = 0;
        }

        currentTouch += 1;
    })
}

export const generatePattern = (duration, delays) => {
    const res = [];
    for (let i = 0; i < delays.length + 1; i++) {
        if (i == 0) res.push({ duration });
        else res.push({ duration, delay: delays[i - 1] })
    }
    return res;
}