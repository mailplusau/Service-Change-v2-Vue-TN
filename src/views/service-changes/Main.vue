<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <ServiceTable />
            </v-col>
        </v-row>

        <ServiceFormDialog />

        <ServiceChangeDeletionDialog />
    </v-container>
</template>

<script>
import ServiceTable from '@/views/service-changes/ServiceTable.vue';
import ServiceFormDialog from '@/views/service-changes/ServiceFormDialog.vue';
import ServiceChangeDeletionDialog from '@/views/service-changes/ServiceChangeDeletionDialog.vue';

export default {
    name: "Main",
    components: {ServiceChangeDeletionDialog, ServiceFormDialog, ServiceTable},
};
</script>

<style scoped>

</style>