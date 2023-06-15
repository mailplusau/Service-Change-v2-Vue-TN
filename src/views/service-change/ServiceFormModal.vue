<template>
    <b-modal centered v-model="modal" size="lg" static @hide="handleModalHide">
        <template v-slot:modal-header>
            <h1 class="text-center" v-if="form.internalid">Editing Service Change Record #{{form.internalid}}</h1>
            <h1 class="text-center" v-else>Creating New Service Change Record</h1>
        </template>

        <div class="row">
            <div class="col-8 mb-4">
                <b-input-group prepend="Date Effective">
                    <b-form-datepicker v-model="form.custrecord_servicechg_date_effective" :min="minEffectiveDate" value-as-date
                                       v-validate="'required|date_after'" data-vv-name="date_effective" disabled
                                       :class="errors.has('date_effective') ? 'is-invalid' : ''"
                    ></b-form-datepicker>

                    <b-form-invalid-feedback :state="!errors.has('date_effective')">{{ errors.first('date_effective') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-4 mb-4">
                <b-input-group prepend="New Price">
                    <b-form-input v-model="form.custrecord_servicechg_new_price" type="number" step="0.01" min="0"
                                  v-validate="'required|min_value:0'" data-vv-name="new_price" :disabled="busy"
                                  :class="errors.has('new_price') ? 'is-invalid' : ''"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('new_price')">{{ errors.first('new_price') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-8 mb-4">
                <b-input-group prepend="Sales Type">
                    <SearchableSelect v-model="form.custrecord_servicechg_type" :options="salesTypes" :max-height="'30vh'"
                                      v-validate="'required'" data-vv-name="sales_type" :disabled="busy"
                                      :class="errors.has('sales_type') ? 'is-invalid' : ''"/>

                    <b-form-invalid-feedback :state="!errors.has('sales_type')">{{ errors.first('sales_type') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-4 mb-4">
                <b-input-group prepend="Old Price">
                    <b-form-input v-model="form.custrecord_service_price" type="number" step="0.01" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-12 mb-4">
                <b-input-group prepend="Service">
                    <SearchableSelect v-model="form.custrecord_service" :options="$store.getters['misc/serviceTypes']" :max-height="'30vh'"
                                      v-validate="'required'" data-vv-name="service_type" :disabled="busy"
                                      :class="errors.has('service_type') ? 'is-invalid' : ''"/>

                    <b-form-invalid-feedback :state="!errors.has('service_type')">{{ errors.first('service_type') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-12 mb-4">
                <b-input-group prepend="Description">
                    <b-form-input v-model="form.custrecord_service_description" :disabled="busy"></b-form-input>
                </b-input-group>
            </div>

            <div class="col-3 mb-4">
                <CheckboxInputGroup v-model="form.custrecord_service_day_mon" label="Monday" :disabled="busy"
                                    @changed="updateFrequencyCheckboxes('mon')"/>
            </div>
            <div class="col-3 mb-4">
                <CheckboxInputGroup v-model="form.custrecord_service_day_tue" label="Tuesday" :disabled="busy"
                                    @changed="updateFrequencyCheckboxes('tue')"/>
            </div>
            <div class="col-3 mb-4">
                <CheckboxInputGroup v-model="form.custrecord_service_day_wed" label="Wednesday" :disabled="busy"
                                    @changed="updateFrequencyCheckboxes('wed')"/>
            </div>
            <div class="col-3 mb-4">
                <CheckboxInputGroup v-model="form.custrecord_service_day_thu" label="Thursday" :disabled="busy"
                                    @changed="updateFrequencyCheckboxes('thu')"/>
            </div>
            <div class="col-4">
                <CheckboxInputGroup v-model="form.custrecord_service_day_fri" label="Friday" :disabled="busy"
                                    @changed="updateFrequencyCheckboxes('fri')"/>
            </div>
            <div class="col-4">
                <CheckboxInputGroup v-model="form.custrecord_service_day_daily" label="Daily" :disabled="busy"
                                    @changed="updateFrequencyCheckboxes('daily')"/>
            </div>
            <div class="col-4">
                <CheckboxInputGroup v-model="form.custrecord_service_day_adhoc" label="Adhoc" :disabled="busy"
                                    @changed="updateFrequencyCheckboxes('adhoc')"/>
            </div>

            <div class="col-12" v-if="!freqValid">
                <b-form-invalid-feedback :state="false">Please specify frequency.</b-form-invalid-feedback>
            </div>
        </div>

        <template v-slot:modal-footer>
            <b-button size="sm" :disabled="busy" @click="modal = false">Cancel</b-button>
            <b-button size="sm" variant="success" :disabled="busy" @click="save">
                {{ busy ? 'Saving. Please waiting...' : 'Save' }}
                <b-spinner type="grow" v-show="busy" style="width:1rem;height:0.1rem"></b-spinner>
            </b-button>
        </template>
    </b-modal>
</template>

<script>
import SearchableSelect from "@/components/SearchableSelect";
import CheckboxInputGroup from "@/components/CheckboxInputGroup";

export default {
    name: "ServiceFormModal",
    components: {CheckboxInputGroup, SearchableSelect},
    data: () => ({

    }),
    methods: {
        handleModalHide(event) {
            if(this.busy) event.preventDefault();
        },
        updateFrequencyCheckboxes(lastClick) {
            this.$store.dispatch('service-changes/updateFrequencyCheckboxes', lastClick);
        },
        save() {
            this.$validator.validateAll().then((result) => {
                if (result && this.freqValid) {
                    // eslint-disable-next-line
                    console.log('Form Submitted!');
                    this.$store.dispatch('service-changes/saveServiceChange');
                    return;
                }

                console.log('Correct them errors!');
            });
        }
    },
    computed: {
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
        }
    },
    watch: {

    }
}
</script>

<style scoped>

</style>