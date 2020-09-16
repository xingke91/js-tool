/**
 * 数据校验相关功能
 * fanlinjun
 */
import { isObject as isObj, isFunction as isFun, isString, isNum, isArray } from './utils.js';

//初始化选项和内部校验的匿名函数名
const initOptions = Symbol('initOptions');
const innerValidate = Symbol('innerValidate');

//邮箱和手机号校验使用的正则
const emailPtn = /^[\w\-\.]+@([\w\-]+\.){1,3}[a-z]+$/i;
const phonePtn = /^1[3-9]\d{9}$/;

//assert方法中支持的待校验数据的类型集合（null类型单独判断）;
const sTyps = ['string', 'number', 'boolean', 'undefined', 'symbol'];

//解析校验选项时排除解析的字段
const externals = ['msg', 'message', 'error'];
/**
 * 默认可选校验规则集合
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
        assert: (val) => (val === 0 || !!(val && val.toString().trim())),
    },
    email: {
        name: '邮箱',
        assert: (val) => isString(val) && emailPtn.test(val),
    },
    mobile: {
        name: '手机号',
        assert: (val) => isString(val) && phonePtn.test(val),
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
        name: '数值范围',
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
        base: (base) => isNum(base) && base >= 0,
        assert: (val, base) => (isString(val) || isArray(val)) && val.length <= base
    },
    minLength: {
        name: '最小长度',
        base: (base) => isNum(base) && base >= 0,
        assert: (val, base) => (isString(val) || isArray(val)) && val.length >= base
    },
    rangeLength: {
        name: '长度范围',
        base: (base) => isArray(base) && base.length == 2 && base.every(v => (isNum(v) && v >= 0)),
        assert: (val, range) => (isString(val) || isArray(val)) && val.length >= range[0] && val.length <= range[1]
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
    if (!isObj(item)) return;
    let _msg = item.error || item.msg || item.message;
    Object.keys(item).filter(v => !externals.includes(v)).forEach(key => {
        let _rule = (ctx.$own[key] || rules[key]);
        if (!_rule) return;
        let isTrue = isFun(_rule.base) ? _rule.base(item[key]) : true;
        if (!isTrue) {
            throw Error(`校验规则'${key}'的基准值'${JSON.stringify(item[key])}'非法！`);
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
 * 逐条解析校验选项的方法
 * @param {String|Object|Array} item 待解析的选项 
 * @param {Array} target 存放解析后生成的统一形式的校验选项的数组 
 * @param {Validator} ctx 当前上下文对象，即Validator实例
 */
function parseOptionItems (item, target, ctx) {
    if (isString(item)) {
        parseString(item, target);
    } else if (isObj(item)) {
        parseObject(item, target, ctx);
    } else if (isArray(item)) {
        item.forEach(s => isString(s) ? parseString(s, target) : parseObject(s, target, ctx));
    }
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
    if (options && isObj(options)) {
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
    if (!isObj(opts)) return;
    Object.keys(opts).forEach(key => {
        _op[key] = _op[key] || [];
        let _item = opts[key];
        parseOptionItems(_item, _op[key], this);
    });
    this.$options = _op;
}

/**
 * 内部校验方法（可实现对象属性的递归校验）
 * @param {Object} val 待校验对象
 */
Validator.prototype[innerValidate] = function (val) {
    if (!isObj(val)) {
        throw Error('参数 \'val\' 必须是Object类型数据！');
    }
    let _op = this.$options, _opt, _failMsg;
    for (let key in val) {
        if (_failMsg || !_op.hasOwnProperty(key)) continue;
        _opt = _op[key];
        if (!isArray(_opt)) continue;
        _opt.forEach(o => {
            let _rule = this.$own[o._rule] || rules[o._rule];
            if (_failMsg || !_rule.assert) return;
            if (!_rule.assert(val[key], o[o._rule])) {
                _failMsg = o.msg || `字段'${key}'${_rule.name || ''}校验不通过`;
            }
        });
        if(isObj(val[key])){
            let res = this[innerValidate](val[key]);
            (!res.valid) && (_failMsg = res.msg);
        }else if(isArray(val[key])){
            val[key].forEach(v => {
                if(!isObj(v)) return;
                let res = this[innerValidate](v);
                (!res.valid) && (_failMsg = res.msg);
            });
        }
    }
    if (_failMsg) {
        return { valid: false, msg: _failMsg };
    }
    return { valid: true };
}

/**
 * 添加自定义校验规则
 * @param {String} ruleName 校验规则名称
 * @param {Object|Function} rule 校验规则对象或者处理函数
 */
Validator.prototype.addRule = function (ruleName, rule) {
    if (!isString(ruleName)) return;
    if (isObj(rule) && rule.assert) {
        return (this.$own[ruleName] = rule);
    }
    if (!isFun(rule)) return;
    this.$own[ruleName] = {
        assert: rule
    }
}

/**
 * 添加校验选项，同一字段的同名校验选项会覆盖
 * @param {Object} options 校验选项 
 */
Validator.prototype.addOptions = function (options) {
    if (!isObj(options)) return;
    this[initOptions](options);
}


function _error(msg, fn){
    isFun(fn) && fn(msg);
    throw Error(_msg);
}

/**
 * 单项数据校验
 * @param {Any} val 待校验数据值，只能是简单类型
 * @param {Any} options 校验选项，当为简单时，做全等判断，其余情况下按校验规则校验
 * @param {?Function} onInvalid 当校验失败时调用的方法（当options参数为string类型或null时忽略该参数）
 */
Validator.prototype.assert = function (val, options, onInvalid) {
    let _type = typeof(val), _type2 = typeof(options);
    if (val !== null && !sTyps.includes(_type)) {
        _error('\'assert\'方法只支持简单类型数据的判断！', onInvalid);
    }
    if (arguments.length === 1) {
        _error('\'assert\'校验数据时参数\'options\'不可缺少', onInvalid);
    }
    if (options === null | !sTyps.includes(_type2)) return (val === options);
    if (!isArray(options) && isObj(options)) {
        _error('参数\'options\'只支持String、Object或Array类型！', onInvalid);
    }
    let _opts = [];
    parseOptionItems(options, _opts, this);
    let res = true, _rule;
    _opts.forEach((o, i) => {
        if (!res) {
            let _msg = _opts[i - 1].msg || `待检验值'${val}'验证失败！`;
            return (isFun(onInvalid) && onInvalid(_msg));
        }
        _rule = this.$own[o._rule] || rules[o._rule];
        res = _rule.assert(val, o[o._rule]);
    });
    return res;
}

/**
 * 数据校验方法
 * @param {Object} val 待校验数据对象
 * @param {Function|Object} onInvalid 当校验不通过时执行的回调函数，如果为Object类型，则视为数据校验选项 
 * @param {Object} options 数据校验选项（可选参数，如果传入，则要去必须为Object对象）
 */
Validator.prototype.validate = function (val, onInvalid, options) {
    if (!isObj(val)) {
        let msg = '参数类型错误，参数\'val\'必须为Object对象类型！';
        isFun(onInvalid) && onInvalid(msg);
        throw Error(msg);
    }
    if (isObj(onInvalid)) {
        options = Object.assign({}, onInvalid, options);
    }
    options && this[initOptions](options);
    let res = this[innerValidate](val);
    if (!res.valid) {
        isFun(onInvalid) && onInvalid(res.msg);
        return false;
    }
    return true;
}

export default Validator;