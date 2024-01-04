/**
 * @author Tim Nguyen
 * @description Service Change Page v2 with Vue 2
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 16/05/2023
 */

import {VARS} from '@/utils/utils.mjs';

// These variables will be injected during upload. These can be changed under 'netsuite' of package.json
let htmlTemplateFilename/**/;
let clientScriptFilename/**/;

const defaultTitle = VARS.pageTitle;

let NS_MODULES = {};


// eslint-disable-next-line no-undef
define(['N/ui/serverWidget', 'N/render', 'N/search', 'N/file', 'N/log', 'N/record', 'N/email', 'N/runtime', 'N/https', 'N/task', 'N/format', 'N/url'],
    (serverWidget, render, search, file, log, record, email, runtime, https, task, format, url) => {
        NS_MODULES = {serverWidget, render, search, file, log, record, email, runtime, https, task, format, url};

        const onRequest = ({request, response}) => {
            if (request.method === "GET") {

                if (!_.handleGETRequests(request.parameters['requestData'], response)){
                    // Render the page using either inline form or standalone page
                    if (request.parameters['standalone']) _.getStandalonePage(response)
                    else _.getInlineForm(response)
                }

            } else if (request.method === "POST") { // Request method should be POST (?)
                _.handlePOSTRequests(JSON.parse(request.body), response);
                // _writeResponseJson(response, {test: 'test response from post', params: request.parameters, body: request.body});
            } else {
                log.debug({
                    title: "request method type",
                    details: `method : ${request.method}`,
                });
            }

        }

        const _ = {
            // Render the htmlTemplateFile as a standalone page without any of NetSuite's baggage. However, this also means no
            // NetSuite module will be exposed to the Vue app. Thus, an api approach using Axios and structuring this Suitelet as
            // a http request handler will be necessary. For reference:
            // https://medium.com/@vladimir.aca/how-to-vuetify-your-suitelet-on-netsuite-part-2-axios-http-3e8e731ac07c
            getStandalonePage(response) {
                let {file} = NS_MODULES;

                // Get the id and url of our html template file
                const htmlFileData = this.getHtmlTemplate(htmlTemplateFilename);

                // Load the  html file and store it in htmlFile
                const htmlFile = file.load({id: htmlFileData[htmlTemplateFilename].id});

                response.write(htmlFile['getContents']());
            },
            // Render the page within a form element of NetSuite. This can cause conflict with NetSuite's stylesheets.
            getInlineForm(response) {
                let {serverWidget} = NS_MODULES;

                // Create a NetSuite form
                let form = serverWidget['createForm']({ title: defaultTitle });

                // Retrieve client script ID using its file name.
                form.clientScriptFileId = this.getHtmlTemplate(clientScriptFilename)[clientScriptFilename].id;

                response['writePage'](form);
            },
            // Search for the ID and URL of a given file name inside the NetSuite file cabinet
            getHtmlTemplate(htmlPageName) {
                let {search} = NS_MODULES;

                const htmlPageData = {};

                search.create({
                    type: 'file',
                    filters: ['name', 'is', htmlPageName],
                    columns: ['name', 'url']
                }).run().each(resultSet => {
                    htmlPageData[resultSet.getValue({ name: 'name' })] = {
                        url: resultSet.getValue({ name: 'url' }),
                        id: resultSet.id
                    };
                    return true;
                });

                return htmlPageData;
            },
            handleGETRequests(request, response) {
                if (!request) return false;

                let {log} = NS_MODULES;

                try {
                    let {operation, requestParams} = JSON.parse(request);

                    if (!operation) throw 'No operation specified.';

                    if (operation === 'getIframeContents') this.getIframeContents(response);
                    else if (!getOperations[operation]) throw `GET operation [${operation}] is not supported.`;
                    else getOperations[operation](response, requestParams);
                } catch (e) {
                    log.debug({title: "_handleGETRequests", details: `error: ${e}`});
                    _writeResponseJson(response, {error: `${e}`})
                }

                return true;
            },
            handlePOSTRequests({operation, requestParams}, response) {
                let {log} = NS_MODULES;

                try {
                    if (!operation) throw 'No operation specified.';

                    // _writeResponseJson(response, {source: '_handlePOSTRequests', operation, requestParams});
                    postOperations[operation](response, requestParams);
                } catch (e) {
                    log.debug({title: "_handlePOSTRequests", details: `error: ${e}`});
                    _writeResponseJson(response, {error: `${e}`})
                }
            },
            getIframeContents(response) {
                const htmlFileData = this.getHtmlTemplate(htmlTemplateFilename);
                const htmlFile = NS_MODULES.file.load({ id: htmlFileData[htmlTemplateFilename].id });

                _writeResponseJson(response, htmlFile['getContents']());
            }
        }

        return {onRequest};
    });

