/**
 * 数据校验相关功能
 * fanlinjun
 */
import { isObject, isFunction, isString, isNum, isArray, isLonlat } from './utils.js';

//初始化选项的匿名函数名
const initOptions = Symbol('initOptions');

//邮箱和手机号校验使用的正则
const emailPtn = /^[\w\-\.]+@([\w\-]+\.){1,3}[a-z]+$/i;
const phonePtn = /^1[3-9]\d{9}$/;

//assert方法中支持的待校验数据的类型集合（此处不包含null）;
const assertTypes = ['string', 'number', 'boolean', 'undefined', 'symbol'];

//解析校验选项时排除解析的字段
const parseExcepts = ['msg', 'message'];
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
    lonlat: {
        name: '地理坐标',
        assert: (val) => isLonlat(val)
    },
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
        base: (base) => isArray(base) && base.length == 2 && base.every(v => isNum(v)),
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
        base: (base) => isArray(base) && base.length == 2 && base.every(v => isNum(v)),
        assert: (val, range) => (isString(val) && val.length >= range[0] && val.length <= range[1])
    }
};

/**
 * 解析字符串型的校验选项，如：
 * { userName: 'required' }
 */
function parseString(item, target) {
    let _strategy = target.filter(v => v.hasOwnProperty(item))[0];
    if (_strategy) return;
    target.push({ _rule: item, [item]: true });
}

/**
 * 解析Object类型的校验选项，如：
 * {
 *     userName: { required: true, rangeLength: [5, 10], msg: '用户名填写不符合要求！' }
 * }
 */
function parseObject(item, target, ctx) {
    if (!isObject(item)) return;
    let _msg = item.msg || item.message;
    Object.keys(item).filter(v => !parseExcepts.includes(v)).forEach(key => {
        if (!(ctx.$own[key] || rules[key])) return;
        let isTrue = !_rule.base ? true : _rule.base(item[key]);
        if (!isTrue) {
            throw Error(`校验规则${key}的基准值"${JSON.stringify(item[key])}"非法！`);
        }
        let _new = { _rule: key, [key]: item[key] };
        if (_msg) _new.msg = _msg;
        let _strategy = target.filter(r => r.hasOwnProperty(key))[0];
        if (_strategy) {
            return Object.assign(_strategy, _new);
        }
        target.push(_new);
    });
}

/**
 * 数据校验类，支持单项数据校验和对象属性逐项校验
 * 1. 单项校验，如: <Validator>.assert('12345678@qq.com', 'email') 或 <Validator>.assert(100, { range: [5, 10] });
 * 2. 对象逐个属性校验，如：<Validator>.validate({ a: 'hahah', b: '1234567@qq.com' }, { a: 'required', b: 'email' });
 * @param {Object|Null} options 校验选项
 */
function Validator (options) {
    this.$options = {};
    this.$own = {};
    if (options && isObject(options)) {
        this[initOptions](options);
    }
}

/**
 * 解析校验选项的方法（匿名，外部不可访问）
 * 如果同名字段下已有同名校验选项，则会用新的选项覆盖原来的校验选项
 * @param {String|Object|Array} opts 校验选项
 */
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

/**
 * 添加自定义校验规则
 * @param {String} ruleName 校验规则名称
 * @param {Object|Function} handler 校验规则对象或者处理函数
 */
Validator.prototype.addRule = function (ruleName, handler) {
    if (!isString(ruleName)) return;
    if (isObject(handler) && handler.assert) {
        return (this.$own[ruleName] = handler);
    }
    if (!isFunction(handler)) return;
    this.$own[ruleName] = {
        assert: handler
    }
}

/**
 * 添加校验选项，同一字段的同名校验选项会覆盖
 * @param {Object} options 校验选项 
 */
Validator.prototype.addValidateOptions = function (options) {
    if (!isObject(options)) return;
    this[initOptions](options);
}

/**
 * 单项数据校验（多项数据校验也可使用）
 * @param {Any} val 待校验数据 
 * @param {Any} options 数据校验选项
 */
Validator.prototype.assert = function (val, options) {
    if (isObject(val)) { 
        return this.validate(val, options);
    }
    let _type = typeof(val);
    if (val !== null && !assertTypes.includes(_type)) {
        throw Error('"assert"方法只支持Object类型或者简单类型数据的判断！');
    }
    let _opts = [];
    if (options === undefined) {
        throw Error('简单类型判断时参数"options"不可缺少')
    }
    if (isString(options)) {
        parseString(options, _opts);
    } else if (isObject(options)) {
        parseObject(options, _opts, this);
    } else if (isArray(options)) {
        options.forEach(opt => {
            isString(options) ? parseString(options, _opts) : parseObject(options, _opts, this);
        });
    }
    if (!_opts.length) {
        return val === options;
    }
    let res = true, _rule;
    _opts.forEach(o => {
        if (!res) return;
        _rule = this.$own[o._rule] || rules[o._rule];
        res = _rule.assert(val, o[o._rule]);
    });
    return res;
}

/**
 * 
 * @param {Object} val 待校验数据对象
 * @param {Function|Object} onInvalid 当校验不通过时执行的回调函数，如果为Object类型，则视为数据校验选项 
 * @param {Object} options 数据校验选项（可选参数，如果传入，则要去必须为Object对象）
 */
Validator.prototype.validate = function (val, onInvalid, options) {
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
    let _op = this.$options, _opt, _failMsg;
    for (let key in val) {
        if (_failMsg || !(key in _op)) continue;
        _opt = _op[key];
        if (!isArray(_opt) || !_rule.assert) continue;
        if (!isArray(_opt)) continue;
        let _rule;
        _opt.forEach(o => {
            if (_failMsg) return;
            _rule = this.$own[o._rule] || rules[o._rule];
            if (!_rule.assert(val[key], o[o._rule])) {
                _failMsg = o.msg || `字段"${key}"${_rule.name || ''}校验不通过`;
            }
        });
    }
    if (_failMsg) {
        this.$onInvalid && this.$onInvalid(msg);
        return false;
    }
    return true;
}