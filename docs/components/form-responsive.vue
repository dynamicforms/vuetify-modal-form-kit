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

        <v-chip class="mb-4" color="primary"> Current breakpoint: {{ currentBreakpoint }} </v-chip>

        <form-render :layout="formLayout" :components="components" />
      </v-card-text>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { VTextField, VTextarea, VSelect, VCheckbox, VBtn, VRadioGroup, VRadio, VSwitch } from 'vuetify/components';

import { FormBuilder, FormRender, FormBuilderBodyProp } from '../../src';

const formBuilder = new FormBuilder();

// Base layout, up to 4 fields in a row. The xs override below replaces it at xs, and every larger breakpoint
// inherits from an override, so this layout is not rendered.
formBuilder
  .row({}, (row) =>
    row.col({ cols: 12, offset: 0 }, (col) =>
      col.component((cmpt) => cmpt.generic('h2', { [FormBuilderBodyProp]: 'Registration Form', class: 'ma-0 pa-0' })),
    ),
  )
  // Personal Information
  .row({}, (row) =>
    row.col({ cols: 12, offset: 0 }, (col) =>
      col.component((cmpt) => cmpt.generic('h4', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' })),
    ),
  )
  // 4 fields in a row
  .row({}, (row) =>
    row
      .col({ cols: 3, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'First Name', placeholder: 'Enter first name' })),
      )
      .col({ cols: 3, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'Last Name', placeholder: 'Enter last name' })),
      )
      .col({ cols: 3, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'SSN', placeholder: 'Enter social security number' }),
        ),
      )
      .col({ cols: 3, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VSelect', {
            label: 'Gender',
            items: [
              { title: 'Male', value: 'M' },
              { title: 'Female', value: 'F' },
              { title: 'Prefer not to say', value: 'N' },
            ],
          }),
        ),
      ),
  )
  // Contact Information
  .row({}, (row) =>
    row.col({ cols: 12, offset: 0 }, (col) =>
      col.component((cmpt) => cmpt.generic('h4', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' })),
    ),
  )
  .row({}, (row) =>
    row
      .col({ cols: 4, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'Email', type: 'email', placeholder: 'email@domain.com' }),
        ),
      )
      .col({ cols: 4, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'Phone', placeholder: '+1 234 567 890' })),
      )
      .col({ cols: 4, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VSelect', {
            label: 'Preferred Contact Method',
            items: [
              { title: 'Email', value: 'email' },
              { title: 'Phone', value: 'phone' },
              { title: 'Mail', value: 'mail' },
            ],
          }),
        ),
      ),
  )
  // Address
  .row({}, (row) =>
    row.col({ cols: 12, offset: 0 }, (col) =>
      col.component((cmpt) => cmpt.generic('h4', { [FormBuilderBodyProp]: 'Address', class: 'mt-0' })),
    ),
  )
  .row({}, (row) =>
    row
      .col({ cols: 8, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'Street', placeholder: 'Enter street name' })),
      )
      .col({ cols: 4, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'House Number', placeholder: 'Enter number' })),
      ),
  )
  .row({}, (row) =>
    row
      .col({ cols: 4, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'Postal Code', placeholder: '12345' })),
      )
      .col({ cols: 4, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'City', placeholder: 'Enter city' })),
      )
      .col({ cols: 4, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'Country', placeholder: 'USA' })),
      ),
  )
  // Additional Information
  .row({}, (row) =>
    row.col({ cols: 12, offset: 0 }, (col) =>
      col.component((cmpt) => cmpt.generic('h4', { [FormBuilderBodyProp]: 'Additional Information', class: 'mt-0' })),
    ),
  )
  .row({}, (row) =>
    row
      .col({ cols: 6, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VSelect', {
            label: 'Education',
            items: [
              { title: 'High School', value: 'high_school' },
              { title: 'Associate Degree', value: 'associate' },
              { title: "Bachelor's Degree", value: 'bachelor' },
              { title: "Master's Degree", value: 'master' },
              { title: 'Doctorate', value: 'doctorate' },
            ],
          }),
        ),
      )
      .col({ cols: 6, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VRadioGroup', {
            label: 'Status',
            inline: true,
            children: [
              { name: 'VRadio', props: { label: 'Student', value: 'student' } },
              { name: 'VRadio', props: { label: 'Employed', value: 'employed' } },
              { name: 'VRadio', props: { label: 'Retired', value: 'retired' } },
              { name: 'VRadio', props: { label: 'Other', value: 'other' } },
            ],
          }),
        ),
      ),
  )
  .row({}, (row) =>
    row.col({ cols: 12, offset: 0 }, (col) =>
      col.component((cmpt) =>
        cmpt.generic('VTextarea', {
          label: 'Additional Notes',
          placeholder: 'Enter any additional notes or comments',
          rows: 3,
        }),
      ),
    ),
  );

