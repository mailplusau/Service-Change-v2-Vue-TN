<template>
    <b-modal centered v-model="modalOpen" @hide="handleModalHide">
        <template v-slot:modal-header>
            <h5 class="text-center">Deleting service change record #{{value}}</h5>
        </template>

        <b-row v-if="formBusy">
            <b-col cols="12">
                <h5 class="text-danger text-center">
                    Deleting service change record...
                </h5>
            </b-col>
        </b-row>

        <b-row class="justify-content-between" v-else>
            <b-col cols="12">
                Service Name: {{item.custrecord_service_text}}
            </b-col>
            <b-col cols="12">
                Description: {{item.custrecord_service_description}}
            </b-col>
            <b-col cols="12">
                New Price: {{item.custrecord_servicechg_new_price}}
            </b-col>
            <b-col cols="12">
                Old Price: {{item.custrecord_service_price}}
            </b-col>
            <b-col cols="12">
                Date Effective: {{item.custrecord_servicechg_date_effective}}
            </b-col>
            <b-col cols="12">
                Created By: {{item.custrecord_servicechg_created_text}}
            </b-col>
            <b-col cols="12">
                Last Modified: {{item.lastmodified}}
            </b-col>
            <b-col cols="12">
                Type: {{item.custrecord_servicechg_type}}
            </b-col>
            <b-col cols="12">
                <h6 class="text-danger text-center mt-3">
                    Please confirm that you really want to delete this service change record. This action cannot be undone.
                </h6>
            </b-col>
        </b-row>

        <template v-slot:modal-footer>
            <b-button size="sm" :disabled="formBusy" @click="modalOpen = false">Cancel</b-button>
            <b-button size="sm" variant="danger" :disabled="formBusy"
                      @click="deleteItem">
                {{formBusy ? 'Please wait' : 'Delete this'}}
                <b-spinner type="grow" v-show="formBusy" style="width:1rem;height:0.1rem"></b-spinner>
            </b-button>
        </template>
    </b-modal>

</template>

<script>
export default {
    name: "ServiceChangeDeletionModal",
    props: ['value'],
    data: () => ({

    }),
    methods: {
        handleModalHide(event) {
            if(this.formBusy) event.preventDefault();
        },
        deleteItem() {
            this.$store.dispatch('service-changes/delete', this.value).then(() => {
                console.log('finish deleting');
                this.modalOpen = false;
            });
        }
    },
    computed: {
        formBusy() {
            return this.$store.getters['service-changes/modal'].busy;
        },
        modalOpen: {
            get() {
                return !!this.value;
            },
            set(val) {
                if (!val) this.$emit('input', null);
            }
        },
        item() {
            let index = this.$store.getters['service-changes/serviceChanges'].findIndex(item => item.id === this.value);
            return index >= 0 ? this.$store.getters['service-changes/serviceChanges'][index] : {};
        }
    }
}
</script>

<style scoped>

</style>