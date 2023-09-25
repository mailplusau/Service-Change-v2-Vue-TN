<template>
    <div class="col-auto">
        <b-button variant="primary" @click="modal = true" v-show="!!$store.getters['nextPageToProceed']">
            Proceed to next page <b-icon icon="arrow-right-circle"></b-icon>
        </b-button>

        <b-modal centered v-model="modal" @hide="handleModalHide">
            <template v-slot:modal-header>
                <h6 class="text-center">Ready to proceed?</h6>
            </template>

            <b-row class="justify-content-center" v-if="going">
                <b-col cols="12" class="text-center">
                    <b-spinner variant="primary"></b-spinner>
                </b-col>
                <b-col cols="12" class="text-center">
                    Redirecting to <b>{{$store.getters['nextPageToProceed']}}</b>...
                </b-col>
            </b-row>
            <b-row class="justify-content-center" v-else>
                <b-col cols="12" class="text-center">
                    If you are ready to continue with the process, this dialog will take you to <b>{{$store.getters['nextPageToProceed']}}</b>.
                </b-col>
            </b-row>

            <template v-slot:modal-footer>
                <b-button size="sm" variant="danger" @click="modal = false" :disabled="going">Cancel</b-button>
                <b-button size="sm" variant="success" @click="proceed" :disabled="going || !$store.getters['nextPageToProceed']">Continue</b-button>
            </template>
        </b-modal>
    </div>
</template>

<script>
export default {
    name: "ServiceFinalisedButton",
    data: () => ({
        modal: false,
        going: false,
    }),
    methods: {
        proceed() {
            this.$store.dispatch('goToNextPage');
            this.going = true;
        },
        handleModalHide(event) {
            if(this.going) event.preventDefault();
        },
    }
}
</script>

<style scoped>

</style>