// md and up (lg and xl state no layout of their own)
formBuilder.breakpoint(
  'md',
  (form) =>
    form
      .row({}, (row) =>
        row.col({ cols: 12, offset: 0 }, (col) =>
          col.component((cmpt) =>
            cmpt.generic('h2', { [FormBuilderBodyProp]: 'Registration Form', class: 'ma-0 pa-0' }),
          ),
        ),
      )
      // Personal Information - a different row layout
      .row({}, (row) =>
        row.col({ cols: 12, offset: 0 }, (col) =>
          col.component((cmpt) => cmpt.generic('h4', { [FormBuilderBodyProp]: 'Personal Information', class: 'ma-0' })),
        ),
      )
      .row({}, (row) =>
        row
          .col({ cols: 6, offset: 0 }, (col) =>
            col.component((cmpt) =>
              cmpt.generic('VTextField', { label: 'First Name', placeholder: 'Enter first name' }),
            ),
          )
          .col({ cols: 6, offset: 0 }, (col) =>
            col.component((cmpt) => cmpt.generic('VTextField', { label: 'Last Name', placeholder: 'Enter last name' })),
          ),
      )
      .row({}, (row) =>
        row
          .col({ cols: 6, offset: 0 }, (col) =>
            col.component((cmpt) =>
              cmpt.generic('VTextField', { label: 'SSN', placeholder: 'Enter social security number' }),
            ),
          )
          .col({ cols: 6, offset: 0 }, (col) =>
            col.component((cmpt) =>
              cmpt.generic('VSelect', {
                label: 'Gender',
                items: [
                  { title: 'Male', value: 'M' },
                  { title: 'Female', value: 'F' },
                  { title: 'Prefer not to say', value: 'N' },
                ],
              }),
            ),
          ),
      )
      // Contact Information
      .row({}, (row) =>
        row.col({ cols: 12, offset: 0 }, (col) =>
          col.component((cmpt) => cmpt.generic('h4', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' })),
        ),
      )
      .row({}, (row) =>
        row
          .col({ cols: 6, offset: 0 }, (col) =>
            col.component((cmpt) =>
              cmpt.generic('VTextField', { label: 'Email', type: 'email', placeholder: 'email@domain.com' }),
            ),
          )
          .col({ cols: 6, offset: 0 }, (col) =>
            col.component((cmpt) => cmpt.generic('VTextField', { label: 'Phone', placeholder: '+1 234 567 890' })),
          ),
      )
      .row({}, (row) =>
        row.col({ cols: 12, offset: 0 }, (col) =>
          col.component((cmpt) =>
            cmpt.generic('VSelect', {
              label: 'Preferred Contact Method',
              items: [
                { title: 'Email', value: 'email' },
                { title: 'Phone', value: 'phone' },
                { title: 'Mail', value: 'mail' },
              ],
            }),
          ),
        ),
      )
      // Address - two columns with a column-level breakpoint. The column inherits its sm width at md, so where
      // this form applies both columns are 12 wide.
      .row({}, (row) =>
        row.col({ cols: 12, offset: 0 }, (col) =>
          col.component((cmpt) => cmpt.generic('h4', { [FormBuilderBodyProp]: 'Address', class: 'mt-0' })),
        ),
      )
      .row({}, (row) =>
        row
          .col({ cols: 8, offset: 0 }, (col) =>
            col
              .breakpoint('sm', (col) => {
                col.props.cols = 12;
                return col;
              }) // 12 wide from sm upwards
              .component((cmpt) => cmpt.generic('VTextField', { label: 'Street', placeholder: 'Enter street name' })),
          )
          .col({ cols: 4, offset: 0 }, (col) =>
            col
              .breakpoint('sm', (col) => {
                col.props.cols = 12;
                return col;
              }) // 12 wide from sm upwards
              .component((cmpt) => cmpt.generic('VTextField', { label: 'House Number', placeholder: 'Enter number' })),
          ),
      )
      .row({}, (row) =>
        row
          .col({ cols: 4, offset: 0 }, (col) =>
            col.component((cmpt) => cmpt.generic('VTextField', { label: 'Postal Code', placeholder: '12345' })),
          )
          .col({ cols: 4, offset: 0 }, (col) =>
            col.component((cmpt) => cmpt.generic('VTextField', { label: 'City', placeholder: 'Enter city' })),
          )
          .col({ cols: 4, offset: 0 }, (col) =>
            col.component((cmpt) => cmpt.generic('VTextField', { label: 'Country', placeholder: 'USA' })),
          ),
      ),
  // The rows stated here replace all rows of the base layout, so the form at md ends with the Address section
);

// sm - mostly one field per row
formBuilder.breakpoint('sm', (form) =>
  form
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('h3', { [FormBuilderBodyProp]: 'Registration Form', class: 'ma-0' })),
      ),
    )
    // Personal Information
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('h5', { [FormBuilderBodyProp]: 'Personal Information', class: 'mt-0' })),
      ),
    )
    .row({}, (row) =>
      row
        .col({ cols: 6, offset: 0 }, (col) =>
          col.component((cmpt) =>
            cmpt.generic('VTextField', { label: 'First Name', placeholder: 'Enter first name', dense: true }),
          ),
        )
        .col({ cols: 6, offset: 0 }, (col) =>
          col.component((cmpt) =>
            cmpt.generic('VTextField', { label: 'Last Name', placeholder: 'Enter last name', dense: true }),
          ),
        ),
    )
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'SSN', placeholder: 'Enter social security number', dense: true }),
        ),
      ),
    )
    // Contact Information
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('h5', { [FormBuilderBodyProp]: 'Contact Information', class: 'mt-0' })),
      ),
    )
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'Email', type: 'email', placeholder: 'email@domain.com', dense: true }),
        ),
      ),
    )
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'Phone', placeholder: '+1 234 567 890', dense: true }),
        ),
      ),
    )
    // Address
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('h5', { [FormBuilderBodyProp]: 'Address', class: 'mt-0' })),
      ),
    )
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'Street and Number', placeholder: 'E.g. Main Street 123', dense: true }),
        ),
      ),
    )
    .row({}, (row) =>
      row
        .col({ cols: 4, offset: 0 }, (col) =>
          col.component((cmpt) =>
            cmpt.generic('VTextField', { label: 'Postal Code', placeholder: '12345', dense: true }),
          ),
        )
        .col({ cols: 8, offset: 0 }, (col) =>
          col.component((cmpt) => cmpt.generic('VTextField', { label: 'City', placeholder: 'New York', dense: true })),
        ),
    )
    // Notes
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextarea', {
            label: 'Additional Notes',
            placeholder: 'Enter any notes',
            rows: 2,
            dense: true,
          }),
        ),
      ),
    ),
);

// xs - the fewest fields
formBuilder.breakpoint('xs', (form) =>
  form
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('h4', { [FormBuilderBodyProp]: 'Registration', class: 'ma-0' })),
      ),
    )
    // Name, email, phone and address
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'Full Name', placeholder: 'John Doe', dense: true }),
        ),
      ),
    )
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'Email', type: 'email', placeholder: 'john.doe@email.com', dense: true }),
        ),
      ),
    )
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'Phone', placeholder: '+1 234 567 890', dense: true }),
        ),
      ),
    )
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VTextField', { label: 'Address', placeholder: 'E.g. Main Street 123, New York', dense: true }),
        ),
      ),
    )
    // Confirmation field
    .row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) =>
          cmpt.generic('VCheckbox', {
            label: 'I agree to the terms and conditions',
            dense: true,
            hideDetails: true,
          }),
        ),
      ),
    ),
);

// The components the layout names
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

// The current breakpoint, shown above the form
const display = useDisplay();
const currentBreakpoint = computed(() => display.name.value);

const formLayout = formBuilder;
</script>

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
