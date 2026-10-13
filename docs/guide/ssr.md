# Server-side rendering

The layouts render on the server (Nuxt, Vite SSR, VitePress) and hydrate in the browser. The dialogs render in the
browser only.

## Setup

Vuetify is created with `ssr: true`, on the server and in the browser, as
[`@dynamicforms/vuetify-inputs`](:vuetify-inputs:/guide/ssr.html) requires:

```typescript
const vuetify = createVuetify({ ssr: true, components, directives });
```

The package is bundled for the server with Vuetify and `@dynamicforms/vuetify-inputs`, whose components import CSS
that Node does not load:

```typescript
// vite.config.ts
export default defineConfig({
  ssr: {
    noExternal: ['vuetify', '@dynamicforms/vuetify-inputs', '@dynamicforms/vuetify-modal-form-kit'],
  },
});
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  build: {
    transpile: ['vuetify', '@dynamicforms/vuetify-inputs', '@dynamicforms/vuetify-modal-form-kit'],
  },
});
```

## What the server renders

| Component | On the server and until it is mounted | After it is mounted |
|---|---|---|
| `form-render`, `component-render` | The layout of the breakpoint of Vuetify's `ssr.clientWidth`; the base layout where it is not given | The layout of the browser's breakpoint |
| `modal-view`, `df-modal` | Nothing | The dialog |

`createVuetify({ ssr: { clientWidth: 1280 } })` renders the `lg` layout on the server. A server that renders for
one kind of device sets the width of that device, so the layout does not change after mount.

A `<Teleport>` into a [teleport anchor](/examples/form-builder#template-declared-content-teleport) renders after
mount. The server renders the anchor empty, and a `<Teleport>` rendered there is not hydrated into it:

```typescript
const mounted = ref(false);
onMounted(() => { mounted.value = true; });
```

```html
<Teleport v-if="mounted" :key="breakpoint" :to="emailAnchor.target.value" defer>
  <v-text-field v-model="email" label="Email" type="email" />
</Teleport>
```

## State per request

The `translate` and `translateNamespace` options of `app.use(DynamicFormsModalFormKit, options)` are provided to
one app. Where an app is created per request, they are per request.

The following are one per process. On a server rendering several requests, a value set for one request is read by
the others:

- the dialog stack of the `modal` service - see [`<modal-view>`](/api/modal-view);
- the `modalDefaults` option and `setDfModalDefaults()`;
- `translateStrings()`.

A dialog opened while the server renders stays on the stack after the request. The `modal` service is called from
code that runs in the browser: event handlers and `onMounted()`.
