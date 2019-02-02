
// map
var map;

// 地図表示時の中心座標
var init_center_coords = [139.61827, 35.51264];

// 最寄り駅セレクトボックス#moveTo用の中身
var moveToList = [];

// Bing APIのキー
var bing_api_key = 'Ahs7qRRd1eAtwgE7igbe7DOnXYvq_Pg81foKgM727r3S1949_mj8hrsqIY4iAxW9';

// 保育施設JSON格納用オブジェクト	
var nurseryFacilities;

// デフォルトのマップサーバ
var initialMapServer = 'bing-road';

// マップサーバ一覧
var mapServerList = {
	'bing-road': {
		label: "標準(Bing)",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Road',
		})
	},
	'mierune-mono': {
		label: "白地図",
		source_type: "xyz",
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "Maptiles by MIERUNE, under CC BY. Data by OpenStreetMap contributors, under ODbL."
				})
			],
			url: "https://tile.mierune.co.jp/mierune_mono/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	},
	"cyberjapn-pale": {
		label: "国土地理院",
		source_type: "xyz",
		source: new ol.source.XYZ({
			attributions: [
				new ol.Attribution({
					html: "<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>国土地理院</a>"
				})
			],
			url: "http://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
			projection: "EPSG:3857"
		})
	},
	'osm': {
		label: "交通",
		source_type: "osm",
		source: new ol.source.OSM({
			url: "http://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png",
			attributions: [
				ol.source.OSM.DATA_ATTRIBUTION,
				new ol.Attribution({html: "Tiles courtesy of <a href='http://www.thunderforest.com/' target='_blank'>Andy Allan</a>"})
			]
		})
	},
	'bing-aerial': {
		label: "写真",
		source_type: "bing",
		source: new ol.source.BingMaps({
			culture: 'ja-jp',
			key: bing_api_key,
			imagerySet: 'Aerial',
		})
	}
};

var facilityObj = {
	pubNinka: {
		type: '公立認可保育所',
		cb: '#cbPubNinka',
	},
	priNinka: {
		type: '私立認可保育所',
		cb: '#cbPriNinka'
	},
	ninkagai: {
		type: '認可外保育施設',
		cb: '#cbNinkagai'
	},
	yhoiku: {
		type: '横浜保育室',
		cb: '#cbYhoiku'
	},
	kindergarten: {
		type: '幼稚園',
		cb: '#cbKindergarten'
	},
	jigyosho: {
		type: '小規模・事業所内保育事業',
		cb: '#cbJigyosho'
	},
	disability: {
		type: '障害児通所支援事業',
		cb: '#cbDisability'
	}
};

var cdSchoolArray = [
	'#cbMiddleSchool',
	'#cbElementarySchool'
];

var filterObj = {
	OpenTime: '開園',
	CloseTime: '終園',
	H24: '24時間',
	IchijiHoiku: '一時保育',
	Yakan: '夜間',
	Kyujitu: '休日',
	Encho: '延長保育'
};