function _writeResponseJson(response, body) {
    response.write({ output: JSON.stringify(body) });
    response.addHeader({
        name: 'Content-Type',
        value: 'application/json; charset=utf-8'
    });
}

const getOperations = {
    'getSelectOptions' : function (response, {id, type, valueColumnName, textColumnName}) {
        let {search} = NS_MODULES;
        let data = [];

        search.create({
            id, type,
            columns: [{name: valueColumnName}, {name: textColumnName}]
        }).run().each(result => {
            data.push({value: result.getValue(valueColumnName), text: result.getValue(textColumnName)});
            return true;
        });

        _writeResponseJson(response, data);
    },
    'getScheduledServiceChanges' : function (response, {customerId, commRegId, dateEffective}) {
        let {search, format} = NS_MODULES;
        let data = [];

        let serviceChangeSearch = search.load({id: 'customsearch_smc_service_chg', type: 'customrecord_servicechg'});

        serviceChangeSearch.filters.push(search.createFilter({
            name: 'custrecord_servicechg_date_effective',
            operator: search.Operator.ON,
            values: format.format({value: new Date(dateEffective), type: format.Type.DATE})
        }));
        serviceChangeSearch.filters.push(search.createFilter({
            name: 'custrecord_servicechg_status',
            operator: search.Operator.IS,
            values: 1
        }));
        serviceChangeSearch.filters.push(search.createFilter({
            name: 'custrecord_service_customer',
            operator: search.Operator.IS,
            join: 'CUSTRECORD_SERVICECHG_SERVICE',
            values: customerId
        }));

        if (commRegId)
            serviceChangeSearch.filters.push(search.createFilter({
                name: 'custrecord_servicechg_comm_reg',
                operator: search.Operator.NONEOF,
                values: commRegId
            }));

        serviceChangeSearch.run().each(item => {
            let tmp = {};

            for (let column of item.columns) {
                tmp[column.name + '_text'] = item.getText(column);
                tmp[column.name] = item.getValue(column);
            }

            data.push(tmp);

            return true;
        })

        _writeResponseJson(response, data);
    },
    'getServiceTypes' : function (response) {
        let {search} = NS_MODULES;
        let data = [];

        let searchResult = search.create({
            type: 'customrecord_service_type',
            filters: [
                {name: 'custrecord_service_type_category', operator: 'anyof', values: [1]},
            ],
            columns: [
                {name: 'internalid'},
                {name: 'custrecord_service_type_ns_item_array'},
                {name: 'name'}
            ]
        }).run();

        searchResult.each(item => {
            data.push({value: item.getValue('internalid'), text: item.getValue('name')})

            return true;
        });

        _writeResponseJson(response, data);
    },
    'getServiceChanges' : function (response, {commRegId}) {
        _writeResponseJson(response, sharedFunctions.getServiceChanges(commRegId));
    },
    'getAssignedServices' : function (response, {customerId}) {
        _writeResponseJson(response, sharedFunctions.getAssignedServices(customerId));
    },
    'getCustomerDetails': function (response, {customerId, fieldIds}) {
        if (!customerId) return _writeResponseJson(response, {error: `Invalid Customer ID: ${customerId}`});

        _writeResponseJson(response, sharedFunctions.getCustomerData(customerId, fieldIds));
    },
    'getCommencementRegister' : function (response, {commRegId, fieldIds}) {
        let {record} = NS_MODULES;
        let data = {};

        let commRegRecord = record.load({
            type: 'customrecord_commencement_register',
            id: commRegId,
        });

        for (let fieldId of fieldIds) {
            data[fieldId] = commRegRecord.getValue({fieldId});
            data[fieldId + '_text'] = commRegRecord.getText({fieldId});
        }

        _writeResponseJson(response, data);
    },
    'getScriptUrl' : function (response, {scriptId, deploymentId, params, returnExternalUrl = false}) {
        let {url} = NS_MODULES;

        _writeResponseJson(response, url.resolveScript({scriptId, deploymentId, params, returnExternalUrl}));
    },
}

