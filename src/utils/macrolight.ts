import { highlight, HL_KEYWORDS } from "macrolight";

export const macrolight = (code: string, lang: string) => {
    const keywords = (HL_KEYWORDS as Record<string, string[]>)[lang];
    return highlight(code, {
        keywords: keywords,
        styles: {
            keyword: "font-weight: bold",
            punctuation: "color: #055d05",
            string: "color: #2A2AA2",
            comment: "font-style: italic; color: gray",
        },
    });
};
