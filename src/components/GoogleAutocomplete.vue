<template>
    <b-form-input
        ref="autocomplete"
        v-bind="$attrs"
        :id="id"
        :value="value"
        @input="handleInput">
        <slot name="default"/>
    </b-form-input>
</template>

<script>
export default {
    name: "GoogleAutocomplete",
    props: ['id', 'value'],
    data: () => ({
        autocomplete: null,
    }),
    mounted() {
        let options = {
            types: [],
            componentRestrictions: {
                country: 'au'
            }
        }

        this.autocomplete = new google.maps.places.Autocomplete((document.getElementById(this.id)), options);

        this.autocomplete.addListener('place_changed', () => {
            this.$emit('placeChanged', this.autocomplete.getPlace());
        });
    },
    methods: {
        handlePlaceChanged() {

        },
        handleInput(val) {
            this.$emit('input', val);
        }
    }
}
</script>

<style scoped>

</style>