const postOperations = {
    'verifyParameters' : function (response, {customerId, salesRecordId, commRegId}) {
        let {runtime} = NS_MODULES;

        _writeResponseJson(response, {
            customerId: parseInt(customerId),
            salesRecordId: parseInt(salesRecordId),
            commRegId: parseInt(commRegId),
            userId: runtime['getCurrentUser']().id,
            userRole: runtime['getCurrentUser']().role,
        });
    },
    'deleteServiceChangeRecord' : function (response, {serviceChangeId}) {
        let {record} = NS_MODULES;
        let serviceChangeRecord = record.load({type: 'customrecord_servicechg', id: serviceChangeId});
        let serviceId = serviceChangeRecord.getValue({fieldId: 'custrecord_servicechg_service'});
        let serviceRecord = record.load({type: 'customrecord_service', id: serviceId});

        // Retrieve relevant info before deleting
        let commRegId = serviceChangeRecord.getValue({fieldId: 'custrecord_servicechg_comm_reg'});
        let commRegRecord = record.load({type: 'customrecord_commencement_register', id: commRegId});
        let customerId = commRegRecord.getValue({fieldId: 'custrecord_customer'});
        let customerRecord = record.load({type: 'customer', id: customerId});

        record.delete({type: 'customrecord_servicechg', id: serviceChangeId});

        // Only delete the associated service record if it is inactive
        // serviceRecord.setValue({fieldId: 'isinactive', value: true});
        if (serviceRecord.getValue({fieldId: 'isinactive'})) record.delete({type: 'customrecord_service', id: serviceId});

        // TODO: recalculate monthly service rates after deletion
        let {monthlyServiceRate, monthlyExtraServiceRate, monthlyReducedServiceRate} = _calculateServiceRates(customerId, commRegId);

        customerRecord.setValue({fieldId: 'custentity_cust_monthly_service_value', value: monthlyServiceRate});
        customerRecord.setValue({fieldId: 'custentity_monthly_extra_service_revenue', value: monthlyExtraServiceRate});
        customerRecord.setValue({fieldId: 'custentity_monthly_reduc_service_revenue', value: monthlyReducedServiceRate});
        customerRecord.save({ignoreMandatoryFields: true});

        _writeResponseJson(response, {serviceChangeId, serviceId});
    },
    'updateEffectiveDateForAll' : function (response, {commRegId, effectiveDate}) {
        let serviceChanges = sharedFunctions.getServiceChanges(commRegId);

        _updateDateEffectiveForAll(commRegId, serviceChanges, new Date(effectiveDate));

        _writeResponseJson(response, 'Effective Date Updated');
    },
    'saveServiceChangeRecord' : function (response, {customerId, salesRecordId = null, data, commRegId, extraParams = {}}) {
        let {expSendEmail, expClosedWon} = extraParams;
        let {record, runtime} = NS_MODULES;
        let userId = runtime['getCurrentUser']().id;
        let userRole = runtime['getCurrentUser']().role;
        let customerRecord = record.load({type: record.Type.CUSTOMER, id: customerId});
        let partnerId = parseInt(customerRecord.getValue({fieldId: 'partner'}));
        let serviceRecord;
        let freqTerms = ['mon', 'tue', 'wed', 'thu', 'fri', 'adhoc'];
        let serviceChanges = sharedFunctions.getServiceChanges(commRegId);

        // Create/edit service change record
        let serviceChangeRecord = data.internalid ?
            record.load({type: 'customrecord_servicechg', id: data.internalid, isDynamic: true}) :
            record.create({type: 'customrecord_servicechg', isDynamic: true});

        if (!data.internalid && !commRegId) // if this is brand new service change and no commRegId provided, we create a new one
            commRegId = _createCommencementRegister(customerId, salesRecordId, data, extraParams);
        else if (data.internalid) // if existing service change record, load commRegId from service change record and disregard the one from parameters
            commRegId = serviceChangeRecord.getValue({fieldId: 'custrecord_servicechg_comm_reg'});

        let oldFreq = serviceChangeRecord.getValue({fieldId: 'custrecord_servicechg_old_freq'});
        let newFreq = serviceChangeRecord.getValue({fieldId: 'custrecord_servicechg_new_freq'});

        let freqArray = ['mon', 'tue', 'wed', 'thu', 'fri', 'adhoc']
            .map((item, index) => data['custrecord_service_day_' + item] ? (index + 1) : 0)
            .filter(item => item);

        serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_date_effective', value: new Date(data.custrecord_servicechg_date_effective)});
        serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_status', value: expSendEmail && !expClosedWon ? 4 : 1}); // Quote (4) | Scheduled (1)
        serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_new_price', value: data.custrecord_servicechg_new_price});
        serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_old_price', value: data.custrecord_service_price});
        serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_new_freq', value: freqArray});
        serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_old_freq', value: oldFreq && oldFreq.length ? oldFreq : newFreq});
        serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_type', value: data.custrecord_servicechg_type});

        if (!data.service_internalid && !data.internalid) // This is the first service change record for a new service, set the default as Yes (1)
            serviceChangeRecord.setValue({fieldId: 'custrecord_default_servicechg_record', value: 1});

        if (commRegId) serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_comm_reg', value: commRegId});

        // TODO: if commRegId is null then this status is 4 (Quoted)
        // if (data.custrecord_servicechg_type === 'Change of Entity') // If this is Change of Entity, status is Active
        //     serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_status', value: 2});

        if (userRole !== 1000) {
            serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_created', value: userId});
            serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_old_zee', value: partnerId});
        } else
            serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_old_zee', value: userId});

        // Create/edit service record
        if (data.internalid) // Existing service change record, we load the associated service
            serviceRecord = record.load({type: 'customrecord_service', id: serviceChangeRecord.getValue({fieldId: 'custrecord_servicechg_service'}), isDynamic: true});
        else if (data.service_internalid) // Existing service, we load it from the provided internal id
            serviceRecord = record.load({type: 'customrecord_service', id: data.service_internalid, isDynamic: true});
        else { // We need to create new service and set its initial fields
            serviceRecord = record.create({type: 'customrecord_service', isDynamic: true});

            serviceRecord.setValue({fieldId: 'custrecord_service', value: data.custrecord_service});
            serviceRecord.setValue({fieldId: 'name', value: data.custrecord_service_text});
            serviceRecord.setValue({fieldId: 'custrecord_service_price', value: data.custrecord_servicechg_new_price});
            serviceRecord.setValue({fieldId: 'custrecord_service_customer', value: customerId});
            serviceRecord.setValue({fieldId: 'custrecord_service_description', value: data.custrecord_service_description});

            if (commRegId) serviceRecord.setValue({fieldId: 'custrecord_service_comm_reg', value: commRegId});
        }

        freqTerms.forEach(item => {serviceRecord.setValue({fieldId: 'custrecord_service_day_' + item, value: data['custrecord_service_day_' + item]});});

        let serviceRecordId = serviceRecord.save({ignoreMandatoryFields: true});

        if (!data.internalid) // This is a new service change record, we will give it the associated service record id
            serviceChangeRecord.setValue({fieldId: 'custrecord_servicechg_service', value: serviceRecordId});

        if (!data.internalid && !data.service_internalid) // Newly created service, set it as inactive first
            record.submitFields({type: 'customrecord_service', id: serviceRecordId, values: {'isinactive': true}});

        let serviceChangeRecordId = serviceChangeRecord.save({ignoreMandatoryFields: true});

        // go through all service change records and service records to calculate the rate
        let {monthlyServiceRate, monthlyExtraServiceRate, monthlyReducedServiceRate} = _calculateServiceRates(customerId, commRegId);

        customerRecord.setValue({fieldId: 'custentity_cust_monthly_service_value', value: monthlyServiceRate});
        customerRecord.setValue({fieldId: 'custentity_monthly_extra_service_revenue', value: monthlyExtraServiceRate});
        customerRecord.setValue({fieldId: 'custentity_monthly_reduc_service_revenue', value: monthlyReducedServiceRate});

        customerRecord.save({ignoreMandatoryFields: true});

        _updateDateEffectiveForAll(commRegId, [{id: serviceChangeRecordId}, ...serviceChanges],
            new Date(data.custrecord_servicechg_date_effective));

        // End
        _writeResponseJson(response, {commRegId});
    },
};

