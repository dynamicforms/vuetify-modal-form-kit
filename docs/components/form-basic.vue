<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Basic Form Layout Example</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" density="compact" class="mb-2">
          Personal Information and Additional Information are declared entirely in code. Contact Information's position
          in the layout comes from FormBuilder too, but its field markup and v-model live in this template, wired up
          through a teleport anchor.
        </v-alert>
        <form-render :layout="formLayout" :components="components" @breakpoint="breakpoint = $event" />
        <!-- .value: the anchors are plain objects, and Vue unwraps only top-level refs. The Teleports are keyed on
             the breakpoint, so they remount and find the new anchor when a breakpoint moves a field to another
             row or column. -->
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

<script setup lang="ts">
import { ref } from 'vue';
import { VTextField, VTextarea, VSelect, VCheckbox, VBtn, VRadioGroup, VRadio } from 'vuetify/components';

import { FormBuilder, FormRender, FormBuilderBodyProp, useTeleportAnchor } from '../../src';

// State and teleport anchors of the Contact Information fields; the layout holds only their anchors
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

const formBuilder = new FormBuilder();

// Personal Information Section
formBuilder
  .simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' })
  .simple(2)
  .dfInput({ label: 'First name', placeholder: 'Enter your first name' })
  .dfInput({ label: 'Last name', placeholder: 'Enter your last name' })
  .simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' });

// Contact Information Section - the two fields are teleported in from the template
formBuilder.row({}, (row) =>
  row
    .col({ cols: 6, offset: 0 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(emailAnchor.id)))
    .col({ cols: 6, offset: 0 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(contactMethodAnchor.id))),
);

formBuilder
  .simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' })
  .generic('VTextarea', { label: 'Comments', rows: 3, modelValue: '' });
/*
  The same layout, declared with row() / col(), with the Contact Information fields in the components map:

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
// The components the layout names
const components = {
  VTextField,
  VTextarea,
  VSelect,
  VCheckbox,
  VBtn,
  VRadioGroup,
  VRadio,
};

const formLayout = formBuilder;
</script>
