# Modal Dialog Component

The Modal Dialog component provides a powerful alternative to standard Vuetify dialogs with additional features like dialog stacking, Promise-based API, and integration with DynamicForms.

## Basic Usage

Below is an example of using the modal dialog system:

<modal-basic/>

## Features

- **Only One Dialog At A Time** - Even with nested dialog calls, only one dialog is shown (others are queued)
- **Promise API** - All dialogs return Promises that resolve when the dialog is closed
- **Form Integration** - Seamless integration with `@dynamicforms/vue-forms` for validation
- **Responsive Design** - Automatically adapts to screen size, switches to fullscreen on mobile
- **Markdown Support** - Supports Markdown in dialog titles and content
- **Custom Components** - Can display any component inside the dialog

## API Usage

### Message Dialog

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

// Simple information dialog
modal.message('Information', 'Operation completed successfully.');

// Wait for dialog to close
const result = await modal.message('Success', 'Your changes have been saved.');
console.log('Dialog closed with action:', result); // 'close'
```

### Confirmation Dialog

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

// Ask for confirmation
const result = await modal.yesNo('Confirm Delete', 'Are you sure you want to delete this item?');

if (result === 'yes') {
  // User confirmed
  deleteItem();
} else {
  // User canceled
  console.log('Deletion canceled');
}
```

### Dialog with Markdown string and custom CSS class
```typescript
import { MdString, RenderableValue} from '@dynamicforms/vue-forms';
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

// Custom css class is defined in RenderableValue
modal.message('Information', new RenderableValue(
  new MdString(
    'This is a **simple message** dialog with a close button.\n\nStyling can be changed with custom CSS class.'
  ),
  'md_extra_class'),
);
```

If CSS is scoped, you need to use global selector to target the class:
```css
:global(.md_extra_class) {
  color: blue;
}
```
Otherwise, you can use the following selector:
```css
.md_extra_class {
  color: blue;
}
```

### Form Dialog

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';
import * as Form from '@dynamicforms/vue-forms';

// Create a form with validation
const form = new Form.Group({
  name: new Form.Field({
    label: 'Name',
    rules: [Form.Rules.required()],
  }),
  email: new Form.Field({
    label: 'Email',
    rules: [Form.Rules.required(), Form.Rules.email()],
  }),
  submit: new Form.Action({
    label: 'Submit',
    icon: 'check',
  }),
  cancel: new Form.Action({
    label: 'Cancel',
    icon: 'close',
  }),
});

// Show dialog with form
const result = await modal.message('User Information', 'Please enter your details:', form);

if (result === 'submit') {
  // Form was submitted with valid data
  const userData = {
    name: form.field('name').value,
    email: form.field('email').value,
  };
}
```

### Custom Component Dialog

```typescript
import { modal } from '@dynamicforms/vuetify-modal-form-kit';

// Show a dialog with a custom component
const result = await modal.custom(
  'Color Picker',
  'ColorPickerComponent', // Name of your registered component
  { 
    initialColor: '#FF5733',
    // Any props your component needs
  }
);
```

### Dialog Sizing

The modal system supports four different sizes:

```typescript
import { modal, DialogSize } from '@dynamicforms/vuetify-modal-form-kit';

// Different size options
const smallDialog = modal.message(
  'Information', 
  'This is a small dialog', 
  new Form.Group({ size: new Form.Field({ defaultValue: DialogSize.SMALL }) })
);

const mediumDialog = modal.message(
  'Information', 
  'This is a medium dialog', 
  new Form.Group({ size: new Form.Field({ defaultValue: DialogSize.MEDIUM }) })
);

const largeDialog = modal.message(
  'Information', 
  'This is a large dialog', 
  new Form.Group({ size: new Form.Field({ defaultValue: DialogSize.LARGE }) })
);

const xLargeDialog = modal.message(
  'Information', 
  'This is an extra large dialog', 
  new Form.Group({ size: new Form.Field({ defaultValue: DialogSize.X_LARGE }) })
);
```

## Installation

To use the modal system, register the API component in your main app:

```vue
<template>
  <v-app>
    <v-main>
      <!-- Your app content -->
    </v-main>
    
    <!-- Register modal API component -->
    <df-modal />
  </v-app>
</template>

<script setup>
import { DfModal } from '../../src';
</script>
```

<script setup>
import ModalBasic from '../components/modal-basic.vue';
</script>
