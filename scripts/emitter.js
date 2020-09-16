/**
 * 事件代理对象，当绑定事件时，参数call应当使用bind绑定函数执行上下文
 * 如：emitter.on('event', <function>.bind(context));
 * */
const emitter = (function(){
    let events = {};
    return {
        //绑定事件
        on (evtName, call) {
            if(!evtName || typeof(call) !== 'function') return;
            events[evtName] = call;
        },
        //绑定单次事件
        one (evtName, callback) {
            if(!evtName || typeof(call) !== 'function') return;
            this.on(evtName, function(){
                let args = Array.prototype.slice.call(arguments);
                callback(...args);
                this.off(evtName);
            });
        },
        //移除指定事件
        off (evtName) {
            if(!events[evtName]) return;
            delete events[evtName];
        },
        //触发事件
        emit (evtName) {
            if(!events[evtName]) return;
            let args = Array.prototype.slice.call(arguments, 1);
            events[evtName].apply(null, args);
        }
    };
})();

export default emitter;