# `<component-render>`

`import { ComponentRender } from '@dynamicforms/vuetify-modal-form-kit'`

Renders one component of a layout: it resolves a name to a component and binds the props stored with it.
[`<form-render>`](./form-render) renders every component of a layout with it. It is exported for a custom renderer,
e.g. one with a different row and column layout, so that names resolve by the same rules.

```vue
<template>
  <component-render :name="component.name" :props="component.props" :components="components" />
</template>
```

## Props

`ComponentRenderProps` is exported, for a component that wraps `<component-render>` and forwards its props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string \| symbol` | — | The name to resolve. `FormBuilderName` renders a nested form. A symbol that is not that one is resolved as a global component by its `description`, or as `'SymbolComponent'` where it carries none. |
| `props` | `Record<string \| symbol, any> \| null` | `{}` | Bound to the resolved component. `FormBuilderBodyProp` is passed as the default slot, not as a prop. A serialized component without props has `ComponentJSON.props` `null`, which is passed here. |
| `components` | `Record<string \| symbol, any>` | `{}` | Maps names to Vue components. A name not in the map is resolved as a globally registered component or a native tag. |

`<component-render>` has no slots and emits nothing.

## How a name resolves

In this order:

1. **`FormBuilderName`** - the component is a nested layout, and `props` is that layout. It is rendered by the
   component the `components` map holds under `FormBuilderName` (`<form-render>` puts itself there), with `props`
   passed as its `layout` prop. Without that entry, the name resolves by the rules below.
2. **A key of the `components` map** - the mapped component is rendered with `props` bound to it.
3. **Anything else** - the name is rendered as a tag, which Vue resolves as a globally registered component and
   then as a native element. `generic('h3', ...)` resolves here, and so does `'df-input'` in an application that
   registers the inputs globally.

The map is read in a `computed`: when the `components` prop is replaced with a map that has the nested-form
renderer, the nested layout is rendered from then on.
