/**
 * 事件代理对象，当绑定事件时，参数call应当使用bind绑定函数执行上下文
 * 如：emitter.on('event', <function>.bind(context));
 * */
const emitter = (function(){
    let events = {}, onceEventNames = [];
    return {
        //绑定事件
        on (evtName, call) {
            if(!evtName || typeof(call) !== 'function') return;
            events[evtName] = call;
        },
        //绑定单次事件
        once (evtName, call) {
            if(!evtName || typeof(call) !== 'function') return;
            this.on(evtName, call);
            if(onceEventNames.includes(evtName)) return;
            onceEventNames.push(evtName);
        },
        //触发事件
        emit (evtName) {
            if(!events[evtName]) return;
            let args = Array.prototype.slice.call(arguments, 1);
            events[evtName](...args);
            let idx = onceEventNames.indexOf(evtName);
            if(idx === -1) return;
            delete events[evtName];
            onceEventNames.splice(idx, 1);
        }
    };
})();

export {
    emitter
}