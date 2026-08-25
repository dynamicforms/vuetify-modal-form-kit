# `<form-render>`

`import { FormRender } from '@dynamicforms/vuetify-modal-form-kit'`

Renders a [`FormBuilder`](./form-builder) layout as a Vuetify grid: one `<v-row>` per row, one `<v-col>` per
column, and one [`<component-render>`](./component-render) per component in it.

```vue
<template>
  <form-render :layout="form" :components="{ 'df-input': DfInput }" />
</template>

<script setup lang="ts">
import { DfInput } from '@dynamicforms/vuetify-inputs';
import { FormBuilder, FormRender } from '@dynamicforms/vuetify-modal-form-kit';

const form = new FormBuilder();
form.simple(2).generic('df-input', { label: 'First name' }).generic('df-input', { label: 'Last name' });
</script>
```

## Props

`FormRenderProps` is exported under that name, for a component that wraps `<form-render>` and forwards its props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `layout` | `FormBuilder \| FormJSONResponsive` | — | The layout to render, either as the builder or as the plain JSON `toJSON()` produces. JSON is hydrated back through `FormBuilder.fromJSON()`, so the two render the same thing. A `symbol` component name - `FormBuilderName` among them - survives an in-memory copy of the JSON but not a `JSON.stringify()` / `JSON.parse()` round trip. |
| `components` | `Record<string \| symbol, any>` | `{}` | Maps the names used in `generic()` calls (e.g. `'df-input'`) to Vue components. Symbol keys are supported. A name missing from the map is resolved as a globally registered component or a native tag. |

The renderer adds itself to the map it passes down, under the `FormBuilderName` symbol, which is how a nested
layout is rendered as a form of its own. A key of that name in your own map is replaced.

`<form-render>` has no slots and emits nothing.

## Breakpoints

The layout is resolved against the current Vuetify breakpoint and re-resolved when it changes: the form-level
overrides through `getOptionsForBreakpoint()`, and the row- and column-level ones through the `toJSON(breakpoint)`
that follows. A nested layout resolves its own breakpoints, at any depth - see
[what a breakpoint inherits](/examples/form-builder-responsive#what-a-breakpoint-inherits).

## Duplicate ids

`<form-render>` warns, via `console.warn`, if the layout it is about to render carries the same `id` prop on more
than one component - most commonly two [`teleportAnchor()`](./form-builder#component-builder) calls sharing a ref
that was meant for two different fields rather than the same field across breakpoints. It only checks what it
renders itself: a nested form's own `<form-render>` instance checks its own ids, at the breakpoint it resolves to,
independently of the outer one.
