/**
 * Papamamap :
 *   コンストラクタであり、index.jsの$('#mainPage').onでnewされる
 * 
 * @property {object}         map ol.Map
 * @property {Array.<number>} viewCenter マップの初期中心座標
 * @property {number}         centerLatOffsetPixel 緯度表示位置の調整用オフセット
 *
 */
window.Papamamap = function(init_center_coords, mapServer) {
    this.map;
    this.popup;
    this.viewCenter = init_center_coords;
    this.centerLatOffsetPixel = 75;
    this.generate(mapServer);
};

/**
 * マップを作成して保持する
 *
 * @param  {object} mapServerListItem マップサーバのオブジェクト
 */
Papamamap.prototype.generate = function(mapServerListItem)
{
    this.map = new ol.Map({
        target: 'map', // index.htmlの#map
        layers: [
            new ol.layer.Tile({
                opacity: 1.0,
                name: 'layerTile',
                source: mapServerListItem.source
            }),
            // 中学校区レイヤーグループ
            new ol.layer.Group({
                layers:[
                    // 中学校区ポリゴン
                    new ol.layer.Vector({
                        source: new ol.source.GeoJSON({
                            projection: 'EPSG:3857',
                            url: 'data/MiddleSchool.geojson'
                        }),
                        name: 'layerMiddleSchool',
                        style: middleSchoolStyleFunction,
                    }),
                    // 中学校区位置
                    new ol.layer.Vector({
                        source: new ol.source.GeoJSON({
                            projection: 'EPSG:3857',
                            url: 'data/MiddleSchool_loc.geojson'
                        }),
                        name: 'layerMiddleSchoolLoc',
                        style: middleSchoolStyleFunction,
                    }),
                ],
                visible: false
            }),
            // 小学校区レイヤーグループ
            new ol.layer.Group({
                layers:[
                     // 小学校区ポリゴン
                     new ol.layer.Vector({
                         source: new ol.source.GeoJSON({
                             projection: 'EPSG:3857',
                             url: 'data/Elementary.geojson'
                         }),
                         name: 'layerElementarySchool',
                         style: elementaryStyleFunction,
                     }),
                     // 小学校区位置
                     new ol.layer.Vector({
                         source: new ol.source.GeoJSON({
                             projection: 'EPSG:3857',
                             url: 'data/Elementary_loc.geojson'
                         }),
                         name: 'layerElementarySchoolLoc',
                         style: elementaryStyleFunction,
                     })
                ],
                visible: false
            }),
            // 距離同心円描画用レイヤー
            new ol.layer.Vector({
                 source: new ol.source.Vector(),
                 name: 'layerCircle',
                 style: circleStyleFunction,
                 visible: true
            }),
        ],
        view: new ol.View({
            center: ol.proj.transform(this.viewCenter, 'EPSG:4326', 'EPSG:3857'),
            zoom: 13,
            maxZoom: 18,
            minZoom: 10
        }),
        controls: [
             new ol.control.Attribution({collapsible: true}),
             new ol.control.ScaleLine({}), // 距離ライン定義
             new ol.control.Zoom({}),
             new ol.control.ZoomSlider({}),
             new MoveCurrentLocationControl()
        ]
    });
};

// 指定した名称のレイヤーの表示・非表示を切り替える
Papamamap.prototype.switchLayer = function(layerName, visible)
{
    // layerNameはcheckboxのid属性から取得しているため先頭の"cb"を取り除く
    var _layerName = this.getLayerName(layerName.substr(2));

    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == _layerName) {
            layer.setVisible(visible);
        }
    });
};

// レイヤー名を取得する
Papamamap.prototype.getLayerName = function(name)
{
    return 'layer' + name.slice(0,1).toUpperCase() + name.slice(1);
};

/**
 * 指定した座標にアニメーションしながら移動する
 * isTransform:
 * 座標参照系が変換済みの値を使うには false,
 * 変換前の値を使うには true を指定
 */
