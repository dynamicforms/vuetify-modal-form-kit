# Getting Started

## Installation

```bash
npm install @dynamicforms/vuetify-modal-form-kit
```

The package is ESM only. `engines.node` is `>=22.12`, the first Node release that supports `require()` of an ES
module, which a CommonJS consumer uses. A CommonJS consumer still needs a bundler: the peers import their own
stylesheets, which Node cannot load.

Server-side rendering takes the setup in [Server-side rendering](/guide/ssr).

In your `main.ts`:
```typescript
import { DynamicFormsModalFormKit } from '@dynamicforms/vuetify-modal-form-kit';
// this library has no stylesheet; the inputs it renders use the vuetify-inputs one
import '@dynamicforms/vuetify-inputs/styles.css';

...
const app = createApp(MyApp);
app.use(router);
app.use(vuetify);

app.use(DynamicFormsModalFormKit, { registerComponents: true, registerVuetifyComponents: false });
```

`registerComponents` and `registerVuetifyComponents` default to `false`. `registerComponents` registers
`<modal-view>`, `<df-modal>`, `<form-render>` and `<component-render>` globally; `registerVuetifyComponents`
registers the Vuetify components the library renders (`VBtn`, `VCard*`, `VDialog`, `VIcon`, `VRow`, `VCol`,
`VSheet`), for projects that do not register Vuetify's components globally. `modalDefaults` sets the values a dialog
uses where it states none of its own - see
[`<df-modal>` → Global defaults](/api/df-modal#global-defaults):

```typescript
app.use(DynamicFormsModalFormKit, { modalDefaults: { titleColor: 'primary' } });
```

`translate` and `translateNamespace` translate the library's strings - see
[Translating the library's strings](#translating-the-library-s-strings).

## Basic Usage

### Modal dialogs

Mount `<modal-view />` once, in the root component. It draws the dialogs the `modal` service opens:

```vue
<template>
  <v-app>
    <router-view />
    <modal-view />
  </v-app>
</template>
```

Dialogs can then be opened from any code:

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

Use `FormBuilder` to define a responsive layout in code and render it with
[`<form-render>`](/api/form-render):

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

## Translating the library's strings

The library has three strings, the labels of the [default actions](/api/modal-service#default-actions) of
`modal.message()` and `modal.yesNo()`:

| Key | English default |
|---|---|
| `Close` | `Close` |
| `Yes` | `Yes` |
| `No` | `No` |

They are translated with `@dynamicforms/translatable`, as the strings of `@dynamicforms/vuetify-inputs` are. The
`translate` option of the plugin is a function shaped like vue-i18n's `t`; the keys are looked up under
`translateNamespace`, `df_modal` by default (`df_modal.Close`), and without a namespace where it is `''`. A key the
function does not translate keeps its English default. The labels are read while the buttons render, so they follow
a locale switch:

```typescript
const { t } = i18n.global;
app.use(DynamicFormsModalFormKit, { translate: t });
```

```json
{ "df_modal": { "Close": "Zapri", "Yes": "Da", "No": "Ne" } }
```

Each app states its own `translate`. `translateStrings(t, namespace?)` sets the function for the whole process,
used where the app states none.

## Translating errors

An error is data: a `code`, `params` and an English `detail`. The application converts it into what the user sees,
as described in vue-forms' [Error messages and translation](:vue-forms:/api/validators.html#error-messages-and-translation),
which also lists every code vue-forms raises with its params.

The inputs of `@dynamicforms/vuetify-inputs` render an error as the content the `errorText` setting returns for it,
or as its `detail` where the setting is not given or returns `undefined`. `errorText` is set once, when the plugin is
installed, and converts every error: those of vue-forms' validators, of the application's validators, of its server
and of vuetify-inputs itself ([error codes](:vuetify-inputs:/examples/localisation.html#error-codes)).

`errorText` returns plain text, an `MdString` (rendered as markdown), an `HtmlString` (rendered as HTML) or a
`SimpleComponentDef`. In the example below the catalogue holds a markdown variant of a message under the code with
`Md` appended, and `errorText` prefers it:

```typescript
import { formatParams } from '@dynamicforms/translatable';
import { DynamicFormsInputs, type ErrorText, MdString } from '@dynamicforms/vuetify-inputs';

const { t, n, d, te } = i18n.global;
// formats numbers and dates for the locale before t substitutes them
const tf = formatParams(t, (value) =>
  typeof value === 'number' ? n(value) : value instanceof Date ? d(value) : value);
const markdown = true;

const errorText: ErrorText = (error) => {
  const key = `errors.${error.code}`;
  if (markdown && te(`${key}Md`)) return new MdString(tf(`${key}Md`, error.params));
  return te(key) ? tf(key, error.params) : undefined;
};

app.use(DynamicFormsInputs, { errorText });
```

```json
{
  "errors": {
    "required": "Prosimo, vnesite vrednost",
    "min_value": "Vrednost mora biti vsaj {minValue}",
    "min_valueMd": "Vrednost mora biti vsaj **{minValue}**"
  }
}
```

- `errorText` runs when the errors render, so a locale switch changes the errors on screen without revalidating.
- A code without a message renders as its `detail`; a code without an `Md` variant renders as plain text.
- A message uses the placeholder names of its code's params.

The [migration guide](/guide/migration) lists the breaking changes of each release with before/after code.
