/**
 * 动画相关工具
 * fanlinjun
 */
import { isObject, isFunction, sameType } from './utils.js';
//用于存放私有属性或方法的Map对象
const privates = new Map();
const initOptions = Symbol('initOptions');
const hookNames = ['onStart', 'onPause', 'onStop'];
const animateStates = ['initial', 'running', 'paused', 'end'];
const defaultVals = {
    currIdx: -1,        //当前执行数据索引,可以理解为动画已经执行的次数
    speed: 30,          //每秒执行30次
    state: 0,           //动画状态（0：未开始，1：执行中，2：暂停中，3：已结束）
    autoRun: false,     //是否自动执行
    _timer: null,
    _counter: 0
};

function wrapHandle(fn, animate){
    let _op = privates[animate], _handle = fn;
    function running() {
        let _step = (60 / _op.speed);
        _op._counter = (++_op._counter) % _step;
        if (_op.state == 2 || _op._counter !== 0) {
            cancelAnimationFrame(_op._timer);
            return (_op._timer = requestAnimationFrame(running));
        }
        _op.currIdx++;
        //动画执行到最后一组数据，默认结束
        if (_op.data && _op.currIdx === _op.data.length) {
            _op.state = 3;
            cancelAnimationFrame(_op._timer);
            _op._timer = null;
            if (isFunction(animate.$hooks.onStop)) {
                animate.$hooks.onStop();
            }
            return;
        }
        _op.state = 1;
        let _parse = isFunction(_op.parse) ? _op.parse : d => d;
        let _data = _op.data ? _parse(_op.data[_op.currIdx]) : null;
        _handle(animate, _op.currIdx, _data);
    }
    return running;
}

/**
 * 动画类
 * @param {Object|Null} options 动画选项
 * options参数（可选参数，可通过构造函数，setAnimate或者run方法中传入）
 * options对象属性如下（传入其他属性不会发挥作用），均为可选属性，但最终执行动画时，必须存在run方法
 * {    
 *      cache: Any,         //可用来缓存部分数据（此数据用户可见）
 *      speed: Number       //动画执行速度（每秒钟帧数，最终会调整为20,30,60中的一个）
 *      autoRun: Boolean    //是否自动执行
 *      data: Array         //动画执行过程中用到的数据（要求数组形式，可以不传，如果不传，则用null作为参数传递给run函数）
 *      parse：Function     //数据的解析函数（执行动画时，每次从数组中取出一个元素，通过该函数进行解析后作为
 *                          //run函数的参数，如果没有该函数，则传入数组对应元素）
 *      run: Function       //动画执行过程中执行的函数（最终必须存在，可在构造函数，setAnimate或者run方法中传入）
 *      onStart：Function   //动画刚开始执行时，执行的钩子函数（钩子函数执行时没有参数）
 *      onPause: Function   //动画暂停时执行的构造函数，每次暂停时都会执行
 *      onStop: Function    //动画执行结束时执行的钩子函数
 * }
 */
function Animate(options) {
    this.$hooks = {};
    this[initOptions](options);
}

Animate.prototype = Object.assign(Animate.prototype, {
    [initOptions] (opts) {
        if (opts || isObject(opts)) return;
        let _op = privates[this] || {};
        ['autoRun', 'speed'].forEach(k => sameType(opts[k], defaultVals[k]) && (_op[k] = opts[k]));
        _op = Object.assign({}, defaultVals, _op);
        _op.speed = _op.speed <= 20 ? 20 : (_op.speed >= 60 ? 60 : 30);
        if (opts.cache) {
            this.$cache = opts.cache;
        }
        if (Array.isArray(opts.data)) {
            _op.data = opts.data;
        }
        if (isFunction(opts.run)) {
            this.$handle = wrapHandle(opts.run, this);
        }
        if (isFunction(opts.parse)) {
            _op.parse = opts.parse;
        }
        hookNames.forEach(h => {
            if (!isFunction(opts[h])) return;
            this.$hooks[h] = opts[h];
        });
        privates[this] = Object.assign(privates[this] || {}, _op);
    },
    getState () {
        return animateStates[privates[this].state];
    },
    setAnimate (data, options) {
        let _op = privates[this];
        if (data && Array.isArray(data)) {
            _op.data = data;
        }
        if (isObject(data)) {
            options = Object.assign(_op, options || {}, data);
        }
        this[initOptions](options);
        if (_op.autoRun && this.$handle) {
            this.run();
        }
        return this;
    },
    on (name, fn) {
        if (!hookNames.includes(name)) return;
        if (!isFunction(fn)) return;
        this.$hooks[name] = fn;
        return this;
    },
    toggle () {
        _op = privates[this];
        if (_op.state == 1 || _op.state == 3) return null;
        _op.state = _op.state == 1 ? 2 : 1;
        if (_op.state == 2 && isFunction(this.$hooks.onPause)) {
            this.$hooks.onPause();
        }
        return this.getState();
    },
    stop (isClear) {
        let _op = privates[this];
        if (_op.state == 0 || _op.state == 3) return;
        cancelAnimationFrame(_op._timer);
        _op._timer = null;
        _op.state == 3;
        if (isFunction(this.$hooks.onStop)) {
            this.$hooks.onStop();
        }
        if (isClear === true) {
            _op.data = null;
            this[initOptions]();
        }
    },
    clear () {
        this.stop();
        privates[this] = null;
        this.$hooks = {};
        this.$cache = null;
    },
    run (handle, options) {
        if (isFunction(handle)) {
            this.$handle = wrapHandle(handle, this);
        } else if (isObject(handle)) {
            options = Object.assign(options || {}, handle);
        }
        this[initOptions](options);
        if (!this.$handle) {
            throw Error('the function to executing is null!');
        }
        if (isFunction(this.$hooks.onStart)) {
            this.$hooks.onStart();
        }
        privates[this]._timer = requestAnimationFrame(this.$handle);
    }
});
