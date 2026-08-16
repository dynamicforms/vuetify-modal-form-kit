# Getting Started

## Installation

```bash
npm install @dynamicforms/vuetify-modal-form-kit
```

The library declares [`@dynamicforms/vue-forms`](:vue-forms:) `^0.6.0`,
[`@dynamicforms/vuetify-inputs`](:vuetify-inputs:) `^0.8.1` and Vuetify `^3.9` among its peer
dependencies; install them alongside it if they are not already in your project.

In your `main.ts`:
```typescript
import { DynamicFormsModalFormKit } from '@dynamicforms/vuetify-modal-form-kit';
// this library ships no stylesheet of its own; the inputs it renders bring theirs
import '@dynamicforms/vuetify-inputs/styles.css';

...
const app = createApp(MyApp);
app.use(router);
app.use(vuetify);

app.use(DynamicFormsModalFormKit, { registerComponents: true, registerVuetifyComponents: false });
```

Both options default to `false`. `registerComponents` registers `<modal-view>`, `<df-modal>`,
`<form-render>` and `<component-render>` globally; `registerVuetifyComponents` registers the handful of
Vuetify components the library renders, for projects that do not install Vuetify globally.

## Basic Usage

### Modal dialogs

Add `<modal-view />` to your root component to enable the modal system:

```vue
<template>
  <v-app>
    <router-view />
    <modal-view />
  </v-app>
</template>
```

Then call dialogs from anywhere in your application:

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

// Simple message
await modal.message('Done', 'Your changes have been saved.');

// Yes / No confirmation
const answer = await modal.yesNo('Delete item', 'This cannot be undone. Continue?');
if (answer === 'yes') {
  await deleteItem();
}
```

### Form layouts

Use `FormBuilder` to define a responsive layout in code and render it with `<FormRender>`:

```typescript
import { FormBuilder } from '@dynamicforms/vuetify-modal-form-kit';

const form = new FormBuilder();

form.simple(2)
  .dfInput({ label: 'First name' })
  .dfInput({ label: 'Last name' })
  .simple()
  .dfTextArea({ label: 'Notes', rows: 3 });
```

```vue
<template>
  <FormRender :layout="form" />
</template>
```

Coming from 0.5.x? The [migration guide](/guide/migration) lists the breaking changes with before/after code.
