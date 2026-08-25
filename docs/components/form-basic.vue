<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Basic Form Layout Example</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" density="compact" class="mb-2">
          Personal Information and Additional Information are declared entirely in code. Contact Information's
          position in the layout comes from FormBuilder too, but its field markup and v-model live in this
          template, wired up through a teleport anchor.
        </v-alert>
        <form-render :layout="formLayout" :components="components" @breakpoint="breakpoint = $event"/>
        <!-- .value is required here: emailAnchor/contactMethodAnchor are plain objects, not refs themselves, so
             Vue's template auto-unwrapping does not reach into their .target property. Both Teleports are keyed
             on the resolved breakpoint so a switch that moves a field to a different row/column - and so recreates
             its anchor - forces them to remount and re-resolve rather than keep pointing at the removed anchor. -->
        <Teleport :key="breakpoint" :to="emailAnchor.target.value" defer>
          <v-text-field v-model="email" label="Email" type="email" />
        </Teleport>
        <Teleport :key="breakpoint" :to="contactMethodAnchor.target.value" defer>
          <v-select v-model="contactMethod" label="Preferred Contact Method" :items="contactMethodItems" />
        </Teleport>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

import { FormBuilder, FormRender, FormBuilderBodyProp, useTeleportAnchor } from '../../src';

// Import Vuetify components for direct use
import { VTextField, VTextarea, VSelect, VCheckbox, VBtn, VRadioGroup, VRadio } from 'vuetify/components';

// Reactive state and teleport anchors for the Contact Information fields, declared here rather than in the
// components map: the builder only reserves their position in the layout.
const email = ref('');
const contactMethod = ref('');
const emailAnchor = useTeleportAnchor();
const contactMethodAnchor = useTeleportAnchor();
const breakpoint = ref();
const contactMethodItems = [
  { title: 'Email', value: 'email' },
  { title: 'Phone', value: 'phone' },
  { title: 'Mail', value: 'mail' },
];

// Create form layout using FormBuilder
const formBuilder = new FormBuilder();

// Personal Information Section
formBuilder.simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' })
  .simple(2)
  .dfInput({ label: 'First name', placeholder: 'Enter your first name' })
  .dfInput({ label: 'Last name', placeholder: 'Enter your last name' })
  .simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' });

// Contact Information Section - the two fields below are teleported in from the template instead of being
// resolved through the components map
formBuilder.row({}, (row) => row
  .col({ cols: 6, offset: 0 }, (col) => col
    .component((cmpt) => cmpt.teleportAnchor(emailAnchor.id)))
  .col({ cols: 6, offset: 0 }, (col) => col
    .component((cmpt) => cmpt.teleportAnchor(contactMethodAnchor.id))));

formBuilder.simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' })
  .generic('VTextarea', { label: 'Comments', rows: 3, modelValue: '' });
/*
  Code left to demonstrate the "long and clunky" way of declaring the layout vs the simple() method above
  Both code fragments result in the same layout being built.

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
*/
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