Papamamap.prototype.animatedMove = function(lon, lat, isTransform) {

    // map から view を取得する
    view = this.map.getView();
    var pan = ol.animation.pan({
        duration: 850,
        source: view.getCenter()
    });
    this.map.beforeRender(pan);
    var coordinate = [lon, lat];
    if(isTransform) {
        // 座標参照系を変換する
        coordinate = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
    } else {
        // 座標系を変換しない
        // モバイルでポップアップ上部が隠れないように中心をずらす
        var pixel = this.map.getPixelFromCoordinate(coordinate);
        pixel[1] = pixel[1] - this.centerLatOffsetPixel;
        coordinate = this.map.getCoordinateFromPixel(pixel);
    }
    view.setCenter(coordinate);
};


// facilityObjの施設分のレイヤーを追加する
Papamamap.prototype.addNurseryFacilitiesLayer = function(facilitiesData)
{
    // Papamamap.prototype.generate()のnew ol.Map()の
    // 初期化で追加したレイヤー以外は削除する。
    while (this.map.getLayers().getLength() > 4) {
        this.map.removeLayer(this.map.getLayers().item(4));
    }

    Object.keys(facilityObj).reverse().forEach(function(elem){
        this.map.addLayer(
            new ol.layer.Vector({
                source: new ol.source.GeoJSON({
                    projection: 'EPSG:3857',
                    object: facilitiesData
                }),
                name: Papamamap.prototype.getLayerName(elem),
                style: StyleFunctionFactory(facilityObj[elem].type)
                // style: window[elem+'StyleFunction']
            })
        );
    });
};

/**
 * 保育施設データの読み込みを行う
 * @return {[type]} [description]
 */
Papamamap.prototype.loadNurseryFacilitiesJson = function(successFunc)
{
    var d = new $.Deferred();
    $.getJSON(
        "data/nurseryFacilities.geojson",
        function(data) {
            successFunc(data);
            d.resolve();
        }
    ).fail(function(){
        console.log('station data load failed.');
        d.reject('load error.');
    });
    return d.promise();
};

/**
 *
 * @param  {[type]} mapServerListItem [description]
 * @param  {[type]} opacity           [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.changeMapServer = function(mapServerListItem, opacity)
{
    this.map.removeLayer(this.map.getLayers().item(0));
    var layer;
    if(mapServerListItem.source_type === 'image') {
        layer = new ol.layer.Image({
            opacity: opacity,
            source: mapServerListItem.source
        });
    } else {
        layer = new ol.layer.Tile({
            opacity: opacity,
            source: mapServerListItem.source
        });
    }
    this.map.getLayers().insertAt(0, layer);
};

/**
 * 指定した名前のレイヤー情報を取得する
 * @param  {[type]} layerName [description]
 * @return {[type]}           [description]
 */
Papamamap.prototype.getLayer = function(layerName)
{
    var result;
    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == layerName) {
            result = layer;
        }
    });
    return result;
};

/**
 * 指定した場所に地図の中心を移動する。
 * 指定した場所情報にポリゴンの座標情報を含む場合、ポリゴン外枠に合わせて地図の大きさを変更する
 *
 * @param  {[type]} mapServerListItem [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.moveToSelectItem = function(mapServerListItem)
{
    if(mapServerListItem.coordinates !== undefined) {
        // 区の境界線に合わせて画面表示
        var components = mapServerListItem.coordinates.map(function(elem){
            ol.proj.transform(elem, 'EPSG:4326', 'EPSG:3857');
        });

        var polygon = new ol.geom.Polygon([components]);
        var size =  this.map.getSize();
        var view = this.map.getView();

        var pan = ol.animation.pan({
            duration: 850,
            source: view.getCenter()
        });
        this.map.beforeRender(pan);

        var feature = new ol.Feature({
            name: mapServerListItem.name,
            geometry: polygon
        });
        // if文でtrueは呼ばれることはないようで、以下のコードが問題ないか未確認
        var source = this.getLayer(this.getLayerName("Circle")).getSource()
        source.clear();
        source.addFeature(feature);

        view.fitGeometry(
            polygon,
            size,
            {constrainResolution: false}
        );
    } else {
        // 選択座標に移動
        lon = mapServerListItem.lon;
        lat = mapServerListItem.lat;
        if(lon !== undefined && lat !== undefined) {
            this.animatedMove(lon, lat, true);
        }
    }
};

/**
 * [getPopupTitle description]
 * @param  {[type]} feature [description]
 * @return {[type]}         [description]
 */
