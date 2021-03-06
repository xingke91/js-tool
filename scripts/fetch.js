/**
 * 配置axios请求相关
 * fanlinjun
 **/
import axios from 'axios';
import qs from 'querystring';
const reqStack = [];

// 空函数，不会执行任何操作
function noop(){}

// 可自定义的拦截器钩子函数的名称集合，钩子函数用于向axios实例中注入对应拦截器
const hookFns = ['before', 'success', 'error'];

// 自定义axios拦截器钩子函数集合
let axiosHooks = {};

// 自动初始化axios自定义拦截器钩子函数，所有函数均为noop
hookFns.forEach(m => {
    axiosHooks[m] = noop;
});

// 设置默认请求头及超时时间
axios.defaults.headers.get['Cache-Control'] = 'no-cache';
axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
axios.defaults.headers['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.timeout = 60000;

/**
 * @description 向Axios实例中注入对应的拦截器函数
 * @param {Axios} instance Axios实例
 * @param {Object} options 为Axios实例单独配置的拦截器函数集合
 */
function injectHook(instance, options) {
    if(!instance){ return; }
    let _error = options.error || axiosHooks.error;
    // 添加请求拦截器
    instance.interceptors.request.use(conf => {
        let _before = options.before || axiosHooks.before;
        _before(conf);
        return conf;
    }, err => {
        _error(err);
        return Promise.reject(err);
    });

    // 添加响应拦截器
    instance.interceptors.response.use(res => {
        let _success = options.success || axiosHooks.success;
        let _res = _success(res);
        return (_res || res);
    }, err => {
        _error(err);
        return Promise.reject(err);
    });
}

/**
 * @description 手动配置通用的拦截器钩子函数
 * @param {Object} options 配置选项 
 */
function initRequestHooks(options) {
    options = options || {};
    hookFns.forEach(m => {
        if(!options[m]){ return; }
        axiosHooks[m] = options[m];
    });
}

/**
 * @description 获取Axios实例
 * @param {Object} options axios实例选项
 * @returns {Axios} Axios实例
 */
function getFetcher(options){
    let config = {
        cancelToken: new axios.CancelToken(c => reqStack.push(c)),
    };
    options = Object.assign({}, options);
    if(/^get$/i.test(options.method)){
        config.transformRequest = [data => qs.stringify(data)];
    }
    if(options.headers){
        config.headers = options.headers;
    }
    let instance = axios.create(config);
    if(options.useHook !== false){
        //默认使用注册的拦截器钩子函数
        injectHook(instance, options);
    }
    ['all', 'spread'].forEach(m => instance[m] = axios[m]);
    return instance;
}

/**
 * fetch对象，有get、post、put和delete四个方法用于对应http请求
 */
let fetch = {};
['get', 'post', 'put', 'delete'].forEach(m => {
    fetch[m] = function(url, pms, options){
        let instance = getFetcher(Object.assign({}, options, { method: m }));
        if(m === 'get' && !pms.params){
            pms = { params: pms };
        }
        return instance[m](url, pms);
    }
});

/**
 * @description 取消请求
 */
function cancelRequests() {
    reqStack.forEach(cancel => cancel());
    reqStack.splice(0);
}

export {
    fetch,
    initRequestHooks,
    getFetcher,
    cancelRequests
}