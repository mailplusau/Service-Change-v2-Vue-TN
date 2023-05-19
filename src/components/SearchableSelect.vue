<template>
    <b-dropdown menu-class="w-100" no-caret
                variant="outline"
                class="form-control searchable-select" ref="dropdownButton" @shown="onDropDownShown" :disabled="disabled" :style="cssProps">
        <template v-slot:button-content>
            <input
                id="input-1"
                :value="displayValue"
                type="text"
                :placeholder="placeholder"
                required
                readonly
                style="border: none !important;"
            />
        </template>
        <b-dropdown-form class="searchable-select-search-form" @submit.stop.prevent="submitSearch">
            <b-form-input
                v-model="search"
                ref="searchInput"
                id="dropdown-search"
                size="sm"
                placeholder="Search"
            ></b-form-input>
        </b-dropdown-form>


        <b-dropdown-item v-if="!filteredOptions.length" disabled>
            <i>There's nothing here. Here's a koala instead ʕ·͡ᴥ·ʔ</i>
        </b-dropdown-item>

        <b-dropdown-item v-for="(option, index) in filteredOptions" :key="option.value" :active="index === selectedIndex" @click="onClickingDropDownItem(index)">
            {{ option.text }}
        </b-dropdown-item>
    </b-dropdown>
</template>

<script>
export default {
    name: "SearchableSelect",
    props: {
        value: {
            required: false,
        },
        options: {
            type: Array,
            required: true,
            default: () => [],
            note: 'Options of dropdown. An array of options with id and name',
        },
        placeholder: {
            type: String,
            required: false,
            default: 'Please select an option',
            note: 'Placeholder of dropdown'
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false,
            note: 'Disable the dropdown'
        },
        maxHeight: {
            type: String,
            required: false,
            default: '35vh',
            note: 'The max-height of the drop-down panel'
        }
    },
    data() {
        return {
            search: '',
            displayValue: '',
            selectedIndex: -1,
        }
    },
    created() {
        let index = this.filteredOptions.findIndex(item => item.value === this.value);
        if (index >= 0) this.displayValue = this.filteredOptions[index].text;
    },
    mounted() {
        this.$refs.searchInput.$el.addEventListener('keydown', this.onKeyDown);
    },
    beforeDestroy() {
        this.$refs.searchInput.$el.removeEventListener('keydown', this.onKeyDown);
    },
    methods: {
        onKeyDown(e) {
            if ([38, 40].includes(e.keyCode)) { // 38 is up, 40 is down, 13 is return
                e.preventDefault();
                this.iterateOptionsByKey(e.keyCode);
            } else if (e.keyCode !== 13) // when is anything but arrow up, down or return, we return highlighted option
                this.setSelectedIndex(-1);
        },
        iterateOptionsByKey(keyCode) { // We hijack arrow key up and down to highlight the options
            if (this.filteredOptions.length <= 0)
                return;

            if (keyCode === 38)
                this.setSelectedIndex(this.selectedIndex <= 0 ? this.filteredOptions.length - 1 : this.selectedIndex - 1);
            else if (keyCode === 40)
                this.setSelectedIndex(this.selectedIndex >= this.filteredOptions.length - 1 ? 0 : this.selectedIndex + 1);
        },
        setSelectedIndex(index) {
            this.selectedIndex = index;
        },
        onDropDownShown() {
            this.$nextTick(() => {
                this.$refs.searchInput.focus();
            })
        },
        submitSearch() { // Hitting [Enter] in the search box, we select the highlighted option
            if (this.selectedIndex < 0) return;

            this.$emit('input', this.filteredOptions[this.selectedIndex].value);
            this.setSelectedIndex(-1);
            this.search = '';
            this.$refs.dropdownButton.hide();
        },
        onClickingDropDownItem(index) {
            this.search = '';
            this.$emit('input', this.filteredOptions[index].value)
        }
    },
    computed: {
        filteredOptions() {
            let filtered = this.options.filter(item => item.text.toLowerCase().includes(this.search.toLowerCase()) || !this.search);
            if (filtered.length && this.search) this.setSelectedIndex(0);
            return filtered;
        },
        cssProps() {
            return {
                '--drop-down-panel-max-height': this.maxHeight,
            }
        }
    },
    watch: {
        value(val) {
            let index = this.filteredOptions.findIndex(item => item.value === val);
            if (index >= 0) this.displayValue = this.filteredOptions[index].text;
        }
    }
}
</script>

<style>
    .searchable-select, .searchable-select > button {
        padding: 0 !important;
    }
    .searchable-select > button > input {
        padding: 0.375rem 0.75rem;
        display: block;
        width: 100%;
        height: 100%;
        cursor: pointer;

        font-size: 1rem !important;
        font-weight: 400;
        line-height: 1.5;
        border: none;
    }
    .searchable-select > ul {
        max-height: var(--drop-down-panel-max-height);
        overflow-y: scroll;

        display: none;
        padding-left: inherit;
        margin: inherit;
        list-style: inherit;
    }
    .searchable-select > button > input:focus {
        border: none;
        outline: none;
    }
    .searchable-select > button:disabled {
        border: none;
        outline: none;
    }
    .searchable-select-search-form > form {
        padding: 10px;
    }
    li.searchable-select-search-form {
        position: sticky;
        top: -0.5rem;
        left: 0;
        width: 100%;
        background: white;
        border-bottom: 1px solid #c5c5c5;
    }
</style>