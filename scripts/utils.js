/**
 * @description 检测字符串是否为邮箱地址
 * @param {String} str 待判断的字符串
 * @returns {Boolean} 判断结果
 * */
function isEmail (str) {
    if(!str || typeof(str) !== 'string') return false;
    return /^[\w\-\.]+@(?:[\w\-]+\.){1,3}[a-z]+$/i.test(str);
}

/**
 * @description 校验字符串是否为手机号码
 * @param {String} str 待判断的字符串
 * @returns {Boolean} 判断结果
*/
function isMobileNo (str) {
    if(!str || typeof(str) !== 'string') return false;
    return /^1[3-9]\d{9}$/.test(str);
}

/**
 * @description 校验字符串是否为url
 * @param {String} str 待判断的字符串
 * @returns {Boolean} 判断结果
*/
function isUrl (str) {
    if(!str || typeof(str) !== 'string') return false;
    return /^https?\:\/\/.+$/i.test(str);
}

/**
 * @description 时间格式化
 * @param {Number|Date} time 待判断的时间，可以是Number/Date类型
 * @param {?String} format 指定格式，缺省值为yyyy-MM-dd hh:mm:ss
 * @returns {String|null} 格式化后的时间字符串，如果参数不符合，将返回null
*/
function formatTime (time, format) {
    time = typeof(time) === "number" ? time : (time instanceof Date ? time.getTime() : parseInt(time));
    if(isNaN(time)) return null;
    if(typeof(format) !== 'string' || !format) format = 'yyyy-MM-dd hh:mm:ss';
    let _time = new Date(time);
    time = _time.toString().split(/[\s\:]/g).slice(0, -2);
    time[1] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'][_time.getMonth()];
    let _mapping = { MM: 1, dd: 2, yyyy: 3, hh: 4, mm: 5, ss: 6 };
    return format.replace(/([Mmdhs]|y{2})\1/g, (key) => time[_mapping[key]]);
}

/**
 * @description 数字格式化，如：1234567.89 -> 1,234,567.89
 * @param {Number} num 待格式化的数字，小数或整数
 * @param {?Boolean} fixed 是否保留小数，缺省值为true
 * @returns {String} 格式化后的字符串
 */
function formatDecimal (num, fixed) {
    if(typeof(num) !== 'number'){
        throw Error('parameter "num" must be a number!');
    }
    fixed = fixed === undefined ? true : fixed;
    let numStr = fixed ? (Math.round(num * 100) / 100).toFixed(2) : Math.round(num).toString();
    return numStr.replace(/(\d{1,3})(?=(\d{3})+\b)/g, '$1,');
}

/**
 * @description 节流器函数，避免函数在小于规定时间范围内多次执行
 * @param {Function} fn 目标函数
 * @param {?Number} interval 规定限制时间，单位为ms，缺省值为1000
 * @returns {Function} 经节流器处理过的函数
*/
function throttle (fn, interval){
    let _self = fn, lastTime;
    if(typeof(interval) !== 'number' || interval <= 0){
        interval = 1000;
    }
    return function () {
        let args = Array.prototype.slice.call(arguments),
            now = new Date().getTime();
        if(lastTime && now - lastTime < interval) return;
        lastTime = now;
        _self(...args);
    }
}

/**
 * @description 防抖函数，规定函数延迟指定时间执行，如果在这段时间内再次调用，则以函数执行时间往后顺延
 * @param {Function} fn 目标函数
 * @param {?Number} interval 规定限制时间，单位为ms，缺省值为500
 * @returns {Function} 经处理过的函数
*/
function debounce(fn, interval){
    let _self = fn, lastTime, timer;
    if(typeof(interval) !== 'number' || interval <= 0){
        interval = 500;
    }
    return function(){
        let ctx = this,
            args = Arrar.prototype.slice.call(arguments),
            now = new Date().getTime();
        if(lastTime && now - lastTime < interval){
            clearTimeout(timer);
        }
        lastTime = now;
        timer = setTimeout(() => {
            clearTimeout(timer);
            _self.call(ctx, ...args);
        }, interval);
    }
}

