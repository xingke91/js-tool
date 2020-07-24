/**
 * 将JSON数据渲染称表格
 * fanlinjun
 * */
export default (function(){
    let tableInfo = {
        colCount: 1,
        rowCount: {}
    };
    let tableConf = {
        //表格嵌套字段
        nestedField: 'subs'
    };
    /**
     * 初始化表格结构信息
     * @param {*} rows
     * @param {*} level 
     */
    function initStructureInfo(rows, level){
        let nesting = tableConf.nestedField;
        let _rows = rows.filter(r => r[nesting] && r[nesting].length > 0);
        if(_rows.length == 0){ return 0; }
        level++;
        tableInfo.colCount = Math.max(level, tableInfo.colCount);
        let _key, _count, _allSubs = 0, _subs = 0;
        _rows.forEach(s => {
            _count = s[nesting].length;
            _subs = initStructureInfo(s[nesting], level);
            _count += _subs;
            _allSubs += (_subs + s[nesting].length);
            _key = `${s[nesting][0].fieldName}_${level}`;
            tableInfo.rowCount[_key] = _count;
        });
        return _allSubs;
    }
    return {
        render () {

        }
    }
})();


var tableModule = {
    tableInfo: {
        colCount: 1,
        rowCount: {}
    },
    initTableInfo: function(rows, level){
        let _rows = rows.filter(r => r.subs && r.subs.length > 0);
        if(_rows.length == 0){ return 0; }
        level++;
        tableModule.tableInfo.colCount = Math.max(level, tableModule.tableInfo.colCount);
        let _key, _count, _allSubs = 0, _subs = 0;
        _rows.forEach(s => {
            _count = s.subs.length;
            _subs = tableModule.initTableInfo(s.subs, level);
            _count += _subs;
            _allSubs += (_subs + s.subs.length);
            _key = `${s.subs[0].fieldName}_${level}`;
            tableModule.tableInfo.rowCount[_key] = _count;
        });
        return _allSubs;
    },
    createRowHtml: function(row, level, idx){
        if(({}).toString.call(row) != '[object Object]'){ return null; }
        let _html = '', _blank = '', _key = `${row.fieldName}_${level}`;
        let colspan = tableModule.tableInfo.colCount - level + 1;
        colspan = colspan > 1 ? ` colspan="${colspan}"` : '';
        let rowspan = tableModule.tableInfo.rowCount[_key] || 0;
    
        for (let key in row) {
            if(key == 'subs'){ continue; }
            _html += (key == 'fieldName') ? `<td ${colspan}><p>${row[key]}</p></td>` : `<td><p>${row[key]}</p></td>`;
        }
        _blank = idx == 0 && level > 1 ? (rowspan > 1 ? `<td rowspan="${rowspan}"></td>` : rowspan > 0 ? '<td rowspan></td>' : '') : '';
        let val = `<tr>${_blank}${_html}</tr>`;
        return val;
    },
    renderRow: function(rows, level){
        let html = '', result = '';
        rows.forEach((row, idx) => {
            _level = level;
            if(!row.subs || row.subs.length == 0){
                result = tableModule.createRowHtml(row, _level, idx);
            }else{
                result = tableModule.createRowHtml(row, level, 0);
                _level = level + 1;
                result += tableModule.renderRow(row.subs, _level);
            }
            html += result;
        });
        return html;
    },
    renderHead: function(obj){
        if(({}).toString.call(obj) != '[object Object]'){ return null; }
        let head = '', _col = '', _label, _colspan, _width, _createCols = false;
        for(let key in obj){
            if(typeof(obj[key]) != 'object'){ continue; }
            _createCols = true;
            break;
        }
        if(_createCols){
            for(let i = 0; i < tableModule.tableInfo.colCount -1; i++){ _col += '<col>'; }
        }
        for(let key in obj){
            _label = typeof(obj[key]) == 'string' ? obj[key] : obj[key].name;
            _width = typeof(obj[key]) == 'object' ? (obj[key].width || '') : '';
            if(!!_width){ _width = `width:${_width};`; }
            if(_createCols){ _col += `<col style="${_width}">`; }
            _colspan = key == 'fieldName' ? ` colspan="${obj[key].colspan || tableModule.tableInfo.colCount}"` : '';
            head += `<th${_colspan}>${_label}</th>`;
        }
        if(!!_col){ _col = `<colgroup>${_col}</colgroup>`; }
        return `${_col}<tr>${head}</tr>`;
    }
}

// 自定义指令处理函数（函数名即自定义指令名）
export default {
    table_render: function(html, data){
        if(({}).toString.call(data) != '[object Object]'){ return null; }
        tableModule.tableInfo.colCount = 1;
        tableModule.tableInfo.rowCount = {};
        tableModule.initTableInfo(data.table, 1);
        let thead = tableModule.renderHead(data.tableHead);
        let tbody = tableModule.renderRow(data.table, 1);
        return `<table cellspacing="0">${thead}${tbody}</table>`;
    }
}