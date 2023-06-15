<template>
    <div class="row">
        <div class="col-6 mb-4">
            <b-input-group prepend="Global Date Effective">
                <b-form-datepicker v-model="$store.getters['service-changes/modal'].globalEffectiveDate"
                                   @input="handleGlobalEffectiveDateChanged"
                                   :min="minEffectiveDate" value-as-date
                                   :disabled="busy"
                ></b-form-datepicker>
            </b-input-group>
        </div>


        <b-modal centered v-model="modalOpen" hide-footer @hide="handleModalHide">
            <template v-slot:modal-header>
                <h5 class="text-center">Global Effective Date Changed</h5>
            </template>

            <b-row class="justify-content-center" v-if="modalBusy">
                <b-col cols="12" class="text-center">
                    <b-spinner variant="primary"
                    ></b-spinner>
                </b-col>
                <b-col cols="12" class="text-center">
                    Applying global effective date...
                </b-col>
            </b-row>
            <b-row class="justify-content-center" v-else>
                <b-col cols="12" class="text-center">
                    What would you like to do?
                </b-col>
                <b-col cols="12" class="text-center">
                    <b-button class="w-100 mt-3" variant="outline-primary" @click="apply">
                        Apply this to all existing service changes
                    </b-button>
                    <b-button class="w-100 mt-3" variant="outline-primary" @click="keepWithoutApplying">
                        Keep this without applying to existing service changes
                    </b-button>
                    <b-button class="w-100 mt-3" variant="outline-danger" @click="cancel">
                        Cancel this change of global effective date
                    </b-button>
                </b-col>
            </b-row>
        </b-modal>
    </div>
</template>

<script>
export default {
    name: "ServiceDateEffective",
    data: () => ({
        modalOpen: false,
    }),
    mounted() {
        this.$store.getters['service-changes/modal'].oldGlobalEffectiveDate = this.$store.getters['service-changes/modal'].globalEffectiveDate;
    },
    methods: {
        handleGlobalEffectiveDateChanged() {
            this.modalOpen = true;
        },
        apply() {
            this.$store.getters['service-changes/modal'].oldGlobalEffectiveDate = this.$store.getters['service-changes/modal'].globalEffectiveDate;
            this.$store.dispatch('service-changes/applyGlobalEffectiveDate').then(() => {
                this.modalOpen = false;
            });
        },
        keepWithoutApplying() {
            this.$store.getters['service-changes/modal'].oldGlobalEffectiveDate = this.$store.getters['service-changes/modal'].globalEffectiveDate;
            this.$store.dispatch('service-changes/makeGlobalEffectiveDateDefault');
            this.modalOpen = false;
        },
        cancel() {
            this.$store.getters['service-changes/modal'].globalEffectiveDate = this.$store.getters['service-changes/modal'].oldGlobalEffectiveDate;
            this.modalOpen = false;
        },
        handleModalHide(event) {
            if(this.modalBusy) event.preventDefault();
            else this.keepWithoutApplying();
        },
    },
    computed: {
        minEffectiveDate() {
            return this.$store.getters['service-changes/modal'].minEffectiveDate;
        },
        busy() {
            return this.$store.getters['service-changes/busy'];
        },
        modalBusy() {
            return this.$store.getters['service-changes/modal'].busy;
        }
    }
}
</script>

<style scoped>

</style>