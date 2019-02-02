
// urlでクエリが渡されていれば実行
if(location.search) {

	// 保育施設の読み込みとレイヤーの追加
	Papamamap.prototype.loadNurseryFacilitiesJson(function(data){
		nurseryFacilities = data;
	})
  .then(function(){        // 検索条件のテキストと検索結果の一覧Tableを作成
    createFilteredList();
  }, function(error) {     // 非同期処理がエラーで終了した場合
    document.getElementById("filterCondition").textContent = '検索結果の取得に失敗しました。';
  });

  //// 以下、非同期処理中に実行させる

  // 新規タブのURLクエリより条件をパース
  var conditions = {};
  location.search
    .substr(1)
    .split('&')
    .forEach(function(item) {
      item.split('=')
        .reduce(function(p,c) {
          conditions[p] = c;
         });
     });

  var checkObj = {};
  Object.keys(facilityObj).forEach(function(elem){
    checkObj[elem] = false;
  });

  // コンテンツの作成
  var table = document.createElement('table');
  table.classList.add('table');
  var thead = document.createElement('thead');
  var tbody = document.createElement('tbody');

  // 検索結果一覧のtheadを作成
  createThead(thead);

}


function createFilteredList () {

  var filter = new FacilityFilter();
  ga_label = 0; // 定義のみで使用されない
  var features = filter.getFilteredFeaturesGeoJson( // checkObjを参照渡しで表示レイヤーを取得する
        {conditions, checkObj, ga_label},
        nurseryFacilities
  ).features;

  var trueType = Object.keys(checkObj).map(function(elem){
    if (checkObj[elem] ) return facilityObj[elem].type;
  });

  // 検索結果一覧のtbodyを作成
  Object.keys(features).forEach(function(item) {
    trueType.forEach(function(type) {
      if(features[item].properties.Type === type) {
        createTbody(tbody, features[item].properties);
      }
    });
  });

  // Tableの各Nodeを連結してからdiv'filteredList'と紐づけ
  table.appendChild(thead);
  table.appendChild(tbody);
  document.getElementById("filteredList").appendChild(table);
  document.getElementById("filteredList").classList.add('table-responsive');

  // 絞り込み条件のテキスト生成
  createFilterText();
}

// 検索結果のTable theadを作成する関数
function createThead(parent) {

  var tr = document.createElement('tr');

  [
    '施設名(区分)',
    '開園/終園',
    '対象年齢',
    '対応',
    '備考',
    '情報',
  ].forEach(function(elem){
    var th = document.createElement('th');
    th.textContent = elem;
    tr.appendChild(th);
  });

  // theadにtrを追加
  parent.appendChild(tr);
}

// 検索結果のTable tbodyを作成する関数
function createTbody(parent, p) {

  var elem = 'td';
  var tr = document.createElement('tr');

  // 施設名、施設区分
  var type = document.createElement(elem);
  var ul_name  = document.createElement('ul');
  var li_name  = document.createElement('li');
  li_name.textContent = p.Name;
  ul_name.appendChild(li_name);
  var ul_type  = document.createElement('ul');
  var li_type  = document.createElement('li');
  li_type.textContent = '(' + p.Type + ')';
  ul_name.appendChild(li_type);
  type.appendChild(ul_name);
  tr.appendChild(type);

  // 開園、終園時間
  var open = document.createElement(elem);
  open.textContent = p.Open + ' ~ ' + p.Close;
  tr.appendChild(open);

  // 対象年齢
  var age = document.createElement(elem);
  age.textContent = p.AgeS + ' ~ ' + p.AgeE;
  tr.appendChild(age);

  // 一時保育、延長保育、夜間、24時間をひとくくり
  var service = document.createElement(elem);
  var ul_service  = document.createElement('ul');
  if(p.Temp) {
    var li_temp  = document.createElement('li');
    li_temp.textContent = '一時保育';
    ul_service.appendChild(li_temp);
  }
  if(p.Extra) {
    var li_extra  = document.createElement('li');
    li_extra.textContent = '延長保育';
    ul_service.appendChild(li_extra);
  }
  if(p.Night) {
    var li_night  = document.createElement('li');
    li_night.textContent = '夜間';
    ul_service.appendChild(li_night);
  }
  if(p.H24) {
    var li_h24  = document.createElement('li');
    li_h24.textContent = '24時間';
    ul_service.appendChild(li_h24);
  }
  service.appendChild(ul_service);
  tr.appendChild(service);

  // 備考
  var memo = document.createElement(elem);
  memo.textContent = p.Memo;
  tr.appendChild(memo);

  // 住所、TEL、FAX、urlをひとくくり
  var info = document.createElement(elem);
  var ul_info  = document.createElement('ul');
  if(p.Add1) {
    var li_add  = document.createElement('li');
    li_add.textContent = p.Add1 + ' ' + p.Add2;
    ul_info.appendChild(li_add);
  }
  var li_tel  = document.createElement('li');
  if(p.TEL) {
    li_tel.textContent = 'TEL ' + p.TEL;

  }
  if(p.FAX) {
    li_tel.textContent = li_tel.textContent + ' / FAX ' + p.FAX;
  }
  if(p.TEL || p.FAX) {
    ul_info.appendChild(li_tel);
  }
  if(p.url) {
    var li_url = document.createElement('li');
    var a_url = document.createElement('a');
    a_url.setAttribute('href', p.url);
    a_url.setAttribute('target','_blank');
    a_url.textContent = '施設のWebサイトを開く';
    li_url.appendChild(a_url);
    ul_info.appendChild(li_url);
  }
  info.appendChild(ul_info);
  tr.appendChild(info);

  // tbodyにtrを追加
  parent.appendChild(tr);
}

// 絞り込み条件のテキスト生成
function createFilterText() {
  
  var textObj = {};
  Object.keys(facilityObj).forEach(function(type){
    Object.keys(filterObj).forEach(function(filter){
      if(conditions[type+filter]) {  // １つの施設に複数の条件が指定されてる場合
        if(textObj[facilityObj[type].type]) {
          textObj[facilityObj[type].type] += ('、' + filterObj[filter]);
        } else {
          textObj[facilityObj[type].type] = filterObj[filter];
        }
        if(filter === 'OpenTime' || filter === 'CloseTime') {
          textObj[facilityObj[type].type] += conditions[type+filter];
        }
      }
    });
  });

  document.getElementById("filterCondition").textContent = '絞り込み条件 : ';
  document.getElementById("filterCondition").appendChild(document.createElement('br'));

  // " - 施設名 (条件)"のテキスト生成
  Object.keys(textObj).forEach(function(type){
    var elem_span = document.createElement('span');
    elem_span.textContent = ' - ' + type + ' (' + textObj[type] + ')';
    document.getElementById("filterCondition").appendChild(elem_span);
    document.getElementById("filterCondition").appendChild(document.createElement('br'));
  });
}
