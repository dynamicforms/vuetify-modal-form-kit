# DynamicForms Vuetify Modal Form Kit Documentation

This directory contains the VitePress documentation for `@dynamicforms/vuetify-modal-form-kit`.

## Development

```bash
# from the repository root or from docs/
npm run docs:dev
```

The development server listens on `http://localhost:5173/`.

## Structure

- `.vitepress/config.ts` - VitePress configuration
- `.vitepress/theme/` - theme: installs Vuetify, this library and vuetify-inputs with the demos' `errorText`
- `guide/` - guide pages
- `api/` - API reference
- `examples/` - example pages
- `components/` - the demo components the example pages embed

## Building

```bash
# From the root directory
npm run docs:build
```

The build is written to `docs/.vitepress/dist`.

## Adding an example

1. Add the demo component to `docs/components/`. `npm run lint` lints and type-checks it.
2. Add a page to `examples/` that imports the component in `<script setup>` and renders it.
3. Add the page to the `/examples/` sidebar in `.vitepress/config.ts`.