const sharedFunctions = {
    getCustomerData(customerId, fieldIds) {
        let {record} = NS_MODULES;
        let data = {};

        let customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: customerId,
        });

        for (let fieldId of fieldIds) {
            data[fieldId] = customerRecord.getValue({fieldId});
            data[fieldId + '_text'] = customerRecord.getText({fieldId});
        }

        return data;
    },
    getServiceChanges(commRegId) {
        let {search} = NS_MODULES;
        let data = [];

        if (!commRegId) return data; // if commRegId is null, most likely new customer with no services, we return empty array

        let serviceChangeSearch = search.load({id: 'customsearch_smc_service_chg', type: 'customrecord_servicechg'});

        serviceChangeSearch.filters.push(search.createFilter({
            name: 'custrecord_servicechg_comm_reg',
            operator: search.Operator.IS,
            values: commRegId
        }));

        serviceChangeSearch.run().each(item => {
            let tmp = {};

            for (let column of item.columns) {
                tmp[column.name] = item.getValue(column);
                tmp[column.name + '_text'] = item.getText(column);
            }

            data.push(tmp);

            return true;
        })

        return data;
    },
    getAssignedServices(customerId) {
        let {search} = NS_MODULES;
        let data = [];

        let serviceSearch = search.load({
            id: 'customsearch_salesp_services',
            type: 'customrecord_service'
        });

        serviceSearch.filters.push(search.createFilter({
            name: 'custrecord_service_customer',
            operator: search.Operator.ANYOF,
            values: customerId
        }));

        serviceSearch.run().each(function (item) {
            let tmp = {};

            for (let column of item.columns) {
                let columnName = column.join ? `${column.join.toLowerCase()}.${column.name}` : column.name
                tmp[columnName] = item.getValue(column);
                tmp[columnName + '_text'] = item.getText(column);
            }

            data.push(tmp);

            return true;
        });

        return data;
    }
}

