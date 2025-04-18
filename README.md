# Colle

A dead-simple pastebin service.

Intended for use on <https://paste.shantaram.xyz>.

## Usage

```sh
deno run -A --unstable src/mod.ts
```

An API client can be imported with:

```ts
import { Colle } from "https://deno.land/x/colle@2.1.1/mod.ts";
```

if using TypeScript, and

```js
import { Colle } from "https://deno.land/x/colle@2.1.1/src/Colle.js";
```

if working directly in the browser.

## TODO

- [ ] Allow nicknames (custom slugs) for pastes

## License

See [LICENSE](./LICENSE).
