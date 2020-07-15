/**
 * 配置axios请求相关
 * fanlinjun
 **/

import axios from 'axios';
import qs from 'querystring';
const source = axios.CancelToken.source();

// 空函数，不会执行任何操作
function noop(){}

// 可自定义的拦截器钩子函数的名称集合，钩子函数可用于axios实例发送请求前后调用
const hookFns = ['before', 'success', 'error'];

// 自定义axios拦截器钩子函数集合
let axiosHooks = {};

// 初始化axios自定义拦截器钩子函数，初始函数均为noop
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
        _error();
        return Promise.reject(err);
    });

    // 添加响应拦截器
    instance.interceptors.response.use(res => {
        let _success = options.success || axiosHooks.success;
        _success(res);
        return res;
    }, err => {
        _error();
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
function getFetch(options){
    let config = {
        cancelToken: source.token,
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
 * all和spread为axios对应的方法，用于多个请求
 */
let fetch = {
    all: axios.all,
    spread: axios.spread
};
['get', 'post', 'put', 'delete'].forEach(m => {
    fetch[m] = function(url, pms, options){
        let instance = getFetch(Object.assign({}, options, { method: m }));
        if(m === 'get'){
            pms = { params: pms };
        }
        return instance[m](url, pms);
    }
});

/**
 * @description 取消请求
 */
function cancelFetches() {
     source.cancel('Operation canceled!');
}

export {
    fetch,
    initRequestHooks,
    getFetch,
    cancelFetches
}