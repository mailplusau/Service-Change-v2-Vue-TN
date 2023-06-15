<template>
    <div class="row justify-content-end" >
        <div class="col-12">
            <ServiceDateEffective />
        </div>

        <div class="col-12">
            <ServiceTable />
        </div>

        <ServiceFinalisedButton />

        <ServiceFormModal />
    </div>
</template>

<script>
import ServiceFormModal from "@/views/service-change/ServiceFormModal";
import ServiceTable from "@/views/service-change/ServiceTable";
import ServiceDateEffective from "@/views/service-change/ServiceDateEffective";
import ServiceFinalisedButton from "@/views/service-change/ServiceFinalisedButton";

export default {
    name: "Main",
    components: {ServiceFinalisedButton, ServiceDateEffective, ServiceTable, ServiceFormModal},
}
</script>

<style scoped>

</style>