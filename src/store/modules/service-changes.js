import http from "@/utils/http";

const state = {
    serviceChanges: [],
    services: [],
    scheduledChanges: [],
    busy: true,
    modal: {
        defaults: {
            internalid: null,
            service_internalid: null,
            custrecord_servicechg_date_effective: '', // Effective Date
            custrecord_servicechg_type: '', // Sales Type
            custrecord_service: '', // Service Type ID
            custrecord_service_description: '', // Description
            custrecord_service_price: 0, // Price/Old Price
            custrecord_servicechg_new_price: 0, // New Price
            custrecord_servicechg_new_freq: '', // New Frequency

            custrecord_service_day_adhoc: false,
            custrecord_service_day_daily: false,
            custrecord_service_day_mon: false,
            custrecord_service_day_tue: false,
            custrecord_service_day_wed: false,
            custrecord_service_day_thu: false,
            custrecord_service_day_fri: false,
        },
        form: {},
        open: false,
        busy: false,
        minEffectiveDate: null,
        globalEffectiveDate: null,
        oldGlobalEffectiveDate: null,
    }
};

const getters = {
    services : state => state.services,
    serviceChanges : state => state.serviceChanges,
    modal : state => state.modal,
    busy : state => state.busy,
    hasScheduledChanges : state => !!state.scheduledChanges.length,
    tableData : state => [...state.serviceChanges, ...state.services.map(item => ({...item, isService: true}))]
};

const mutations = {
    openModal : (state, open = true) => { state.modal.open = open; },
    resetForm : state => {
        state.modal.form = {...state.modal.defaults};
    },
};

const actions = {
    init : async context => {
        if (!context.rootGetters['customerId']) return;

        context.state.busy = true;

        await _getServiceChangesAndServices(context);

        _initGlobalEffectiveDate(context);

        await _getExistingScheduledChanges(context);

        context.commit('resetForm');

        context.state.busy = false;
    },
    openFormModal : (context, index) => {
        if (index >= 0) {
            let item = {...context.getters['tableData'][index]};
            let tempArr = ['mon', 'tue', 'wed', 'thu', 'fri'];

            for (let fieldId in context.state.modal.defaults)
                context.state.modal.form[fieldId] = item[fieldId];

            context.state.modal.form.internalid = item.isService ? null : item.id;
            context.state.modal.form.service_internalid = item.isService ? item.internalid : null;

            context.state.modal.form.custrecord_servicechg_date_effective = item.isService ?
                context.state.modal.globalEffectiveDate :
                _parseDateStringIntoObject(item.custrecord_servicechg_date_effective);

            context.state.modal.form.custrecord_service_day_daily =
                tempArr.reduce((acc, val) => acc && context.state.modal.form['custrecord_service_day_' + val], true);
        } else context.commit('resetForm');

        let tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);

        context.state.modal.minEffectiveDate = tmr;
        context.state.modal.open = true;
    },
    updateFrequencyCheckboxes : (context, lastClick) => {
        let form = context.state.modal.form;
        let tempArr = ['mon', 'tue', 'wed', 'thu', 'fri', 'daily', 'adhoc'];

        if (lastClick === 'adhoc' && form['custrecord_service_day_adhoc'])
            tempArr.filter(item => item !== 'adhoc').forEach(item => { form['custrecord_service_day_' + item] = false;})
        else {
            form.custrecord_service_day_adhoc = false;

            if (lastClick === 'daily' && form['custrecord_service_day_daily'])
                tempArr.filter(item => item !== 'adhoc').forEach(item => { form['custrecord_service_day_' + item] = true;})
            else {
                form['custrecord_service_day_daily'] = tempArr.filter(item => !['daily', 'adhoc'].includes(item))
                    .reduce((acc, val) => acc && context.state.modal.form['custrecord_service_day_' + val], true);
            }
        }
    },
    applyGlobalEffectiveDate : async context => {
        context.state.modal.busy = true;
        context.state.modal.defaults.custrecord_servicechg_date_effective = context.state.modal.globalEffectiveDate;

        try {
            _setTimeForDateObject(context.state.modal.globalEffectiveDate);

            await http.post('updateEffectiveDateForAll', {
                commRegId: context.rootGetters['commRegId'],
                effectiveDate: context.state.modal.globalEffectiveDate
            });

            await _getServiceChangesAndServices(context);
        } catch (e) { console.error(e); }

        context.state.modal.busy = false;
    },
    makeGlobalEffectiveDateDefault : context => {
        context.state.modal.defaults.custrecord_servicechg_date_effective = context.state.modal.globalEffectiveDate;
        _getExistingScheduledChanges(context).then();
    },
    delete : async (context, serviceChangeId) => {
        context.state.modal.busy = true;
        try {
            await http.post('deleteServiceChangeRecord', {serviceChangeId});

            await _getServiceChangesAndServices(context);
        } catch (e) { console.error(e); }
        context.state.modal.busy = false;
    },
    saveServiceChange : async context => {
        context.state.modal.busy = true;
        try {
            _setTimeForDateObject(context.state.modal.form.custrecord_servicechg_date_effective);

            context.state.modal.form.custrecord_servicechg_type_id = context.rootGetters['misc/salesTypes']
                .filter(item => item.text === context.state.modal.form.custrecord_servicechg_type)[0].value;

            context.state.modal.form.custrecord_service_text = context.rootGetters['misc/serviceTypes']
                .filter(item => item.value === context.state.modal.form.custrecord_service)[0].text;

            await http.post('saveServiceChangeRecord', {
                customerId: context.rootGetters['customerId'],
                commRegId: context.rootGetters['commRegId'],
                data: context.state.modal.form,

                salesRecordId: context.rootGetters['salesRecordId'],
                extraParams: {},
            });

            await _getServiceChangesAndServices(context);

            context.dispatch('customer/init', null, {root: true}).then();

            context.state.modal.open = false;
        } catch (e) { console.error(e); }
        context.state.modal.busy = false;
    }
};

