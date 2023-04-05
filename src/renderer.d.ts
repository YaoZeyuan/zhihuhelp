export interface IElectronAPI {
    ['get-task-default-title']: (...args) => Promise<any>,
    ['get-common-config']: () => Promise<any>,
    ['start-customer-task']: (...args) => Promise<any>,
    ['zhihu-http-get']: (...args) => Promise<any>,
    ['open-output-dir']: () => Promise<any>,
    ['open-devtools']: () => Promise<any>,
    ['clear-all-session-storage']: () => Promise<any>,
    ['get-db-summary-info']: () => Promise<any>,
    ['get-log-content']: (...args) => Promise<any>,
    ['clear-log-content']: () => Promise<any>,
    ['open-js-rpc-window-devtools']: () => Promise<any>,
    loadPreferences: () => Promise<void>,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}