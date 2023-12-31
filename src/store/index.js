import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import {getWindowContext, VARS} from '@/utils/utils.mjs';
import http from '@/utils/http';

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex)

const state = {
    pageTitle: VARS.pageTitle,
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
        dateEffective: null,
    },

    standaloneMode: false,

    globalModal: {
        open: false,
        title: 'Default title',
        body: 'This is a global modal that will deliver notification on global level.',
        busy: false,
        progress: -1,
        persistent: true,
        isError: false,
        maxWidth: 500,
        buttons: [], // [{color, action, text}, ...] || 'spacer'
    },
};

const getters = {
    pageTitle: state => state.pageTitle,
    customerId: state => state.customerId,
    commRegId: state => state.commRegId,
    salesRecordId: state => state.salesRecordId,
    userId: state => state.userId,
    userRole: state => state.userRole,
    isSalesRep: state => state.isSalesRep,
    standaloneMode : state => state.standaloneMode,
    extraParams: state => state.extraParams,

    globalModal: state => state.globalModal,
    nextPageToProceed: state => {
        if (!state.isSalesRep && state.extraParams.sendEmail)
            return state.extraParams.suspects ? 'Finalisation Page' : 'Create Multi-Site Quote: Update Suspects';
        else if (!state.isSalesRep) return 'Service Creation Page';
        else if (state.isSalesRep) return 'Finalisation Page';
        else return null;
    }
};

const mutations = {
    closeGlobalModal: state => {
        state.globalModal.title = '';
        state.globalModal.body = '';
        state.globalModal.busy = false;
        state.globalModal.open = false;
        state.globalModal.progress = -1;
        state.globalModal.persistent = false;
        state.globalModal.isError = false;
        state.globalModal.maxWidth = 500;
        state.globalModal.buttons.splice(0);
    },
    displayErrorGlobalModal: (state, {title, message, buttons = [], maxWidth = 500}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
        state.globalModal.maxWidth = maxWidth;
        state.globalModal.buttons = [...buttons];
    },
    displayBusyGlobalModal: (state, {title, message, open = true, progress = -1, buttons = [], maxWidth = 500}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.progress = progress;
        state.globalModal.persistent = true;
        state.globalModal.isError = false;
        state.globalModal.maxWidth = maxWidth;
        state.globalModal.buttons = [...buttons];
    },
    displayInfoGlobalModal: (state, {title, message, persistent = false, buttons = [], maxWidth = 500}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = persistent;
        state.globalModal.isError = false;
        state.globalModal.maxWidth = maxWidth;
        state.globalModal.buttons = [...buttons];
    },

    setPageTitle: (state, title) => {
        state.pageTitle = title || VARS.pageTitle;

        if (parent['setMPTheme'])
            parent.setMPTheme(title + ' - NetSuite Australia (Mail Plus Pty Ltd)')
    }
};

const actions = {
    addShortcut : () => {
        getWindowContext().window['addShortcut']();
    },
    init : async context => {
        if (!getWindowContext().location.href.includes(baseURL)) return;

        await _readUrlParams(context);

        await Promise.allSettled([
            context.dispatch('misc/init'),
            context.dispatch('customer/init'),
            context.dispatch('comm-reg/init'),
        ]);

        await context.dispatch('service-changes/init');
    },
    handleException : (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
    goToNextPage: async context => {
        context.commit('displayBusyGlobalModal', {title: 'Redirecting', message: `Moving to <b>${context.getters['nextPageToProceed']}</b>. Please wait...`});

        if (!context.state.isSalesRep && context.state.extraParams.sendEmail)
            getWindowContext().location.href = context.state.extraParams.suspects ?
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
            getWindowContext().location.href = baseURL + await http.get('getScriptUrl', {
                scriptId: 'customscript_sl_service_change',
                deploymentId: 'customdeploy_sl_service_change',
                params: {
                    custid: context.state.customerId,
                }
            });
        else if (context.state.isSalesRep)
            getWindowContext().location.href = baseURL + await http.get('getScriptUrl', {
                scriptId: 'customscript_sl_finalise_page_tn_v2_vue',
                deploymentId: 'customdeploy_sl_finalise_page_tn_v2_vue',
                params: {
                    recid: context.state.customerId,
                    sales_record_id: context.state.salesRecordId
                }
            });
    }
};

async function _readUrlParams(context) {
    let currentUrl = getWindowContext().location.href;
    let [, queryString] = currentUrl.split('?');

    const params = new Proxy(new URLSearchParams(`?${queryString}`), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    context.state.standaloneMode = !!params['standalone'];

    let weirdParams = params['custparam_params'] ? JSON.parse(params['custparam_params']) : {};
    let salesRep = params['salesrep'] || weirdParams['salesrep'] === 'T';

    let paramCustomerId = (!params['salesrep'] ? weirdParams['custid'] : params['custid']) || null;
    let paramSalesRecordId = (!params['salesrep'] ? weirdParams['salesrecordid'] : params['salesrecordid']) || null;
    let paramCommRegId = (!params['salesrep'] ? weirdParams['commreg'] : params['commreg']) || null;

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
        context.state.extraParams.suspects = (!params['salesrep'] ? weirdParams['suspects'] === 'T' : params['suspects'] === 'T') || null;
        context.state.extraParams.sendEmail = (!params['sendemail'] ? weirdParams['sendemail'] === 'T' : params['sendemail'] === 'T') || false;
        context.state.extraParams.closedWon = (!params['salesrep'] ? weirdParams['closedwon'] === 'T' : params['closedwon'] === 'T') || false;
        context.state.extraParams.oppWithValue = (!params['salesrep'] ? weirdParams['oppwithvalue'] === 'T' : params['oppwithvalue'] === 'T') || false;
        context.state.extraParams.dateEffective = weirdParams['date'] || null;
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