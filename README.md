# Colle

A dead-simple pastebin service.

Intended for use on <https://shantaram.xyz>.

## Usage

```sh
deno run -A --unstable src/mod.ts
```

An API client can be imported with:

```ts
import { Colle } from "https://deno.land/x/colle@2.0.1/mod.ts";
```

if using TypeScript, and

```js
import { Colle } from "https://deno.land/x/colle@2.0.1/src/Colle.js";
```

if working directly in the browser.

## Todo

- [] FE: Add md parsing
- [] Allow nicknames (custom slugs) for pastes
- [] Implement signout somehow
- [] Cache JWT on client side

## License

See [LICENSE](./LICENSE).
