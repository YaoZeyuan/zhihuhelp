export interface IElectronAPI {
    ['get-debug-ipc-channel-list']: () => Promise<any>,
    ['get-task-default-title']: (...args) => Promise<any>,
    ['get-common-config']: () => Promise<any>,
    ['start-customer-task']: (...args) => Promise<any>,
    ['zhihu-http-get']: (...args) => Promise<any>,
    ['open-output-dir']: () => Promise<any>,
    ['open-devtools']: () => Promise<any>,
    ['clear-all-session-storage']: () => Promise<any>,
    ['get-db-summary-info']: () => Promise<any>,
    ['get-db-record-list']: (...args) => Promise<any>,
    ['get-output-history']: () => Promise<any>,
    ['export-diagnostic-info']: () => Promise<any>,
    ['open-local-path']: (...args) => Promise<any>,
    ['get-log-content']: (...args) => Promise<any>,
    ['clear-log-content']: () => Promise<any>,
    ['get-runtime-jsonl-content']: () => Promise<any>,
    ['clear-runtime-jsonl-content']: () => Promise<any>,
    ['open-js-rpc-window-devtools']: () => Promise<any>,
    loadPreferences: () => Promise<void>,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}
