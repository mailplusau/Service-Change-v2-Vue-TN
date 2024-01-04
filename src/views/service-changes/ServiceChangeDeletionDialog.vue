<template>
    <v-dialog v-model="dialogOpen" :max-width="600" persistent>
        <v-card class="background">
            <v-container>
                <v-row justify="center">
                    <v-col cols="12">
                        <p class="text-h5 text-center mb-0">Deleting service change record #{{internalIdToDelete}}</p>
                    </v-col>
                    <v-col cols="12">
                        <p><b>Service Name:</b> {{item.custrecord_service_text}}</p>
                        <p><b>Description:</b> {{item.custrecord_service_description}}</p>
                        <p><b>New Price:</b> {{formatCurrency(item.custrecord_servicechg_new_price)}}</p>
                        <p><b>Old Price:</b> {{formatCurrency(item.custrecord_service_price)}}</p>
                        <p><b>Date Effective:</b> {{item.custrecord_servicechg_date_effective}}</p>
                        <p><b>Created By:</b> {{item.custrecord_servicechg_created_text}}</p>
                        <p><b>Last Modified:</b> {{item.lastmodified}}</p>
                        <p><b>Type:</b> {{item.custrecord_servicechg_type}}</p>
                        <p class="red--text text-center"><b>
                            Please confirm that you really want to delete this service change record. This action cannot be undone.
                        </b></p>
                    </v-col>
                </v-row>
            </v-container>

            <v-card-actions class="pb-5">
                <v-spacer></v-spacer>
                <v-btn class="mx-3" @click="dialogOpen = false">
                    Cancel
                </v-btn>

                <v-btn color="red darken-1" dark class="mx-3" @click="deleteItem">
                    Delete Service Change
                </v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>

let AUDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AUD',
});

export default {
    name: "ServiceChangeDeletionDialog",
    methods: {
        formatCurrency(value) {
            return AUDollar.format(value);
        },
        deleteItem() {
            this.$store.dispatch('service-changes/delete').then(() => {
                console.log('finish deleting');
                this.dialogOpen = false;
            });
        }
    },
    computed: {
        dialogOpen: {
            get() {
                return !!this.internalIdToDelete;
            },
            set(val) {
                if (!val) this.internalIdToDelete = null;
            }
        },
        internalIdToDelete: {
            get() {
                return this.$store.getters['service-changes/serviceChangeIdToDelete'];
            },
            set(val) {
                this.$store.commit('service-changes/setServiceChangeIdToDelete', val);
            }
        },
        item() {
            let index = this.$store.getters['service-changes/serviceChanges'].findIndex(item => item.id === this.internalIdToDelete);
            return index >= 0 ? this.$store.getters['service-changes/serviceChanges'][index] : {};
        }
    }
};
</script>

<style scoped>

</style>