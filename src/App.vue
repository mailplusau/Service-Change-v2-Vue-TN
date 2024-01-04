<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-main>
            <v-container fluid>
                <v-row class="mx-1" justify="space-between" align="center">
                    <v-col cols="auto">
                        <h2 class="primary--text" v-html="pageTitle"></h2>
                    </v-col>

                    <v-col cols="auto">
                        <!--                        <a @click="$store.dispatch('addShortcut')" class="subtitle-1">Add To Shortcuts <v-icon size="20" color="primary">mdi-open-in-new</v-icon></a>-->
                    </v-col>
                </v-row>
            </v-container>

            <v-divider class="mb-3"></v-divider>

            <v-container fluid>
                <v-row justify="center">
                    <v-col cols="12">
                        <ServiceChangesView />
                    </v-col>
                </v-row>

                <v-row justify="end" v-show="!$store.getters['standaloneMode']">
                    <v-col cols="auto" class="mr-3">
                        <ServiceFinaliseDialog />
                    </v-col>
                </v-row>
            </v-container>

        </v-main>

        <GlobalNotificationModal />
    </v-app>
</template>

<script>
import GlobalNotificationModal from "@/components/GlobalNotificationModal";
import ServiceChangesView from "@/views/service-changes/Main";
import ServiceFinaliseDialog from '@/views/service-changes/ServiceFinaliseDialog.vue';

export default {
    name: 'App',
    components: {
        ServiceFinaliseDialog,
        GlobalNotificationModal,
        ServiceChangesView,
    },
    beforeCreate() {
        this.$store.dispatch('init');
    },
    computed:{
        theme() {
            return (this.$vuetify.theme.dark) ? 'dark' : 'light'
        },
        pageTitle() {
            return this.$store.getters['pageTitle'];
        }
    }
};
</script>
