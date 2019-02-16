
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

// マップ上保育施設のスタイル
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

/**
 * 保育施設・幼稚園に関する情報 
 * 
 *   マップ上の各施設のレイヤーのZ軸はfacilityObj要素の上から最前面となる。
 *   これはaddNurseryFacilitiesLayerメソッドでreverse()で読み込まれるため。
 *   おおまかな方針として各施設のレイヤーZ軸は施設数が少ない順ほど全面。
 */
var facilityObj = {
	pubNinka: {      // 9件(2019/02月時点)
		type: '公立認可保育所',
		cb: '#cbPubNinka',
	},
	yhoiku: {        // 20件(2019/02月時点)
		type: '横浜保育室',
		cb: '#cbYhoiku'
	},
	kindergarten: {  // 26件(2019/02月時点)
		type: '幼稚園',
		cb: '#cbKindergarten'
	},
	ninkagai: {      // 28件(2019/02月時点)
		type: '認可外保育施設',
		cb: '#cbNinkagai'
	},
	jigyosho: {      // 40件(2019/02月時点)
		type: '小規模・事業所内保育事業',
		cb: '#cbJigyosho'
	},
	gakudou: {       // 52件(2019/02月時点)
		type: '学童保育',
		cb: '#cbGakudou'
	},
	priNinka: {      // 165件(2019/02月時点)
		type: '私立認可保育所',
		cb: '#cbPriNinka'
	},
	disability: {    // 258件(2019/02月時点)
		type: '障害児通所支援事業',
		cb: '#cbDisability'
	}
};

var cdSchoolArray = [
	'#cbMiddleSchool',
	'#cbElementarySchool'
];

// filteredList.jsで使用
var filterObj = {
	OpenTime: '開園',
	CloseTime: '終園',
	H24: '24時間',
	IchijiHoiku: '一時保育',
	Yakan: '夜間',
	Kyujitu: '休日',
	Encho: '延長保育'
};