// Retrieve service change records as well as service records
async function _getServiceChangesAndServices(context) {
    try {
        context.state.services = await http.get('getAssignedServices', {
            customerId: context.rootGetters['customerId']
        });

        if (context.rootGetters['commRegId']) {
            context.state.serviceChanges = await http.get('getServiceChanges', {
                commRegId: context.rootGetters['commRegId']
            });
        }
    } catch (e) { console.error(e); }
}

// Retrieve existing scheduled changes. If this result in a non-0 array, that means there are already scheduled changes.
async function _getExistingScheduledChanges(context) {
    if (Object.prototype.toString.call(context.state.modal.globalEffectiveDate) !== '[object Date]') return;

    try {
        _setTimeForDateObject(context.state.modal.globalEffectiveDate);

        let dt = context.state.modal.globalEffectiveDate.toISOString().split(/[: T-]/).map(parseFloat);
        let dateEffective = dt[2] + '/' + dt[1] + '/' + dt[0];

        context.state.scheduledChanges = await http.get('getScheduledServiceChanges', {
            customerId: context.rootGetters['customerId'],
            commRegId: context.rootGetters['commRegId'],
            dateEffective
        });
    } catch (e) { console.error(e); }
}

// Set the initial value for global effective date based on data retrieved from NetSuite
function _initGlobalEffectiveDate(context) {
    if (context.rootGetters['commRegId'])
        context.state.modal.globalEffectiveDate = _parseIsoDatetime(context.rootGetters['comm-reg/details'].custrecord_comm_date, true)

    let tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    tmr.setHours(0, 0, 0, 0);

    context.state.modal.minEffectiveDate = tmr;

    if (!context.state.modal.globalEffectiveDate || context.state.modal.globalEffectiveDate < tmr)
        context.state.modal.globalEffectiveDate = tmr;

    context.state.modal.defaults.custrecord_servicechg_date_effective = context.state.modal.globalEffectiveDate;
    context.state.modal.oldGlobalEffectiveDate = context.state.modal.globalEffectiveDate;
}

// Assuming that the input string is DD/MM/YYYY
// Converting it to ISO format (YYYY-MM-DD)
function _parseDateStringIntoObject(dateString) {
    // If dateString is not a string then we return itself without any modification
    return !!dateString && Object.prototype.toString.call(dateString) === '[object String]' ?
        new Date(dateString.split('/').reverse().join('-')) : dateString;
}

function _setTimeForDateObject(dateObj) {
    let todayDate = new Date();

    // We offset the time by an amount according to the current UTC offset.
    // For example, if the current UTC offfset is +10 hours then we set the current time to be 10 AM
    if (Object.prototype.toString.call(dateObj) === '[object Date]') dateObj.setHours(todayDate.getTimezoneOffset()/-60, 0 , 0);

    return dateObj;
}

function _parseIsoDatetime(dateString, dateOnly = false) {
    let tmp = dateString.split(/[: T-]/).map(parseFloat);
    return dateOnly ?
        new Date(tmp[0], tmp[1] - 1, tmp[2]) :
        new Date(tmp[0], tmp[1] - 1, tmp[2], tmp[3] || 0, tmp[4] || 0, tmp[5] || 0, 0);
}

export default {
    state,
    getters,
    actions,
    mutations
};