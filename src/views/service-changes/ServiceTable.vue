<template>
    <v-data-table :headers="serviceChangeColumns" :items="tableData" :loading="busy" no-data-text="No Service Change to Show"
                  :items-per-page="-1" :hide-default-footer="tableData.length <= 10"
                  class="elevation-5 background" loading-text="Loading service changes...">
        <template v-slot:top>
            <v-toolbar flat dense color="primary" dark>
                <v-toolbar-title v-if="$store.getters['customerId']">
                    Global Effective Date:

                    <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                            <span v-on="on" class="yellow--text" style="cursor: pointer"
                                  @click.stop="$refs.globalEffectiveDateDialog.openDialog()">{{globalEffectiveDate}}</span>
                        </template>
                        Click to change
                    </v-tooltip>

                    <v-tooltip bottom>
                        <template v-slot:activator="{ on }">
                            <v-btn v-on="on" icon small class="ml-2" @click="() => {}">
                                <v-icon>mdi-help-circle-outline</v-icon>
                            </v-btn>
                        </template>
                        What is this?
                    </v-tooltip>
                </v-toolbar-title>

                <v-divider class="mx-4" inset vertical></v-divider>

                <v-toolbar-title class="caption primary--text">Message</v-toolbar-title>

                <v-spacer></v-spacer>

                <GlobalEffectiveDateDialog ref="globalEffectiveDateDialog" />

                <v-btn small color="success" :disabled="!$store.getters['customerId']"
                       @click="$store.dispatch('service-changes/openFormModal')">+ add service</v-btn>
            </v-toolbar>
        </template>

        <template v-slot:item.custrecord_service_price="{ item }">
            {{ formatCurrency(item.custrecord_service_price) }}
        </template>

        <template v-slot:item.custrecord_servicechg_new_price="{ item }">
            {{ formatCurrency(item.custrecord_servicechg_new_price) }}
        </template>

        <template v-for="term in ['mon', 'tue', 'wed', 'thu', 'fri', 'adhoc']"
                  v-slot:[`item.custrecord_service_day_${term}`]="{ item }">
            <v-icon :color="item[`custrecord_service_day_${term}`] ? 'green' : 'red'" :key="term" small>
                {{ item[`custrecord_service_day_${term}`] ? 'mdi-check' : 'mdi-close'}}
            </v-icon>
        </template>

        <template v-slot:item.actions="{index, item}">
            <v-card-actions>
                <v-btn icon color="primary" @click="$store.dispatch('service-changes/openFormModal', index)"><v-icon>mdi-pencil</v-icon></v-btn>
                <v-btn icon color="red" v-if="!item.isService" @click="$store.commit('service-changes/setServiceChangeIdToDelete', item.id)"><v-icon>mdi-delete</v-icon></v-btn>
            </v-card-actions>
        </template>

    </v-data-table>
</template>

<script>

import GlobalEffectiveDateDialog from '@/views/service-changes/GlobalEffectiveDateDialog.vue';

let AUDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AUD',
});

let dateFormat = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'full',
    timeZone: 'Australia/Sydney',
});

export default {
    name: "ServiceTable",
    components: {GlobalEffectiveDateDialog},
    data: () => ({
        headers: [
            {value: 'address', text: 'Address', align: 'start'},
            {value: 'label', text: 'Label', align: 'center', sortable: false},
            {value: 'shipping', text: 'Default Shipping', align: 'center', sortable: false},
            {value: 'billing', text: 'Default Billing', align: 'center', sortable: false},
            {value: 'geocoded', text: 'Geocoded', align: 'center', sortable: false},
            {value: 'actions', text: '', align: 'end', sortable: false},
        ],
        serviceChangeColumns: [
            {value: 'custrecord_service_text', text: 'Service Name', sortable: false, align: 'start', cellClass: 'cell-text-size'},
            {value: 'custrecord_service_description', text: 'Description', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_service_price', text: 'Old Price', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_servicechg_new_price', text: 'New Price', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_servicechg_date_effective', text: 'Effective Date', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_servicechg_created_text', text: 'Created By', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'lastmodified', text: 'Last Modified', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_servicechg_type', text: 'Type', sortable: false, align: 'center', cellClass: 'cell-text-size'},

            {value: 'custrecord_service_day_mon', text: 'MON', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_service_day_tue', text: 'TUE', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_service_day_wed', text: 'WED', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_service_day_thu', text: 'THU', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_service_day_fri', text: 'FRI', sortable: false, align: 'center', cellClass: 'cell-text-size'},
            {value: 'custrecord_service_day_adhoc', text: 'Adhoc', sortable: false, align: 'center', cellClass: 'cell-text-size'},

            {value: 'actions', text: '', sortable: false, align: 'end'},
        ],
    }),
    methods: {
        formatCurrency(value) {
            return AUDollar.format(value);
        },
    },
    computed: {
        globalEffectiveDate() {
            let date = this.$store.getters['service-changes/modal'].globalEffectiveDate;
            return date?.toISOString ? dateFormat.format(date) : '';
        },
        hasScheduledChanges() {
            return this.$store.getters['service-changes/hasScheduledChanges'];
        },
        tableData() {
            return this.hasScheduledChanges ? [] : this.$store.getters['service-changes/tableData'];
        },
        busy() {
            return this.$store.getters['service-changes/busy'];
        }
    },
};
</script>

<style>
.cell-text-size {
    font-size: 11px !important;
}
</style>