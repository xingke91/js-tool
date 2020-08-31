/**
 * 数据校验相关功能
 * fanlinjun
 */
import { isObject, isFunction, isLonlat, isString, isNum, isArray } from './utils.js';
const initOptions = Symbol('initOptions');
const emailPtn = /^[\w\-\.]+@([\w\-]+\.){1,3}[a-z]+$/i;
const phonePtn = /^1[3-9]\d{9}$/;

/**
 * 可选校验校验集合
 * {
 *      name: 校验规则名称
 *      base：基准值判断函数（当校验规则需要传入一个基准值作比较时，通过该函数判断基准值是否符合要求）
 *            如：{ min: 5 }规则中，min规则的基准值是5
 *      assert: 校验规则主函数，通过该函数确定待校验的属性值是否符合要求
 * }
 */
const rules = {
    required: {
        name: '非空',
        assert: (val) => (val === 0 || !!val.toString().trim()),
    },
    email: {
        name: '邮箱',
        assert: (val) => isString(val) && emailPtn.test(val),
    },
    mobile: {
        name: '手机号',
        assert: (val) => isString(val) && phonePtn.test(val),
    },
    // lonlat: {
    //     name: '地理坐标',
    //     assert: (val) => isString(val) && isLonlat(val)
    // },
    max: {
        name: '最大值',
        base: (base) => isNum(base),
        assert: (val, base) => isNum(val) && val <= base
    },
    min: {
        name: '最小值',
        base: (base) => isNum(base),
        assert: (val, base) => isNum(val) && val >= base
    },
    range: {
        name: '范围',
        base: (base) => isArray(base) && base.length >= 2,
        assert: (val, range) => (isNum(val) && val >= range[0] && val <= range[1])
    },
    limit: {
        name: '限制可选值',
        base: (base) => isArray(base),
        assert: (val, arr) => arr.includes(val)
    },
    maxLength: {
        name: '最大长度',
        base: (base) => isNum(base),
        assert: (val, base) => isString(val) && val.length <= base
    },
    minLength: {
        name: '最小长度',
        base: (base) => isNum(base),
        assert: (val, base) => isString(val) && val.length >= base
    },
    rangeLength: {
        name: '长度范围',
        base: (base) => isArray(base) && base.length >= 2,
        assert: (val, range) => (isString(val) && val.length >= range[0] && val.length <= range[1])
    }
};

/**
 * 解析字符串型的校验选项，如：
 * { userName: 'required' }
 */
function parseString(item, target) {
    let _strategy = target.filter(v => v.hasOwnProperty(item))[0];
    if(_strategy) return;
    target.push({ [item]: true });
}

/**
 * 解析Object类型的校验选项，如：
 * {
 *     userName: { required: true, msg: '用户名必填' }
 * }
 */
function parseObject(item, target, ctx) {
    if(!isObject(item)) return;
    let _msg = item.msg || item.message;
    const _excepts = ['msg', 'message'];
    Object.keys(item).filter(v => !_excepts.includes(v)).forEach(key => {
        let _rule = ctx.$own[key] || rules[key];
        if(!_rule) return;
        let isTrue = !_rule.base ? true : _rule.base(item[key]);
        if(!isTrue){
            throw Error(`"${JSON.stringify(item[key])}"为校验规则${key}的非法基准值！`);
        }
        let _new = { [key]: item[key] };
        if(_msg) _new.msg = _msg;
        let _strategy = target.filter(r => r.hasOwnProperty(key))[0];
        if(_strategy) return Object.assign(_strategy, _new);
        target.push(_new);
    });
}

function Validator (options) {
    this.$own = {};
    if (options && isObject(options)) {
        this[initOptions](options);
    }
}

Validator.prototype[initOptions] = function (opts) {
    let _op = this.$options || {};
    if (!isObject(opts)) return;
    Object.keys(opts).forEach(key => {
        if (!(this.$own[key] || rules[key])) return;
        _op[key] = _op[key] || [];
        let _item = opts[key];
        if (isString(_item)) {
            parseString(_item, _op[key]);
        } else if (isObject(_item)) {
            parseObject(_item, _op[key], this);
        } else if (isArray(_item)) {
            _item.forEach(s => isString(s) ? parseString(s, _op[key]) : parseObject(s, _op[key], this));
        }
    });
    this.$options = _op;
}

//添加校验规则
Validator.prototype.addRule = function (ruleName, checker) {

}

//添加校验配置
Validator.prototype.addConfig = function (options) {
    if (!isObject(options)) return;
    this[initOptions](options);
}

Validator.prototype.check = function (val, onInvalid, options) {
    if (isFunction(onInvalid)) {
        this.$onInvalid = onInvalid;
    } else if (isObject(onInvalid)) {
        options = Object.assign({}, onInvalid, options);
    }
    options && this[initOptions](options);
    if (!isObject(val)) {
        let msg = 'parameter "val" must be an Object!';
        this.$onInvalid && this.$onInvalid(msg);
        throw Error(msg);
    }
    let _op = this.$options, _rule, _opt;
    for (let key in val) {
        if(!(key in _op)) continue;
        _opt = _op[key];
        _rule = this.$own[key] || rules[key];
        if (!isObject(_rule) || isFunction(_rule.assert)) continue;

    }
}