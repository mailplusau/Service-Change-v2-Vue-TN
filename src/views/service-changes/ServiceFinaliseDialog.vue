<template>
    <v-dialog v-model="dialog" :max-width="400" persistent>
        <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" large color="primary" elevation="10" :disabled="!$store.getters['customerId']">
                Proceed to next page <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
        </template>

        <v-card class="background">
            <v-card-title>
                Ready to proceed?
            </v-card-title>

            <v-card-text>
                If you are ready to continue with the process, this dialog will take you to <b class="red--text">{{$store.getters['nextPageToProceed']}}</b>.
            </v-card-text>

            <v-card-actions>
                <v-btn class="mx-3" @click="dialog = false" text>
                    Cancel
                </v-btn>

                <v-spacer></v-spacer>

                <v-btn color="success darken-1" dark text class="mx-3" @click="$store.dispatch('goToNextPage')">
                    Proceed
                </v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "ServiceFinaliseDialog",
    data: () => ({
        dialog: false,
    })
};
</script>

<style scoped>

</style>