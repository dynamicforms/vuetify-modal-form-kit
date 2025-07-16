<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Basic Form Layout Example</v-card-title>
      <v-card-text>
        <form-render :layout="formLayout" :components="components"/>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { FormBuilder, FormRender, FormBuilderBodyProp } from '../../src';

// Import Vuetify components for direct use
import { VTextField, VTextarea, VSelect, VCheckbox, VBtn, VRadioGroup, VRadio } from 'vuetify/components';

// Create form layout using FormBuilder
const formBuilder = new FormBuilder();

// Personal Information Section
formBuilder
  .row({ }, (row) => row
    .col({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .col({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'First Name', modelValue: '' })))
    .col({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Last Name', modelValue: '' }))))
  // Contact Information Section
  .row({ }, (row) => row
    .col({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .col({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', type: 'email', modelValue: '' })))
    .col({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VSelect', {
          label: 'Preferred Contact Method',
          items: [
            { title: 'Email', value: 'email' },
            { title: 'Phone', value: 'phone' },
            { title: 'Mail', value: 'mail' }
          ],
          modelValue: '',
        }))))
  // Additional Information Section
  .row({ }, (row) => row
    .col({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .col({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextarea', { label: 'Comments', rows: 3, modelValue: '' }))));

// Register the components used by the form
const components = {
  VTextField,
  VTextarea,
  VSelect,
  VCheckbox,
  VBtn,
  VRadioGroup,
  VRadio,
};

// Provide the layout to the template
const formLayout = formBuilder;
</script>
