# `<component-render>`

`import { ComponentRender } from '@dynamicforms/vuetify-modal-form-kit'`

Renders one component of a layout: it resolves a name to a component and binds the props stored with it.
[`<form-render>`](./form-render) draws every component in a layout through it, and it is exported for a renderer
of your own - one that lays the rows and columns out differently, or draws something around each component - which
reaches the same resolution rules without repeating them.

```vue
<template>
  <component-render :name="component.name" :props="component.props" :components="components" />
</template>
```

## Props

`ComponentRenderProps` is exported under that name, for a component that wraps `<component-render>` and forwards
its props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string \| symbol` | — | The name to resolve. `FormBuilderName` renders a nested form. A symbol that is not that one is resolved as a global component by its `description`, or as `'SymbolComponent'` where it carries none. |
| `props` | `Record<string \| symbol, any> \| null` | `{}` | What is bound onto the resolved component. `FormBuilderBodyProp` in it becomes the component's default slot rather than a prop. A serialized component that carries no props states `null`, which is what `ComponentJSON.props` holds and what reaches this prop. |
| `components` | `Record<string \| symbol, any>` | `{}` | Maps names to Vue components. A name missing from it is resolved as a globally registered component or a native tag. |

`<component-render>` has no slots and emits nothing.

## How a name resolves

In this order:

1. **`FormBuilderName`** - the component is a nested layout, and `props` is that layout. It is rendered by the
   renderer the `components` map carries under `FormBuilderName`, which `<form-render>` puts there, with `props` on
   its `layout` prop rather than spread onto it as attrs. A map carrying no renderer under that key falls through
   to the two branches below.
2. **A key of the `components` map** - the component it maps to is rendered with `props` bound onto it.
3. **Anything else** - the name is rendered as a tag, which Vue resolves against the globally registered components
   and then as a native element. `generic('h3', ...)` reaches this branch, and so does a `'df-input'` in an
   application that registered the inputs globally.

The map is read in a `computed`, so a `components` prop replaced with a map that gains the nested-form renderer
draws the nested layout from then on.
