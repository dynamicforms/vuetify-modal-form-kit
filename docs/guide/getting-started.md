# Getting Started

## Installation

```bash
npm install @dynamicforms/vuetify-modal-form-kit
```

In your `main.ts`:
```typescript
import { DynamicFormsModalFormKit } from '@dynamicforms/vuetify-modal-form-kit';
import '@dynamicforms/vuetify-modal-form-kit/styles.css';

...
const app = createApp(MyApp);
app.use(router);
app.use(vuetify);

app.use(DynamicFormsModalFormKit);
```

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
