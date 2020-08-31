/**
 * 数据校验相关功能
 * fanlinjun
 */
import { isObject, isFunction, isLonlat, isString, isNum, isArray } from './utils.js';
const initOptions = Symbol('initOptions');
const emailPtn = /^[\w\-\.]+@([\w\-]+\.){1,3}[a-z]+$/i;
const phonePtn = /^1[3-9]\d{9}$/;
const rules = {
    required: {
        name: '非空',
        rule: (val) => val && val.toString().trim(),
    },
    email: {
        name: '邮箱',
        rule: (val) => isString(val) && emailPtn.test(val),
    },
    mobile: {
        name: '手机号',
        rule: (val) => isString(val) && phonePtn.test(val),
    },
    lonlat: {
        name: '地理坐标',
        rule: (val) => isString(val) && isLonlat(val)
    },
    max: {
        name: '最大值',
        rule: (val, base) => isNum(val) && val <= base
    },
    min: {
        name: '最小值',
        rule: (val, base) => isNum(val) && val >= base
    },
    range: {
        name: '范围',
        rule (val, range) {
            if(!isArray(range) || range.length < 2){
                throw Error('范围校验基准值非法！');
            }
            return isNum(val) && val >= range[0] && val <= range[1];
        }
    },
    limit: {
        name: '限制可选值',
        rule (val, arr) {
            if(!isArray(arr)){
                throw Error('限制可选值校验基准值非法！');
            }
            return arr.includes(val);
        }
    },
    maxLength: {
        name: '最大长度',
        rule: (val, base) => isString(val) && val.length <= base
    },
    minLength: {
        name: '最小长度',
        rule: (val, base) => isString(val) && val.length >= base
    },
    rangeLength: {
        name: '长度范围',
        rule (val, range) {
            if(!isArray(range) || range.length < 2){
                throw Error('范围校验基准值非法！');
            }
            return isString(val) && val.length >= range[0] && val.length <= range[1];
        }
    }
};

function Validator (options) {
    this.$custom = {};
    if(options && isObject(options)){
        options = [options];
        this[initOptions](options);
    }
}

Validator.prototype[initOptions] = function (opts) {

}

//添加校验规则
Validator.prototype.addRule = function (ruleName, checker) {

}

//添加校验配置
Validator.prototype.addConfig = function (options) {
    if(!isObject(options)) return;
    this[initOptions](options);
}

Validator.prototype.check = function (val, onInvalid, options) {
    if(isObject(onInvalid)){
        options = Object.assign({}, onInvalid, options);
    }
    options && this[initOptions](options);
    if(isFunction(onInvalid)){
        this.$onInvalid = onInvalid;
    }
    if(!isObject(val)){
        let msg = 'parameter "val" must be an Object!';
        this.$onInvalid && this.$onInvalid(msg);
        throw Error(msg);
    }
    let _op = this.$options;
    for (let key in val) {
        if(!(key in _op)) continue;

    }
}