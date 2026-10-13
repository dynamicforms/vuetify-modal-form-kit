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

`FormRenderProps` is exported, for a component that wraps `<form-render>` and forwards its props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `layout` | `FormBuilder \| FormJSONResponsive` | — | The layout, as the builder or as the JSON `toJSON()` produces. JSON is read with `FormBuilder.fromJSON()`, so both render the same. A `symbol` component name, `FormBuilderName` included, is kept in an in-memory copy of the JSON but lost in a `JSON.stringify()` / `JSON.parse()` round trip. |
| `components` | `Record<string \| symbol, any>` | `{}` | Maps the names used in `generic()` calls (e.g. `'df-input'`) to Vue components. Keys can be symbols. A name not in the map is resolved as a globally registered component or a native tag. |

The renderer passes the map on with itself added under the `FormBuilderName` symbol; a nested layout is rendered
through that entry. A `FormBuilderName` key in the given map is replaced.

`<form-render>` has no slots.

## Emits

`FormRenderEmits` is exported, for a component that wraps `<form-render>` and forwards its emits.

| Event | Payload | Description |
|---|---|---|
| `breakpoint` | `BreakpointNames` | The current breakpoint, emitted on setup and on every change. A teleport-anchored field uses it - see [Breakpoints](#breakpoints). |

## Breakpoints

The layout is resolved for the current Vuetify breakpoint and again when it changes: the form-level overrides with
`getOptionsForBreakpoint()`, the row- and column-level ones with `toJSON(breakpoint)`. A nested layout resolves its
own breakpoints, at any depth - see
[what a breakpoint inherits](/examples/form-builder-responsive#what-a-breakpoint-inherits).

When a breakpoint change moves a [`teleportAnchor()`](./form-builder#component-builder) cell to another row or
column, Vue removes its `<div :id>` and creates a new one. `<Teleport :to>` resolves its target again only when the
`to` string changes, so it still points at the removed element and its content is not shown. Keying the
`<Teleport>` on the `breakpoint` emit remounts it with the anchor - see
[the same field across breakpoints](/examples/form-builder#the-same-field-across-breakpoints).

## Duplicate ids

`<form-render>` logs a `console.warn` when the layout it renders has the same `id` prop on more than one
component, e.g. two [`teleportAnchor()`](./form-builder#component-builder) calls for different fields given the
same ref. Each `<form-render>` checks only the components it renders itself; a nested form's instance checks its
own, at its own breakpoint.
