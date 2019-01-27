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
 * @param  {[type]} mapServerListItem [description]
 * @return {[type]}                   [description]
 */
Papamamap.prototype.generate = function(mapServerListItem)
{
    this.map = new ol.Map({
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
        target: 'map',
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

/**
 * レイヤー名を取得する
 * @param  {[type]} cbName [description]
 * @return {[type]}        [description]
 */
Papamamap.prototype.getLayerName = function(name)
{
    return 'layer' + name;
};

/**
 * 指定した名称のレイヤーの表示・非表示を切り替える
 * @param  {[type]} layerName [description]
 * @param  {[type]} visible   [description]
 * @return {[type]}           [description]
 */
Papamamap.prototype.switchLayer = function(layerName, visible) {
    // layerNameはcheckboxのid属性から取得しているため先頭の"cb"を取り除く
    var _layerName = this.getLayerName(layerName.substr(2));
    this.map.getLayers().forEach(function(layer) {
        if (layer.get('name') == _layerName) {
            layer.setVisible(visible);
        }
    });
};

/**
 * 指定した座標にアニメーションしながら移動する
 * isTransform:
 * 座標参照系が変換済みの値を使うには false,
 * 変換前の値を使うには true を指定
 */
Papamamap.prototype.animatedMove = function(lon, lat, isTransform)
{
    // グローバル変数 map から view を取得する
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


/**
 * 指定したgeojsonデータを元に公立認可・私立認可・小規模等・横浜保育室・認可外・幼稚園レイヤーを描写する
 *    ※上記以外に描写レイヤーを追加する時は、下の this.map.removeLayer(this.map.getLayers().item(4)); も追加レイヤーの数だけ追加してください！
 *
 * @param {[type]} facilitiesData [description]
 */
Papamamap.prototype.addNurseryFacilitiesLayer = function(facilitiesData)
{
    /**
     * Papamamap.prototype.generate()のnew ol.Map()の
     * 初期化で追加したレイヤー以外は削除する。
     */
    while (this.map.getLayers().getLength() > 4) {
        this.map.removeLayer(this.map.getLayers().item(4));
    }

    // 幼稚園
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerKindergarten',
            style: kindergartenStyleFunction
        })
    );
    // 認可外
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerNinkagai',
            style: ninkagaiStyleFunction
        })
    );
    // 私立認可
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerPriNinka',
            style: priNinkaStyleFunction
        })
    );
    // 公立認可
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerPubNinka',
            style: pubNinkaStyleFunction
        })
    );
    // 横浜保育室
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerYhoiku',
            style: yhoikuStyleFunction
        })
    );
    // 小規模・事業所内保育事業
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerJigyosho',
            style: jigyoshoStyleFunction
        })
    );
    // 障害児通所支援事業
    this.map.addLayer(
        new ol.layer.Vector({
            source: new ol.source.GeoJSON({
                projection: 'EPSG:3857',
                object: facilitiesData
            }),
            name: 'layerDisability',
            style: disabilityStyleFunction
        })
    );
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
    source_type = mapServerListItem.source_type;
    var layer = null;
    switch(source_type) {
        case 'image':
            layer = new ol.layer.Image({
                opacity: opacity,
                source: mapServerListItem.source
            });
            break;
        default:
            layer = new ol.layer.Tile({
                opacity: opacity,
                source: mapServerListItem.source
            });
            break;
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
    result = null;
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
        components = [];
        for(var i=0; i<mapServerListItem.coordinates.length; i++) {
            coord = mapServerListItem.coordinates[i];
            pt2coo = ol.proj.transform(coord, 'EPSG:4326', 'EPSG:3857');
            components.push(pt2coo);
        }
        components = [components];

        view = this.map.getView();
        polygon = new ol.geom.Polygon(components);
        size =  this.map.getSize();
        var pan = ol.animation.pan({
            duration: 850,
            source: view.getCenter()
        });
        this.map.beforeRender(pan);

        feature = new ol.Feature({
            name: mapServerListItem.name,
            geometry: polygon
        });
        layer = this.getLayer(this.getLayerName("Circle"));
        source = layer.getSource();
        source.clear();
        source.addFeature(feature);

        view.fitGeometry(
            polygon,
            size,
            {
                constrainResolution: false
            }
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

    var type = feature.get('Type');

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
    var add1 = feature.get('Add1');
    var add2 = feature.get('Add2');
    if (!isUndefined(add1) || !isUndefined(add2)) {
        contentFactory.addContent({
            th: '住所',
            td: add1 + add2
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
            td: foundation
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
  if(param == null || param == undefined || param ==""){
    return null;
  } else {
    return param;
  }
}

/**
* 未定義カラム判定関数
* 　引数が未定義、null、空文字いずれかの場合はtrueを返却する
* @param {[type]}
* @return {[type]}
**/
function isUndefined(param){
  if(param == null || param == undefined || param ==""){
    return true;
  } else {
    return false;
  }
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
    var layer = this.getLayer(this.getLayerName("Circle"));
    var source = layer.getSource();
    source.clear();
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
    if(moveToPixel === undefined || moveToPixel === null) {
        moveToPixel = 0;
    }
    if(radius === "") {
        radius = 500;
    }

    // 円を消す
    this.clearCenterCircle();

    view  = this.map.getView();
    coordinate = view.getCenter();
    if(moveToPixel > 0) {
        var pixel = map.getPixelFromCoordinate(coordinate);
        pixel[1] = pixel[1] + moveToPixel;
        coordinate = map.getCoordinateFromPixel(pixel);
    }
    // circleFeatures = drawConcentricCircle(coord, radius);

    // 選択した半径の同心円を描く
    radius = Math.floor(radius);

    circleFeatures = [];
    // 中心部の円を描く
    var sphere = new ol.Sphere(6378137); // ol.Sphere.WGS84 ol.js には含まれてない
    coordinate = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');

    // 描画する円からextent情報を取得し、円の大きさに合わせ画面の縮尺率を変更
    geoCircle = ol.geom.Polygon.circular(sphere, coordinate, radius);
    geoCircle.transform('EPSG:4326', 'EPSG:3857');
    circleFeature = new ol.Feature({
        geometry: geoCircle
    });
    circleFeatures.push(circleFeature);

    // 大きい円に合わせて extent を設定
    extent = geoCircle.getExtent();
    view   = this.map.getView();
    sizes  = this.map.getSize();
    size   = (sizes[0] < sizes[1]) ? sizes[0] : sizes[1];
    view.fitExtent(extent, [size, size]);

    // 円の内部に施設が含まれるかチェック
    _features = nurseryFacilities.features.filter(function(item,idx){
        coordinate = ol.proj.transform(item.geometry.coordinates, 'EPSG:4326', 'EPSG:3857');
        if(ol.extent.containsCoordinate(extent, coordinate))
            return true;
        });
    for(var i=0; i < _features.length; i++) {
        console.log(_features[i].properties['名称']);
    }
    console.log(_features);

    var layer  = this.getLayer(this.getLayerName("Circle"));
    var source = layer.getSource();
    source.addFeatures(circleFeatures);
    return;
};