Papamamap.prototype.getPopupTitle = function(feature)
{
    // タイトル部
    var title = '';
    var type = feature.get('Type');
    title  = '[' + type + '] ';
    var owner = feature.get('Ownership');
    if(!isUndefined(owner)) {
        title += ' [' + owner +']';
    }
    var name = feature.get('Name');
    title += name;
    url = feature.get('url');
    if(!isUndefined(url)) {
        title = '<a href="' +url+ '" target="_blank">' + title + '</a>';
    }
    return title;
};

/**
 * [getPopupContent description]
 * @param  {[type]} feature [description]
 * @return {[type]}         [description]
 */
Papamamap.prototype.getPopupContent = function(feature)
{
    var contentFactory = {
        content: '<table><tbody>',
        addContent: function(rowSet){
            this.content += '<tr>';
            this.content += `<th>${rowSet.th}</th>`;
            this.content += `<td>${rowSet.td}</td>`;
            this.content += '</tr>';
        },
        completeContent: function(){
            this.content += '</tbody></table>';
            return this.content;
        }
    };

    var open  = feature.get('Open');
    var close = feature.get('Close');
    if (!isUndefined(open) && !isUndefined(close)) {
        contentFactory.addContent({
            th: '時間',
            td: open + '〜' + close
        });
    }

    var memo = feature.get('Memo');
    if (!isUndefined(memo)) {
        contentFactory.addContent({
            th: '',
            td: memo
        });
    }    

    // ヘッダー非使用のコンテンツ
    var items = "";
    [
        temp    = feature.get('Temp') ? '一時保育 ' : "",
        holiday = feature.get('Holiday') ? '休日保育 ' : "",
        night   = feature.get('Night') ? '夜間保育 ' : "",
        h24     = feature.get('H24') ? '24時間 ' : "",
        extra   = feature.get('Extra') ? '延長保育 ' : "",
        disability = feature.get('児童発達支援') ? '児童発達支援 ' : "",
        d_degree   = feature.get('重心（児童発達）') ? `(${feature.get('重心（児童発達）')})` : "",
        after = feature.get('放課後デイ') ? '放課後デイ ' : "",
        a_degree   = feature.get('重心（放課後デイ）') ? `(${feature.get('重心（放課後デイ）')})` : ""
    ].forEach(function(elem){
        items += elem ? elem : "";
    });
    if (items !== "") {
        contentFactory.addContent({
            th: '',
            td: items
        });
    }

    var ageS = feature.get('AgeS');
    var ageE = feature.get('AgeE');
    if (!isUndefined(ageS) && !isUndefined(ageE)) {
        contentFactory.addContent({
            th: '年齢',
            td: ageS + '〜' + ageE
        });
    }

    var full = feature.get('Full');
    if (!isUndefined(full)) {
        contentFactory.addContent({
            th: '定員',
            td: full
        });
    }

    var tel = feature.get('TEL');
    if (!isUndefined(tel)) {
        contentFactory.addContent({
            th: 'TEL',
            td: tel
        });
    }

    var fax = feature.get('FAX');
    if (!isUndefined(fax)) {
        contentFactory.addContent({
            th: 'FAX',
            td: fax
        });
    }

    var add = feature.get('Add1') + feature.get('Add2');
    if (!isUndefined(add)) {
        contentFactory.addContent({
            th: '住所',
            td: add
        });
    }

    var owner = feature.get('Owner');
    if (!isUndefined(owner)) {
        contentFactory.addContent({
            th: '設置者',
            td: owner
        });
    }

    var foundation = feature.get('設立年度');
    if (!isUndefined(foundation)) {
        contentFactory.addContent({
            th: '設立年度',
            td: foundation + '年'
        });
        // var foundation_year = foundation.substring(0, 4);
        // var current_date = new Date();
        // var diffday = compareDate(current_date.getFullYear(), current_date.getMonth()+1, current_date.getDate(), foundation.substring(0, 4), foundation.substring(4, 5), foundation.substring(5, 6));
        // if(diffday <= 365*2){
        //     content += '<tr>';
        //     content += '<th>設立年度</th>';
        //     content += '<td>' + foundation_year + "年新設" + '</td>';
        //     if(diffday < 0){
        //         content += '<td>' + "予定" + '</td>';
        //     }
        //     content += '</tr>';
        // }
    }

    var pre = feature.get('プレ幼稚園');
    if (!isUndefined(pre)) {
        contentFactory.addContent({
            th: 'プレ幼稚園',
            td: (pre === "Y") ? "あり" : "なし" 
        });
    }

    var bus = feature.get('園バス');
    if (!isUndefined(bus)) {
        contentFactory.addContent({
            th: '園バス',
            td: (bus === "Y") ? "あり" : "なし" 
        });
    }

    var lunch = feature.get('給食');
    if (!isUndefined(lunch)) {
        contentFactory.addContent({
            th: '給食',
            td: lunch
        });
    }

    return contentFactory.completeContent();
};

