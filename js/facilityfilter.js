window.FacilityFilter = function () {};

/**
 * 指定したフィルター条件に一致する施設情報のGeoJSONを生成する
 *
 * @param  {[type]} conditions        [description]
 * @param  {[type]} nurseryFacilities [description]
 * @param  {[type]} checkObj          [description]
 * @return {[type]}                   [description]
 */
FacilityFilter.prototype.getFilteredFeaturesGeoJson = function (filterSet, nurseryFacilities)
{
    'use strict';
    
    var conditions = filterSet.conditions;
    var checkObj = filterSet.checkObj;
    var nameKeyword = filterSet.nameKeyword;

    // 施設名ごとにフィルターをかけるコールバックを返す
    var filterFunc = function (prop, name) {
          return function (item) { return item.properties[prop] == name; };
    };

    // 開園終演時間でフィルターをかけるコールバックを返す
    var filterTimeFunc = function (prop, name) {
          return function (item) {
              var result = [name, item.properties[prop]]
              .map(function(elem){
                var hour = Number(elem.slice(0, elem.indexOf(":")));
                var min = Number(elem.slice(-2));
                hour = (prop === "Close" && hour <= 12) ? hour += 24 : hour;   //終園時間が24時過ぎの場合翌日扱い
                return hour*60 + min;
              });

              if(!result[1]) return false;  // 開園終園時間が入力されていない施設はfalseを返す
              return (prop === "Close") ? (result[0] <= result[1]) : (result[0] >= result[1]);
          };
    };

    var featureObj = {};  // 各施設の検索元データを取得
    var ffunc = !nameKeyword ? filterFunc  // 施設名キーワードの入力によって分岐
    : function (prop, name) { 
        return function (item) { 
          return item.properties["Name"].indexOf(nameKeyword) >= 0 && item.properties[prop] == name; 
        };
      } 
    Object.keys(facilityObj).forEach(function(elem){
      featureObj[elem] = nurseryFacilities.features.filter(ffunc("Type", facilityObj[elem].type));
    });

    // Google Analyticsイベントトラッキングの値を普遍値として作成
    var gaEventVal = Object.freeze({
      pubNinkaOpenTime:   1,
      pubNinkaCloseTime:  2**1,
      pubNinkaH24:        2**2,
      pubNinkaIchijiHoiku: 2**3,
      pubNinkaYakan:       2**4,
      pubNinkaKyujitu:     2**5,
      pubNinkaEncho:       2**6,

      priNinkaOpenTime:   2**7,
      priNinkaCloseTime:  2**8,
      priNinkaH24:        2**9,
      priNinkaIchijiHoiku: 2**10,
      priNinkaYakan:       2**11,
      priNinkaKyujitu:     2**12,
      priNinkaEncho:       2**13,

      ninkagaiOpenTime:   2**14,
      ninkagaiCloseTime:  2**15,
      ninkagaiH24:        2**16,
      ninkagaiIchijiHoiku: 2**17,
      ninkagaiYakan:       2**18,
      ninkagaiKyujitu:     2**19,
      ninkagaiEncho:       2**20,

      yhoikuOpenTime:   2**21,
      yhoikuCloseTime:  2**22,
      yhoikuH24:        2**23,
      yhoikuIchijiHoiku: 2**24,
      yhoikuYakan:       2**25,
      yhoikuKyujitu:     2**26,
      yhoikuEncho:       2**27,

      kindergartenOpenTime:   2**28,
      kindergartenCloseTime:  2**29,
      kindergartenH24:        2**30,
      kindergartenIchijiHoiku: 2**31,
      kindergartenYakan:       2**32,
      kindergartenKyujitu:     2**33,
      kindergartenEncho:      2**34,

      jigyoshoOpenTime:   2**35,
      jigyoshoCloseTime:  2**36,
      jigyoshoH24:        2**37,
      jigyoshoIchijiHoiku: 2**38,
      jigyoshoYakan:       2**39,
      jigyoshoKyujitu:     2**40,
      jigyoshoEncho:       2**41,

      disabilityOpenTime:   2**42,
      disabilityCloseTime:  2**43,
      disabilityH24:        2**44,
      disabilityIchijiHoiku: 2**45,
      disabilityYakan:       2**46,
      disabilityKyujitu:     2**47,
      disabilityEncho:       2**48,

      gakudouOpenTime:   2**49,
      gakudouCloseTime:  2**50,
      gakudouH24:        2**51,
      gakudouIchijiHoiku: 2**52,
      gakudouYakan:       2**53,
      gakudouKyujitu:     2**54,
      gakudouEncho:       2**55
    });

    // DOM上のid属性に使われる文字列とGeoJSONの対応するプロパティのマッピング
    var funcObj = {
      OpenTime: "Open",
      CloseTime: "Close",
      H24: "H24",
      IchijiHoiku: "Temp",
      Yakan: "Night",
      Kyujitu: "Holiday",
      Encho: "Extra"
    };

    // オブジェクトconditions(抽出済みのid)の数だけイテレーション priNinkaOpenTimeなど
    if(Object.keys(conditions).length) {
      Object.keys(conditions).forEach(function(item){
        Object.keys(checkObj).forEach(function(facility){  // 施設のイテレーション priNinkaなど
            if (item.indexOf(facility) === 0) {
              checkObj[facility] = true;
              Object.keys(funcObj).forEach(function(func){ // 絞り込み条件のイテレーション OpenTimeなど
                if (item.indexOf(func) > 0) {
                  // 開園終園時間とその他の条件で渡すコールバックが異なるため判定
                  if (func === "OpenTime" || func === "CloseTime") {
                    featureObj[facility] = featureObj[facility].filter(filterTimeFunc(funcObj[func], conditions[item]));
                  } else {
                    featureObj[facility] = featureObj[facility].filter(filterFunc(funcObj[func], conditions[item]));
                  }
                }
              });
            }
        });
        filterSet.ga_label += gaEventVal[item];  // Google Analyticsイベントトラッキングの値の生成(アキュムレーション)
      });
    } else {  // 施設名キーワードに該当するレイヤーをtrue
      Object.keys(checkObj).forEach(function(facility){
        if(featureObj[facility].length) checkObj[facility] = true;
      });
    }

    var features = [];     // 戻り値の作成
    Object.keys(featureObj).forEach(function(facility){
        Array.prototype.push.apply(features, featureObj[facility]);
    });

    return {               // 絞り込み適用後のすべての施設を格納するGeoJSON
          "type": "FeatureCollection",
          "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
          "features": features
      };
};
