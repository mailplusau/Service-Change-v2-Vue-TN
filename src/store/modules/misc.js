import http from "@/utils/http";

const state = {
    salesTypes: [],
    serviceTypes: [],
};

const getters = {
    salesTypes : state => state.salesTypes,
    serviceTypes : state => state.serviceTypes,
};

const mutations = {};

const actions = {
    init : context => {
        if (!context.rootGetters['customerId']) return;

        Promise.allSettled([
            context.dispatch('getSalesTypes'),
            context.dispatch('getServiceTypes'),
        ]).then();
    },
    getSalesTypes : async (context) => {
        await _fetchDataForHtmlSelect(context, context.state.salesTypes,
            null, 'customlist_sale_type', 'internalId', 'name');
    },
    getServiceTypes : async context => {
        let data = await http.get('getServiceTypes');

        context.state.serviceTypes = [...data];
    }
};

async function _fetchDataForHtmlSelect(context, stateObject, id, type, valueColumnName, textColumnName) {
    stateObject.splice(0);

    let data = await http.get('getSelectOptions', {
        id, type, valueColumnName, textColumnName
    });

    data.forEach(item => { stateObject.push(item); });
}

export default {
    state,
    getters,
    actions,
    mutations
};