import { template } from "campfire";
import { FileMeta } from "../types.ts";

export const getName = (file: FileMeta, quoted = false) => {
    const name = file.metadata.name || file.metadata.description;
    if (!name) return "Untitled Paste";
    if (quoted) return `"${name}"`;
    return name;
};

export const ViewTemplate = template(`
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Colle</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/mononoki.min.css">
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="./alert.css">
</head>

<body>
    <div id="root">
        <h1><a href="/">Colle<a></h1>
        <p>a dead-simple pastebin</p>
        <h2>Viewing file: "{{ name }}"</h2>
        <div class=view-actions>
            <a href={{ url }}>View raw</a>
        </div>

        <hr class='actions-separator'>

        {{#isImg}}
        <div class="img-wrapper">
            <img src="{{ url }}">
        </div>
        {{/isImg}}

        {{^isImg}}
        <div class="rendered">
            {{{ contents }}}
        </div>
        {{/isImg}}
    </div>
    <script type="module" src="./main.js"></script>
</body>

</html>
`);
