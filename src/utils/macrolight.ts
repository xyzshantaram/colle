import { highlight, HL_KEYWORDS } from "macrolight";

export const macrolight = (code: string, lang: string) => {
    const keywords = (HL_KEYWORDS as Record<string, string[]>)[lang];
    return highlight(code, {
        keywords: keywords,
        styles: {
            keyword: "font-weight: bold",
            punctuation: "color: blue",
            string: "color: forestgreen",
            comment: "font-style: italic; color: gray",
        },
    });
};
