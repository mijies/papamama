
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

// 保育施設・幼稚園に関する情報
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
	},
	gakudou: {
		type: '学童保育',
		cb: '#cbGakudou'
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