<template>
    <v-dialog v-model="modal" :max-width="700" persistent>
        <v-card class="background">
            <v-container>
                <v-form ref="form" v-model="formValid" lazy-validation>
                    <v-row justify="center">
                        <v-col cols="12">
                            <p class="text-h5 text-center" v-if="form.internalid">Editing Service Change Record #{{form.internalid}}</p>
                            <p class="text-h5 text-center" v-else>Creating New Service Change Record</p>
                        </v-col>

                        <v-col cols="7">
                            <v-text-field label="Effective Date" :value="globalEffectiveDate" readonly dense></v-text-field>
                        </v-col>

                        <v-col cols="5">
                            <v-autocomplete dense label="Sales Type" :disabled="busy"
                                            v-model="form.custrecord_servicechg_type"
                                            :items="salesTypes"
                                            :rules="[v => validate(v, 'required')]"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="12">
                            <v-autocomplete dense label="Service" :disabled="busy"
                                            v-model="form.custrecord_service"
                                            :items="serviceTypes"
                                            :rules="[v => validate(v, 'required')]"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="6">
                            <v-text-field label="Old Price" v-model="form.custrecord_service_price" dense disabled></v-text-field>
                        </v-col>

                        <v-col cols="6">
                            <v-text-field label="New Price" dense :disabled="busy" type="number"
                                          v-model="form.custrecord_servicechg_new_price"
                                          :rules="[v => validate(v, 'required|minValue:0')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12">
                            <v-text-field label="Description" dense :disabled="busy"
                                          v-model="form.custrecord_service_description"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="auto">
                            <v-checkbox v-model="form.custrecord_service_day_daily" dense hide-details class="mt-0"
                                      @change="updateFrequencyCheckboxes('daily')"
                                       label="Daily"
                            ></v-checkbox>
                        </v-col>

                        <v-col cols="auto">
                            <v-checkbox v-model="form.custrecord_service_day_adhoc" dense hide-details class="mt-0"
                                      @change="updateFrequencyCheckboxes('adhoc')"
                                      label="Adhoc"
                            ></v-checkbox>
                        </v-col>
                    </v-row>
                    <v-row justify="space-between">
                        <v-col cols="auto">
                            <v-checkbox v-model="form.custrecord_service_day_mon" dense hide-details class="mt-0"
                                      @change="updateFrequencyCheckboxes('mon')"
                                      label="Monday"
                            ></v-checkbox>
                        </v-col>
                        <v-col cols="auto">
                            <v-checkbox v-model="form.custrecord_service_day_tue" dense hide-details class="mt-0"
                                      @change="updateFrequencyCheckboxes('tue')"
                                      label="Tuesday"
                            ></v-checkbox>
                        </v-col>
                        <v-col cols="auto">
                            <v-checkbox v-model="form.custrecord_service_day_wed" dense hide-details class="mt-0"
                                      @change="updateFrequencyCheckboxes('wed')"
                                      label="Wednesday"
                            ></v-checkbox>
                        </v-col>
                        <v-col cols="auto">
                            <v-checkbox v-model="form.custrecord_service_day_thu" dense hide-details class="mt-0"
                                      @change="updateFrequencyCheckboxes('thu')"
                                      label="Thursday"
                            ></v-checkbox>
                        </v-col>
                        <v-col cols="auto">
                            <v-checkbox v-model="form.custrecord_service_day_fri" dense hide-details class="mt-0"
                                      @change="updateFrequencyCheckboxes('fri')"
                                      label="Friday"
                            ></v-checkbox>
                        </v-col>
                    </v-row>
                </v-form>
            </v-container>

            <v-card-actions class="pb-5">
                <v-spacer></v-spacer>
                <v-btn class="mx-3" @click="modal = false" :disabled="busy">
                    Cancel
                </v-btn>

                <v-btn v-if="freqValid" color="green darken-1" dark class="mx-3" @click="save" :disabled="busy || !$store.getters['customerId']">
                    Save Service Change
                </v-btn>
                <v-btn v-else color="red" outlined><v-icon small>mdi-alert-outline</v-icon> Please Select Frequency</v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import {allowOnlyNumericalInput, rules} from '@/utils/utils.mjs';

let dateFormat = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'full',
    timeZone: 'Australia/Sydney',
});

export default {
    name: "ServiceFormDialog",
    data: () => ({
        formValid: false,
    }),
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        resetValidation () {
            this.$refs.form.resetValidation()
        },
        updateFrequencyCheckboxes(lastClick) {
            this.$store.dispatch('service-changes/updateFrequencyCheckboxes', lastClick);
        },
        save() {
            if (!this.$refs.form.validate()) return false;
            this.$store.dispatch('service-changes/saveServiceChange');
        }
    },
    computed: {
        globalEffectiveDate() {
            let date = this.$store.getters['service-changes/modal'].globalEffectiveDate;
            return date?.toISOString ? dateFormat.format(date) : '';
        },
        form() {
            return this.$store.getters['service-changes/modal'].form;
        },
        freqValid() {
            return ['mon', 'tue', 'wed', 'thu', 'fri', 'adhoc']
                .reduce((acc, val) => acc || this.form['custrecord_service_day_' + val], false);
        },
        minEffectiveDate() {
            return this.$store.getters['service-changes/modal'].minEffectiveDate;
        },
        busy() {
            return this.$store.getters['service-changes/modal'].busy;
        },
        modal: {
            get() {
                return this.$store.getters['service-changes/modal'].open;
            },
            set(val) {
                this.$store.commit('service-changes/openModal', val);
            }
        },
        salesTypes() {
            return this.$store.getters['misc/salesTypes'].map(item => ({value: item.text, text: item.text}));
        },
        serviceTypes() {
            return this.$store.getters['misc/serviceTypes'].filter(item => !this.$store.getters['service-changes/excludedServiceTypes'].includes(item.value))
        }
    },
};
</script>

<style scoped>

</style>