<style scoped>
.demo-container {
  margin-bottom: 20px;
}

.code-block {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow: auto;
  font-family: monospace;
  font-size: 14px;
  white-space: pre-wrap;
}
</style>
<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Responsive Form Layout</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" border="start" class="mb-4">
          Resize your browser window to see how the form layout adapts to different screen sizes.
          <ul class="mt-2">
            <li><strong>Large screens (md+):</strong> Two-column layout</li>
            <li><strong>Small screens (sm):</strong> Modified layout with some fields side by side</li>
            <li><strong>Extra small screens (xs):</strong> Single column layout</li>
          </ul>
        </v-alert>

        <v-chip class="mb-4" color="primary">
          Current breakpoint: {{ currentBreakpoint }}
        </v-chip>

        <form-render :layout="formLayout" :components="components"/>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { FormBuilder, FormRender, FormBuilderBodyProp } from '../../src';
import { useDisplay } from 'vuetify';

// Import Vuetify components for direct use
import {
  VTextField,
  VTextarea,
  VSelect,
  VCheckbox,
  VBtn,
  VRadioGroup,
  VRadio,
  VSwitch
} from 'vuetify/components';

// Default layout (md and up)
// Personal Information Section
const formBuilder = new FormBuilder();

// Default layout (lg and up) - full version with up to 4 fields in a row
formBuilder
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h2', { [FormBuilderBodyProp]: 'Registration Form', class: 'ma-0 pa-0' }))))
  // Personal Information
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h4', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' }))))
  // Row with 4 fields
  .row({ }, (row) => row
    .column({ cols: 3, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'First Name', placeholder: 'Enter first name' })))
    .column({ cols: 3, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Last Name', placeholder: 'Enter last name' })))
    .column({ cols: 3, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'SSN', placeholder: 'Enter social security number' })))
    .column({ cols: 3, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VSelect', {
          label: 'Gender',
          items: [
            { title: 'Male', value: 'M' },
            { title: 'Female', value: 'F' },
            { title: 'Prefer not to say', value: 'N' }
          ]
        }))))
  // Contact Information
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h4', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 4, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', type: 'email', placeholder: 'email@domain.com' })))
    .column({ cols: 4, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Phone', placeholder: '+1 234 567 890' })))
    .column({ cols: 4, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VSelect', {
          label: 'Preferred Contact Method',
          items: [
            { title: 'Email', value: 'email' },
            { title: 'Phone', value: 'phone' },
            { title: 'Mail', value: 'mail' }
          ]
        }))))
  // Address
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h4', { [FormBuilderBodyProp]: 'Address', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 8, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Street', placeholder: 'Enter street name' })))
    .column({ cols: 4, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'House Number', placeholder: 'Enter number' }))))
  .row({ }, (row) => row
    .column({ cols: 4, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Postal Code', placeholder: '12345' })))
    .column({ cols: 4, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'City', placeholder: 'Enter city' })))
    .column({ cols: 4, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Country', placeholder: 'USA' }))))
  // Additional Information
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h4', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VSelect', {
          label: 'Education',
          items: [
            { title: 'High School', value: 'high_school' },
            { title: 'Associate Degree', value: 'associate' },
            { title: 'Bachelor\'s Degree', value: 'bachelor' },
            { title: 'Master\'s Degree', value: 'master' },
            { title: 'Doctorate', value: 'doctorate' }
          ]
        })))
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VRadioGroup', {
          label: 'Status',
          inline: true,
          children: [
            { name: 'VRadio', props: { label: 'Student', value: 'student' } },
            { name: 'VRadio', props: { label: 'Employed', value: 'employed' } },
            { name: 'VRadio', props: { label: 'Retired', value: 'retired' } },
            { name: 'VRadio', props: { label: 'Other', value: 'other' } }
          ]
        }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextarea', {
          label: 'Additional Notes',
          placeholder: 'Enter any additional notes or comments',
          rows: 3
        }))));

