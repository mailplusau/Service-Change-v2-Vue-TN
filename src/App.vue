<template>
    <div id="app">
        <img alt="Vue logo" src="./assets/logo.png">
        <HelloWorld msg="Welcome to Your Vue.js App"/>
    </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
    name: 'App',
    components: {
        HelloWorld
    },
    mounted() {
        this.registerCustomValidationRules();
    },
    methods: {
        registerCustomValidationRules() {
            this.$validator.extend('aus_phone', {
                getMessage(field) {
                    return `the ${field} field must be a valid Australian phone number.`;
                },
                validate(value) {
                    let australiaPhoneFormat = /^(\+\d{2}[ -]{0,1}){0,1}(((\({0,1}[ -]{0,1})0{0,1}\){0,1}[2|3|7|8]{1}\){0,1}[ -]*(\d{4}[ -]{0,1}\d{4}))|(1[ -]{0,1}(300|800|900|902)[ -]{0,1}((\d{6})|(\d{3}[ -]{0,1}\d{3})))|(13[ -]{0,1}([\d -]{5})|((\({0,1}[ -]{0,1})0{0,1}\){0,1}4{1}[\d -]{8,10})))$/;
                    return australiaPhoneFormat.test(value);
                }
            });
            this.$validator.extend('aus_abn', {
                getMessage(field) {
                    return `the ${field} field must be a valid Australian ABN number.`;
                },
                validate(value) {

                    if (!value || value.length !== 11) {
                        return false;
                    }
                    let weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
                        checksum = value.split('').map(Number).reduce(
                            function(total, digit, index) {
                                if (!index) {
                                    digit--;
                                }
                                return total + (digit * weights[index]);
                            },
                            0
                        );

                    return !(!checksum || checksum % 89 !== 0);

                }
            });
        },
    }
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

.custom-select {
    position: relative;
    flex: 1 1 auto;
    width: 1%;
    min-width: 0;
    font-size: 13px;
}

.pac-container {
    z-index: 1100 !important;
}

body.modal-open {
    overflow: hidden !important;
}

.mp-header {
    color: #387080;
}

.mp-text {
    color: #103d39
}

/* Styles to give NetSuite the MailPlus color */
div#body {
    background-color: #cfe0ce !important;
}

ul#NS_MENU_ID0, ul#NS_MENU_ID0 > .ns-menuitem > a {
    background-color: #cfe0ce !important;
}

ul.pagination.b-pagination, ul.nav.nav-tabs {
    display: flex !important;
    padding-left: 0 !important;
    list-style: none !important;
    margin: 0 !important;
}
</style>