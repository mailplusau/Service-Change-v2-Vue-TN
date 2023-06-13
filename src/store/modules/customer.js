import http from "@/utils/http";

const state = {
    data: [],
    details: {
        internalid: null,
        entityid: '',
        companyname: '',
        vatregnumber: '',
        partner: '',
        entitystatus: '',

        custentity_cust_monthly_service_value: 0,
        custentity_monthly_extra_service_revenue: 0,
        custentity_monthly_reduc_service_revenue: 0,
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
        if (!context.rootGetters['customerId']) return;

        try {
            let fieldIds = [];
            for (let fieldId in context.state.details) fieldIds.push(fieldId);

            let data = await http.get('getCustomerDetails', {
                customerId: context.rootGetters['customerId'],
                fieldIds,
            });

            for (let fieldId in context.state.details) {
                context.state.details[fieldId] = data[fieldId];
                context.state.texts[fieldId] = data[fieldId + '_text'];
            }

            _updateFormTitleAndHeader(context);
        } catch (e) {console.error(e);}
    },
};

function _updateFormTitleAndHeader(context) {
    let title, header;

    header = 'Add / Edit Service : ';

    header += '<a target="_blank" href="/app/common/entity/custjob.nl?id=' + context.rootGetters['customerId'] + '">' + context.state.details.entityid + '</a> ';

    header += context.state.details.companyname;

    title = 'Add / Edit Service : ' + context.state.details.entityid + ' ' + context.state.details.companyname + ' - NetSuite Australia (Mail Plus Pty Ltd)';

    document.querySelector('h1.uir-record-type').innerHTML = header;
    document.title = title;
}

export default {
    state,
    getters,
    actions,
    mutations
};