/**
* 空文字判定関数
* 　引数が未定義、null、空文字いずれかの場合はnullを返却する
* 　それ以外の時はparamを返却する
* @param {[type]}
* @return {[type]}
**/
function formatNull(param){
  return (param == null || param == undefined || param =="")
  ? null : param;
}

/**
* 未定義カラム判定関数
* 　引数が未定義、null、空文字いずれかの場合はtrueを返却する
* @param {[type]}
* @return {[type]}
**/
function isUndefined(param){
  return (param == null || param == undefined || param =="")
  ? true : false;
}

/* 日付の差を求める関数*/
function compareDate(year1, month1, day1, year2, month2, day2) {
    var dt1 = new Date(year1, month1 - 1, day1);
    var dt2 = new Date(year2, month2 - 1, day2);
    var diff = dt1 - dt2;
    var diffDay = diff / 86400000;//1日は86400000ミリ秒
    return diffDay;
}

/**
 * 円を消す
 *
 * @param  {[type]} radius      [description]
 * @param  {[type]} moveToPixel [description]
 * @return {[type]}             [description]
 */
Papamamap.prototype.clearCenterCircle = function()
{
    this.getLayer(this.getLayerName("Circle"))
        .getSource()
        .clear()
};

/**
 * 円を描画する
 *
 * @param  {[type]} radius      [description]
 * @param  {[type]} moveToPixel [description]
 * @return {[type]}             [description]
 */
Papamamap.prototype.drawCenterCircle = function(radius, moveToPixel)
{

    moveToPixel　= moveToPixel || 0;
    radius = Math.floor((radius || 500)); // 選択した半径の同心円を描く

    // 円を消す
    this.clearCenterCircle();

    var coordinate = this.map.getView().getCenter();
    if(moveToPixel > 0) {
        var pixel = map.getPixelFromCoordinate(coordinate);
        pixel[1] = pixel[1] + moveToPixel;
        coordinate = map.getCoordinateFromPixel(pixel);
    }

    
    // 中心部の円を描く
    var sphere = new ol.Sphere(6378137); // ol.Sphere.WGS84 ol.js には含まれてない
    coordinate = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

    // 描画する円からextent情報を取得し、円の大きさに合わせ画面の縮尺率を変更
    geoCircle = ol.geom.Polygon.circular(sphere, coordinate, radius);
    geoCircle.transform('EPSG:4326', 'EPSG:3857');
    circleFeature = new ol.Feature({
        geometry: geoCircle
    });
    this.getLayer(this.getLayerName("Circle"))
        .getSource()
        .addFeatures([circleFeature]);

    // 大きい円に合わせて extent を設定
    var extent = geoCircle.getExtent();
    var sizes  = this.map.getSize();
    var size   = (sizes[0] < sizes[1]) ? sizes[0] : sizes[1];
    this.map.getView().fitExtent(
        extent,
        [size, size]
    );

    // 円の内部に施設が含まれるかチェック
    var _features = nurseryFacilities.features.filter(function(item,idx){
        var coordinate = ol.proj.transform(item.geometry.coordinates, 'EPSG:4326', 'EPSG:3857');
        if(ol.extent.containsCoordinate(extent, coordinate))
            return true;
        });
    _features.forEach(function(elem){
        console.log(_features[i].properties['Name']);
    });
    console.log(_features);
};
