<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Modal Dialog Examples</v-card-title>
      <v-card-text>
        <div class="mb-6">
          <p class="mb-2">The modal system provides several types of dialogs that can be triggered programmatically:</p>

          <v-row class="mt-4">
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4 mb-4">
                <v-card-title class="text-subtitle-1 px-0">Message Dialog</v-card-title>
                <v-card-text class="px-0"> Simple dialog with information message and a close button. </v-card-text>
                <v-card-actions class="px-0">
                  <v-btn color="primary" prepend-icon="mdi-information-outline" @click="showMessage">
                    Show Message
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4 mb-4">
                <v-card-title class="text-subtitle-1 px-0">Confirmation Dialog</v-card-title>
                <v-card-text class="px-0"> Dialog with Yes/No options for confirmation. </v-card-text>
                <v-card-actions class="px-0">
                  <v-btn color="warning" prepend-icon="mdi-alert-outline" @click="showConfirmation">
                    Show Confirmation
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4 mb-4">
                <v-card-title class="text-subtitle-1 px-0">Form Dialog</v-card-title>
                <v-card-text class="px-0"> Dialog with a form including validation. </v-card-text>
                <v-card-actions class="px-0">
                  <v-btn color="success" prepend-icon="mdi-form-select" @click="showFormDialog"> Show Form </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4 mb-4">
                <v-card-title class="text-subtitle-1 px-0">Dialog Sizes</v-card-title>
                <v-card-text class="px-0">
                  Dialogs with different sizes (small, medium, large, x-large); the inputs in the dialog change its
                  title, icon, title color and size.
                </v-card-text>
                <v-card-actions class="px-0">
                  <v-btn-group variant="outlined">
                    <v-btn color="primary" @click="showSizedDialog('small')">S</v-btn>
                    <v-btn color="primary" @click="showSizedDialog('medium')">M</v-btn>
                    <v-btn color="primary" @click="showSizedDialog('large')">L</v-btn>
                    <v-btn color="primary" @click="showSizedDialog('x-large')">XL</v-btn>
                  </v-btn-group>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <v-alert v-if="dialogResult" color="info" variant="tonal" class="mt-4">
          Last dialog result: <strong>{{ dialogResult }}</strong>
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- an application mounts <modal-view> once, in App.vue -->
    <modal-view v-if="showModalApi" />
  </div>
</template>

<script setup lang="ts">
import { Field, Group, Validators } from '@dynamicforms/vue-forms';
import { Action, MdString, RenderableValue, type SimpleComponentDef } from '@dynamicforms/vuetify-inputs';
import { ref, watch } from 'vue';

import { type DialogSize, dialogSizes, modal, ModalView } from '../../src';

// whether this demo mounts <modal-view>; an application mounts it once, in App.vue
const showModalApi = true;

// the result of the last dialog, shown below the demo
const dialogResult = ref<string | null>(null);

// Simple message dialog
async function showMessage() {
  dialogResult.value = await modal.message(
    'Information',
    new RenderableValue(
      new MdString(
        'This is a **simple message** dialog with a close button.\n\nStyling can be changed with custom CSS class.',
      ),
      'md_extra_class',
    ),
    { color: 'info', icon: 'mdi-information' },
  );
}

// Confirmation dialog
async function showConfirmation() {
  dialogResult.value = await modal.yesNo('Confirm Action', 'Are you sure you want to proceed with this action?');
}

// Form dialog
async function showFormDialog() {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const emailFormat = new Validators.Pattern(emailPattern, {
    code: 'invalid_email',
    detail: 'Please enter a valid email address',
  });

  // defaultConfirm / defaultReject color the action primary / secondary and bind it to Enter / Esc - see
  // <df-modal>'s `actions` prop
  const submitAction = new Action({ value: { label: 'Submit', icon: 'mdi-check', defaultConfirm: true } });
  const cancelAction = new Action({ value: { label: 'Cancel', icon: 'mdi-close', defaultReject: true } });

  // a form with validation
  const form = new Group({
    // the dialog draws the field's own label
    name: new Field({
      value: '',
      label: 'Full name',
      validators: [new Validators.Required()],
    }),
    // no label: the dialog labels it from the field name, 'Email'
    email: new Field({
      value: '',
      validators: [new Validators.Required(), emailFormat],
    }),
    // the dialog's buttons
    submit: submitAction,
    cancel: cancelAction,
  });

  // the form is the dialog body
  dialogResult.value = await modal.message('User Information', new RenderableValue({ componentName: 'div' }), { form });

  // on submit, show the entered values
  if (dialogResult.value === 'submit') {
    const userData = {
      name: form.fields.name.value,
      email: form.fields.email.value,
    };

    // in another dialog
    modal.message('Form Submitted', `You entered:\nName: ${userData.name}\nEmail: ${userData.email}`);
  }
}

// #region dialog-props
// Dialog sizes: the inputs in the dialog body write the title, the icon, the title color and the size to the open
// dialog's props
async function showSizedDialog(size: DialogSize) {
  const titleField = new Field({ value: 'Dialog Size Example', label: 'Dialog title' });
  const iconField = new Field({ value: 'mdi-resize', label: 'Icon' });
  const colorField = new Field({ value: 'none', label: 'Title color' });
  const sizeField = new Field({ value: size, label: 'Dialog size' });
  const icons = ['mdi-resize', 'mdi-star', 'mdi-heart', 'mdi-rocket', 'mdi-palette'];
  // 'none' sets no color: the title bar keeps its default
  const colors = ['none', 'primary', 'secondary', 'success', 'info', 'warning', 'error'];
  const colorOf = (name: string) => (name === 'none' ? undefined : name);

  const column = (cols: Record<string, number>, input: SimpleComponentDef): SimpleComponentDef => ({
    componentName: 'v-col',
    componentProps: cols,
    children: [input],
  });
  const dialog = modal.message(
    titleField.value,
    {
      componentName: 'v-row',
      children: [
        column({ cols: 12, sm: 8 }, { componentName: 'df-input', componentProps: { control: titleField } }),
        column(
          { cols: 12, sm: 4 },
          {
            componentName: 'df-select',
            componentProps: {
              control: iconField,
              choices: icons.map((icon) => ({ id: icon, text: icon.slice(4), icon })),
              allowNull: false,
            },
          },
        ),
        column(
          { cols: 12, sm: 6 },
          {
            componentName: 'df-select',
            componentProps: {
              control: colorField,
              choices: colors.map((color) => ({ id: color, text: color })),
              allowNull: false,
            },
          },
        ),
        column(
          { cols: 12, sm: 6 },
          {
            componentName: 'df-select',
            componentProps: {
              control: sizeField,
              choices: dialogSizes.map((name) => ({ id: name, text: name })),
              allowNull: false,
            },
          },
        ),
      ],
    },
    { icon: iconField.value, color: colorOf(colorField.value), size },
  );

  const stop = watch(
    () => [titleField.value, iconField.value, colorField.value, sizeField.value] as const,
    ([title, icon, color, dialogSize]) => {
      dialog.props.title = title;
      dialog.props.icon = icon;
      dialog.props.color = colorOf(color);
      dialog.props.size = dialogSize;
    },
  );

  dialogResult.value = await dialog;
  stop();
}
// #endregion dialog-props
</script>

<style scoped>
.demo-container {
  position: relative;
}

:global(.md_extra_class) {
  color: blue;
}
</style>
