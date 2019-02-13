/**
 * 保育所背景リスト
 * @type {Object}
 */
var featureStyleList = {
	'default': { color: 'rgba(153, 153, 153, 1)', img: 'image/018.png'},
	'認可外保育施設': { color: '#0362A0', img: 'image/019.png'},
	'幼稚園': { color: '#FF5C24', img: 'image/029.png'},
	'私立認可保育所': { color: '#6EE100', img: 'image/018.png'},
	'公立認可保育所': { color: '#44AA00', img: 'image/018.png'},
	'横浜保育室': { color: '#0488EE', img: 'image/018.png'},
	'小規模・事業所内保育事業': { color: '#6DBA9C', img: 'image/018.png'},
	'障害児通所支援事業': { color: '#f78cb7', img: 'image/029.png'},
	'学童保育' : { color: '#a16e2b', img: 'image/029.png'}
};

// 各施設のスタイル設定関数を返すクロージャ
function StyleFunctionFactory(type) {
	return function(feature, resolution){
		if (feature.get('Type') !== type) return [];
		return nurseryStyleFunction(
			feature,
			resolution,
			featureStyleList[type]
		);	
	}
}

/**
 * 保育施設共通のスタイル定義
 * @param  {object}         feature      施設のGeoJSON構造のobject
 * @param  {number}         resolution   施設のLabel文字列を表示するか判断の解像度(Zoom in/out)
 * @param  {Array.<object>} featureStyle 施設の種別ごとのスタイル(画像と色)
 * @return {Array.<object>}                      ol.style.Styleの配列
 */
function nurseryStyleFunction(feature, resolution, featureStyle) {
	var image = new ol.style.Icon({
		anchor: [0.5, 0.5],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction',
		src: featureStyle.img,
		scale: 0.5
	});
	
	var background = new ol.style.Circle({
		radius: 15,
		fill: new ol.style.Fill({
			color: featureStyle.color
		}),
		stroke: new ol.style.Stroke({color: 'white', width: 3})
	});

	resolution = Math.floor(resolution * 1000);
	var text = (resolution < 10000) ? feature.get('Label') : '';
	var style = [
		new ol.style.Style({image: background}),
		new ol.style.Style({image: image})
	];

	if (text !== "") {
		style.push(
			new ol.style.Style({
				text: new ol.style.Text({
					offsetY: -20.0,
					text: text,
					font: '14px sans-serif',
					fill: new ol.style.Fill({
						color: '#000'
					}),
					stroke: new ol.style.Stroke({
						color: '#FFF',
						width: 3
					})
				})
			})
		);
	}
	return style;
};

/**
 * ベースの校区スタイルを戻す関数
 * @param  {[type]} mojicolor [description]
 * @param  {[type]} fillcolor [description]
 * @return {[type]}           [description]
 */
function baseSchoolStyle(mojicolor, fillcolor) {
	return function(feature, resolution) {
		var image = new ol.style.Icon({
			anchor: [0.5, 0.5],
			anchorXUnits: 'fraction',
			anchorYUnits: 'fraction',
			src: 'image/school.png',
			// scale: 0.5
		});

		var background = new ol.style.Circle({
			radius: 15,
			fill: new ol.style.Fill({
				color: mojicolor
			}),
			stroke: new ol.style.Stroke({color: 'white', width: 3})
		});

		var style = [
			new ol.style.Style({image: background}),
			new ol.style.Style({image: image}),
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: mojicolor,
					width: 3
				}),
				fill: new ol.style.Fill({
					color: fillcolor
				})
			})
		];

		resolution = Math.floor(resolution * 1000);
		var text = (feature.get('label') !== null) && resolution < 12000
				　 ? feature.get('label') : '';
		if (text !== "") {
			style.push(
					new ol.style.Style({
						text: new ol.style.Text({
							offsetY: -25.0,
							text: text,
							font: '13px sans-serif',
							fill: new ol.style.Fill({
								color: mojicolor
							}),
							stroke: new ol.style.Stroke({
								color: '#FFF',
								width: 3
							})
						})
					})
				);
		}
		return style;
	};
}

// 中学校区スタイル
var middleSchoolStyleFunction = baseSchoolStyle(
	'#7379AE', 'rgba(115, 121, 174, 0.1)'
);

// 小学校区スタイル
var elementaryStyleFunction = baseSchoolStyle(
	'#1BA466', 'rgba(27, 164, 102, 0.1)'
);

// 距離計測用同心円の色設定
function circleStyleFunction(feature, resolution) {
	resolution = Math.floor(resolution * 1000);
	var text = (feature.get('name') !== null) && resolution < 100000 
			   ? feature.get('name') : '';

	var style = [new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: 'rgba(238, 149, 44, 0.30)',
			width: 3
		}),
		fill: new ol.style.Fill({
			color: 'rgba(238, 149, 44, 0.30)'
		}),
		text: new ol.style.Text({
			offsetY: -40.0,
			text: text,
			font: '20px sans-serif',
			fill: new ol.style.Fill({
				color: 'rgba(255, 0, 0, 0.4)'
			}),
			stroke: new ol.style.Stroke({
				color: '#FFF',
				width: 3
			})
		})
	})];
	return style;
};
