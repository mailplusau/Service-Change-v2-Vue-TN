<template>
    <div class="row justify-content-center" >
        <b-table :items="tableData" :fields="serviceChangeColumns" head-row-variant="light" :busy="busy" striped show-empty hover>
            <template v-slot:empty>
                {{ hasScheduledChanges ? 'There are already scheduled changes' : 'No Service Change Found' }}
            </template>

            <template v-slot:thead-top>
                <b-tr>
                    <b-th colspan="8"></b-th>
                    <b-th colspan="6" variant="secondary">Frequency</b-th>
                </b-tr>
            </template>

            <template v-slot:table-busy>
                <div class="text-center text-danger my-2">
                    <b-spinner class="align-middle mx-2"></b-spinner>
                    <strong>Loading...</strong>
                </div>
            </template>


            <template v-slot:cell(custrecord_service_day_mon)="{item}">
                <b-icon :icon="item.custrecord_service_day_mon ? 'check-lg' : 'x-lg'" :variant="item.custrecord_service_day_mon ? 'success' : 'danger'"></b-icon>
            </template>
            <template v-slot:cell(custrecord_service_day_tue)="{item}">
                <b-icon :icon="item.custrecord_service_day_tue ? 'check-lg' : 'x-lg'" :variant="item.custrecord_service_day_tue ? 'success' : 'danger'"></b-icon>
            </template>
            <template v-slot:cell(custrecord_service_day_wed)="{item}">
                <b-icon :icon="item.custrecord_service_day_wed ? 'check-lg' : 'x-lg'" :variant="item.custrecord_service_day_wed ? 'success' : 'danger'"></b-icon>
            </template>
            <template v-slot:cell(custrecord_service_day_thu)="{item}">
                <b-icon :icon="item.custrecord_service_day_thu ? 'check-lg' : 'x-lg'" :variant="item.custrecord_service_day_thu ? 'success' : 'danger'"></b-icon>
            </template>
            <template v-slot:cell(custrecord_service_day_fri)="{item}">
                <b-icon :icon="item.custrecord_service_day_fri ? 'check-lg' : 'x-lg'" :variant="item.custrecord_service_day_fri ? 'success' : 'danger'"></b-icon>
            </template>
            <template v-slot:cell(custrecord_service_day_adhoc)="{item}">
                <b-icon :icon="item.custrecord_service_day_adhoc ? 'check-lg' : 'x-lg'" :variant="item.custrecord_service_day_adhoc ? 'success' : 'danger'"></b-icon>
            </template>

            <template v-slot:cell(actions)="{index, item}">
                <div class="text-end">

                    <b-button size="sm" variant="link" @click="$store.dispatch('service-changes/openFormModal', index)">
                        <b-icon icon="pencil"></b-icon>
                    </b-button>

                    <b-button size="sm" variant="link" v-if="!item.isService" @click="internalIdToDelete = item.id">
                        <b-icon icon="trash" variant="danger"></b-icon>
                    </b-button>
                </div>
            </template>


            <template v-slot:custom-foot>
                <b-tr>
                    <b-td :colspan="serviceChangeColumns.length">
                        <b-button variant="outline-primary" size="sm" class="w-100"
                                  @click="$store.dispatch('service-changes/openFormModal')" :disabled="busy || hasScheduledChanges">
                            Add New Service
                        </b-button>
                    </b-td>
                </b-tr>
            </template>
        </b-table>

        <ServiceChangeDeletionModal v-model="internalIdToDelete" />
    </div>
</template>

<script>
import ServiceChangeDeletionModal from "@/views/service-change/ServiceChangeDeletionModal";
export default {
    name: "ServiceTable",
    components: {ServiceChangeDeletionModal},
    data: () => ({
        serviceChangeColumns: [
            {key: 'custrecord_service_text', label: 'Service Name'},
            {key: 'custrecord_service_description', label: 'Description'},
            {key: 'custrecord_service_price', label: 'Old Price'},
            {key: 'custrecord_servicechg_new_price', label: 'New Price'},
            {key: 'custrecord_servicechg_date_effective', label: 'Effective Date'},
            {key: 'custrecord_servicechg_created_text', label: 'Created By'},
            {key: 'lastmodified', label: 'Last Modified'},
            {key: 'custrecord_servicechg_type', label: 'Type'},

            {key: 'custrecord_service_day_mon', label: 'MON'},
            {key: 'custrecord_service_day_tue', label: 'TUE'},
            {key: 'custrecord_service_day_wed', label: 'WED'},
            {key: 'custrecord_service_day_thu', label: 'THU'},
            {key: 'custrecord_service_day_fri', label: 'FRI'},
            {key: 'custrecord_service_day_adhoc', label: 'Adhoc'},

            {key: 'actions', label: ''},
        ],
        internalIdToDelete: null,
    }),
    computed: {
        hasScheduledChanges() {
            return this.$store.getters['service-changes/hasScheduledChanges'];
        },
        tableData() {
            return this.hasScheduledChanges ? [] : this.$store.getters['service-changes/tableData'];
        },
        busy() {
            return this.$store.getters['service-changes/busy'];
        }
    }
}
</script>

<style scoped>

</style>