// Medium screens (md) - similar to lg but with some adaptations
formBuilder.breakpoint('md', (form) => form
    .row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('h2', { [FormBuilderBodyProp]: 'Registration Form', class: 'ma-0 pa-0' }))))
    // Personal Information - here we use a different row layout
    .row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('h4', { [FormBuilderBodyProp]: 'Personal Information', class: 'ma-0' }))))
    .row({ }, (row) => row
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'First Name', placeholder: 'Enter first name' })))
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Last Name', placeholder: 'Enter last name' }))))
    .row({ }, (row) => row
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'SSN', placeholder: 'Enter social security number' })))
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VSelect', {
            label: 'Gender',
            items: [
              { title: 'Male', value: 'M' },
              { title: 'Female', value: 'F' },
              { title: 'Prefer not to say', value: 'N' }
            ]
          }))))
    // Contact Information
    .row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('h4', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' }))))
    .row({ }, (row) => row
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Email', type: 'email', placeholder: 'email@domain.com' })))
      .column({ cols: 6, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Phone', placeholder: '+1 234 567 890' }))))
    .row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VSelect', {
            label: 'Preferred Contact Method',
            items: [
              { title: 'Email', value: 'email' },
              { title: 'Phone', value: 'phone' },
              { title: 'Mail', value: 'mail' }
            ]
          }))))
    // Address - showing an example of breakpoint at the column level
    .row({ }, (row) => row
      .column({ cols: 12, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('h4', { [FormBuilderBodyProp]: 'Address', class: 'mt-0' }))))
    .row({ }, (row) => row
      .column({ cols: 8, offset: 0 }, (col) => col
        .breakpoint('sm', (col) => {
          col.cols = 12;
          return col;
        })  // Column adapts for sm
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Street', placeholder: 'Enter street name' })))
      .column({ cols: 4, offset: 0 }, (col) => col
        .breakpoint('sm', (col) => {
          col.cols = 12;
          return col;
        })  // Column adapts for sm
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'House Number', placeholder: 'Enter number' }))))
    .row({ }, (row) => row
      .column({ cols: 4, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Postal Code', placeholder: '12345' })))
      .column({ cols: 4, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'City', placeholder: 'Enter city' })))
      .column({ cols: 4, offset: 0 }, (col) => col
        .component((cmpt) => cmpt
          .generic('VTextField', { label: 'Country', placeholder: 'USA' }))))
  // Other parts of the form remain the same as in lg variant...
);

// Small screens (sm) - only the most necessary fields in one column, with some exceptions
formBuilder.breakpoint('sm', (form) => form
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h3', { [FormBuilderBodyProp]: 'Registration Form', class: 'ma-0' }))))
  // Personal Information
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h5', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'First Name', placeholder: 'Enter first name', dense: true })))
    .column({ cols: 6, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Last Name', placeholder: 'Enter last name', dense: true }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'SSN', placeholder: 'Enter social security number', dense: true }))))
  // Contact Information
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h5', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', type: 'email', placeholder: 'email@domain.com', dense: true }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Phone', placeholder: '+1 234 567 890', dense: true }))))
  // Address
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h5', { [FormBuilderBodyProp]: 'Address', class: 'mt-0' }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Street and Number', placeholder: 'E.g. Main Street 123', dense: true }))))
  .row({ }, (row) => row
    .column({ cols: 4, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Postal Code', placeholder: '12345', dense: true })))
    .column({ cols: 8, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'City', placeholder: 'New York', dense: true }))))
  // Notes
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextarea', {
          label: 'Additional Notes',
          placeholder: 'Enter any notes',
          rows: 2,
          dense: true
        })))));

// Mobile screens (xs) - minimal and simplified form
formBuilder.breakpoint('xs', (form) => form
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('h4', { [FormBuilderBodyProp]: 'Registration', class: 'ma-0' }))))
  // Only the most important fields
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Full Name', placeholder: 'John Doe', dense: true }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Email', type: 'email', placeholder: 'john.doe@email.com', dense: true }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Phone', placeholder: '+1 234 567 890', dense: true }))))
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VTextField', { label: 'Address', placeholder: 'E.g. Main Street 123, New York', dense: true }))))
  // Confirmation field
  .row({ }, (row) => row
    .column({ cols: 12, offset: 0 }, (col) => col
      .component((cmpt) => cmpt
        .generic('VCheckbox', {
          label: 'I agree to the terms and conditions',
          dense: true,
          hideDetails: true
        })))));

// Register components
const components = {
  VTextField,
  VTextarea,
  VSelect,
  VCheckbox,
  VBtn,
  VRadioGroup,
  VRadio,
  VSwitch,
};

// Get current breakpoint
const display = useDisplay();
const currentBreakpoint = computed(() => display.name.value);

// Set up form layout
const formLayout = formBuilder;
</script>
