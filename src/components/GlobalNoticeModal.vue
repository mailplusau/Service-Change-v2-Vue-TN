<template>

    <b-modal centered v-model="modalOpen" @hide="handleModalHide">
        <template v-slot:modal-header>
            <h5 class="text-center text-danger" v-if="globalModal.isError"><b-icon icon="exclamation-triangle"></b-icon> {{globalModal.title}}</h5>
            <h5 class="text-center" v-else>{{globalModal.title}}</h5>
        </template>

        <b-row class="justify-content-center">
            <b-col cols="12" class="text-center" v-show="globalModal.busy">
                <b-spinner variant="primary"
                ></b-spinner>
            </b-col>
            <b-col cols="12" class="text-center">
                <span v-html="globalModal.body"></span>
            </b-col>
        </b-row>

        <template v-slot:modal-footer>
            <b-button size="sm" @click="forceClose" :disabled="globalModal.busy">Okay</b-button>
        </template>
    </b-modal>

</template>

<script>
export default {
    name: "GlobalNoticeModal",
    data: () => ({
        forcedClose: false,
    }),
    methods: {
        handleModalHide(event) {
            if((this.globalModal.busy || this.globalModal.persistent) && !this.forcedClose) event.preventDefault();
        },
        forceClose() {
            this.forcedClose = true;
            this.modalOpen = false;
        }
    },
    computed: {
        globalModal() {
            return this.$store.getters['globalModal'];
        },
        modalOpen: {
            get() {
                return this.globalModal.open;
            },
            set(val) {
                if (val) this.forcedClose = false;
                return this.$store.commit('setGlobalModal', val);
            }
        }
    }
}
</script>

<style scoped>

</style>