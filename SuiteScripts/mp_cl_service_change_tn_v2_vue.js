/**
 * @author Tim Nguyen
 * @description Service Change Page v2 with Vue 2. The only purpose of this script is to expose NetSuite modules to the Vue app.
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @created 16/05/2023
 */

let modules = {};

const moduleNames = ['error', 'runtime', 'search', 'record', 'url', 'format', 'email', 'currentRecord', 'https'];

// eslint-disable-next-line no-undef
define(moduleNames.map(item => 'N/' + item), (...args) => {
        for (let [index, moduleName] of moduleNames.entries())
            modules[moduleName] = args[index];

        function pageInit() {
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop),
            });
            if (params['iframeMode'] === 'T') {
                document.querySelector('div#div__header').remove();
                document.querySelector('div#div__body > form > table > tbody > tr:first-child').remove();
            }
            console.log('Client script init.');
        }

        return { pageInit };
    }
);

// eslint-disable-next-line no-unused-vars
function _getClientModules() {
    return modules;
}