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
    isSalesRep: false,

    extraParams: {
        scriptId: null,
        deployId: null,
        sendEmail: false,
        closedWon: false,
        suspects: false,
        oppWithValue: false,
    },

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
    isSalesRep: state => state.isSalesRep,
    extraParams: state => state.extraParams,

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

        context.dispatch('misc/init').then();
        context.dispatch('customer/init').then();
        context.dispatch('comm-reg/init').then();
    },
    handleException: (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
    goToNetSuiteCustomerPage: context => {
        window.location.href = baseURL + '/app/common/entity/custjob.nl?id=' + context.state.customerId;
    },
    goToNextPage: async context => {
        if (!context.state.isSalesRep && context.state.extraParams.sendEmail)
            window.location.href = context.state.extraParams.suspects ?
                baseURL + await http.get('getScriptUrl', {
                    scriptId: 'customscript_sl_send_email_module',
                    deploymentId: 'customdeploy_sl_send_email_module',
                    params: {
                        custid: context.state.customerId,
                        sales_record_id: context.state.salesRecordId,
                        closedwon: context.state.extraParams.closedWon,
                        oppwithvalue: context.state.extraParams.oppWithValue,
                        script_id: 'customscript_sl_finalise_page_tn_v2_vue',
                        script_deploy: 'customdeploy_sl_finalise_page_tn_v2_vue'
                    }
                }) :
                baseURL + await http.get('getScriptUrl', {
                    scriptId: 'customscript_sl_update_multisite',
                    deploymentId: 'customdeploy_sl_update_multisite',
                    params: {
                        suspects: context.state.extraParams.suspects,
                    }
                })
        else if (!context.state.isSalesRep)
            window.location.href = baseURL + await http.get('getScriptUrl', {
                scriptId: 'customscript_sl_service_change',
                deploymentId: 'customdeploy_sl_service_change',
                params: {
                    custid: context.state.customerId,
                }
            });
        else if (context.state.isSalesRep)
            window.location.href = baseURL + await http.get('getScriptUrl', {
                scriptId: 'customscript_sl_finalise_page_tn_v2_vue',
                deploymentId: 'customdeploy_sl_finalise_page_tn_v2_vue',
                params: {
                    recid: context.state.customerId,
                    sales_record_id: context.state.salesRecordId
                }
            });
    }
};

async function _readAndVerifyUrlParams(context) {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    let weirdParams = params['custparam_params'] ? JSON.parse(params['custparam_params']) : {};
    let salesRep = params['salesrep'] && params['salesrep'] === 'T';

    let paramCustomerId = (!salesRep ? weirdParams['custid'] : params['custid']) || null;
    let paramSalesRecordId = (!salesRep ? weirdParams['salesrecordid'] : params['salesrecordid']) || null;
    let paramCommRegId = (!salesRep ? weirdParams['commreg'] : params['commreg']) || null;

    try {
        if (!paramCustomerId) {
            console.log('Missing parameters')
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
        context.state.isSalesRep = !!salesRep;

        context.state.extraParams.scriptId = (!params['salesrep'] ? weirdParams['customid'] : params['customid']) || null;
        context.state.extraParams.deployId = (!params['salesrep'] ? weirdParams['customdeploy'] : params['customdeploy']) || null;
        context.state.extraParams.sendEmail = weirdParams['sendemail'] && weirdParams['sendemail'] === 'T';
        context.state.extraParams.suspects = (!params['salesrep'] ? weirdParams['suspects'] : params['suspects']) || null;
        context.state.extraParams.closedWon = (!params['salesrep'] ? weirdParams['closedwon'] : params['closedwon']) || false;
        context.state.extraParams.oppWithValue = (!params['salesrep'] ? weirdParams['oppwithvalue'] : params['oppwithvalue']) || false;
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