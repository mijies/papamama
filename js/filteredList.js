
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

  var conditions = {}; // 新規タブのURLクエリより条件をパース
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

  contentFactory = new ContentFactory(); // コンテンツの作成
}

// コンストラクタ
function ContentFactory(){
  this.table = document.createElement('table');
  this.table.classList.add('table');
  this.thead = document.createElement('thead');
  this.tbody = document.createElement('tbody');
};

ContentFactory.prototype.createThead = function(){

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

  this.thead.appendChild(tr);
};

ContentFactory.prototype.createTbody = function(p){

  var tr = document.createElement('tr');

  var addContent = function(data){
    var td = document.createElement('td');
    typeof data === 'string'     // 引数が文字列かDOM要素(object)か判定
    ? td.textContent = data
    : td.appendChild(data);
    tr.appendChild(td);
  };

  var addListContent = function(args){
    var ul = document.createElement('ul');
    args.forEach(function(data){
      var li = document.createElement('li');
      typeof data === 'string'     // 引数が文字列かDOM要素(object)か判定
      ? li.textContent = data
      : li.appendChild(data);
      ul.appendChild(li);
    });
    addContent(ul);
  };

  addListContent([p.Name, '(' + p.Type + ')']); // 施設名、施設区分
  addContent(p.Open + ' ~ ' + p.Close);         // 開園、終園時間
  addContent(p.AgeS + ' ~ ' + p.AgeE);          // 対象年齢

  services = [];      // 一時保育、延長保育、夜間、24時間をひとくくり
  if(p.Temp) services.push('一時保育');
  if(p.Extra) services.push('延長保育');
  if(p.Night) services.push('夜間');
  if(p.H24) services.push('24時間');
  addListContent(services);

  addContent(p.Memo);  // 備考

  info = [];           // 住所、TEL、FAX、urlをひとくくり
  if(p.Add1) info.push(p.Add1 + ' ' + p.Add2);
  if(p.TEL && p.FAX) {
    info.push('TEL ' + p.TEL + ' / FAX ' + p.FAX);
  } else if(p.TEL && !(p.FAX)) {
    info.push('TEL ' + p.TEL);
  } else if(!(p.TEL) && p.FAX) {
    info.push('FAX ' + p.FAX);
  }
  if(p.url) {
    var aTag = document.createElement('a');
    aTag.setAttribute('href', p.url);
    aTag.setAttribute('target','_blank');
    aTag.textContent = '施設のWebサイトを開く';
    info.push(aTag);
  }
  addListContent(info);

  this.tbody.appendChild(tr);
};

ContentFactory.prototype.renderContent = function(p){
    this.table.appendChild(this.thead);
    this.table.appendChild(this.tbody);
    document.getElementById("filteredList").appendChild(this.table);
    document.getElementById("filteredList").classList.add('table-responsive');
};

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

  contentFactory.createThead();　// 検索結果一覧のtheadを作成

  Object.keys(features).forEach(function(item) {　// 検索結果一覧のtbodyを作成
    trueType.forEach(function(type) {
      if(features[item].properties.Type === type) {
        contentFactory.createTbody(features[item].properties);
      }
    });
  });

  contentFactory.renderContent();　// Tableの各Nodeを連結してからdiv'filteredList'と紐づけ
  
  createFilterText();              // 絞り込み条件のテキスト生成
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

  Object.keys(textObj).forEach(function(type){    // " - 施設名 (条件)"のテキスト生成
    var elem_span = document.createElement('span');
    elem_span.textContent = ' - ' + type + ' (' + textObj[type] + ')';
    document.getElementById("filterCondition").appendChild(elem_span);
    document.getElementById("filterCondition").appendChild(document.createElement('br'));
  });
}
