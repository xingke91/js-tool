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
    function renderHead(obj){
        if(({}).toString.call(obj) != '[object Object]') return null; 
        let head = '', _col, _label, _colspan, _width;
        for(let key in obj){
            if(typeof(obj[key]) != 'object') continue;
            _col = '<col>'.repeat(tableInfo.colCount -1);
            break;
        }
        for(let key in obj){
            _label = typeof(obj[key]) == 'string' ? obj[key] : obj[key].name;
            _width = typeof(obj[key]) == 'object' ? (obj[key].width || '') : '';
            if(!!_width){
                _width = `width:${_width};`;
            }
            if(_col){
                _col += `<col style="${_width}">`;
            }
            _colspan = key == 'fieldName' ? ` colspan="${obj[key].colspan || tableInfo.colCount}"` : '';
            head += `<th${_colspan}>${_label}</th>`;
        }
        return !!_col ? `<colgroup>${_col}</colgroup><tr>${head}</tr>` : `<tr>${head}</tr>`;
    }
    function createRowHtml (row, level, idx){
        if(({}).toString.call(row) != '[object Object]') return null;
        let _html = '', _blank = '', _key = `${row.fieldName}_${level}`;
        let colspan = tableInfo.colCount - level + 1;
        colspan = colspan > 1 ? ` colspan="${colspan}"` : '';
        let rowspan = tableInfo.rowCount[_key] || 0;
        for (let key in row) {
            if(key == tableConf.nestedField) continue;
            _html += (key == 'fieldName') ? `<td ${colspan}><p>${row[key]}</p></td>` : `<td><p>${row[key]}</p></td>`;
        }
        _blank = idx == 0 && level > 1 ? (rowspan > 1 ? `<td rowspan="${rowspan}"></td>` : rowspan > 0 ? '<td rowspan></td>' : '') : '';
        let val = `<tr>${_blank}${_html}</tr>`;
        return val;
    }
    function renderRow (rows, level){
        let html = '', result = '';
        rows.forEach((row, idx) => {
            _level = level;
            if(!row.subs || row.subs.length == 0){
                result = createRowHtml(row, _level, idx);
            }else{
                result = createRowHtml(row, level, 0);
                _level = level + 1;
                result += renderRow(row.subs, _level);
            }
            html += result;
        });
        return html;
    }
    return function render (data, config) {
        if(({}).toString.call(data) != '[object Object]'){
            throw Error('parameter "data" must be an Object!');
        }
        tableConf = Object.assign(tableConf, config);
        tableInfo = { colCount: 1, rowCount: {} };
        initStructureInfo(data.table, 1);
        let thead = renderHead(data.tableHead);
        let tbody = renderRow(data.table, 1);
        return `<table cellspacing="0">${thead}${tbody}</table>`;
    }
})();
