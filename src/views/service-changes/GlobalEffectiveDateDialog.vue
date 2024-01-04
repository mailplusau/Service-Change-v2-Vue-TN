<template>
    <v-dialog v-model="dialog" :max-width="500" persistent>
        <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" small color="success" class="mr-2" :disabled="!$store.getters['customerId']">
                change effective date
            </v-btn>
        </template>

        <v-card class="background">
            <v-card-title>
                Change Global Effective Date
            </v-card-title>

            <v-container>
                <v-row justify="center">
                    <v-col cols="12">
                        <EditableDateInput v-model="globalEffectiveDate" prefix="Global Effective Date:" :min="minEffectiveDate" />
                    </v-col>

                    <v-col cols="12" class="text-center">
                        <v-btn block class="mb-3" dark color="green" @click="applyDateSelectionGlobally">
                            Apply to all existing service changes
                        </v-btn>

                        <v-btn block class="mb-3" dark color="yellow darken-4" @click="keepDateSelectionWithoutApplying">
                            Keep without applying to existing service changes
                        </v-btn>

                        <v-btn small class="" dark color="red darken-1" @click="cancelDateSelection">
                            Cancel this change of global effective date
                        </v-btn>
                    </v-col>
                </v-row>
            </v-container>

        </v-card>
    </v-dialog>
</template>

<script>
import EditableDateInput from '@/components/EditableDateInput.vue';

export default {
    name: "GlobalEffectiveDateDialog",
    components: {EditableDateInput},
    data: () => ({
        dialog: false,
    }),
    mounted() {
        this.$store.getters['service-changes/modal'].oldGlobalEffectiveDate = this.$store.getters['service-changes/modal'].globalEffectiveDate;
    },
    methods: {
        openDialog() {
            this.dialog = true;
        },
        applyDateSelectionGlobally() {
            this.$store.getters['service-changes/modal'].oldGlobalEffectiveDate = this.$store.getters['service-changes/modal'].globalEffectiveDate;
            this.$store.dispatch('service-changes/applyGlobalEffectiveDate');
            this.dialog = false;
        },
        keepDateSelectionWithoutApplying() {
            this.$store.getters['service-changes/modal'].oldGlobalEffectiveDate = this.$store.getters['service-changes/modal'].globalEffectiveDate;
            this.$store.dispatch('service-changes/makeGlobalEffectiveDateDefault');
            this.dialog = false;
        },
        cancelDateSelection() {
            this.$store.getters['service-changes/modal'].globalEffectiveDate = this.$store.getters['service-changes/modal'].oldGlobalEffectiveDate;
            this.dialog = false;
        },
    },
    computed: {
        globalEffectiveDate: {
            get() {
                let date = this.$store.getters['service-changes/modal'].globalEffectiveDate;

                if (date?.toISOString) {
                    let pad = num => (num < 10 ? '0' : '') + num;
                    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
                } else return '';
            },
            set(val) {
                this.$store.commit('service-changes/setGlobalEffectiveDateByISOString', val);
            }
        },
        minEffectiveDate() {
            let date = this.$store.getters['service-changes/modal'].minEffectiveDate;
            return date?.toISOString ? date['toISOString']().split('T')[0] : '';
        },
        busy() {
            return this.$store.getters['service-changes/busy'];
        },
        modalBusy() {
            return this.$store.getters['service-changes/modal'].busy;
        }
    }
};
</script>

<style scoped>

</style>