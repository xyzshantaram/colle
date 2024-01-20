# Colle

A dead-simple pastebin service.

Intended for use on <https://shantaram.xyz>.

## Usage

```sh
deno run -A --unstable src/mod.ts
```

An API client can be imported with:

```ts
import { Colle } from "https://deno.land/x/colle@1.2.3/mod.ts";
```

if using TypeScript, and

```js
import { Colle } from "https://deno.land/x/colle@1.2.3/src/Colle.js";
```

if working directly in the browser.

## License

See [LICENSE](./LICENSE).
