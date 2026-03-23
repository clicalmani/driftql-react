import { DriftQL } from '@tonka/driftql-react/types';

const headers = new Headers();
headers.append('Content-Type', 'application/json');
headers.append('X-CSRF-Token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')!);

const get = (url: string) => fetch(url, { headers })
const post = (url: string, body: any) => {
    headers.delete('Content-Type')
    return fetch(url, { method: 'POST', headers, body })
}
const patch = (url: string, body?: any) => {
    headers.delete('Content-Type')
    return fetch(url, { method: 'PATCH', headers, body })
}
const request = (url: string, init?: (() => RequestInit) | DriftQL.RequestData, throwable?: boolean) : Promise<any> => {

    throwable = throwable ?? true;
    let reqInit: any = init ?? {};
    
    if (init && typeof init === 'function') reqInit = init()

    return new Promise(async (resolve, reject) => {
        headers.delete('Content-Type')
        const response = await fetch(url, {headers, ...reqInit})
        
        if (response.ok) {
            resolve(await response.json())
        } else {
            const { error_code, error_message } = await response.json()

            if (!throwable) {
                return resolve(`[${error_code}] ${error_message}`);
            }

            reject(`[${error_code}] ${error_message}`);
        }
    })
}

export {
    headers,
    get,
    post,
    patch,
    request
}
