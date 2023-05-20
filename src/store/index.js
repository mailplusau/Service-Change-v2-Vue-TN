import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import http from "@/utils/http";

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex)

const state = {
    customerId: null,
    salesRecordId: null,
    commRegId: null,
    userId: null,
    userRole: null,

    globalModal: {
        open: false,
        title: '',
        body: '',
        busy: false,
        persistent: true,
        isError: false
    },
};

const getters = {
    customerId: state => state.customerId,
    commRegId: state => state.commRegId,
    salesRecordId: state => state.salesRecordId,
    userId: state => state.userId,
    userRole: state => state.userRole,

    globalModal: state => state.globalModal,
};

const mutations = {
    setGlobalModal: (state, open = true) => {
        state.globalModal.open = open;
    },
    displayErrorGlobalModal: (state, {title, message}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
    },
    displayBusyGlobalModal: (state, {title, message, open}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.persistent = false;
        state.globalModal.isError = false;
    },
    displayInfoGlobalModal: (state, {title, message}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.persistent = false;
        state.globalModal.isError = false;
    }
};

const actions = {
    init: async context => {
        await _readAndVerifyUrlParams(context);
    },
    handleException: (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
    goToNetSuiteCustomerPage: context => {
        window.location.href = baseURL + '/app/common/entity/custjob.nl?id=' + context.state.customerId;
    },

};

async function _readAndVerifyUrlParams(context) {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    let weirdParams = params['custparam_params'] ? JSON.parse(params['custparam_params']) : {};
    let salesRep = params['salesrep'];

    let paramCustomerId = (salesRep ? weirdParams['custid'] : params['custid']) || null;
    let paramSalesRecordId = (salesRep ? weirdParams['salesrecordid'] : params['salesrecordid']) || null;
    let paramCommRegId = (salesRep ? weirdParams['commreg'] : params['commreg']) || null;

    try {
        if (!paramCustomerId || !paramSalesRecordId || !paramCommRegId) {
            context.commit('displayErrorGlobalModal', {
                title: 'Missing parameters',
                message: 'Please check that the url contains all necessary parameters.'
            });
            return;
        }

        let {customerId, salesRecordId, commRegId, userId, userRole} = await http.post('verifyParameters', {
            customerId: parseInt(paramCustomerId), salesRecordId: parseInt(paramSalesRecordId), commRegId: parseInt(paramCommRegId)
        });

        context.state.userId = userId;
        context.state.userRole = userRole;
        context.state.commRegId = commRegId;
        context.state.customerId = customerId;
        context.state.salesRecordId = salesRecordId;
    } catch (e) { console.error(e); }
}

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;