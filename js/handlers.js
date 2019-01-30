/**
 * 現在地に移動するためのカスタムコントロールを定義
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object=} opt_options Control options.
 */
window.MoveCurrentLocationControl = function(opt_options) {
    var options = opt_options || {};

    var element = document.createElement('div');
    element.id  = 'moveCurrentLocation';
    element.className = 'move-current-location ol-control ui-icon-navigation ui-btn-icon-notext';

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};
ol.inherits(MoveCurrentLocationControl, ol.control.Control);

/**
 * 現在位置を取得し、指定した関数に情報を引き渡して実行する
 *
 * @param  function successFunc 現在位置の取得に成功時に実行する関数
 * @param  function failFunc    現在位置の取得に失敗した時に実行する関数
 */
MoveCurrentLocationControl.prototype.getCurrentPosition = function(successFunc, failFunc)
{
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successFunc, failFunc);
    } else {
        failFunc();
    }
};


window.MoveToList = function() {};

/**
 * 駅geojsonファイルを読み込み、moveToList配列に格納する
 * @return {object} Promise
 */
MoveToList.prototype.loadStationJson = function()
{
    var d = new $.Deferred();
    // 駅位置JSONデータ読み込み〜セレクトボックス追加
    $.getJSON(
        "data/station.geojson",
        function(data){
            moveToList.push( {name: "公共交通機関施設", header:true} );
            var lineName = "";
            for(var i=0; i<data.features.length; i++) {
                _s = data.features[i].properties.N05_003 + " (" + data.features[i].properties.N05_002 + ")";
                if(lineName !== _s) {
                    moveToList.push({name: _s, header: true});
                    lineName = _s;
                }
                moveToList.push({
                    name: data.features[i].properties.N05_011,
                    lat: data.features[i].geometry.coordinates[1],
                    lon: data.features[i].geometry.coordinates[0],
                    header: false
                });
            }
            d.resolve();
        }).fail(function(){
            console.log('station data load failed.');
            d.reject('load error.');
        });
    return d.promise();
};

/**
 * 最寄駅セレクトボックスに要素を追加する
 * @param  array moveToList loadStationJsonのresolbe時の戻り値
 */
MoveToList.prototype.appendToMoveToListBox = function(moveToList)
{
    var nesting = "";
    for(i=0; i < moveToList.length; i++) {
        if(moveToList[i].header) {
            if(nesting !== "") $('#moveTo').append(nesting);
            nesting = $('<optgroup>').attr('label', moveToList[i].name);

        } else {
            nesting.append($('<option>').html(moveToList[i].name).val(i));
        }
    }
    if(nesting !== "") $('#moveTo').append(nesting);
};