function _updateDateEffectiveForAll(commRegId, serviceChanges, dateEffective) {
    let {record} = NS_MODULES;

    serviceChanges.forEach(item => {
        record.submitFields({type: 'customrecord_servicechg', id: item.id, values: {'custrecord_servicechg_date_effective': dateEffective}});
    });

    if (commRegId)
        record.submitFields({type: 'customrecord_commencement_register', id: commRegId, values: {'custrecord_comm_date': dateEffective}});
}

function _calculateServiceRates(customerId, commRegId) {
    let serviceChanges = sharedFunctions.getServiceChanges(commRegId);
    let assignedServices = sharedFunctions.getAssignedServices(customerId);
    let monthlyServiceRate = 0.0, monthlyExtraServiceRate = 0.0, monthlyReducedServiceRate = 0.0;
    let freqTerms = ['mon', 'tue', 'wed', 'thu', 'fri', 'adhoc'];

    [...serviceChanges, ...assignedServices].forEach(item => {
        let singleMonthlyServiceRate = 0, singleMonthlyExtraServiceRate = 0, singleMonthlyReducedServiceRate = 0;
        let newPrice = parseFloat(item['custrecord_servicechg_new_price']) || parseFloat(item['custrecord_service_price']) || 0;

        freqTerms.forEach(term => {
            if (item['custrecord_service_day_' + term]) {
                singleMonthlyServiceRate += newPrice;

                singleMonthlyExtraServiceRate += ['Extra Service', 'Increase of Frequency'].includes(item['custrecord_servicechg_type']) ?
                    newPrice : 0;

                singleMonthlyReducedServiceRate += ['Reduction of Service', 'Price Decrease', 'Decrease of Frequency'].includes(item['custrecord_servicechg_type']) ?
                    newPrice : 0;
            }
        });

        let monthlyRateServices = [30, 31, 32, 33, 34, 35, 36, 37, 38]; // Fixed Charge (30) and all NeoPost Packages

        // If this service type is Fixed Charge (30), we keep the rates as is
        // because Fixed Charge service's price is monthly rate instead of weekly rate.
        monthlyServiceRate += monthlyRateServices.includes(parseInt(item['custrecord_service'])) ? newPrice : singleMonthlyServiceRate * 4.25;
        monthlyExtraServiceRate += (monthlyRateServices.includes(parseInt(item['custrecord_service'])) && singleMonthlyExtraServiceRate > 0)
            ? newPrice : singleMonthlyExtraServiceRate * 4.25;
        monthlyReducedServiceRate += (monthlyRateServices.includes(parseInt(item['custrecord_service'])) && singleMonthlyReducedServiceRate > 0)
            ? newPrice : singleMonthlyReducedServiceRate * 4.25;
    })

    return {monthlyServiceRate, monthlyExtraServiceRate, monthlyReducedServiceRate};
}

