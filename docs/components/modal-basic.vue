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
                <v-card-text class="px-0">
                  Simple dialog with information message and a close button.
                </v-card-text>
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
                <v-card-text class="px-0">
                  Dialog with Yes/No options for confirmation.
                </v-card-text>
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
                <v-card-text class="px-0">
                  Dialog with a form including validation.
                </v-card-text>
                <v-card-actions class="px-0">
                  <v-btn color="success" prepend-icon="mdi-form-select" @click="showFormDialog">
                    Show Form
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4 mb-4">
                <v-card-title class="text-subtitle-1 px-0">Dialog Sizes</v-card-title>
                <v-card-text class="px-0">
                  Dialogs with different sizes (small, medium, large, x-large).
                </v-card-text>
                <v-card-actions class="px-0">
                  <v-btn-group variant="outlined">
                    <v-btn color="primary" @click="showSizedDialog(DialogSize.SMALL)">S</v-btn>
                    <v-btn color="primary" @click="showSizedDialog(DialogSize.MEDIUM)">M</v-btn>
                    <v-btn color="primary" @click="showSizedDialog(DialogSize.LARGE)">L</v-btn>
                    <v-btn color="primary" @click="showSizedDialog(DialogSize.X_LARGE)">XL</v-btn>
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

    <!-- Modal API component (normally you would include this in your main App.vue) -->
    <modal-view v-if="showModalApi"/>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Field, Group, MdString, Validators } from '@dynamicforms/vue-forms';
import { Action } from '@dynamicforms/vuetify-inputs';
import { modal, DialogSize, ModalView } from '../../src';

// Flag to control whether to show modal API component in this demo
// In a real app, this would be in your App.vue
const showModalApi = true;

// To store and display the result of dialogs
const dialogResult = ref(null);

// Simple message dialog
async function showMessage() {
  dialogResult.value = await modal.message(
    'Information',
    new MdString('This is a **simple message** dialog with a close button.'),
    { color: 'info', icon: 'mdi-information-outline' },
  );
}

// Confirmation dialog
async function showConfirmation() {
  dialogResult.value = await modal.yesNo(
    'Confirm Action',
    'Are you sure you want to proceed with this action?'
  );
}

// Form dialog
async function showFormDialog() {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const emailAction = new Validators.Pattern(emailPattern);

  // Create a form with validation
  const form = new Group({
    name: Field.create({
      // component: 'VTextField',
      value: { label: 'Name' },
      validators: [new Validators.Required()],
    }),
    email: Field.create({
      // component: 'VTextField',
      value: { label: 'Email' },
      validators: [new Validators.Required(), emailAction],
    }),
    // Add action buttons
    submit: Action.create({ value: { label: 'Submit', icon: 'mdi-check' } }),
    cancel: Action.create({ value: { label: 'Cancel', icon: 'mdi-close' } }),
  });

  // Show dialog with form
  dialogResult.value = await modal.message(
    'User Information',
    new RenderContent({ componentName: 'div', componentVHtml: '' }),
    { form },
  );

  // If form was submitted successfully, display the entered values
  if (dialogResult.value === 'submit') {
    const userData = {
      name: field('name').value,
      email: field('email').value,
    };

    // Show the results in another dialog
    modal.message(
      'Form Submitted',
      `You entered:\nName: ${userData.name}\nEmail: ${userData.email}`
    );
  }
}

// Dialog with different sizes
async function showSizedDialog(size) {
  // Create a form with a size field
  const form = new Group({
    // Size field controls dialog size
    size: Field.create({ value: size }),
    // Action button
    ok: Action.create({ value: { label: 'OK', icon: 'mdi-check' } }),
  });

  // Show sized dialog
  dialogResult.value = await modal.message(
    'Dialog Size Example',
    `This dialog is displayed with size: ${DialogSize[size] || 'DEFAULT'}`,
    { form, size },
  );
}
</script>

<style scoped>
.demo-container {
  position: relative;
}
</style>
