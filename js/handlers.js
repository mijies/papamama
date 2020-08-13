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


// メニューバーとロゴをWindowサイズに合わせて配置を変更する
function toggleNavbar() {

    // // マップのサイズを画面サイズに調整
    resizeMapDiv();

    var elem = document.getElementsByClassName("nav1-li");
    document.getElementById("nav1").style.top = "0px";
    document.getElementById("nav1").style.left = "50px";

    Object.keys(elem[0].children).forEach(function(item){
        elem[0].children[item].style.width = "";
    });
    ["btnFilter", "btnNewSchool", "changeBaseMap-button", "moveTo-button", "changeCircleRadius-button", "btnHelp"].forEach(function(evt) {
        document.getElementById(evt).style.width = "";
    });

    elem[0].style.display ="inline-block";
    elem[1].style.display ="inline-block";

    var btn = document.getElementById("nav1-btn-div");
    btn.style.display = "none";

    var logo = document.getElementById("map-logo");
    logo.style.left = window.innerWidth / 2 - 115 + "px";

    // Windowサイズがメニューの幅より小さい場合(つまりメニューが複数行となる場合)
    if (elem[0].clientHeight > 50) {
        elem[0].style.display ="none";
        elem[1].style.display ="none";
        btn.style.display = "block";
        logo.style.top = "0";
        logo.style.height = "0";
        logo.style.bottom = "";

        Object.keys(elem[0].children).forEach(function(i){
            elem[0].children[i].style.width =  (window.innerWidth / 3 * 1) + "px";
        });
        ["btnFilter", "btnNewSchool", "changeBaseMap-button", "moveTo-button", "changeCircleRadius-button", "btnHelp"].forEach(function(e) {
            document.getElementById(e).style.width = (window.innerWidth / 3 * 1) + "px";
        });

        document.getElementById("nav1").style.top = (btn.clientHeight - 5) + "px";
        if (window.innerHeight > 580) {
                document.getElementById("nav1").style.left = (window.innerWidth / 3 * 2 - 5) + "px";
        } else {
                document.getElementById("nav1").style.left = (window.innerWidth / 3 * 1 - 5) + "px";
        }

    // Windowサイズがメニューの幅より大きい場合
    } else {
        elem[0].style.display ="inline-block";
        elem[1].style.display ="inline-block";
        btn.style.display = "none";
        logo.style.top = "";
        logo.style.bottom = "30px";
    }
};