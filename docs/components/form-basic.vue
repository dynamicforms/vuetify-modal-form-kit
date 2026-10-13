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
        <form-render :layout="formBuilder" :components="components" @breakpoint="breakpoint = $event" />
        <!-- .value: the anchors are plain objects, and Vue unwraps only top-level refs. The Teleports are keyed on
             the breakpoint, so they remount and find the new anchor when a breakpoint moves a field to another
             row or column. They render after mount: the server renders the anchors empty. -->
        <Teleport v-if="mounted" :key="`email-${breakpoint}`" :to="emailAnchor.target.value" defer>
          <v-text-field v-model="email" label="Email" type="email" />
        </Teleport>
        <Teleport v-if="mounted" :key="`contact-${breakpoint}`" :to="contactMethodAnchor.target.value" defer>
          <v-select v-model="contactMethod" label="Preferred Contact Method" :items="contactMethodItems" />
        </Teleport>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { VTextarea } from 'vuetify/components';

import { FormBuilder, FormRender, FormBuilderBodyProp, useTeleportAnchor } from '../../src';

// State and teleport anchors of the Contact Information fields; the layout holds only their anchors
const email = ref('');
const contactMethod = ref('');
const emailAnchor = useTeleportAnchor();
const contactMethodAnchor = useTeleportAnchor();
const breakpoint = ref();
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
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
    .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(emailAnchor.id)))
    .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(contactMethodAnchor.id))),
);

formBuilder
  .simple()
  .generic('h3', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' })
  .generic('VTextarea', { label: 'Comments', rows: 3, modelValue: '' });
// The components the layout names
const components = { VTextarea };
</script>
