import http from "@/utils/http";

const state = {
    details: {
        internalid: null,
        custrecord_date_entry: new Date(),
        custrecord_comm_date: '',
        custrecord_comm_date_signup: '',
        custrecord_sale_type: '',
        custrecord_in_out: '',
        custrecord_scand_form: '',
        custrecord_customer: null,
        custrecord_salesrep: null,
        custrecord_franchisee: null,
        custrecord_trial_status: '',
        custrecord_commreg_sales_record: null,
        custrecord_wkly_svcs: '5',
        custrecord_state: '',
        custrecord_finalised_by: '',
        custrecord_finalised_on: '',
    },
    texts: {},
};

const getters = {
    details : state => state.details,
    texts : state => state.texts,
};

const mutations = {};

const actions = {
    init : async context => {
        if (!context.rootGetters['commRegId']) return;

        try {
            let fieldIds = [];
            for (let fieldId in context.state.details) fieldIds.push(fieldId);

            let data = await http.get('getCommencementRegister', {
                commRegId: context.rootGetters['commRegId'],
                fieldIds,
            });

            for (let fieldId in context.state.details) {
                context.state.details[fieldId] = data[fieldId];
                context.state.texts[fieldId] = data[fieldId + '_text'];
            }
        } catch (e) {console.error(e);}
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};