function _createCommencementRegister(customerId, salesRecordId, data, extraParams) {
    let {expSendEmail, expClosedWon} = extraParams;
    let {record, runtime} = NS_MODULES;
    let userId = runtime['getCurrentUser']().id;
    let userRole = runtime['getCurrentUser']().role;
    let customerRecord = record.load({type: record.Type.CUSTOMER, id: customerId});
    let partnerId = parseInt(customerRecord.getValue({fieldId: 'partner'}));
    let partnerRecord = record.load({type: 'partner', id: partnerId});
    let state = partnerRecord.getValue({fieldId: 'location'});

    let commRegRecord = record.create({type: 'customrecord_commencement_register'});

    commRegRecord.setValue({fieldId: 'custrecord_date_entry', value: new Date()});
    commRegRecord.setValue({fieldId: 'custrecord_comm_date', value: new Date(data.custrecord_servicechg_date_effective)});
    commRegRecord.setValue({fieldId: 'custrecord_comm_date_signup', value: new Date(data.custrecord_servicechg_date_effective)});
    commRegRecord.setValue({fieldId: 'custrecord_customer', value: customerId});
    commRegRecord.setValue({fieldId: 'custrecord_salesrep', value: expSendEmail ? userId : 109783});
    commRegRecord.setValue({fieldId: 'custrecord_std_equiv', value: 1}); // Standard Equivalent
    commRegRecord.setValue({fieldId: 'custrecord_wkly_svcs', value: '5'}); // Weekly Services
    commRegRecord.setValue({fieldId: 'custrecord_in_out', value: 2}); // Inbound
    commRegRecord.setValue({fieldId: 'custrecord_state', value: state});
    commRegRecord.setValue({fieldId: 'custrecord_trial_status', value: expSendEmail && !expClosedWon ? 10 : 9}); // Quote (10) or Scheduled (9)
    commRegRecord.setValue({fieldId: 'custrecord_sale_type', value: data.custrecord_servicechg_type_id});

    if (userRole !== 1000) commRegRecord.setValue({fieldId: 'custrecord_franchisee', value: partnerId});
    if (salesRecordId && expSendEmail) commRegRecord.setValue({fieldId: 'custrecord_commreg_sales_record', value: salesRecordId});

    return commRegRecord.save({ignoreMandatoryFields: true});
}