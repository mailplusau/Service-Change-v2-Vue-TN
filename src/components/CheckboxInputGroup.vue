<template>
    <div class="input-group" @click.stop="change">
        <div class="input-group-text">
            <input class="form-check-input mt-0" type="checkbox" :checked="checked" @change="change"
                   aria-label="Checkbox for following text input" disabled>
        </div>
        <input style="color: black !important; border: 1px solid #cccccc !important; cursor: pointer;"
               type="text" class="form-control" aria-label="Text input with checkbox" disabled :value="label">
    </div>
</template>

<script>
export default {
    name: "CheckboxInputGroup",
    props: ['value', 'label'],
    data: () => ({
        checked: false
    }),
    methods: {
        change() {
            this.checked = !this.checked;
            this.$emit('input', this.checked)
            this.$nextTick(() => {
                this.$emit('changed', this.checked);
            })
        }
    },
    watch: {
        value(val) {
            this.checked = !!val;
        }
    }
}
</script>

<style scoped>
.input-group {
    cursor: pointer;
}
.form-check-input {
    opacity: 1 !important;
}
</style>