/**
 * @description 判断一个对象是否包含某个/些属性
 * @param {Object} obj 目标对象
 * @param {String} propStr 属性表达式字符串，如"prop"、"prop1.prop2.prop3"
 * @returns {Boolean} 判断结果
*/
function hasProperty(obj, propStr){
    if(!obj || typeof(propStr) !== 'string') return false;
    let res = false,
        tmpObj = obj;
    propStr.split(/\./g).forEach(p => {
        res = false;
        if(p in tmpObj){
            res = true;
            tmpObj = tmpObj[p];
        }
    });
    return res;
}

/**
 * @description 生成用于判断数据类型的函数，如"String"、"Array"
 * @param {String} typeStr 目标类型
 * @returns {Function} 判断对应类型的目标函数
*/
function genTypeCheckFn (typeStr){
    if(typeof(typeStr) !== 'string'){
        throw Error('the parameter "typeStr" is required and must be a string!');
    }
    let type = typeStr;
    return function (val){
        Object.prototype.toString.call(val) === `[object ${type}]`;
    }
}

/**
 * 预定义一些类型判断函数
 */
const isString = genTypeCheckFn('String');
const isArray = genTypeCheckFn('Array');
const isBool = genTypeCheckFn('Boolean');
const isSymbol = genTypeCheckFn('Symbol');
const isObject = genTypeCheckFn('Object');
const isFunction = genTypeCheckFn('Function');
const isPromise = genTypeCheckFn('Promise');

/**
 * @description 按条件过滤对象属性并格式化，生成满足条件的JSON对象
 * @param {Object} obj 可转换成JSON格式的对象
 * @param {?Object|Array} options 格式化选项，可包含<Function>filter、<Array>includes、<Array>excludes三个选项中的任一个
 * @returns {String} 格式化后的JSON字符串 
*/
function filterToJSON (obj, options){
    if(!(obj instanceof Object)){
        throw Error('paramter "obj" must be an Object!');
    }
    let opts = options,
        optAllows = ['filter', 'includes', 'excludes'];
    if(Array.isArray(opts)){
        return JSON.stringify(obj, opts);
    };
    if(!opts || !optAllows.some(opt => (opt in opts))){
        return JSON.stringify(obj);
    }
    return JSON.stringify(obj, (key, val) => {
        if(!key) return val;
        if(opts.filter && typeof(opts.filter) === 'function'){
            return opts.filter(key, val) ? val : undefined;
        }
        if(opts.includes && Array.isArray(opts.includes)){
            return opts.includes.includes(key) ? val : undefined;
        }
        if(opts.excludes && Array.isArray(opts.excludes)){
            return opts.excludes.includes(key) ? undefined : val;
        }
        return val;
    });
}

/**
 * @description 深拷贝
 * @param {Object|Array} obj 待拷贝的对象
 * @returns {Object|Array} 经过深拷贝后得到的新对象
*/
function deepClone(obj){
    if(typeof(obj) !== 'object') return obj;
    let result;
    if (Array.isArray(obj)) {
        result = [];
        for (let i in obj) {
            result.push(deepClone(obj[i]))
        }
    } else if (obj instanceof Object) {
        result = {};
        for (let i in obj) {
            result[i] = deepClone(obj[i]);
        }
    } else {
        result = obj;
    }
    return result;
}

const ua = navigator.userAgent;

/**
 * @description 根据userAgent判断当前应用是否为微信
 * @returns 判断结果
 */
function isWechat () {
    return /micromessage/ig.test(ua);
}

/**
 * @description 根据userAgent判断当前设备是否为手机
 * @returns 判断结果
 */
function isMobile () {
    return /android|iphone|ipod/ig.test(ua);
}

export {
    isEmail,
    isMobileNo,
    isUrl,
    formatTime,
    formatDecimal,
    throttle,
    debounce,
    hasProperty,
    genTypeCheckFn,
    isString,
    isArray,
    isBool,
    isSymbol,
    isObject,
    isFunction,
    isPromise,
    filterToJSON,
    deepClone,
    isWechat,
    isMobile
}