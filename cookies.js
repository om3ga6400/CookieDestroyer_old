/* global decodeSave, splitSave, UncompressLargeBin, unpack, unpack2, LZString */

function byId(id) {
	return document.getElementById(id);
}

function asBoolNum(what) {
	return what ? 1 : 0;
}

function escapeRegExp(str) { return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); }
function replaceAll(find, replace, str) { return str.replace(new RegExp(escapeRegExp(find), "g"), replace); }

//#region loc
var locStrings = {};
var locStringsFallback = {};
var locId = "NONE";
var EN = true;
var locName = "none";
var locPatches = [];
var locPlur = "nplurals=2;plural=(n!=1);"; //see http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html
var locPlurFallback = locPlur;
//note : plural index will be downgraded to the last matching, ie. in this case, if we get "0" but don't have a 3rd option, use the 2nd option (or 1st, lacking that too)
var locStringsByPart = {};
var FindLocStringByPart = function (match) {
	return locStringsByPart[match] || undefined;
	/*
	//note: slow, only do this on init
	for (var i in locStrings){
		var bit=i.split(']');
		if (bit[0].substring(1)==match) return i;
	}
	return undefined;
	*/
};

var Langs = {
	"EN": {file: "EN", nameEN: "English", name: "English", changeLanguage: "Language", icon: 0, w: 1, isEN: true}
	// "FR": {file: "FR", nameEN: "French", name: "Fran&ccedil;ais", changeLanguage: "Langue", icon: 0, w: 1},
	// "DE": {file: "DE", nameEN: "German", name: "Deutsch", changeLanguage: "Sprache", icon: 0, w: 1},
	// "NL": {file: "NL", nameEN: "Dutch", name: "Nederlands", changeLanguage: "Taal", icon: 0, w: 1},
	// "CS": {file: "CS", nameEN: "Czech", name: "&#x10C;e&#x161;tina", changeLanguage: "Jazyk", icon: 0, w: 1},
	// "PL": {file: "PL", nameEN: "Polish", name: "Polski", changeLanguage: "J&#281;zyk", icon: 0, w: 1},
	// "IT": {file: "IT", nameEN: "Italian", name: "Italiano", changeLanguage: "Lingua", icon: 0, w: 1},
	// "ES": {file: "ES", nameEN: "Spanish", name: "Espa&#xF1;ol", changeLanguage: "Idioma", icon: 0, w: 1},
	// "PT-BR": {file: "PT-BR", nameEN: "Portuguese", name: "Portugu&#xEA;s", changeLanguage: "Idioma", icon: 0, w: 1},
	// "JA": {file: "JA", nameEN: "Japanese", name: "&#x65E5;&#x672C;&#x8A9E;", changeLanguage: "&#35328;&#35486;", icon: 0, w: 1.5},
	// "ZH-CN": {file: "ZH-CN", nameEN: "Chinese", name: "&#x4E2D;&#x6587;", changeLanguage: "&#35821;&#35328;", icon: 0, w: 1.5},
	// "KO": {file: "KO", nameEN: "Korean", name: "&#xD55C;&#xAE00;", changeLanguage: "&#xC5B8;&#xC5B4;", icon: 0, w: 1.5},
	// "RU": {file: "RU", nameEN: "Russian", name: "&#x420;&#x443;&#x441;&#x441;&#x43A;&#x438;&#x439;", changeLanguage: "&#1071;&#1079;&#1099;&#1082;", icon: 0, w: 1.2},
};

var locBlink = false;
function loc(id, params, baseline) {
	var fallback = false;
	var found = locStrings[id];
	if (!found) { found = locStringsFallback[id]; fallback = true; }
	if (found) {
		var str = "";
		str = parseLoc(found, params);
		//return str;
		if (str.constructor === Array) { return str; }
		if (locBlink && !fallback) { return '<span class="blinking">' + str + "</span>"; }//will make every localized text blink on screen, making omissions obvious; will not work for elements filled with textContent
	}

	//if ((fallback || !found) && localizationNotFound.length<20 && localizationNotFound.indexOf(id)==-1){localizationNotFound.push(id);console.trace('localization string not found: ',id);}
	if (found) { return str; }
	return baseline || id;
}

function parseLoc(str, params) {
	/*
		parses localization strings
		-there can only be 1 plural per string and it MUST be at index %1
		-a pluralized string is detected if we have at least 1 param and the matching localized string is an array
	*/
	if (typeof params === "undefined") {
		params = [];
	} else if (params.constructor !== Array) {
		params = [params];
	}
	if (!str) { return ""; }
	//if (str.constructor===Array) return str;
	//if (typeof str==='function') return str(params);
	//str=str.replace(/[\t\n\r]/gm,'');

	if (params.length == 0) { return str; }

	var plurIndex;
	if (str.constructor === Array) {
		if (typeof params[0] === "object") { //an object containing a beautified number
			plurIndex = locPlur(params[0].n);
			plurIndex = Math.min(str.length - 1, plurIndex);
			str = str[plurIndex];
			str = replaceAll("%1", params[0].b, str);

		} else {
			plurIndex = locPlur(params[0]);
			plurIndex = Math.min(str.length - 1, plurIndex);
			str = str[plurIndex];
			str = replaceAll("%1", params[0], str);
		}
	}

	var out = "";
	var len = str.length;
	var inPercent = false;
	for (var i = 0; i < len; i++) {
		var it = str[i];
		if (inPercent) {
			inPercent = false;
			if (!isNaN(it) && params.length >= parseInt(it, 10) - 1) {
				out += params[parseInt(it, 10) - 1];
			} else {
				out += "%" + it;
			}
		} else if (it == "%") {
			inPercent = true;
		} else {
			out += it;
		}
	}
	return out;
}

var AddLanguage = function (id, name, json, mod) { /* eslint-disable-line no-unused-vars */
	//used in loc files
	//if mod is true, this file is augmenting the current language
	if (id == locId && !mod) { return false; } //don't load twice
	if (!Langs[id]) { return false; }
	locId = id;
	if (Langs[locId].isEN) { EN = true; } else { EN = false; }
	locName = Langs[id].nameEN; //name

	var i, bit;

	if (mod) {
		for (i in json) {
			locStrings[i] = json[i];
		}
		for (i in locStrings) {
			bit = i.split("]");
			if (bit[1] && bit[0].indexOf("[COMMENT:") != 0 && !locStringsByPart[bit[0].substring(1)]) { locStringsByPart[bit[0].substring(1)] = i; }
		}
		console.log('Augmented language "' + locName + '".');

	} else {
		locStrings = json;
		locPlur = json[""]["plural-forms"] || locPlurFallback;
		delete locStrings[""];
		for (i in locStrings) {
			if (locStrings[i] == "/") { locStrings[i] = i; }
		}

		locPlur = (function (plural_form) {
			//lifted and modified from gettext.js
			var pf_re = new RegExp("^\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;n0-9_\(\)])+");
			if (!pf_re.test(plural_form)) {
				throw new Error('The plural form "' + plural_form + '" is not valid');
			}
			return new Function("n", "var plural, nplurals; " + plural_form + " return plural;");
			//return new Function('n','var plural, nplurals; '+ plural_form +' return { nplurals: nplurals, plural: (plural === true ? 1 : (plural ? plural : 0)) };');
		})(locPlur);

		locPatches = [];
		for (i in locStrings) {
			if (i.split("|")[0] == "Update notes") {
				var patch = i.split("|");
				var patchTranslated = locStrings[i].split("|");
				locPatches.push({id: parseInt(patch[1], 10), type: 1, title: patchTranslated[2], points: patchTranslated.slice(3)});
			}
		}
		var sortMap = function (a, b) {
			if (a.id < b.id) { return 1; }
			else { return -1; }
		};
		locPatches.sort(sortMap);

		for (i in locStrings) {
			bit = i.split("]");
			if (bit[1] && bit[0].indexOf("[COMMENT:") != 0 && !locStringsByPart[bit[0].substring(1)]) { locStringsByPart[bit[0].substring(1)] = i; }
		}

		console.log('Loaded language "' + locName + '".');
	}
};

//#endregion loc

//seeded random function, courtesy of http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html
//out of IIFE because strict mode
//#region seeded random (fold for less horizontal scroll pain)
//eslint-disable-next-line
(function(a,b,c,d,e,f){function k(a){var b,c=a.length,e=this,f=0,g=e.i=e.j=0,h=e.S=[];for(c||(a=[c++]);d>f;)h[f]=f++;for(f=0;d>f;f++)h[f]=h[g=j&g+a[f%c]+(b=h[f])],h[g]=b;(e.g=function(a){for(var b,c=0,f=e.i,g=e.j,h=e.S;a--;)b=h[f=j&f+1],c=c*d+h[j&(h[f]=h[g=j&g+b])+(h[g]=b)];return e.i=f,e.j=g,c})(d)}function l(a,b){var e,c=[],d=(typeof a)[0];if(b&&"o"==d)for(e in a)try{c.push(l(a[e],b-1))}catch(f){}return c.length?c:"s"==d?a:a+"\0"}function m(a,b){for(var d,c=a+"",e=0;c.length>e;)b[j&e]=j&(d^=19*b[j&e])+c.charCodeAt(e++);return o(b)}function n(c){try{return a.crypto.getRandomValues(c=new Uint8Array(d)),o(c)}catch(e){return[+new Date,a,a.navigator.plugins,a.screen,o(b)]}}function o(a){return String.fromCharCode.apply(0,a)}var g=c.pow(d,e),h=c.pow(2,f),i=2*h,j=d-1;c.seedrandom=function(a,f){var j=[],p=m(l(f?[a,o(b)]:0 in arguments?a:n(),3),j),q=new k(j);return m(o(q.S),b),c.random=function(){for(var a=q.g(e),b=g,c=0;h>a;)a=(a+c)*d,b*=d,c=q.g(1);for(;a>=i;)a/=2,b/=2,c>>>=1;return(a+c)/b},p},m(c.random(),b)})(this,[],Math,256,6,52);
//#endregion seeded random

(function (window, $) {
"use strict";

var document = window.document;

//#region definitions

var Game = {
	version: 2.052,
	mainJS: "10",
	beta: window.location.href.indexOf("/beta") > -1,
	steam: false,

	firstRun: true,

	fps: 30,
	T: 0, //used for a certain achievement's animation

	ObjectPriceIncrease: 1.15, //price increase factor for buildings
	SpecialGrandmaUnlock: 15, //when farmer/worker/miner/etc. grandmas upgrades unlock
	maxClicksPs: 250, //maximum clicks per second

	Objects: {}, //buildings
	ObjectsById: [],
	ObjectsByGroup: {},
	ObjectsOwned: 0,

	Upgrades: {},
	UpgradesById: [],
	UpgradesByPool: {},
	UpgradesByGroup: {},
	UpgradesOwned: 0,
	numCountedUpgrades: 0,
	maxCountedUpgrades: 0,

	UpgradeOrder: [], //list of upgrades sorted by current settings

	Achievements: {},
	AchievementsById: [],
	AchievementsByPool: {},
	AchievementsByGroup: {},
	AchievementsOwned: 0,
	AchievementsTotal: 0,

	defaultSeason: "",
	season: "",
	seasons: {},
	seasonTriggerBasePrice: 1000000000,
	seasonUses: 0,

	pledges: 0,
	ascensionMode: 0,
	sellMultiplier: 0.5,
	startDate: Date.now(), //used for calculating Century egg stuff
	CenturyEggBoost: 1,
	objectGodMult: 1,

	numGoldenCookies: 0,

	ObjectPriceMultArray: [], //used for Object price caches
	UpgradePriceMultArray: [],

	heralds: 0,

	heavenlyPower: 1, //% cps bonus per prestige level
	cookiesPs: 0,
	cookiesPerClick: 0,
	cookiesPsPlusClicks: 0,
	globalCpsMult: 1,
	rawCookiesPs: 0,
	unbuffedCookiesPs: 0,
	prestige: 0,
	cookiesBaked: 0,
	buildingCps: 0,

	buildingBuyInterval: 1,

	santa: {},
	santaLevel: 0,
	santaLevels: ["Festive test tube", "Festive ornament", "Festive wreath", "Festive tree", "Festive present",
		"Festive elf fetus", "Elf toddler", "Elfling", "Young elf", "Bulky elf", "Nick", "Santa Claus", "Elder Santa", "True Santa", "Final Claus"],

	dragonLevel: 0,
	dragonAura: 0,
	dragonAura2: 0,
	wrinklerLimit: 14, //hard limit regardless of boosts
	maxWrinklers: 10, //current max

	minCumulative: 0, //minimum cookies needed for everything (see getMinCumulative method)
	minCumulativeOffset: 0, //used to try to prevent minCumulative from being excessively wrong large due to saves from old game versions
	permanentUpgrades: [-1, -1, -1, -1, -1], //used for calculating min cumulative
	includeDragonSacrifices: true, //whether to include the cost of sacrificing buildings to train Krumblor (if relevant)

	Buffs: {},
	BuffTypes: [],
	BuffTypesByName: {},

	lumps: 0,

	effs: {},

	pantheon: {
		gods: {},
		godsById: [],
		slot: [-1, -1, -1],
		slotNames: ["Diamond", "Ruby", "Jade"]
	},

	garden: {
		plants: {},
		plantsById: [],
		numPlants: 0,
		seedSelected: -1,

		soils: {},
		soilsById: [],

		plot: [],
		plotBoost: [],
		plotLimits: [],

		effs: {},
		effsData: {},

		tileSize: 40,

		stepT: 1,
		soil: 0
	},

	Milks: [
		{name: "Plain milk",        icon: [1,  8]},
		{name: "Chocolate milk",    icon: [2,  8]},
		{name: "Raspberry milk",    icon: [3,  8]},
		{name: "Orange milk",       icon: [4,  8]},
		{name: "Caramel milk",      icon: [5,  8]},
		{name: "Banana milk",       icon: [6,  8]},
		{name: "Lime milk",         icon: [7,  8]},
		{name: "Blueberry milk",    icon: [8,  8]},
		{name: "Strawberry milk",   icon: [9,  8]},
		{name: "Vanilla milk",      icon: [10, 8]},
		{name: "Honey milk",        icon: [21, 23]},
		{name: "Coffee milk",       icon: [22, 23]},
		{name: "Tea milk",          icon: [23, 23]},
		{name: "Coconut milk",      icon: [24, 23]},
		{name: "Cherry milk",       icon: [25, 23]},
		{name: "Spiced milk",       icon: [26, 23]},
		{name: "Maple milk",        icon: [28, 23]},
		{name: "Mint milk",         icon: [29, 23]},
		{name: "Licorice milk",     icon: [30, 23]},
		{name: "Rose milk",         icon: [31, 23]},
		{name: "Dragonfruit milk",  icon: [21, 24]},
		{name: "Melon milk",        icon: [22, 24]},
		{name: "Blackcurrant milk", icon: [23, 24]}
	],

	temp: {
		ObjectsOwned: 0,
		UpgradesOwned: 0,
		UpgradesToCheck: [],
		kittensOwned: 0,
		AchievementsOwned: 0,
		LockedAchievements: [],

		cpsObj: {},

		prestige: 0,
		cookiesBaked: 0,
		santaLevel: 0,
		dragonAura: 0,
		dragonAura2: 0
	},

	storedImport: null,

	maxRecommend: 5,
	maxLookahead: 10,

	abbrOn: true, //whether to abbreviate with letters/words or with commas/exponential notation
	lockChecked: false, //sets behavior when clicking on upgrades, controlled by various checkboxes on the page
	predictiveMode: false, //prevents predictive calculations overwriting current state by changing which properties are read/written
	showDebug: false, //whether to always show debug upgrades
	altMode: false
};
window.Game = Game;
Game.santaMax = Game.santaLevels.length - 1;
Game.lastUpdateTime = Game.startDate;

byId("pVersion").textContent = Game.version + (Game.beta ? " beta" : "");
byId("pVersion").title = "main.js?v=" + Game.mainJS;
if (Game.beta) { document.title += " Beta"; }

//#endregion definitions


//#region methods

//debug method to check whether upgrades and achievements and maybe other things match the ingame definitions
Game.debugCheckProperties = function (calcList, property) {
	var gameList = JSON.parse(prompt("gameList")); //because why would JSON want to be easy to use in the console
	for (var i = 0; i < gameList.length; i++) {
		var g = gameList[i];
		var c = calcList[i];
		if (!c) {
			console.log("calc object not found", g, i);
			continue;
		}
		if (typeof property === "string") {
			if (g !== c[property]) {
				console.log("mismatch! game prop:", g, "calc obj:", c, "calc prop", c[property]);
			}
		} else {
			var mismatched = false;
			var misMatchedProps = {};
			for (var key in g) {
				if (g[key] !== c[key]) {
					misMatchedProps[key] = [g[key], c[key]];
					mismatched = true;
				}
			}
			if (mismatched) {
				console.log("mismatch! game obj:", g, "calc obj:", c, misMatchedProps);
			}
		}
	}
	console.log("done");
};

Game.choose = function (arr) {
	return arr[Math.floor(Math.random() * arr.length)];
};

Game.makeSeed = function () {
	var chars = "abcdefghijklmnopqrstuvwxyz".split("");
	var str = "";
	for (var i = 0; i < 5; i++) { str += Game.choose(chars); }
	return str;
};

Game.setSeed = function (seed) {
	Game.seed = seed || Game.makeSeed(); //each run has its own seed, used for deterministic random stuff
};

Game.seed = Game.makeSeed();

//sets obj[key] to an array if it is not already and pushes value to it
Game.ArrayPush = function (obj, key, value) {
	if (!Array.isArray(obj[key])) {
		obj[key] = [];
	}
	obj[key].push(value);
};

//checks event for keys for alt mode
Game.checkEventAltMode = function (event) {
	return event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
};

Game.toFixed = function (x) {
	if (Math.abs(x) < 1.0) {
		var e = parseInt(x.toString().split("e-")[1], 10);
		if (e) {
			x *= Math.pow(10, e - 1);
			x = "0." + (new Array(e)).join("0") + x.toString().substring(2);
		}
	} else {
		e = parseInt(x.toString().split("+")[1], 10);
		if (e > 20) {
			e -= 20;
			x /= Math.pow(10, e);
			x += (new Array(e + 1)).join("0");
		}
	}
	return x;
};

Game.cap = function (str) { return str.charAt(0).toUpperCase() + str.slice(1); };

Game.romanize = function (num) {
	if (isNaN(num)) {
		return NaN;
	}
	var digits = String(+num).split("");
	var key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
			"", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
			"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
	var roman = "";
	var i = 3;
	while (i--) {
		roman = (key[+digits.pop() + (i * 10)] || "") + roman;
	}
	return Array(+digits.join("") + 1).join("M") + roman;
};

var Abbreviations = [
	{short: "", long: ""},
	{short: "k", long: "thousand"},
	{short: "M", long: "million"},
	{short: "B", long: "billion"},
	{short: "T", long: "trillion"},
	{short: "Qa", long: "quadrillion"},
	{short: "Qi", long: "quintillion"},
	{short: "Sx", long: "sextillion"},
	{short: "Sp", long: "septillion"},
	{short: "Oc", long: "octillion"},
	{short: "No", long: "nonillion"}
];

var longPrefixes = ["", "un", "duo", "tre", "quattuor", "quin", "sex", "septen", "octo", "novem"];
var longSuffixes = ["decillion", "vigintillion", "trigintillion", "quadragintillion", "quinquagintillion", "sexagintillion", "septuagintillion", "octogintillion", "nonagintillion"];
var shortPrefixes = ["", "Un", "Do", "Tr", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
var shortSuffixes = ["D", "V", "T", "Qa", "Qi", "Sx", "Sp", "O", "N"];
for (var ii = 0; ii < longSuffixes.length; ii++) {
	for (var jj = 0; jj < longPrefixes.length; jj++) {
		Abbreviations.push({
			short: shortPrefixes[jj] + shortSuffixes[ii],
			long: longPrefixes[jj] + longSuffixes[ii]
		});
	}
}
Abbreviations[11].short = "Dc";
var AbbreviationsMax = Abbreviations.length - 1;

for (ii = 1; ii <= AbbreviationsMax; ii++) {
	var abbr = Abbreviations[ii];
	abbr.shortRgx = new RegExp("(\\-?[\\d\\.]+)\\s*(" + abbr.short + ")\\s*$", "i");
	abbr.longRgx = new RegExp("(\\-?[\\d\\.]+)\\s*(" + abbr.long + ")\\s*$", "i");
}

var commaRgx = /\B(?=(\d{3})+(?!\d))/g;
Game.addCommas = function (what) {
	var x = what.toString().split(".");
	x[0] = x[0].replace(commaRgx, ",");
	return x.join(".");
};

Game.Beautify = function (what, floats) { //turns 9999999 into 9,999,999
	if (what === "---") { return what; }
	if (!isFinite(what)) { return "Infinity"; }
	var absWhat = Math.abs(what);
	if (absWhat > 1 && what.toString().indexOf("e") > -1) { return what.toString(); }
	floats = absWhat < 1000 && floats > 0 ? Math.pow(10, floats) : 1;
	what = Math.round(what * floats) / floats;
	return Game.addCommas(what);
};

Game.LBeautify = function (val, floats) {
	//returns an object in the form {n:original value floored,b:beautified value as string} for localization purposes
	return {n: Math.floor(Math.abs(val)), b: Game.abbreviateNumber(val, floats, true)};
};

Game.shortenNumber = function (value) {
	//if no scientific notation, return as is, else :
	//keep only the 5 first digits (plus dot), round the rest
	//may or may not work properly
	if (value >= 1000000 && isFinite(value)) {
		var num = value.toString();
		var ind = num.indexOf("e+");
		if (ind == -1) { return value; }
		var str = "";
		for (var i = 0; i < ind; i++) {
			str += (i < 6 ? num[i] : "0");
		}
		str += "e+";
		str += num.split("e+")[1];
		return parseFloat(str);
	}
	return value;
};

//abbreviates numbers
Game.abbreviateNumber = function (num, floats, abbrlong) {
	if (num === "---") { return num; }
	if (!isFinite(num)) { return "Infinity"; }
	if (Math.abs(num) < 1000000) { return Game.Beautify(num, floats); }
	num = Number(num).toExponential().split("e+");
	var pow = Math.floor(num[1] / 3);
	if (pow > AbbreviationsMax) {
		num[0] = Math.round(num[0] * 1000) / 1000;
		return num.join("e+");
	}
	num[0] *= Math.pow(10, num[1] % 3);
	num[0] = Math.round(num[0] * 1000) / 1000;
	if (Math.abs(num[0]) >= 1000 && pow < AbbreviationsMax) {
		pow += 1;
		num[0] /= 1000;
	} else {
		num[0] = Game.addCommas(num[0]);
	}
	num[1] = Abbreviations[Math.min(pow, AbbreviationsMax)][abbrlong ? "long" : "short"];
	return num.join(" ");
};

Game.BeautifyAbbr = function (what, floats, abbrlong) {
	return Game.abbrOn ? Game.abbreviateNumber(what, floats, abbrlong) : Game.Beautify(what, floats);
};

Game.formatNumber = function (num, floats, abbrlong, extraStr, extraTitle) {
	var beaut = Game.Beautify(num, floats);
	var abbr = Game.abbreviateNumber(num, floats, abbrlong);
	var text = extraStr || "";
	var title = text + (extraTitle || "");
	if (beaut === abbr) {
		text = beaut + text;
	} else {
		text = (Game.abbrOn ? abbr : beaut) + text;
		var aLong = abbrlong || abbr === beaut ? abbr : Game.abbreviateNumber(num, floats, true);
		title = (Game.abbrOn ? beaut : aLong) + title;
	}
	return ("<span" + (title ? ' data-title="' + title.trim() + '">' : ">") + text + "</span>");
};

Game.formatTime = function (seconds) {
	seconds = Math.ceil(seconds);
	if (!isFinite(seconds) || seconds <= 0) { return "---"; }
	var days = Math.floor(seconds / 86400);
	if (days > 0) {
		days = Game.BeautifyAbbr(days) + (days >= 1e7 ? " " : "") + "d ";
	} else {
		days = "";
	}

	seconds %= 86400;
	var hours = Math.floor(seconds / 3600);
	hours = hours > 0 ? hours + "h " : "";
	seconds %= 3600;
	var minutes = Math.floor(seconds / 60);
	minutes = minutes > 0 ? minutes + "m " : "";
	seconds %= 60;
	seconds = seconds > 0 ? seconds + "s" : "";
	return (days + hours + minutes + seconds).trim();
};

Game.getPlural = function (amount, singular, plural) {
	singular = singular || "";
	plural = plural || (singular + "s");
	return amount === 1 ? singular : plural;
};

Game.sayTime = function (time, detail) {
	//time is a value where one second is equal to Game.fps (30).
	//detail skips days when >1, hours when >2, minutes when >3 and seconds when >4.
	//if detail is -1, output something like "3 hours, 9 minutes, 48 seconds"
	if (time <= 0) { return ""; }
	var str = "";
	detail = detail || 0;
	time = Math.floor(time);

	if (detail == -1) {
		// var months = 0;
		var days = 0;
		var hours = 0;
		var minutes = 0;
		var seconds = 0;
		// if (time >= Game.fps * 60 * 60 * 24 * 30) { months = (Math.floor(time / (Game.fps * 60 * 60 * 24 * 30))); }
		if (time >= Game.fps * 60 * 60 * 24) { days = (Math.floor(time / (Game.fps * 60 * 60 * 24))); }
		if (time >= Game.fps * 60 * 60) { hours = (Math.floor(time / (Game.fps * 60 * 60))); }
		if (time >= Game.fps * 60) { minutes = (Math.floor(time / (Game.fps * 60))); }
		if (time >= Game.fps) { seconds = (Math.floor(time / (Game.fps))); }
		// days -= months * 30;
		hours -= days * 24;
		minutes -= hours * 60 + days * 24 * 60;
		seconds -= minutes * 60 + hours * 60 * 60 + days * 24 * 60 * 60;
		if (days > 10) { hours = 0; }
		if (days) {
			minutes = 0;
			seconds = 0;
		}
		if (hours) { seconds = 0; }
		var bits = [];
		// if (months > 0) { bits.push(Game.Beautify(months) + Game.getPlural(months, " month")); }
		if (days > 0) { bits.push(loc("%1 day", Game.LBeautify(days))); }
		if (hours > 0) { bits.push(loc("%1 hour", Game.LBeautify(hours))); }
		if (minutes > 0) { bits.push(loc("%1 minute", Game.LBeautify(minutes))); }
		if (seconds > 0) { bits.push(loc("%1 second", Game.LBeautify(seconds))); }
		if (bits.length == 0) { str = loc("less than 1 second"); }
		else { str = bits.join(", "); }

	} else {
		/* if (time >= Game.fps * 60 * 60 * 24 * 30 * 2 && detail < 1) { str = Beautify(Math.floor(time / (Game.fps * 60 * 60 * 24 * 30))) + " months"; }
		else */ if (time >= Game.fps * 60 * 60 * 24 * 30 && detail < 1) { str = "1 month"; }
		else if (time >= Game.fps * 60 * 60 * 24 && detail < 2) { str = loc("%1 day", Game.LBeautify(Math.floor(time / (Game.fps * 60 * 60 * 24)))); }
		else if (time >= Game.fps * 60 * 60 && detail < 3) { str = loc("%1 hour", Game.LBeautify(Math.floor(time / (Game.fps * 60 * 60)))); }
		else if (time >= Game.fps * 60 && detail < 4) { str = loc("%1 minute", Game.LBeautify(Math.floor(time / (Game.fps * 60)))); }
		else if (time >= Game.fps && detail < 5) { str = loc("%1 second", Game.LBeautify(Math.floor(time / (Game.fps)))); }
		else { str = loc("less than 1 second"); }
	}
	return str;
};

Game.costDetails = function (cost, force) {
	if (!force && !Game.HasUpgrade("Genius accounting")) { return ""; }
	if (!cost || !isFinite(cost)) { return ""; }
	var priceInfo = "";
	var cps = Game.cookiesPs * (1 - Game.cpsSucked);
	if (!cps) { return ""; }
	// if (cost > Game.cookies) { priceInfo += loc("in %1", Game.sayTime(((cost - Game.cookies) / cps + 1) * Game.fps)) + "<br>"; }
	priceInfo += loc("%1 worth", Game.sayTime((cost / cps + 1) * Game.fps)) + "<br>";
	// priceInfo += loc("%1% of bank", Game.Beautify((cost / Game.cookies) * 100, 1)) + "<br>";
	return ('<div class="costDetails">' + priceInfo + "</div>");
};

var cleanNumberRgx = /[^\deE\+\.\-]/g;
Game.cleanNumber = function (str) {
	return str.replace(cleanNumberRgx, "");
};

var parseMatchRgx = /\s*(.*\d)(\D*)/;
var parseReplaceRgx = /[^\d\.]/g;

Game.parseNumber = function (num, min, max, floor) {
	if (typeof num === "string" && num.length) {
		var matches = num.match(parseMatchRgx);
		var c = false;

		if (matches) {
			var d = parseFloat(matches[1].replace(parseReplaceRgx, ""));
			var n = (d + matches[2]).trim();
			for (var i = 1; i <= AbbreviationsMax; i++) {
				var abbrs = Abbreviations[i];
				if (abbrs.shortRgx.test(n) || abbrs.longRgx.test(n)) {
					num = d * Math.pow(10, 3 * i);
					c = true;
					break;
				}
			}
		}
		if (!c) { num = parseFloat(Game.cleanNumber(num)); }
	}

	var def = 0;
	if (min > 0) {
		def = min;
	}

	num = Number(num) || def;
	num = Math.max(num, min || 0);
	if (!isNaN(max)) {
		num = Math.min(num, max);
	}
	if (floor) {
		num = Math.floor(num);
	}
	return isFinite(num) ? num || def : def;
};

Game.setInput = function (ele, value) {
	var $ele = $(ele);
	ele = $ele[0];

	var metaObj = ele.metaObj;
	var dataProp = ele.dataProp;

	if ($ele.hasClass("text")) {
		ele.value = value;

	} else {

		if (typeof value === "undefined") {
			value = ele.parsedValue || 0; //refresh values and stuff
		}
		value = Game.parseNumber(value, ele.minIn, ele.maxIn, !$ele.hasClass("deci"));
		var displayVal = value;

		ele.parsedValue = value;
		if ($ele.hasClass("exp")) {
			ele.dataset.title = value < 1e7 || Game.abbrOn ? Game.Beautify(value) : Game.abbreviateNumber(value, 0, true);
			displayVal = Game.BeautifyAbbr(value, 0, true);
			ele.displayValue = displayVal;
		}
		if (document.activeElement !== ele) {
			ele.value = displayVal;
		}

		if (ele.twin) {
			ele.twin.parsedValue = ele.parsedValue;
			if (ele.displayValue) {
				ele.twin.displayValue = ele.displayValue;
			}
			if (document.activeElement !== ele.twin) {
				ele.twin.value = ele.twin.displayValue || value;
			}
			if (typeof ele.dataset.title !== "undefined") {
				ele.twin.dataset.title = ele.dataset.title;
			}

			metaObj = metaObj || ele.twin.metaObj;
			dataProp = dataProp || ele.twin.dataProp;
		}
	}

	if ((ele === Game.tooltipAnchor || ele.twin === Game.tooltipAnchor) && typeof Game.updateTooltip === "function") {
		Game.updateTooltip(true);
	}

	if (metaObj && dataProp) {
		metaObj[dataProp] = value;
	}

	return value;
};

Game.prepSearchText = function (str) {
	return str.trim().replace(/\s+/g, " ").toLowerCase();
};

Game.registerInput = function (ele, metaObj, dataProp) {
	ele = $(ele)[0];
	if (ele) {
		ele.metaObj = metaObj || null;
		ele.dataProp = dataProp || null;
	}
};

Game.registerInputs = function (metaObj, arr) {
	for (var i = 0; i < arr.length; i++) {
		var props = arr[i];
		Game.registerInput(props[0], metaObj, props[1]);
	}
};

Game.getUpgradeName = function (name) {
	var it = Game.Upgrades[name];
	var found = FindLocStringByPart("Upgrade name " + it.id);
	if (found) { return loc(found); } else { return name; }
};

Game.GetUpgrade = function (what) {
	if (what && what.type === "upgrade") {
		return what;
	}
	if (Game.Upgrades.hasOwnProperty(what)) {
		return Game.Upgrades[what];
	}
	if (Game.UpgradesById.hasOwnProperty(what)) {
		return Game.UpgradesById[what];
	}
	return false;
};

Game.Has = Game.HasUpgrade = function (what, asNum) {
	if (Array.isArray(what)) {
		for (var i = 0; i < what.length; i++) {
			if (!Game.HasUpgrade(what[i])) {
				return false;
			}
		}
		return what.length > 0;
	}
	var upgrade = Game.GetUpgrade(what);
	if (!upgrade) { return false; }
	if (Game.ascensionMode === 1 && (upgrade.pool === "prestige" || upgrade.tier === "fortune")) {
		return false;
	}
	return upgrade.getBought(asNum);
};

Game.GetAchiev = Game.GetAchieve = function (what) {
	if (what && what.type === "achievement") {
		return what;
	}
	if (Game.Achievements.hasOwnProperty(what)) {
		return Game.Achievements[what];
	}
	if (Game.AchievementsById.hasOwnProperty(what)) {
		return Game.AchievementsById[what];
	}
	return false;
};

Game.HasAchiev = Game.HasAchieve = function (what, asNum) {
	var achieve = Game.GetAchiev(what);
	return achieve ? achieve.getWon(asNum) : false;
};

Game.Win = function (what, temp) {
	if (Array.isArray(what)) {
		for (var i = 0; i < what.length; i++) { Game.Win(what[i], temp); }
	} else {
		var achieve = Game.getAchieve(what);
		if (achieve) { achieve.setWon(true, temp); }
	}
};

Game.countUpgradesByGroup = function (list, limit, includeUnlocked) {
	if (!Array.isArray(list)) {
		list = Game.UpgradesByGroup[list];
	}
	var count = 0;
	if (list) {
		if (isNaN(limit) || limit < 0) {
			limit = list.length;
		}
		for (var i = 0; i < list.length && count < limit; i++) {
			var upgrade = Game.GetUpgrade(list[i]);
			if (upgrade) {
				if (upgrade.getBought() || (includeUnlocked && upgrade.unlocked)) {
					count++;
				}
			}
		}
	}
	return count;
};

Game.listTinyOwnedUpgrades = function (arr) {
	var str = "";
	for (var i = 0; i < arr.length; i++) {
		var upgrade = Game.GetUpgrade(arr[i]);
		if (upgrade.getBought()) {
			str += upgrade.tinyIconStr;
		}
	}
	return str;
};

Game.saySeasonSwitchUses = function () {
	if (Game.seasonUses == 0) { return loc("You haven't switched seasons this ascension yet."); }
	return (EN ?
		("You've switched seasons <b>" + (Game.seasonUses == 1 ? "once" : Game.seasonUses == 2 ? "twice" : (Game.seasonUses + " times")) + "</b> this ascension.") :
		(Game.seasonUses == 1 ? loc("You've switched seasons <b>once</b> this ascension.") : loc("You've switched seasons <b>%1 times</b> this ascension.", Game.seasonUses)));
};

Game.hasAura = function (name) {
	if (Game.predictiveMode && Game.tempDragonAuraOff === name) {
		return false;
	}
	return Game.dragonAuras[Game.Get("dragonAura")].name === name || Game.dragonAuras[Game.Get("dragonAura2")].name === name;
};

Game.auraMult = function (what) {
	var n = 0;
	if (Game.hasAura(what)) { n = 1; }
	if (Game.hasAura("Reality Bending") && Game.dragonLevel >= Game.dragonAurasByName[what].id + 4) { n += 0.1; }
	return n;
};

Game.hasBuff = function (what) {
	return Game.Buffs[what];
};

Game.hasGod = function (what) {
	var god = Game.pantheon.gods[what];
	if (god) {
		for (var i = 0; i < 3; i++) {
			if (Game.pantheon.slot[i] === god.id) {
				if (Game.hasAura("Supreme Intellect")) {
					return Math.max(1, i);
				}
				return (i + 1);
			}
		}
	}
	return false;
};

Game.GetTieredCpsMult = function (building) {
	var mult = 1;
	var isUnshackled = Game.HasUpgrade(building.unshackleUpgrade);
	for (var i in building.tieredUpgrades) {
		var upgrade = building.tieredUpgrades[i];
		var tier = Game.Tiers[upgrade.tier];
		if (!tier.special && upgrade.getBought()) {
			var tierMult = 2;
			if (isUnshackled && Game.HasUpgrade(tier.unshackleUpgrade)) {
				tierMult += building.id == 1 ? 0.5 : (20 - building.id) * 0.1;
			}
			mult *= tierMult;
		}
	}
	for (i = 0; i < building.synergies.length; i++) {
		var syn = building.synergies[i];
		if (syn.getBought()) {
			if (syn.buildingTie1 === building) {
				mult *= 1 + 0.05 * syn.buildingTie2.getAmount();
			} else if (syn.buildingTie2 === building) {
				mult *= 1 + 0.001 * syn.buildingTie1.getAmount();
			}
		}
	}
	if (building.fortune && building.fortune.getBought()) { mult *= 1.07; }
	if (building.grandmaSynergy && building.grandmaSynergy.getBought()) {
		mult *= 1 + Game.Objects["Grandma"].getAmount() * 0.01 * (1 / (building.id - 1));
	}
	return mult;
};

Game.setDisabled = function (ele, disable) {
	ele = $(ele)[0];
	if (!ele) { return; }
	disable = typeof disable === "undefined" ? !ele.disabled : Boolean(disable);
	ele.disabled = disable;
	var $par = $(ele.parentNode);
	if ($par.is("label")) {
		$par.toggleClass("disabled", disable);
	} else if ($par.is("select")) {
		$(ele).toggleClass("hidden", disable);
	}
	return ele.disable;
};

Game.updateMaxWrinklers = function (force) {
	var prevMax = Game.maxWrinklers;
	var n = 10;
	if (Game.HasUpgrade("Elder spice")) {
		n += 2;
	}
	n += Math.round(Game.auraMult("Dragon Guts") * 2);
	n = Math.min(n, Game.wrinklerLimit);
	Game.maxWrinklers = n;
	if (force || prevMax !== n) {
		byId("numWrinklersIn").maxIn = n;
		Game.setInput("#numWrinklersIn");
	}
};

var ObjectPriceMultStr = "";
var mapToNum = function (i) { return Number(i); };
//cache price reduction upgrade.bought values, for use in getPrice methods
Game.setPriceMultArrays = function () {
	Game.ObjectPriceMultArray = [
		Game.HasUpgrade("Season savings"),
		Game.HasUpgrade("Santa's dominion"),
		Game.HasUpgrade("Faberge egg"),
		Game.HasUpgrade("Divine discount"),
		Game.HasUpgrade("Fortune #100"),
		1 - Game.auraMult("Fierce Hoarder") * 0.02,
		Boolean(Game.hasBuff("Everything must go")),
		Boolean(Game.hasBuff("Crafty pixies")),
		Boolean(Game.hasBuff("Nasty goblins")),
		Game.eff("buildingCost"),
		Number(Game.hasGod("creation")) //Dotjeiess
	];
	var newStr = Game.ObjectPriceMultArray.map(mapToNum).join("");

	Game.UpgradePriceMultArray = [
		Game.HasUpgrade("Toy workshop"),
		Game.HasUpgrade("Five-finger discount"),
		Game.ObjectPriceMultArray[1], //Santa's dominion
		Game.ObjectPriceMultArray[2], //Faberge egg
		Game.HasUpgrade("Divine sales"),
		Game.HasUpgrade("Fortune #100"),
		Game.HasUpgrade("Kitten wages"),
		Boolean(Game.hasBuff("Haggler's luck")),
		Boolean(Game.hasBuff("Haggler's misery")),
		1 - Game.auraMult("Master of the Armory") * 0.02,
		Game.eff("upgradeCost"),
		Game.HasUpgrade("Divine bakeries")
	];

	if (newStr !== ObjectPriceMultStr) {
		ObjectPriceMultStr = newStr;
		for (var i = 0; i < Game.ObjectsById.length; i++) {
			Game.ObjectsById[i].priceCache = {};
		}
	}
};

Game.modifyObjectPrice = function (building, price) {
	var arr = Game.ObjectPriceMultArray;
	if (arr[0]) { price *= 0.99; } //Season savings
	if (arr[1]) { price *= 0.99; } //Santa's dominion
	if (arr[2]) { price *= 0.99; } //Faberge egg
	if (arr[3]) { price *= 0.99; } //Divine discount
	if (arr[4]) { price *= 0.99; } //Fortune #100
	price *= arr[5]; //Fierce Hoarder
	if (arr[6]) { price *= 0.95; } //Everything must go
	if (arr[7]) { price *= 0.98; } //Crafty pixies
	if (arr[8]) { price *= 1.02; } //Nasty goblins
	if (building.fortune && Game.HasUpgrade(building.fortune.name)) { price *= 0.93; }
	price *= arr[9]; //buildingCost minigame effect

	var godLvl = arr[10]; //creation
	if (godLvl == 1) {      price *= 0.93; }
	else if (godLvl == 2) { price *= 0.95; }
	else if (godLvl == 3) { price *= 0.98; }
	return price;
};

Game.setObjectDisplays = function () {
	for (var i = 0; i < Game.ObjectsById.length; i++) {
		Game.ObjectsById[i].setDisplay();
	}
};

// var foolsNameCheck = byId("foolsNameCheck");

Game.setSeason = function (season) {
	var seasonObj = Game.seasons[season];
	if (!seasonObj) {
		seasonObj = Game.seasons[Game.defaultSeason];
	}
	if (!seasonObj) {
		seasonObj = {season: ""};
	}
	Game.season = seasonObj.season || "";
	$(".seasonBlock").addClass("hidden");
	$('.seasonBlock[data-season="' + Game.season + '"]').removeClass("hidden");

	//TODO revisit autoforce fools display names once?
	// if (Game.season === "fools" && !foolsNameCheck.manualChecked && Game.defaultSeason !== "fools") {
	// 	foolsNameCheck.checked = true;
	// }
	// Game.setObjectDisplays();
};

Game.getGoldCookieDurationMod = function (wrath) {
	var effectDurMod = 1;
	if (Game.HasUpgrade("Get lucky")) {       effectDurMod *= 2; }
	if (Game.HasUpgrade("Lasting fortune")) { effectDurMod *= 1.1; }
	if (Game.HasUpgrade("Lucky digit")) {     effectDurMod *= 1.01; }
	if (Game.HasUpgrade("Lucky number")) {    effectDurMod *= 1.01; }
	if (Game.HasUpgrade("Green yeast digestives")) { effectDurMod *= 1.01; }
	if (Game.HasUpgrade("Lucky payout")) {    effectDurMod *= 1.01; }
	effectDurMod *= 1 + Game.auraMult("Epoch Manipulator") * 0.05;

	if (wrath) {
		effectDurMod *= Game.eff("wrathCookieEffDur");
	} else {
		effectDurMod *= Game.eff("goldenCookieEffDur");
	}

	var godLvl = Game.hasGod("decadence"); //Vomitrax
	if (godLvl == 1) {      effectDurMod *= 1.07; }
	else if (godLvl == 2) { effectDurMod *= 1.05; }
	else if (godLvl == 3) { effectDurMod *= 1.02; }

	return effectDurMod;
};

//shortcut function to get either current or temporary property of Game
Game.Get = function (key) {
	return Game.predictiveMode && key in Game.temp ? Game.temp[key] : Game[key];
};

//shortcut function to set either current or temporary property of Game
Game.Set = function (key, value) {
	var obj = Game.predictiveMode && key in Game.temp ? Game.temp : Game;
	obj[key] = value;
};

Game.getCookiesBaked = function (add) {
	return (Game.Get("cookiesBaked") + (Number(add) || 0));
};

Game.ComputeCps = function (base, mult, bonus) {
	return (base) * (Math.pow(2, mult)) + (bonus || 0);
};

Game.addClickMult = function (mult) {
	for (var key in Game.Buffs) {
		var multClick = Game.Buffs[key].multClick;
		if (typeof multClick !== "undefined") {
			mult *= multClick;
		}
	}
	return mult;
};

Game.calcCookiesPerClick = function (cps, includeBuffs) {
	var i, upgrade;
	var add = 0;
	if (Game.HasUpgrade("Thousand fingers")) {    add += 0.1; }
	if (Game.HasUpgrade("Million fingers")) {     add *= 5; }
	if (Game.HasUpgrade("Billion fingers")) {     add *= 10; }
	if (Game.HasUpgrade("Trillion fingers")) {    add *= 20; }
	if (Game.HasUpgrade("Quadrillion fingers")) { add *= 20; }
	if (Game.HasUpgrade("Quintillion fingers")) { add *= 20; }
	if (Game.HasUpgrade("Sextillion fingers")) {  add *= 20; }
	if (Game.HasUpgrade("Septillion fingers")) {  add *= 20; }
	if (Game.HasUpgrade("Octillion fingers")) {   add *= 20; }
	if (Game.HasUpgrade("Nonillion fingers")) {   add *= 20; }
	if (Game.HasUpgrade("Decillion fingers")) {   add *= 20; }
	if (Game.HasUpgrade("Undecillion fingers")) { add *= 20; }
	if (Game.HasUpgrade("Unshackled cursors")) {  add *= 25; }
	add *= Game.Get("ObjectsOwned") - Game.Objects["Cursor"].getAmount();

	if (isNaN(cps)) { cps = Game.Get("cookiesPs"); }
	cps *= 0.01;
	for (i = 0; i < Game.UpgradesByGroup.clickPercent.length; i++) {
		upgrade = Game.UpgradesByGroup.clickPercent[i];
		if (Game.HasUpgrade(upgrade.name)) { //not getBought() because fortune
			add += cps;
		}
	}

	var mult = 1;
	if (Game.HasUpgrade("Santa's helpers")) { mult = 1.1; }
	if (Game.HasUpgrade("Cookie egg")) {      mult *= 1.1; }
	if (Game.HasUpgrade("Halo gloves")) {     mult *= 1.1; }
	if (Game.HasUpgrade("Dragon claw")) {     mult *= 1.03; }

	if (Game.HasUpgrade("Aura gloves")) {
		mult *= 1 + 0.05 * Math.min(Game.Objects["Cursor"].level, Game.HasUpgrade("Luminous gloves") ? 20 : 10);
	}

	mult *= Game.eff("click");

	var godLvl = Game.hasGod("labor"); //Muridal
	if (godLvl == 1) {      mult *= 1.15; }
	else if (godLvl == 2) { mult *= 1.1; }
	else if (godLvl == 3) { mult *= 1.05; }

	if (includeBuffs) {
		mult = Game.addClickMult(mult);
	}

	mult *= 1 + Game.auraMult("Dragon Cursor") * 0.05;

	var out = mult * Game.ComputeCps(1, Game.HasUpgrade("Reinforced index finger") +
		Game.HasUpgrade("Carpal tunnel prevention cream") + Game.HasUpgrade("Ambidextrous"), add);

	if (Game.hasBuff("Cursed finger")) {
		out = Game.Buffs["Cursed finger"].power;
	}

	return out;
};

Game.eff = function (name, def) {
	if (typeof Game.effs[name] === "undefined") {
		return (typeof def === "undefined" ? 1 : def);
	} else {
		return Game.effs[name];
	}
};

Game.setEffs = function () {
	//add up effect bonuses from building minigames
	var effs = {};
	for (var i = 0; i < Game.ObjectsById.length; i++) {
		var building = Game.ObjectsById[i];
		if (building.minigame && building.minigame.effs) {
			var myEffs = Game.ObjectsById[i].minigame.effs;
			for (var j in myEffs) {
				if (effs[j]) {
					effs[j] *= myEffs[j];
				} else {
					effs[j] = myEffs[j];
				}
			}
		}
	}
	Game.effs = effs;
};

Game.CalculateCookiesPs = function (earnedAchs, method) {
	if (!Array.isArray(earnedAchs)) {
		earnedAchs = [];
	}
	if (!method || typeof Game[method] !== "function") {
		method = "CalculateGains";
	}

	var cpsObj = Game[method]();
	if (Game.predictiveMode && cpsObj.rawCookiesPs < Game.rawCookiesPs) {
		return cpsObj;
	}

	var earned = 0;
	for (var i = 0; i < Game.CpsAchievements.length; i++) {
		var achieve = Game.CpsAchievements[i];
		if (!achieve.getWon() && achieve.require(cpsObj.rawCookiesPs)) {
			achieve.setWon(true);
			earned++;
			if (Game.predictiveMode) {
				earnedAchs.push(achieve);
			}
		}
	}

	if (earned > 0) {
		Game.Set("AchievementsOwned", Game.Get("AchievementsOwned") + earned);
		if (Game.Get("kittensOwned") > 0) {
			//recurse to see if you'd earn more cps achievements just from the milk gained
			//(probably not but better safe than sorry)
			cpsObj = Game.CalculateCookiesPs(earnedAchs, method);
		}
	}

	return cpsObj;
};

Game.GetHeavenlyMultiplier = function () {
	var heavenlyMult = 0;
	if (Game.HasUpgrade("Heavenly chip secret")) {   heavenlyMult += 0.05; }
	if (Game.HasUpgrade("Heavenly cookie stand")) {  heavenlyMult += 0.20; }
	if (Game.HasUpgrade("Heavenly bakery")) {        heavenlyMult += 0.25; }
	if (Game.HasUpgrade("Heavenly confectionery")) { heavenlyMult += 0.25; }
	if (Game.HasUpgrade("Heavenly key")) {           heavenlyMult += 0.25; }
	heavenlyMult *= 1 + Game.auraMult("Dragon God") * 0.05;
	if (Game.HasUpgrade("Lucky digit")) {            heavenlyMult *= 1.01; }
	if (Game.HasUpgrade("Lucky number")) {           heavenlyMult *= 1.01; }
	if (Game.HasUpgrade("Lucky payout")) {           heavenlyMult *= 1.01; }

	var godLvl = Game.hasGod("creation"); //Dotjeiess
	if (godLvl == 1) {      heavenlyMult *= 0.7; }
	else if (godLvl == 2) { heavenlyMult *= 0.8; }
	else if (godLvl == 3) { heavenlyMult *= 0.9; }
	return heavenlyMult;
};

Game.CalculateGains = function (heavenlyMult) {
	var mult = 1;
	var cpsObj = {
		cookiesPs: 0,
		cookiesPsBase: 0,
		cookiesPsByType: {},
		cookiesMultByType: {},
		milkMult: 1,
		addCpsBase: 0
	};

	if (Game.ascensionMode !== 1) {
		if (isNaN(heavenlyMult)) {
			heavenlyMult = Game.GetHeavenlyMultiplier();
		}
		mult += Game.Get("prestige") * 0.01 * Game.heavenlyPower * heavenlyMult;
	}

	mult *= Game.eff("cps");

	if (Game.HasUpgrade("Heralds") && Game.ascensionMode !== 1) {
		mult *= 1 + 0.01 * Game.heralds;
	}

	var hasResidualLuck = Game.HasUpgrade("Residual luck");

	var goldenSwitchMult = 1.5;
	var cookieMult = 1;
	var eggMult = 1;
	for (var i = 0; i < Game.UpgradesNoMisc.length; i++) {
		var upgrade = Game.UpgradesNoMisc[i];
		if (upgrade.getBought()) {
			if (upgrade.pool === "cookie" || upgrade.pseudoCookie) {
				cookieMult *= 1 + (typeof upgrade.power === "function" ? upgrade.power(upgrade) : upgrade.power) * 0.01;
			}
			if (typeof upgrade.groups.plus === "number") {
				mult *= upgrade.groups.plus;
			}

			var addCps = upgrade.groups.addCps;
			if (typeof addCps === "number") { //"egg"
				cpsObj.addCpsBase += addCps;
				cpsObj.cookiesPsByType[upgrade.name] = addCps;
			}
			if (hasResidualLuck && upgrade.groups.goldSwitchMult) {
				goldenSwitchMult += 0.1;
			}
			if (upgrade.groups.commonEgg) {
				eggMult *= 1.01;
			}
		}
	}

	cpsObj.cookiesMultByType["cookie"] = cookieMult;
	mult *= cookieMult;

	var godLvl = Game.hasGod("asceticism"); //Holobore
	if (godLvl == 1) {      mult *= 1.15; }
	else if (godLvl == 2) { mult *= 1.1; }
	else if (godLvl == 3) { mult *= 1.05; }

	godLvl = Game.hasGod("ages"); //Cyclius
	if (godLvl == 1) {      mult *= 1 + 0.15 * Math.sin((Game.lastUpdateTime / 1000 / (60 * 60 * 3)) * Math.PI * 2); }
	else if (godLvl == 2) { mult *= 1 + 0.15 * Math.sin((Game.lastUpdateTime / 1000 / (60 * 60 * 12)) * Math.PI * 2); }
	else if (godLvl == 3) { mult *= 1 + 0.15 * Math.sin((Game.lastUpdateTime / 1000 / (60 * 60 * 24)) * Math.PI * 2); }

	if (Game.HasUpgrade("Santa's legacy")) {
		mult *= 1 + (Game.Get("santaLevel") + 1) * 0.03;
	}

	if (Game.HasUpgrade("Century egg")) {
		eggMult *= Game.CenturyEggBoost;
	}

	cpsObj.cookiesMultByType["eggs"] = eggMult;
	mult *= eggMult;

	if (Game.HasUpgrade("Sugar baking")) {
		mult *= (1 + Math.min(100, Game.lumps) * 0.01);
	}

	mult *= 1 + Game.auraMult("Radiant Appetite");

	var n = Game.numGoldenCookies;
	var auraMult = Game.auraMult("Dragon's Fortune");
	for (i = 0; i < n; i++) { mult *= 1 + auraMult * 1.23; }

	cpsObj.preMilkMult = mult;
	mult = Game.addMilkMult(cpsObj, mult);

	Game.addBuildingCps(cpsObj);

	cpsObj.cookiesPs += cpsObj.addCpsBase;

	cpsObj.rawMult = mult;
	cpsObj.rawCookiesPs = cpsObj.cookiesPs * mult;
	var extraMult = 1;

	var name = Game.bakeryNameLowerCase;
	if (name === "orteil") {
		extraMult *= 0.99;
	} else if (name === "ortiel") { //or so help me
		extraMult *= 0.98;
	}

	if (Game.HasUpgrade("Elder Covenant")) { extraMult *= 0.95; }

	if (Game.HasUpgrade("Golden switch [off]")) { extraMult *= goldenSwitchMult; }
	if (Game.HasUpgrade("Shimmering veil [off]")) {
		extraMult *= 1 + Game.getVeilBoost();
	}
	if (Game.HasUpgrade("Magic shenanigans")) { extraMult *= 1000; }
	if (Game.HasUpgrade("Occult obstruction")) { extraMult *= 0; }

	var multCpSTotal = 1;

	for (var key in Game.Buffs) {
		var multCpS = Game.Buffs[key].multCpS;
		if (typeof multCpS !== "undefined") {
			multCpSTotal *= multCpS;
		}
	}
	cpsObj.buffMultCps = multCpSTotal;

	cpsObj.unbuffedExtraMult = extraMult;
	var unbuffedMult = mult * extraMult;
	extraMult *= multCpSTotal;

	cpsObj.extraMult = extraMult;
	mult *= extraMult;
	cpsObj.globalCpsMult = mult;
	cpsObj.unbuffedGlobalCpsMult = unbuffedMult;

	cpsObj.unbuffedCookiesPs = cpsObj.cookiesPs * unbuffedMult;
	cpsObj.unbuffedCookiesPerClick = Game.calcCookiesPerClick(cpsObj.unbuffedCookiesPs, false);
	cpsObj.unbuffedCookiesPsPlusClicks = cpsObj.unbuffedCookiesPs + cpsObj.unbuffedCookiesPerClick * Game.clicksPs;

	cpsObj.cookiesPs *= mult;
	cpsObj.cookiesPerClick = Game.calcCookiesPerClick(cpsObj.cookiesPs, true);
	cpsObj.cookiesPsPlusClicks = cpsObj.cookiesPs + cpsObj.cookiesPerClick * Game.clicksPs;

	return cpsObj;
};

//bit of a pain to do this, but optimizations help when there's so many .chains to check
Game.CalculateBuildingGains = function () {
	var cpsObj = {
		cookiesPs: 0,
		cookiesPsBase: 0,
		cookiesPsByType: {},
		cookiesMultByType: {},
		milkProgress: Game.Get("AchievementsOwned") / 25,
		milkMult: Game.temp.cpsObj.milkMult || 1,
		preMilkMult: Game.temp.cpsObj.preMilkMult,
		extraMult: Game.temp.cpsObj.extraMult,
		addCpsBase: Game.addCpsBase
	};

	var mult = Game.temp.AchievementsOwned !== Game.AchievementsOwned ? Game.addMilkMult(cpsObj, cpsObj.preMilkMult) : Game.temp.cpsObj.rawMult;

	Game.addBuildingCps(cpsObj);

	cpsObj.cookiesPs += cpsObj.addCpsBase;

	cpsObj.rawMult = mult;
	cpsObj.rawCookiesPs = cpsObj.cookiesPs * mult;

	mult *= cpsObj.extraMult;
	cpsObj.globalCpsMult = mult;
	cpsObj.cookiesPs *= mult;

	cpsObj.cookiesPerClick = Game.calcCookiesPerClick(cpsObj.cookiesPs, true);
	cpsObj.cookiesPsPlusClicks = cpsObj.cookiesPs + cpsObj.cookiesPerClick * Game.clicksPs;

	return cpsObj;
};

Game.setObjectGodMultiplier = function () {
	var buildMult = 1;
	var godLvl = Game.hasGod("decadence"); //Vomitrax
	if (godLvl == 1) {      buildMult *= 0.93; }
	else if (godLvl == 2) { buildMult *= 0.95; }
	else if (godLvl == 3) { buildMult *= 0.98; }

	godLvl = Game.hasGod("industry"); //Jeremy
	if (godLvl == 1) {      buildMult *= 1.1; }
	else if (godLvl == 2) { buildMult *= 1.06; }
	else if (godLvl == 3) { buildMult *= 1.03; }

	godLvl = Game.hasGod("labor"); //Muridal
	if (godLvl == 1) {      buildMult *= 0.97; }
	else if (godLvl == 2) { buildMult *= 0.98; }
	else if (godLvl == 3) { buildMult *= 0.99; }
	Game.objectGodMult = buildMult;
};

Game.addBuildingCps = function (cpsObj) {
	for (var i = 0; i < Game.ObjectsById.length; i++) {
		var building = Game.ObjectsById[i];
		var amount = building.getAmount();
		var cps = building.calcCps(building);
		if (Game.ascensionMode !== 1) {
			cps *= (1 + building.level * 0.01) * Game.objectGodMult;
		}
		if (building.id == 1 && Game.HasUpgrade("Milkhelp&reg; lactose intolerance relief tablets")) {
			cps *= 1 + 0.05 * cpsObj.milkProgress * cpsObj.milkMult;
		}
		var cpsTotal = cps * amount;
		cpsObj.cookiesPsBase += building.baseCps * amount;

		if (!Game.predictiveMode) {
			building.storedCps = cps;
			building.storedTotalCps = cpsTotal;
		}
		cpsObj.cookiesPs += cpsTotal;
		cpsObj.cookiesPsByType[building.name] = cpsTotal;
	}
	cpsObj.buildingCps = cpsObj.cookiesPs;
	return cpsObj;
};

Game.addMilkMult = function (cpsObj, mult) {
	var milkProgress = Game.Get("AchievementsOwned") / 25;
	cpsObj.milkProgress = milkProgress;
	if (Game.Get("kittensOwned") > 0) {
		var milkMult = 1;
		if (Game.HasUpgrade("Santa's milk and cookies")) { milkMult *= 1.05; }
		milkMult *= 1 + Game.auraMult("Breath of Milk") * 0.05;

		var godLvl = Game.hasGod("mother"); //Mokalsium
		if (godLvl == 1) {      milkMult *= 1.1; }
		else if (godLvl == 2) { milkMult *= 1.05; }
		else if (godLvl == 3) { milkMult *= 1.03; }

		milkMult *= Game.eff("milk");

		var catMult = 1;

		if (Game.HasUpgrade("Kitten helpers")) {     catMult *= (1 + milkProgress * 0.1 * milkMult); }
		if (Game.HasUpgrade("Kitten workers")) {     catMult *= (1 + milkProgress * 0.125 * milkMult); }
		if (Game.HasUpgrade("Kitten engineers")) {   catMult *= (1 + milkProgress * 0.15 * milkMult); }
		if (Game.HasUpgrade("Kitten overseers")) {   catMult *= (1 + milkProgress * 0.175 * milkMult); }
		if (Game.HasUpgrade("Kitten managers")) {    catMult *= (1 + milkProgress * 0.2 * milkMult); }
		if (Game.HasUpgrade("Kitten accountants")) { catMult *= (1 + milkProgress * 0.2 * milkMult); }
		if (Game.HasUpgrade("Kitten specialists")) { catMult *= (1 + milkProgress * 0.2 * milkMult); }
		if (Game.HasUpgrade("Kitten experts")) {     catMult *= (1 + milkProgress * 0.2 * milkMult); }
		if (Game.HasUpgrade("Kitten consultants")) { catMult *= (1 + milkProgress * 0.2 * milkMult); }
		if (Game.HasUpgrade("Kitten assistants to the regional manager")) { (catMult *= 1 + milkProgress * 0.175 * milkMult); }
		if (Game.HasUpgrade("Kitten marketeers")) {  catMult *= (1 + milkProgress * 0.15 * milkMult); }
		if (Game.HasUpgrade("Kitten analysts")) {    catMult *= (1 + milkProgress * 0.125 * milkMult); }
		if (Game.HasUpgrade("Kitten executives")) {  catMult *= (1 + milkProgress * 0.115 * milkMult); }
		if (Game.HasUpgrade("Kitten admins")) {      catMult *= (1 + milkProgress * 0.11 * milkMult); }
		if (Game.HasUpgrade("Kitten strategists")) { catMult *= (1 + milkProgress * 0.105 * milkMult); }
		if (Game.HasUpgrade("Kitten angels")) {      catMult *= (1 + milkProgress * 0.1 * milkMult); }
		if (Game.HasUpgrade("Fortune #103")) {       catMult *= (1 + milkProgress * 0.05 * milkMult); }

		cpsObj.milkMult = milkMult;
		cpsObj.cookiesMultByType["kittens"] = catMult;
		mult *= catMult;
	}
	return mult;
};


Game.resetObjects = function () {
	for (var i = 0; i < Game.ObjectsById.length; i++) { Game.ObjectsById[i].resetTemp(); }
	Game.temp.ObjectsOwned = Game.ObjectsOwned;
};
Game.resetUpgrades = function () {
	for (var i = 0; i < Game.UpgradesById.length; i++) { Game.UpgradesById[i].resetTemp(); }
	Game.temp.UpgradesOwned = Game.UpgradesOwned;
};
Game.resetAchievements = function (achsList, force) {
	if (!Array.isArray(achsList)) {
		achsList = Game.AchievementsById;
	}
	force = force || achsList === Game.AchievementsById;
	for (var i = 0; i < achsList.length; i ++) {
		var achieve = achsList[i];
		if (!force && !achieve.won && achieve.tempWon && Game.CountsAsAchievementOwned(achieve.pool)) { Game.temp.AchievementsOwned--; }
		achieve.tempWon = achieve.won;
	}
	if (force) {
		Game.temp.AchievementsOwned = Game.AchievementsOwned;
	}
};

Game.setPredictiveMode = function () {
	Game.predictiveMode = true;

	Game.resetObjects();
	Game.resetUpgrades();
	Game.resetAchievements();

	for (var i in Game.temp) {
		var val = Game[i];
		if (Array.isArray(val)) {
			val = val.slice(0);
		} else if (typeof val === "object" && val !== null) {
			val = $.extend({}, val);
		}
		Game.temp[i] = val;
	}
};

// writes to children elements, where obj's keys map to class attributes
Game.writeChildren = function ($parent, obj) {
	$parent = $($parent);
	for (var c in obj) {
		var val = obj[c];
		if (typeof val === "number") {
			val = Game.formatNumber(val, 1);
		}
		$parent.find("." + c).html(val);
	}
	return $parent;
};

var recommendListSort = function (a, b) {
	return ((a.rate - b.rate) || (a.order - b.order) || ((a.chain ? a.chain.amount : 0) - (b.chain ? b.chain.amount : 0)));
};

//#endregion methods


//#region update()

var updateScheduleTimer = null;
var lastUpdateDelay = 1;
var updateDelayedFuncs = [];
// Delay update so page reflows happen first and/or to throttle inputs
Game.scheduleUpdate = function (delay, afterUpdateFunc) {
	if (!isFinite(delay)) { delay = 1; }
	if (typeof afterUpdateFunc === "function") {
		updateDelayedFuncs.push(afterUpdateFunc);
	}
	delay = Math.max(delay, lastUpdateDelay) || lastUpdateDelay || 1;
	lastUpdateDelay = delay;
	clearTimeout(updateScheduleTimer);
	updateScheduleTimer = setTimeout(function () {
		Game.update();
		for (var i = 0; i < updateDelayedFuncs.length; i++) {
			updateDelayedFuncs[i]();
		}
		updateDelayedFuncs = [];
	}, delay);
};

Game.update = function () {
	Game.predictiveMode = false;
	clearTimeout(Game.updateTimer);
	clearTimeout(updateScheduleTimer);
	lastUpdateDelay = 1;
	Game.lastUpdateTime = Date.now();

	var i, building, upgrade, achieve, req;

	for (i = 0; i < Game.ObjectsById.length; i++) {
		building = Game.ObjectsById[i];
		if (building.minigame && building.minigame.updateFunc) {
			building.minigame.updateFunc();
		}
	}

	Game.setEffs();
	Game.setPriceMultArrays();

	Game.steam = byId("steamCheck").checked;
	document.body.classList.toggle("steam", Game.steam);
	Game.ascensionMode = Number(byId("bornAgainCheck").checked);
	Game.sellMultiplier = 0.25 * (1 + Game.auraMult("Earth Shatterer"));
	Game.cookiesBaked = byId("cookiesBaked").parsedValue;
	Game.cookiesPs = 0;

	Game.buildingBuyInterval = 1;
	if (byId("multiBuildRecCheck").checked && byId("quantityTen").checked) {
		Game.buildingBuyInterval = 10;
	}

	Game.heavenlyMultiplier = Game.GetHeavenlyMultiplier();
	var mult = Game.prestige * Game.heavenlyPower * Game.heavenlyMultiplier;
	byId("prestigeMult").innerHTML = Game.formatNumber(mult, 1);
	$("#prestigeInLabel").toggleClass("disabled", Game.ascensionMode === 1);
	$("#prestigeMultSpan").toggleClass("hidden", Game.ascensionMode === 1 || !mult);

	//the boost increases a little every day, with diminishing returns up to +10% on the 100th day
	var day = Math.floor(Math.max(Game.lastUpdateTime - Game.startDate, 0) / 1000 / 10) * 10 / 60 / 60 / 24;
	day = Math.min(day, 100);
	Game.CenturyEggBoost = 1 + (1 - Math.pow(1 - day / 100, 3)) * 0.1;

	Game.clicksPs = Math.min(byId("clicksPsIn").parsedValue, Game.maxClicksPs) || 0;
	Game.maxChain = byId("buildChainMax").parsedValue || 0;
	if (Game.maxChain < 0 || Game.maxChain > 1000) {
		Game.maxChain = 1000;
	}

	if (Game.clicksPs > 0 && Game.HasUpgrade("Shimmering veil [off]")) {
		Game.GetUpgrade("Shimmering veil [on]").setBought(true);
	}

	var santaIndex = Game.santa.dropEle.selectedIndex;
	Game.santaLevel = Math.max(Math.min(santaIndex - 1, Game.santaMax), 0) || 0;

	Game.setObjectGodMultiplier();

	// Game.setDisabled(foolsNameCheck, Game.season === "fools");
	// foolsNameCheck.checked = Game.season === "fools" ? true : foolsNameCheck.manualChecked;
	// var isFools = Game.season === "fools" || foolsNameCheck.checked;
	// var isFools = foolsNameCheck.checked;

	var bulkAmount = 1;
	if (byId("plusminus10").checked) {
		bulkAmount = 10;
	}
	if (byId("plusminus100").checked) {
		bulkAmount = 100;
	}

	//set building name and amounts and associated properties
	Game.ObjectsOwned = 0;
	Game.HighestBuilding = null;
	for (i = 0; i < Game.ObjectsById.length; i++) {
		building = Game.ObjectsById[i];
		var amount = building.amountIn.parsedValue;
		building.amount = amount;
		building.level = building.levelIn.parsedValue;
		building.price = building.getPrice();
		building.bulkPrice = building.getPriceSum(amount, amount + bulkAmount);
		building.$tooltipBlock = null;

		Game.ObjectsOwned += amount;
		if (amount > 0) {
			Game.HighestBuilding = building;
		}
	}


	Game.UpgradesOwned = 0;
	Game.kittensOwned = 0;
	Game.UpgradesToCheck = [];
	Game.hasClickPercent = false;

	for (i = 0; i < Game.UpgradesById.length; i++) {
		upgrade = Game.UpgradesById[i];
		if (upgrade.runFunc) {
			upgrade.runFunc();
		}

		upgrade.isPerm = false;
		upgrade.statsStr = null;
		upgrade.cpsObj = null;
		upgrade.cps = 0;
		upgrade.rate = 0;
		upgrade.amort = 0;
		upgrade.recommendObj = null;
		if (upgrade.chain) {
			upgrade.chain.recommendObj = null;
			upgrade.chain.rate = 0;
		}
		upgrade.$blacklistEle.toggleClass("hidden", upgrade.hidden || !upgrade.bought || !upgrade.blacklistCheckbox.checked)
			.toggleClass("strike", upgrade.bought && upgrade.blacklistCheckbox.checked);

		upgrade.$tooltipBlock = null;

		if (upgrade.noBuy && upgrade.bought) { //safety switch
			upgrade.bought = false;
		}

		if (upgrade.bought) {
			if (!upgrade.hidden && upgrade.groups.countedUpgrade) {
				Game.UpgradesOwned++;
			}
			if (upgrade.groups.kitten) {
				Game.kittensOwned++;
			}
			if (upgrade.groups.clickPercent) {
				Game.hasClickPercent += true;
			}
		}
	}

	if (Game.ascensionMode !== 1) {
		for (i = 0; i < Game.permanentUpgrades.length; i++) {
			upgrade = Game.GetUpgrade(Game.permanentUpgrades[i]);
			if (upgrade) {
				upgrade.isPerm = true;
			}
		}
	}

	byId("numUpgrades").innerHTML = Game.UpgradesOwned + " / " + Game.maxCountedUpgrades + " (" +
		Math.floor((Game.UpgradesOwned / Game.maxCountedUpgrades) * 100) + "%)";

	Game.minCumulative = Math.max(Game.getMinCumulative() - Game.minCumulativeOffset, 0);
	byId("setCookiesBakedNum").innerHTML = Game.formatNumber(Game.minCumulative);
	$("#setCookiesBakedSpan").toggleClass("hidden", !isFinite(Game.cookiesBaked + Game.minCumulative) || Game.cookiesBaked >= Game.minCumulative);
	Game.cookiesBaked = Math.max(Game.cookiesBaked, Game.minCumulative);

	Game.AchievementsOwned = 0;
	var achievementsOwnedOther = 0;
	var showResetAchs = false;
	var showEnableAchs = false;
	var showDisableAchs = false;
	Game.LockedAchievements = [];

	for (i = 0; i < Game.AchievementsById.length; i++) {
		achieve = Game.AchievementsById[i];
		req = achieve.require ? achieve.require() : false;

		if (!achieve.won && achieve.require && !achieve.groups.cpsAch) {
			if (req) {
				achieve.won = true;
			} else {
				Game.LockedAchievements.push(achieve);
			}
		}

		if (achieve.won) {
			if (Game.CountsAsAchievementOwned(achieve.pool)) {
				Game.AchievementsOwned++;
			} else {
				achievementsOwnedOther++;
			}

			if (!achieve.groups.cpsAch) { //ugh
				if (achieve.require) {
					showResetAchs = showResetAchs || !req;
				}
				showDisableAchs = showDisableAchs || !req;
			}
		} else if (!showEnableAchs && !achieve.groups.cpsAch && achieve.pool !== "dungeon") {
			showEnableAchs = true;
		}
		achieve.$crateNodes.toggleClass("enabled", achieve.won);
	}

	Game.buffMultClicks = Game.addClickMult(1);
	var cpsObj = Game.CalculateCookiesPs();
	$.extend(Game, cpsObj);
	Game.cpsObj = cpsObj;

	Game.garden.updateHarvestBonus();

	for (i = 0; i < Game.CpsAchievements.length && (!showResetAchs || !showDisableAchs); i++) {
		achieve = Game.CpsAchievements[i];
		if (achieve.won) {
			req = achieve.require();
			if (achieve.require) {
				showResetAchs = showResetAchs || !req;
			}
			showDisableAchs = showDisableAchs || !req;
		} else {
			showEnableAchs = true;
		}
	}

	$("#buildCpsTable").toggleClass("hideCpsPlus", !Game.cookiesPs || !Game.clicksPs || !Game.hasClickPercent);

	byId("numAch").innerHTML = Game.AchievementsOwned + " / " + Game.AchievementsTotal +
		" (" + Math.floor((Game.AchievementsOwned / Game.AchievementsTotal) * 100) + "%)";
	$("#numAchOther").text(" (+" + achievementsOwnedOther + ")").toggleClass("hidden", !achievementsOwnedOther);

	var milkStr = Math.round(Game.milkProgress * 100);
	// byId("achMilk").innerHTML = Math.round(Game.milkProgress * 100) + "% (" +
	// 	Game.Milks[Math.min(Math.floor(Game.milkProgress), Game.Milks.length - 1)].name + ")";
	byId("achMilk").innerHTML = Game.Milks[Math.min(Math.floor(Game.milkProgress), Game.Milks.length - 1)].rankStr;

	$("#achReset").toggleClass("hidden", !showResetAchs);
	$("#achDisableAll").toggleClass("hidden", !showDisableAchs);
	$("#achEnableAll").toggleClass("hidden", !showEnableAchs);

	var checkUpgrades = byId("hardcoreCheck").checked;
	var checkResearch = byId("researchCheck").checked;

	for (i = 0; i < Game.UpgradesById.length; i++) {
		upgrade = Game.UpgradesById[i];
		upgrade.setPrice();

		if (!upgrade.unlocked && upgrade.require) {
			upgrade.unlocked = Boolean(upgrade.require());
		}

		if (checkUpgrades && !upgrade.hidden && !upgrade.bought && !upgrade.blacklistCheckbox.checked && upgrade.groups.countedUpgrade &&
		(upgrade.pool !== "tech" || checkResearch) && (upgrade.unlocked || !upgrade.requiredUpgrade || Game.HasUpgrade(upgrade.requiredUpgrade))) {
			Game.UpgradesToCheck.push(upgrade);
		}

		upgrade.$crateNodes.toggleClass("unlocked", upgrade.unlocked).toggleClass("enabled", upgrade.bought);
	}

	byId("nextSeason").innerHTML = Game.formatNumber(Game.UpgradesByGroup.seasonSwitch[0].price);

	Game.nextTech = null;
	if (Game.HasUpgrade("Bingo center/Research facility")) {
		for (i = 0; i < Game.UpgradesByPool.tech.length; i++) {
			upgrade = Game.UpgradesByPool.tech[i];
			if (!upgrade.bought) {
				if (!upgrade.unlocked) {
					Game.nextTech = upgrade;
				}
				break;
			}
		}
	}
	byId("nextResearch").innerHTML = Game.nextTech ? Game.nextTech.name : "---";
	$("#nextResearchSpan").toggleClass("hidden", !Game.nextTech)[0].objTie = Game.nextTech;
	// $('#researchCheckSpan').toggleClass('hidden', !Game.nextTech);

	Game.updateMaxWrinklers();

	var suckRate = 1 / 20;
	suckRate *= Game.eff("wrinklerEat");
	suckRate *= 1 + Game.auraMult("Dragon Guts") * 0.2;
	var numWrinklers = Math.min(byId("numWrinklersIn").parsedValue, Game.maxWrinklers);
	Game.cpsSucked = Math.min(1, numWrinklers * suckRate);
	var witherMult = 1 - Game.cpsSucked;

	var str = "";
	var isWithered = Game.cpsSucked > 0 && Game.cookiesPs > 0;

	if (isWithered || Game.clicksPs > 0 || (Game.buffMultCps !== 1 && Game.unbuffedCookiesPs > 0)) { // || (Game.frenzyMult !== Game.activeFrenzyMult && Game.cookiesPs > 0)) {
		var noClickFrenzyPerClick = Game.calcCookiesPerClick(Game.cookiesPs, false);
		var cps = Game.unbuffedCookiesPs;

		str = "Cookies per Second: <span";
		if (isWithered && Game.buffMultCps === 1) {
			cps *= witherMult;
			str += ' class="warning"';
		}
		str += ">" + Game.formatNumber(cps, 1, true) + "</span>";

		if (Game.buffMultCps !== 1) {
			var witheredCookiesPs = Game.cookiesPs * witherMult;
			str += " x " + Game.formatNumber(Game.buffMultCps, 1) + " = <span" + (isWithered ? ' class="warning">' : '">') +
				Game.formatNumber(witheredCookiesPs, 1, true) + "</span>";
		}
		if (isWithered) {
			str += ' <small class="warning">(withered ' + Game.Beautify(Math.round(100 - 100 * witherMult), 1) + "%)</small>";
		}

		if (Game.clicksPs > 0 || Game.buffMultClicks !== 1) {
			str += "<br>Cookies per Click: " + Game.formatNumber(noClickFrenzyPerClick, 1, true);
			if (Game.buffMultClicks !== 1) {
				str += " x " + Game.formatNumber(Game.buffMultClicks, 1) + " = " + Game.formatNumber(Game.cookiesPerClick, 1, true);
			}
		}

		if (Game.clicksPs > 0) {
			str += "<br>Total: " + Game.formatNumber(Game.cookiesPsPlusClicks, 1, true) + " Cookies per Second";
		}
		str += "<br><br>";
	}

	byId("cpsWithMultsBlock").innerHTML = str;

	$(".productDragonBoost").toggleClass("hidden", !Game.hasAura("Supreme Intellect"));

	Game.filterAchievements();

	Game.updateDragon();
	Game.updateBuffs();

	Game.setPredictiveMode();
	Game.recommendList = [];

	Game.updatePrestige();
	Game.updateGoldenCookies();

	var nextCps = "---";
	var nextCpsPlusClicks = "---";
	if (Game.cookiesPs > 0 && Game.kittensOwned > 0 && Game.AchievementsOwned < Game.AchievementsTotal) {
		Game.temp.AchievementsOwned = Game.AchievementsOwned + 1;
		var nextAchCpsObj = Game.CalculateGains();
		nextCps = Math.abs(nextAchCpsObj.cookiesPs - Game.cookiesPs);
		nextCpsPlusClicks = Math.abs(nextAchCpsObj.cookiesPsPlusClicks - Game.cookiesPsPlusClicks);
	}
	Game.temp.AchievementsOwned = 0;

	var upgradeCpSDiff = Game.cookiesPs - Game.cookiesPsBase;
	if (Game.unbuffedGlobalCpsMult !== 0 && Game.buffMultCps === 0) { //sigh
		upgradeCpSDiff = 0;
	}

	Game.writeChildren("#buildCpsTotUp", {cps: upgradeCpSDiff, mult: Math.round(Game.globalCpsMult * 100)});
	Game.writeChildren("#buildCpsTotAch", {milk: milkStr, cps: Game.cookiesPs - Game.CalculateGains().cookiesPs,
		nextCps: nextCps, nextCpsPlus: nextCpsPlusClicks});
	Game.writeChildren("#buildCpsTotal", {amount: Game.addCommas(Game.ObjectsOwned),
		cps: Game.cookiesPs, perClick: Game.cookiesPerClick});

	Game.temp.AchievementsOwned = Game.AchievementsOwned;

	//santa
	var cond = santaIndex > 0 && Game.santaLevel < Game.santaMax;
	var price = Math.pow(Game.santaLevel + 1, Game.santaLevel + 1);
	Game.santa.price = price;
	var santaStr = cond ? Game.santaLevels[Game.santaLevel + 1] : "---";
	Game.setDisabled("#noSantaOpt", Game.HasUpgrade("A festive hat"));
	var calcNextSanta = cond && Game.cookiesPs > 0 && Game.HasUpgrade("Santa's legacy");
	Game.santa.recommendObj = null;
	var isSantaBlacklisted = Game.santa.blacklistCheckbox.checked;

	if (cond) {
		var nextSanta = santaStr;
		santaStr += " - Cost: " + Game.formatNumber(price);
		if (calcNextSanta) {
			Game.temp.santaLevel++;
			var santaCpsObj = Game.calculateChanges(price, []);
			santaStr += ", +" + Game.formatNumber(santaCpsObj.cookiesPsPlusClicksDiff, 1) + " cps";

			Game.temp.santaLevel = Game.santaLevel;
			Game.resetAchievements(santaCpsObj.earnedAchs, true);

			if (!isSantaBlacklisted && santaCpsObj.rate > 0) {
				Game.santa.recommendObj = {
					type: "santa",
					gameObj: Game.santa,
					name: nextSanta + " (santa level)",
					price: price,
					cpsObj: santaCpsObj,
					earnedAchs: santaCpsObj.earnedAchs,
					rate: santaCpsObj.rate
				};
				Game.recommendList.push(Game.santa.recommendObj);
			}
		}
	}
	$("#santaClick").toggleClass("hidden", !cond).html(santaStr);
	Game.santa.$blacklistEle.toggleClass("hidden", !calcNextSanta && !isSantaBlacklisted)
		.toggleClass("strike", !calcNextSanta && isSantaBlacklisted);

	Game.updateBuildings();
	Game.updateUpgrades();

	Game.recommendList.sort(recommendListSort);
	Game.updateRecommended();
	Game.updateBlacklist();

	Game.predictiveMode = false;
	Game.sortAndFilterUpgrades();

	if (typeof Game.updateTooltip === "function") {
		Game.updateTooltip(true);
	}

	$(".tabs > .tab").each(updateTab);

	if (byId("calcAutoSave").checked) {
		Game._saveCalc();
	}

	upgrade = Game.Upgrades["Century egg"];
	var check = Game.cookiesPs > 0 &&
		(Game.hasGod("ages") || //Cyclius
		(day < 100 && (upgrade.unlocked || upgrade.bought || Game.tooltipUpgrade === upgrade)));
	if (check) {
		Game.updateTimer = setTimeout(Game.update, 1000 * 10); //10 seconds
	}
	// $('#recalcButton').toggleClass('hidden', !check);
};


function updateTab() {
	if (this && typeof this.updateTabFunc === "function") {
		this.updateTabFunc();
	}
}


Game.updateBuildings = function () {
	var sum = {
		amount: Game.addCommas(Game.ObjectsOwned), desired: 0,
		buy1: 0, buy10: 0, buy100: 0,
		buyDesired: 0, cumu: 0, sell: 0
	};

	for (var i = 0; i < Game.ObjectsById.length; i++) {
		var building = Game.ObjectsById[i];
		building.recommendObj = null;

		var cpsObj = Game.setChanges([{gameObj: building}], [], "CalculateBuildingGains");

		var cps = building.storedTotalCps * Game.globalCpsMult;
		var percent = building.amount > 0 && Game.cookiesPs > 0 ? Game.Beautify(cps / Game.cookiesPs * 100, 1) : 0;
		var cpsWrite = Game.formatNumber(cps, 1, false, "", building.amount > 0 ? " (" + percent + "%)" : "");
		Game.writeChildren(building.$cpsRow, {
			buildPrice: building.bulkPrice, cps: cpsWrite,
			time: Game.formatTime(Math.ceil(building.price / Game.cookiesPsPlusClicks)),
			nextCps: cpsObj.cookiesPsDiff, cpsPlus: cpsObj.cookiesPsPlusClicksDiff, amort: Game.formatTime(cpsObj.amort)
		});

		var amount = building.amount;
		var desired = building.amountInDesired.parsedValue;

		var buy10 = building.getPriceSum(amount, amount + 10);
		var buy100 = building.getPriceSum(amount, amount + 100);
		var buyDesired = building.getPriceSum(amount, desired);
		var cumu = building.getPriceSum(0, amount);
		var sell = building.getSellSum(amount, desired);

		Game.writeChildren(building.$priceRow, {
			buy1: building.price, buy10: buy10,
			buy100: buy100, buyDesired: buyDesired, cumu: cumu, sell: sell
		});

		sum.desired += desired;
		sum.buy1 += building.price;
		sum.buy10 += buy10;
		sum.buy100 += buy100;
		sum.buyDesired += buyDesired;
		sum.cumu += cumu;
		sum.sell += sell;

		if (!building.blacklistCheckbox.checked) {
			building.recommendObj = {
				type: building.type,
				name: building.getRecommendedName(building.amount + Game.buildingBuyInterval),
				gameObj: building,
				toAmount: building.amount + Game.buildingBuyInterval,
				price: Game.buildingBuyInterval === 10 ? buy10 : building.price,
				order: building.id,
				cpsObj: cpsObj,
				rate: cpsObj.rate
			};
			Game.recommendList.push(building.recommendObj);
		}
	}

	Game.writeChildren("#buildPriceTotal", sum);
};

Game.updateUpgrades = function () {
	if (!byId("hardcoreCheck").checked) {
		return;
	}
	var recommendChains = byId("multiBuildRecCheck").checked && Game.maxChain > 0;
	var recommendResearch = byId("researchCheck").checked;

	for (var i = 0; i < Game.UpgradesToCheck.length; i++) {
		var upgrade = Game.UpgradesToCheck[i];

		if (upgrade.unlocked) {
			var cpsObj = upgrade.calcCps();
			if (cpsObj && cpsObj.amort > 0 && cpsObj.rate > 0 &&
			(upgrade.pool !== "tech" || recommendResearch) && (!upgrade.recommendFunc || upgrade.recommendFunc())) {
				upgrade.recommendObj = {
					type: upgrade.type,
					name: upgrade.iconName,
					price: upgrade.price,
					gameObj: upgrade,
					order: upgrade.order,
					cpsObj: cpsObj,
					rate: cpsObj.rate
				};
				Game.recommendList.push(upgrade.recommendObj);
				upgrade.$blacklistEle.removeClass("hidden strike");
			}
		}

		//upgrade chains (are a pain)
		var chain = upgrade.chain;
		if (chain && recommendChains && !upgrade.unlocked && chain.require()) {
			var chainCpsObj = Game.setChanges(Game.getUpgradeBuildChainChangeArr(upgrade, chain), [], "CalculateBuildingGains");
			chain.rate = chainCpsObj.rate;

			if (chain.rate > 0) {
				var chainAmount = Game.getUpgradeBuildChainAmount(chain);
				chain.recommendObj = {
					type: "upgrade chain",
					name: "Chain for " + upgrade.iconName,
					title: chain.building.getRecommendedName(chainAmount) + "\n" + upgrade.iconName,
					gameObj: upgrade,
					price: chainCpsObj.price,
					building: chain.building,
					toAmount: chainAmount,
					order: upgrade.order,
					cpsObj: chainCpsObj,
					rate: chainCpsObj.rate
				};
				Game.recommendList.push(chain.recommendObj);
				upgrade.$blacklistEle.removeClass("hidden strike");
			}
		}
	}
};

//sets temporary changes to the game state to calculate them, takes an array of js objects
//{gameObj: [either Game.Object (aka building) or upgrade], amount: number (for buildings, defaults to current amount + 1)}
//will pass setCpsNegative if set as an argument, as a property of the js obj, or if on the gameObj
Game.setChanges = function (changeArr, earnedAchs, method, noCalc) {
	Game.predictiveMode = true;
	var resetArr = [];
	var price = 0;
	var setCpsNegative = false;
	var ObjectsOwned = Game.temp.ObjectsOwned;

	for (var i = 0; i < changeArr.length; i++) {
		var c = changeArr[i];
		if (!c) { continue; }
		var gObj = c.gameObj;
		if (!gObj) { continue; }

		if (gObj.type === "building") {
			var nextAmount = c.amount || gObj.amount + Game.buildingBuyInterval;
			price += c.price || gObj.getPriceSum(gObj.tempAmount, nextAmount);
			Game.temp.ObjectsOwned += nextAmount - gObj.tempAmount;
			gObj.tempAmount = nextAmount;

			resetArr.push(gObj);
		} else if (gObj.type === "upgrade") {
			price += gObj.price;

			if (gObj.toggleInto && gObj.isChild) {
				gObj.toggleInto.setBought();
			} else {
				gObj.setBought();
			}

			if (Game.CountsAsUpgradeOwned(gObj.pool)) {
				Game.temp.UpgradesOwned += gObj.tempBought ? 1 : -1;
			}
			if (gObj.groups.kitten) {
				Game.temp.kittensOwned += gObj.tempBought ? 1 : -1;
			}
			resetArr.push(gObj);
		}
		setCpsNegative = setCpsNegative || c.setCpsNegative || gObj.setCpsNegative;
	}

	if (earnedAchs && earnedAchs.length) {
		for (i = 0; i < earnedAchs.length; i++) {
			var achieve = earnedAchs[i];
			if (!achieve.tempWon && Game.CountsAsAchievementOwned(achieve.pool)) { Game.temp.AchievementsOwned++; }
			achieve.tempWon = true;
		}
	}

	if (noCalc) {
		return;
	}

	var toReturn = Game.calculateChanges(price, earnedAchs, setCpsNegative, method);

	for (i = 0; i < resetArr.length; i++) {
		resetArr[i].resetTemp();
	}
	Game.temp.ObjectsOwned = ObjectsOwned;
	Game.temp.UpgradesOwned = Game.UpgradesOwned;
	Game.temp.kittensOwned = Game.kittensOwned;
	Game.resetAchievements(toReturn.earnedAchs);
	return toReturn;
};

//calculates cps changes and achievements earned based on changes
//pass setCpsNegative to set the difference in cps from current as a loss
Game.calculateChanges = function (price, earnedAchs, setCpsNegative, method) {
	price = Number(price) || 0;
	if (!Array.isArray(earnedAchs)) {
		earnedAchs = [];
	}
	Game.predictiveMode = true;

	for (var i = 0; i < Game.LockedAchievements.length; i++) {
		var achieve = Game.LockedAchievements[i];
		var arg = achieve.groups.bankAch ? price : undefined; //bit hacky but what can you do
		if (!achieve.tempWon && achieve.require && achieve.require(arg)) {
			achieve.tempWon = true;
			earnedAchs.push(achieve);
			if (Game.CountsAsAchievementOwned(achieve.pool)) {
				Game.temp.AchievementsOwned++;
			}
		}
	}

	var cpsObj = Game.CalculateCookiesPs(earnedAchs, method);
	var gameCpsObj = Game.temp.cpsObj;

	var sign = setCpsNegative ? -1 : 1;
	var cpscDiff = sign * Math.abs(gameCpsObj.cookiesPsPlusClicks - cpsObj.cookiesPsPlusClicks);
	cpsObj.cookiesPsDiff = sign * Math.abs(gameCpsObj.cookiesPs - cpsObj.cookiesPs);
	cpsObj.cookiesPerClickDiff = sign * Math.abs(gameCpsObj.cookiesPerClick - cpsObj.cookiesPerClick);
	cpsObj.cookiesPsPlusClicksDiff = cpscDiff;
	cpsObj.earnedAchs = earnedAchs;

	cpsObj.price = price;
	cpsObj.rate = cpscDiff > 0 ? Math.max(price * cpsObj.cookiesPsPlusClicks / cpscDiff, 0) || 0 : 0;
	cpsObj.amort = cpscDiff > 0 ? Math.ceil(price / cpscDiff) || 0 : 0;
	return cpsObj;
};

Game.updateDragon = function () {
	var lvlObj = Game.dragonLevels[Game.dragonLevel] || {name: "---", action: "---"};
	var str = lvlObj.action || "---";
	if (lvlObj.costStr) {
		str += " - Cost: " + lvlObj.costStr();
	}

	byId("dragonName").textContent = lvlObj.name;
	$("#dragonAction").html(str).attr("data-title", lvlObj.actionTitle || "")
		.toggleClass("clickme", Game.dragonLevel < Game.dragonLevelMax && Boolean(lvlObj.cost ? lvlObj.cost() : true));

	var $switchAura = $("#auraAvailable .aura.enabled");
	var switchId = $switchAura.attr("data-aura");
	var currentId = Game.$enabledAuraSlot ? Game.$enabledAuraSlot.attr("data-aura") : null;
	var otherId = Game.$enabledAuraSlot ? Game.$enabledAuraSlot.siblings().attr("data-aura") : null;

	$("#switchAuraBuy").html("Change aura (" + (Game.HighestBuilding ? "sacrifice 1 " + Game.HighestBuilding.displayName : "---") + ")")
		.toggleClass("hidden", !Game.HighestBuilding || !Game.$enabledAuraSlot || !$switchAura.length ||
			currentId == switchId || (switchId > 0 && otherId == switchId));
	$("#switchAuraFree").toggleClass("hidden", Game.$enabledAuraSlot && $switchAura.length && currentId == switchId);

	for (var i = 0; i < Game.dragonAuras.length; i++) {
		Game.dragonAuras[i].$crateNode.toggleClass("unlocked", Game.dragonLevel >= i + 4 && i != otherId);
	}
	$("#auraSlot0").toggleClass("unlocked", Game.dragonLevel > 4);
	$("#auraSlot1").toggleClass("unlocked", Game.dragonLevel >= Game.dragonLevelMax);
};

Game.HCfactor = 3;
Game.HowMuchPrestige = function (cookies) { //how much prestige [cookies] should land you
	return Math.pow(cookies / 1e12, 1 / Game.HCfactor);
};
Game.HowManyCookiesReset = function (chips) { //how many cookies [chips] are worth
	//this must be the inverse of the above function (ie. if cookies = chips^2, chips = cookies^(1/2) )
	return (Math.pow(chips, Game.HCfactor) * 1e12); //1 trillion
};
//ugh floating point why must you be a pain
Game.HowManyCookiesResetAdjusted = function (chips) {
	var cookies = Game.HowManyCookiesReset(chips);
	var i = 0;
	if (Game.HowMuchPrestige(cookies) < chips) {
		i = 1;
		while (Game.HowMuchPrestige(cookies + i) < chips) {
			i *= 10;
		}
	}
	return (cookies + i);
};

Game.updateBuffs = function () {
	for (var i = 0; i < Game.BuffTypes.length; i++) {
		Game.BuffTypes[i].updateFunc();
	}
};

Game.updatePrestige = function () {
	Game.predictiveMode = true;
	var cookiesReset = byId("cookiesReset").parsedValue;
	var cookiesBakedAllTime = Game.cookiesBaked + cookiesReset;
	var cpsObj;

	var prestigeFromCookiesReset = Math.floor(Game.HowMuchPrestige(cookiesReset));
	$("#setPrestigeSpan, #setCookiesResetSpan").toggleClass("hidden", prestigeFromCookiesReset === Game.prestige);
	byId("setPrestigeNum").innerHTML = Game.formatNumber(prestigeFromCookiesReset);
	var cookiesResetFromPrestige = Game.HowManyCookiesResetAdjusted(Game.prestige);
	var ele = byId("setCookiesResetNum");
	ele.innerHTML = Game.formatNumber(cookiesResetFromPrestige);
	ele.setValue = cookiesResetFromPrestige;

	var heavenlyMult = Game.heavenlyMultiplier;
	if (!heavenlyMult) {
		heavenlyMult = 1;
		if (Game.hasAura("Dragon God")) { heavenlyMult *= 1.05; }
	}
	$("#prestigeGainCpsHelp, #prestigeDesiredCpsHelp").toggleClass("hidden", Game.heavenlyMultiplier > 0 || !Game.cookiesPs);

	//prestige gained from resetting
	var prestigeGain = Math.floor(Game.HowMuchPrestige(cookiesBakedAllTime));
	var prestigeGainDiff = Math.max(prestigeGain - Game.prestige, 0) || 0;
	var gainStr = Game.formatNumber(prestigeGain) + " (+" + Game.formatNumber(prestigeGainDiff) + ")";
	if (prestigeGainDiff > 0 && Game.prestige > 0) {
		gainStr += " (+" + Game.Beautify(prestigeGainDiff / prestigeGain * 100, 1) + "%)";
	}
	byId("prestigeGain").innerHTML = gainStr;

	var cpsStr = "--- CpS";
	if (prestigeGainDiff > 0 && Game.cookiesPs > 0) {
		Game.temp.prestige = prestigeGain;
		cpsObj = Game.CalculateGains(heavenlyMult);
		cpsStr = Game.formatNumber(cpsObj.cookiesPs, 1) + " CpS (+" +
			Game.formatNumber(Math.max(cpsObj.cookiesPs - Game.cookiesPs, 0), 1) + ")";
		if (Game.clicksPs > 0) {
			cpsStr += ", " + Game.formatNumber(cpsObj.cookiesPsPlusClicks, 1) + " CpS (+" +
				Game.formatNumber(Math.max(cpsObj.cookiesPsPlusClicks - Game.cookiesPsPlusClicks, 0), 1) + ")";
		}
	}
	byId("prestigeGainCps").innerHTML = cpsStr;

	var cookiesForNextLevel = Math.max(Game.HowManyCookiesResetAdjusted(prestigeGain + 1) - cookiesBakedAllTime, 0) || 0;
	var timeForNextLevel = Game.cookiesPsPlusClicks > 0 && cookiesForNextLevel > 0 ? Math.ceil(cookiesForNextLevel / Game.cookiesPsPlusClicks) : "---";
	byId("cookiesNextPrestige").innerHTML = Game.formatNumber(cookiesForNextLevel);
	byId("cookiesNextPrestigeTime").innerHTML = Game.formatTime(timeForNextLevel);

	//prestige gained from desired (if applicable)
	var prestigeDesired = byId("prestigeDesiredIn").parsedValue;
	var prestigeDesiredDiff = Math.max(prestigeDesired - Game.prestige, 0) || 0;

	$("#prestigeDesiredGainRow, #cookiesPrestigeNeedRow").toggleClass("hidden", !prestigeDesiredDiff);
	gainStr = Game.formatNumber(prestigeDesired) + " (+" + Game.formatNumber(prestigeDesiredDiff) + ")";
	if (prestigeDesiredDiff > 0 && Game.prestige > 0) {
		gainStr += " (+" + Game.Beautify(prestigeDesiredDiff / prestigeDesired * 100, 1) + "%)";
	}
	byId("prestigeDesiredGain").innerHTML = gainStr;

	cpsStr = "--- CpS";
	if (prestigeDesiredDiff > 0 && Game.cookiesPs > 0) {
		Game.temp.prestige = prestigeDesired;
		cpsObj = Game.CalculateGains(heavenlyMult);
		cpsStr = Game.formatNumber(cpsObj.cookiesPs, 1) + " CpS (+" +
			Game.formatNumber(Math.max(cpsObj.cookiesPs - Game.cookiesPs, 0), 1) + ")";
		if (Game.clicksPs > 0) {
			cpsStr += ", " + Game.formatNumber(cpsObj.cookiesPsPlusClicks, 1) + " CpS (+" +
				Game.formatNumber(Math.max(cpsObj.cookiesPsPlusClicks - Game.cookiesPsPlusClicks, 0), 1) + ")";
		}
	}
	byId("prestigeDesiredCps").innerHTML = cpsStr;

	var cookiesForDesired = Math.max(Game.HowManyCookiesResetAdjusted(prestigeDesired) - cookiesBakedAllTime, 0) || 0;
	var timeForDesired = Game.cookiesPsPlusClicks > 0 && cookiesForDesired > 0 ? Math.ceil(cookiesForDesired / Game.cookiesPsPlusClicks) : "---";
	byId("cookiesPrestigeNeed").innerHTML = Game.formatNumber(cookiesForDesired);
	byId("cookiesPrestigeNeedTime").innerHTML = Game.formatTime(timeForDesired);

	Game.temp.prestige = Game.prestige;
};

//golden cookies
var gcShowClicks = false;
var gcEffectMult = 1;
var gcWrathEffectMult = 1;
var gcDurationMult = 1;

//list of effects; .calc for the table and .details if it's selected
var gcEffectsList = [{
		name: "Frenzy CpS",
		detailName: " frenzy",
		calc: function (str, cpsMultObj) {
			if (cpsMultObj.base || (cpsMultObj.current && (Game.buffMultCps === 1 || Game.buffMultCps === 0))) {
				return (str + '<td class="noSel">---</td>');
			}
			var html = Game.BeautifyAbbr(cpsMultObj.cookiesPs);
			var sum = Game.BeautifyAbbr(cpsMultObj.cookiesPs * cpsMultObj.duration);
			var title = cpsMultObj.duration + " seconds at " + Game.BeautifyAbbr(cpsMultObj.cookiesPs) + " CpS";
			if (gcShowClicks) {
				title += " + " + Game.BeautifyAbbr(cpsMultObj.cookiesPerClick) + " per click";
				sum = Game.BeautifyAbbr(cpsMultObj.cookiesPsPlusClicks * cpsMultObj.duration);
			}
			title += " = " + sum;
			return (str + "<td" + cpsMultObj.className + ' data-title="' + title + '">' + html + "</td>");
		},
		details: function (cpsMultObj) {
			var sum = Game.formatNumber(cpsMultObj.cookiesPs * cpsMultObj.duration);
			var str = cpsMultObj.duration + " seconds at " + Game.formatNumber(cpsMultObj.cookiesPs) + " CpS";
			if (gcShowClicks) {
				str += " + " + Game.formatNumber(cpsMultObj.cookiesPerClick) + " per click";
				sum = Game.formatNumber(cpsMultObj.cookiesPsPlusClicks * cpsMultObj.duration);
			}
			return (str + " = " + sum);
		}
	}, {
		name: "Max Lucky!",
		detailName: " Max Lucky!",
		calc: function (str, cpsMultObj) {
			var mult = cpsMultObj.type === "wrath" ? gcWrathEffectMult : gcEffectMult;
			var html = mult * cpsMultObj.cookiesPs * 900 + 13;
			var title = "Bank: " + Game.BeautifyAbbr(Math.ceil(cpsMultObj.cookiesPs * 6000)); //60 * 15 / 0.15
			return (str + "<td" + cpsMultObj.className + ' data-title="' + title + '">' + Game.BeautifyAbbr(html) + "</td>");
		},
		details: function (frenzy) {
			var mult = frenzy.type === "wrath" ? gcWrathEffectMult : gcEffectMult;
			return (Game.formatNumber(mult * frenzy.cookiesPs * 900 + 13) + " - Bank: " + Game.formatNumber(Math.ceil(frenzy.cookiesPs * 6000)));
		}
	}, {
		name: "x777 Click frenzy",
		calc: function (str, cpsMultObj) {
			var cookiesPerClick = cpsMultObj.cookiesPerClick;
			if (!Game.hasBuff("Click frenzy")) { cookiesPerClick *= 777; }
			var duration = Math.ceil(13 * gcDurationMult);
			var html = Game.BeautifyAbbr(cookiesPerClick);
			var title = duration + " seconds at " + html + " per click";
			if (Game.clicksPs > 0) {
				title += " = " + Game.BeautifyAbbr(cookiesPerClick * Game.clicksPs * duration);
			}
			return (str + "<td" + cpsMultObj.className + ' data-title="' + title + '">' + html + "</td>");
		},
		details: function (cpsMultObj) {
			var cookiesPerClick = cpsMultObj.cookiesPerClick;
			if (!Game.hasBuff("Click frenzy")) { cookiesPerClick *= 777; }
			if (cpsMultObj.current && Game.hasBuff("Click frenzy")) { cookiesPerClick = cpsMultObj.cookiesPerClick; }
			var duration = Math.ceil(13 * gcDurationMult);
			return (duration + " seconds at " + Game.formatNumber(cookiesPerClick) + " per click" +
				(Game.clicksPs > 0 ? " = " + Game.formatNumber(cookiesPerClick * Game.clicksPs * duration) : ""));
		}
	}, {
		name: "x1111 Dragonflight",
		className: "dragonflight",
		calc: function (str, cpsMultObj) {
			var cookiesPerClick = cpsMultObj.cookiesPerClick;
			if (!Game.hasBuff("Dragonflight")) { cookiesPerClick *= 1111; }
			var duration = Math.ceil(10 * gcDurationMult);
			var html = Game.BeautifyAbbr(cookiesPerClick);
			var title = duration + " seconds at " + html + " per click";
			if (Game.clicksPs > 0) {
				title += " = " + Game.BeautifyAbbr(cookiesPerClick * Game.clicksPs * duration);
			}
			return (str + "<td" + cpsMultObj.className + ' data-title="' + title + '">' + html + "</td>");
		},
		details: function (cpsMultObj) {
			var cookiesPerClick = cpsMultObj.cookiesPerClick;
			if (!Game.hasBuff("Dragonflight")) { cookiesPerClick *= 1111; }
			var duration = Math.ceil(10 * gcDurationMult);
			return (duration + " seconds at " + Game.formatNumber(cookiesPerClick) + " per click" +
				(Game.clicksPs > 0 ? " = " + Game.formatNumber(cookiesPerClick * Game.clicksPs * duration) : ""));
		}
}];

var $gcTableTbody = $("#gCookiesTable tbody");

var gcCpsMults = [
	{mult: 0.5, baseDuration: 66, type: "wrath"},
	{mult: 1, baseDuration: 0, base: true},
	{mult: 7, baseDuration: 77, reindeerMult: 0.75},
	{mult: 15, baseDuration: 60, type: "harvest"},
	{mult: 666, baseDuration: 6, type: "wrath", reindeerMult: 0.5}
];
var gcCpsMultCurrent = {
	mult: 1, baseDuration: 0, type: "current", current: true, reindeerMult: 1, header: byId("gCookiesCurrentBuffHeader")
};
gcCpsMults.push(gcCpsMultCurrent);

for (ii = 0; ii < gcCpsMults.length; ii++) {
	var cpsMultObj = gcCpsMults[ii];
	cpsMultObj.className = cpsMultObj.type ? ' class="' + cpsMultObj.type + '"' : "";
}

Game.updateGoldenCookies = function () {
	gcShowClicks = Game.cookiesPs > 0 && Game.clicksPs > 0 && Game.hasClickPercent;
	var gMult = 1;
	if (Game.HasUpgrade("Green yeast digestives")) { gMult *= 1.01; }
	if (Game.HasUpgrade("Dragon fang")) { gMult *= 1.03; }
	gcEffectMult = gMult * (1 + Game.auraMult("Unholy Dominion") * 0.1) * Game.eff("goldenCookieGain");
	gcWrathEffectMult = gMult * (1 + Game.auraMult("Ancestral Metamorphosis") * 0.1) * Game.eff("wrathCookieGain");

	/* $('#gCookiesInfo').toggleClass('hideWrath', !Game.HasUpgrade('One mind'))
		.toggleClass('hideHarvest', !Game.hasAura('Reaper of Fields'))
		.toggleClass('hideFlight', !Game.hasAura('Dragonflight')); */

	gcDurationMult = Game.getGoldCookieDurationMod();

	var duration;
	var mult = 1;
	if (Game.buffMultCps !== 1) {
		for (var name in Game.Buffs) {
			var buff = Game.Buffs[name];
			if (buff.multCpS) {
				var time = buff.time / Game.fps;
				if (duration) {
					duration = Math.min(duration, time);
				} else {
					duration = time;
				}
			}
		}

		if (Game.hasBuff("Frenzy")) {
			mult *= 0.75;
		}
		if (Game.hasBuff("Elder frenzy")) {
			mult *= 0.5;
		}
	}

	gcCpsMultCurrent.mult = Game.buffMultCps;
	gcCpsMultCurrent.baseDuration = duration || 0;
	gcCpsMultCurrent.reindeerMult = mult;
	gcCpsMultCurrent.header.innerHTML = "x" + Game.formatNumber(Game.buffMultCps, 1);

	var reindeerHtml = "";
	var reindeerBonusMult = 1;
	var reindeerBonusText = "";
	if (Game.HasUpgrade("Ho ho ho-flavored frosting")) {
		reindeerBonusMult = 2;
	}
	reindeerBonusMult *= Game.eff("reindeerGain");
	if (reindeerBonusMult !== 1) {
		reindeerBonusText = " x" + Game.Beautify(reindeerBonusMult, 2);
	}

	var currentIsRedundant = false;
	for (var i = 0; i < gcCpsMults.length; i++) {
		var cpsMultObj = gcCpsMults[i];
		if (!cpsMultObj.current && cpsMultObj.mult === Game.buffMultCps) {
			currentIsRedundant = true;
			break;
		}
	}

	for (i = 0; i < gcCpsMults.length; i++) {
		cpsMultObj = gcCpsMults[i];
		cpsMultObj.duration = Math.ceil(cpsMultObj.baseDuration * gcDurationMult);
		cpsMultObj.cookiesPs = Game.unbuffedCookiesPs * cpsMultObj.mult;
		cpsMultObj.cookiesPerClick = Game.calcCookiesPerClick(cpsMultObj.cookiesPs, true);
		cpsMultObj.cookiesPsPlusClicks = cpsMultObj.cookiesPs + Game.clicksPs * cpsMultObj.cookiesPerClick;

		if (cpsMultObj.current && currentIsRedundant) {
			continue;
		}
		var reindeerCookies = cpsMultObj.cookiesPs * 60;
		var frenzyReindeerMultText = "";
		if (cpsMultObj.reindeerMult && cpsMultObj.reindeerMult !== 1) {
			reindeerCookies *= cpsMultObj.reindeerMult;
			frenzyReindeerMultText = " x" + cpsMultObj.reindeerMult;
		}

		reindeerHtml = "<div" + cpsMultObj.className + ">1 minute x" + Game.formatNumber(cpsMultObj.mult, 1) +
			" production" + reindeerBonusText + frenzyReindeerMultText + ": " +
			Game.formatNumber(Math.max(25, reindeerCookies) * reindeerBonusMult) + "</div>" + reindeerHtml;
	}

	$("#reindeerWrite").html(reindeerHtml);

	$gcTableTbody.empty();
	var len = gcEffectsList.length;
	for (i = 0; i < len; i++) {
		var effects = gcEffectsList[i];
		var tr = $("<tr></tr>").html("<td>" + effects.name + "</td>" + gcCpsMults.reduce(effects.calc, ""))
			.appendTo($gcTableTbody);
		if (effects.className) {
			tr.addClass(effects.className);
		}
	}

	Game.updateGoldenCookiesDetails();
};

Game.gcSelectedCells = [];
Game.getGCCellFrenzyIndeces = function (cell) {
	var $cell = $(cell);
	var $par = $cell.parent();
	return [$gcTableTbody.children().index($par), $par.children().index(cell)];
};
var gcTableTbody = $gcTableTbody[0];
var $gcClose = $('<span class="close" data-title="Remove this">x</span>');

Game.updateGoldenCookiesDetails = function () {
	$("#gCookiesTable .gcSelected").removeClass("gcSelected");
	var $par = $("#gCookiesDetails").empty();
	var hasSelected = false;

	// show details for cells that currently exist and are not hidden
	for (var i = 0; i < Game.gcSelectedCells.length; i++) {
		var indeces = Game.gcSelectedCells[i].split(",");
		var tr = gcTableTbody.children[indeces[0]];
		if (!tr) { continue; }

		var cell = tr.children[indeces[1]];
		var $cell = $(cell);
		if (cell && !$cell.hasClass("noSel")) {
			hasSelected = true;
			var effects = gcEffectsList[indeces[0]];
			var cpsMultObj = gcCpsMults[indeces[1] - 1];
			var $ele = $("<div" + cpsMultObj.className + ">x" + cpsMultObj.mult + (effects.detailName || (" + " + effects.name)) +
				": " + effects.details(cpsMultObj) + "</div>")
				.prependTo($par);
			$gcClose.clone().prependTo($ele)[0].gcIndex = Game.gcSelectedCells[i];

			$cell.addClass("gcSelected");
		}
	}

	$("#gCookiesDetailsBlock").toggleClass("hidden", !hasSelected);
};

function processAchs(achs) {
	if (!achs || !Array.isArray(achs)) {
		return [];
	}
	var u = {};
	var a = [];
	for (var i = 0, len = achs.length; i < len; i++) {
		if (!u.hasOwnProperty(achs[i].id)) {
			a.push(achs[i]);
			u[achs[i].id] = true;
		}
	}
	return a.sort(Game.sortByOrderFunc);
}

Game.updateRecommended = function () {
	var mode = Game.predictiveMode;
	var $par = $("#recommendedList").empty();
	var enableLookahead = byId("multiBuildRecCheck").checked && !Game.altMode;

	var i = 0;
	var reccedCount = 0;
	var len = Game.recommendList.length;
	var reccedBuildings = {};

	while (i < len && reccedCount < Game.maxRecommend) {
		var recObj = Game.recommendList[i];
		i++;

		var $ele = null;

		if (recObj.type === "building") {
			if (reccedBuildings[recObj.gameObj.name]) {
				continue;
			}
			reccedBuildings[recObj.gameObj.name] = true;
		}

		if (recObj.type === "upgrade chain" && Game.altMode) {
			if (reccedBuildings[recObj.building.name]) {
				continue;
			}
			$ele = $(getRecommendedListHTML(recObj.building.recommendObj));
			$ele[0].recommendObj = recObj.building.recommendObj;
			reccedBuildings[recObj.building.name] = true;
		}

		if (recObj.type === "building" && enableLookahead) {
			var obj = recObj.lookaheadObj;
			if (!obj) {
				obj = Game.lookahead(recObj, reccedCount);
				recObj.lookaheadObj = obj;
			}
			if (obj.toAmount > recObj.toAmount) {
				$ele = $(getRecommendedListHTML(obj)).addClass("lookAheadRec");
				$ele[0].recommendObj = obj;
			}
		}
		if (!$ele) {
			$ele = $(getRecommendedListHTML(recObj));
			$ele[0].recommendObj = recObj;
		}
		$ele.appendTo($par);

		reccedCount++;
		$("<br>").appendTo($par);
	}

	Game.setPredictiveMode();
	Game.predictiveMode = mode;
};

var escapeHTMLChars = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;"
};

Game.escapeHTML = function (str) {
	return str.replace(/[&<>'"]/g, function (c) {
		return escapeHTMLChars[c];
	});
};

function getRecommendedListHTML(recObj) {
	if (!recObj.earnedAchs) {
		recObj.earnedAchs = processAchs(recObj.cpsObj.earnedAchs);
	}

	var str = '<span class="recPurchase clickme"><span';
	if (recObj.title) {
		str += ' data-title="' + Game.escapeHTML(recObj.title.replace("<br>", "")) + '"';
	}
	str += ">" + recObj.name + "</span> - Price: " + Game.formatNumber(recObj.price) +
		", +" + Game.formatNumber(recObj.cpsObj.cookiesPsPlusClicksDiff, 1) + " CpS";

	if (recObj.earnedAchs && recObj.earnedAchs.length > 0) {
		str += ', <span class="earnedAchsSpan tooltipped">+' + recObj.earnedAchs.length +
			" achievement" + (recObj.earnedAchs.length === 1 ? "" : "s") + "</span>";
	}

	if (!byId("bankNone").checked) {
		//15% of bank >= 15 minutes (60 * 15) production -> (60 * 15) / 0.15
		var bankMult = 6000;
		if (byId("bankFrenzy").checked) {
			bankMult *= 7;
		}

		str += ", Bank: " + Game.formatNumber(recObj.price +
			Math.ceil((byId("bankFullCheck").checked ? recObj.cpsObj.unbuffedCookiesPs : Game.unbuffedCookiesPs) * bankMult));
	}

	if (Game.showRecTime) {
		str += ", Time for: " + Game.formatTime(recObj.price / Game.cookiesPsPlusClicks);
	}

	return (str + "</span>");
}


//looks ahead up to Game.maxLookahead levels to combine object purchases
//stops if there are more immediately better purchases than index,
//where index is the object's 0-indexed position in the recommended list
Game.lookahead = function (recObj, index) {
	var b = 2;
	var i;
	var compareCpsObj;

	var checkChains = byId("multiBuildRecCheck").checked;

	var checkSanta = !Game.santa.blacklistCheckbox.checked && Game.santa.dropEle.selectedIndex &&
		Game.santaLevel < Game.santaMax && Game.HasUpgrade("Santa's legacy");

	var lookaheadObj = $.extend({}, recObj);
	var lookaheadBuilding = recObj.gameObj;
	var baseAmount = lookaheadBuilding.amount;

	Game.setPredictiveMode();

	lookaheadLabel:
	while (b <= Game.maxLookahead) {
		var betterPurchases = 0;

		//set base state to having purchased the building level(s)
		var earnedAchs = lookaheadObj.cpsObj.earnedAchs;
		Game.temp.cpsObj = lookaheadObj.cpsObj;
		Game.temp.cookiesBaked = Game.cookiesBaked + lookaheadObj.cpsObj.price;

		Game.setChanges([{gameObj: lookaheadBuilding, amount: lookaheadObj.toAmount}], earnedAchs, null, true);

		//full recalc, just in case
		var nextLevelCpsObj = Game.setChanges([{gameObj: lookaheadBuilding, amount: baseAmount + b * Game.buildingBuyInterval}], []);
		var nextRate = nextLevelCpsObj.rate;
		lookaheadBuilding.tempAmount = lookaheadObj.toAmount; //gotta set again bluh

		if (checkSanta) {
			Game.temp.santaLevel = Game.santaLevel + 1;
			compareCpsObj = Game.calculateChanges(Game.santa.price, []);
			Game.temp.santaLevel = Game.santaLevel;
			Game.resetAchievements(compareCpsObj.earnedAchs);

			if (compareCpsObj.rate > 0 && compareCpsObj.rate < nextRate) {
				betterPurchases++;
			}
			if (betterPurchases > index) {
				break lookaheadLabel;
			}
		}

		for (i = 0; i < Game.ObjectsById.length; i ++) {
			var building = Game.ObjectsById[i];
			if (building === lookaheadBuilding || building.blacklistCheckbox.checked) {
				continue;
			}

			compareCpsObj = Game.setChanges([{gameObj: building}], [], "CalculateBuildingGains");
			if (compareCpsObj.rate > 0 && compareCpsObj.rate < nextRate) {
				betterPurchases++;
			}
			if (betterPurchases > index) {
				break lookaheadLabel;
			}
		}

		for (i = 0; i < Game.UpgradesToCheck.length; i++) {
			var upgrade = Game.UpgradesToCheck[i];
			var req = upgrade.unlocked || (upgrade.require && upgrade.require());
			if (req) {
				compareCpsObj = Game.setChanges([{gameObj: upgrade}], []);
				if (compareCpsObj.rate > 0 && compareCpsObj.rate < nextRate) {
					betterPurchases++;
				}
				if (betterPurchases > index) {
					break lookaheadLabel;
				}
			}

			var chain = upgrade.chain;
			if (chain && checkChains && !req && chain.require()) {
				compareCpsObj = Game.setChanges(Game.getUpgradeBuildChainChangeArr(upgrade, chain), [], "CalculateBuildingGains");
				lookaheadBuilding.tempAmount = lookaheadObj.toAmount; //gotta be safe
				if (compareCpsObj.rate > 0 && compareCpsObj.rate < nextRate) {
					betterPurchases++;
				}
				if (betterPurchases > index) {
					break lookaheadLabel;
				}
			}
		}

		lookaheadObj.price += nextLevelCpsObj.price;
		nextLevelCpsObj.earnedAchs = earnedAchs.concat(nextLevelCpsObj.earnedAchs);
		lookaheadObj.cpsObj = nextLevelCpsObj;
		lookaheadObj.toAmount = baseAmount + b * Game.buildingBuyInterval;
		Game.resetAchievements();
		b++;
	}

	lookaheadBuilding.resetTemp();
	return {
		type: lookaheadBuilding.type,
		name: lookaheadBuilding.getRecommendedName(lookaheadObj.toAmount),
		gameObj: lookaheadBuilding,
		toAmount: lookaheadObj.toAmount,
		price: lookaheadObj.price,
		order: lookaheadBuilding.id,
		cpsObj: lookaheadObj.cpsObj,
		rate: lookaheadObj.cpsObj.rate
	};
};

Game.updateBlacklist = function () {
	var blEles = $("#blacklistEles .blacklistEle");
	blEles.filter(".hidden:has(:checked)").removeClass("hidden");
	var visibleEles = blEles.filter(":not(.hidden)");
	var visibleChecked = blEles.filter(":has(:checked)");

	$("#blackClear").toggleClass("hidden", !blEles.filter(".hidden:has(:checked)").length);
	var blackCheckAll = byId("blackCheckAll");
	blackCheckAll.checked = visibleEles.length === visibleChecked.length;
	blackCheckAll.indeterminate = visibleChecked.length > 0 && !blackCheckAll.checked;
};


Game.filterAchievements = function () {
	var filterAchs = byId("achFilterUnowned").checked;
	var hideAchs = byId("achHideCheck").checked;

	$(document.body).toggleClass("mysteryAchs", hideAchs);

	var achSearchText = Game.prepSearchText(byId("achSearch").value);

	//initialize just to make sure no prototype problems
	var visibleByPool = {};
	for (var pool in Game.AchievementsByPool) {
		visibleByPool[pool] = false;
	}

	for (var i = 0; i < Game.AchievementsById.length; i++) {
		var achieve = Game.AchievementsById[i];
		var hide = (filterAchs && achieve.won) || (hideAchs && (achSearchText || achieve.pool !== "normal") && !achieve.won);
		if (!hide && achSearchText) {
			hide = achieve.searchName.indexOf(achSearchText) === -1 && achieve.searchDesc.indexOf(achSearchText) === -1;
		}
		if (!hide) {
			visibleByPool[achieve.pool] = true;
		}
		achieve.$baseCrate.toggleClass("hidden", hide);
	}

	$("#achShadowBlock").toggleClass("hidden", !visibleByPool.shadow);
	$("#achDungeonBlock").toggleClass("hidden", !visibleByPool.dungeon);
};

var UpgradeSortFunctions = {
	price: function (a, b) { return (a.price - b.price) || (a.order - b.order); },
	cps: function (a, b) { return ((a.cps || 0) - (b.cps || 0)) || (a.order - b.order); },
	rate: function (a, b) { return ((a.rate || 0) - (b.rate || 0)) || (a.order - b.order); },
	amort: function (a, b) { return ((a.amort || 0) - (b.amort || 0)) || (a.order - b.order); }
};

var UpgradeFilterFunctions = {
	all: function () { return true; },
	unowned: function (upgrade) { return !upgrade.bought; },
	owned: function (upgrade) { return upgrade.bought; }
};

function sortArray(arr, sortFunction, sortDesc) {
	arr = arr.slice(0);
	if (typeof sortFunction === "function") {
		arr.sort(sortFunction);
	}
	if (sortDesc) {
		arr.reverse();
	}
	return arr;
}

Game.sortAndFilterUpgrades = function () {
	var sortDescending = byId("upgradeSortDescending").checked;
	var sortOrder = byId("upgradeSortOrder").value;
	var sortFunction = UpgradeSortFunctions[sortOrder];
	var upgrades, upgrade, i;

	if (sortOrder === "price") {
		upgrades = sortArray(Game.UpgradesByGroup.normal, sortFunction, sortDescending).concat(
			sortArray(Game.UpgradesByPool.prestige, sortFunction, sortDescending),
			sortArray(Game.UpgradesByGroup.priceLumps, sortFunction, sortDescending)
		);

	} else if (sortOrder === "amort" && !sortDescending) {
		var amort = [];
		var noAmort = [];
		for (i = 0; i < Game.UpgradesByOrder.length; i++) {
			upgrade = Game.UpgradesByOrder[i];
			if (upgrade.amort > 0) {
				amort.push(upgrade);
			} else {
				noAmort.push(upgrade);
			}
		}

		upgrades = amort.sort(sortFunction).concat(noAmort);

	} else {
		upgrades = sortArray(Game.UpgradesByOrder, sortFunction, sortDescending);
	}

	var filter = byId("upgradeFilterSel").value;
	var filterFunction = UpgradeFilterFunctions[filter] || null;
	var upgradeSearchText = Game.prepSearchText(byId("upgradeSearch").value);

	var showEnableAll = false;
	var showDisableAll = false;
	var showEnableShown = false;
	var showDisableShown = false;

	Game.ShownUpgrades = [];
	var $parent = $("#upgradeIcons").empty();
	for (i = 0; i < upgrades.length; i++) {
		upgrade = upgrades[i];

		var show = !upgrade.hidden;
		if (show) {
			show = filterFunction ? filterFunction(upgrade) : upgrade.groups[filter];
		}
		if (show && sortOrder === "rate") {
			show = upgrade.rate > 0 && !upgrade.bought;
		}
		if (show && upgradeSearchText) {
			show = upgrade.searchName.indexOf(upgradeSearchText) > -1 || upgrade.searchDesc.indexOf(upgradeSearchText) > -1;
		}
		if (show) {
			Game.ShownUpgrades.push(upgrade);
			$parent.append(upgrade.$baseCrate);
		}

		if (upgrade.pool !== "debug" && upgrade.pool !== "toggle" && !upgrade.hidden) {
			showEnableAll = showEnableAll || !upgrade.bought;
			showDisableAll = showDisableAll || upgrade.bought;
			if (show) {
				showEnableShown = showEnableShown || !upgrade.bought;
				showDisableShown = showDisableShown || upgrade.bought;
			}
		}

		if (upgrade.toggleInto) {
			if (upgrade.isParent) {
				upgrade.$crateNodes.toggleClass("hidden", upgrade.bought);
			}
			if (upgrade.isChild) {
				upgrade.$crateNodes.toggleClass("hidden", !upgrade.toggleInto.bought);
			}
		}
	}

	$("#upgradeEnableAll").toggleClass("hidden", !showEnableAll);
	$("#upgradeDisableAll").toggleClass("hidden", !showDisableAll);
	$("#upgradeEnableShown").toggleClass("hidden", filter === "all" || !showEnableShown);
	$("#upgradeDisableShown").toggleClass("hidden", filter === "all" || !showDisableShown);

	Game.UpgradeOrder = upgrades;
};


//guesstimates the minimum cookies baked this ascension you'd need for everything
//assumes everything is bought with current price reduction upgrades
//(including the very upgrades that provide said reduction 'cause to do otherwise is a pain)
//also to set a difference when importing just in case the save is from a version with different prices and this voodoo would be thrown off
Game.getMinCumulative = function () {
	var cumu = 0, upgrade, i;
	for (i = 0; i < Game.ObjectsById.length; i++) {
		var building = Game.ObjectsById[i];
		cumu += building.getPriceSum((Game.ascensionMode === 1 ? 0 : building.free), building.getAmount());
	}

	for (i = 0; i < Game.UpgradesById.length; i++) {
		upgrade = Game.UpgradesById[i];
		if (
			upgrade.pool !== "prestige" && upgrade.pool !== "toggle" &&
			!upgrade.groups.santaDrop && !upgrade.groups.egg &&
			upgrade.getBought() && !upgrade.isPerm
		) {
			cumu += upgrade.getPrice();
		}
	}

	upgrade = Game.Upgrades["Elder Pledge"];
	for (i = 1; i <= Game.pledges; i++) {
		cumu += upgrade.getPrice(i - 1);
	}

	cumu += Game.seasonTriggerBasePrice * Game.seasonUses;
	// upgrade = Game.UpgradesByGroup.seasonSwitch[0];
	// for (i = 1; i <= Game.seasonUses; i++) {
	// 	cumu += upgrade.getPrice(i - 1);
	// }

	for (i = 1; i <= Game.santaLevel; i++) {
		cumu += Math.pow(i, i);
	}

	//assumes you bought each santa drop/easter egg before getting another
	//(and again ignoring that there are price reduction upgrades in both lists for sanity's sake)
	var level = 0;
	for (i = 0; i < Game.UpgradesByGroup.santaDrop.length; i++) {
		upgrade = Game.UpgradesByGroup.santaDrop[i];
		if (upgrade.getBought() && !upgrade.isPerm) {
			cumu += upgrade.getPrice(level);
			level++;
		}
	}

	var eggs = 0;
	for (i = 0; i < Game.UpgradesByGroup.egg.length; i++) {
		upgrade = Game.UpgradesByGroup.egg[i];
		if (upgrade.getBought() && !upgrade.isPerm) {
			cumu += upgrade.getPrice(eggs);
			eggs++;
		}
	}

	var end = Math.min(Game.dragonLevel, Game.dragonLevels.length);
	if (!Game.includeDragonSacrifices) { end = Math.min(end, 5); }
	for (i = 0; i < end; i++) {
		var lvl = Game.dragonLevels[i];
		cumu += lvl.cumuCost ? lvl.cumuCost() : 0;
	}

	return cumu;
};

Game.toggleShowDebug = function (toggle) {
	toggle = typeof toggle === "undefined" ? !Game.showDebug : Boolean(toggle);
	Game.showDebug = toggle;
	$(document.body).toggleClass("hideDebug", Game.HasUpgrade("Neuromancy") ? false : !toggle);
	return toggle;
};
$(document.body).toggleClass("hideDebug", !Game.showDebug);

//#endregion update()


function parseBoolean(n) {
	return Boolean(Game.parseNumber(n));
}

var clearSpaceRgx = /\s/g;

Game.importSave = function (saveCode) {
	var save = saveCode || prompt("Please paste in the code that was given to you on save export.", "");
	if (!save || typeof save !== "string") {
		return false;
	}
	save = save.replace(clearSpaceRgx, "");

	var toStore = save; //save now write later, just in case of error
	save = decodeSave(save);
	if (!save) { return false; }

	var success = _importSave(save);
	if (success) {
		Game.storedImport = toStore;
		$("#reimportSave").removeClass("hidden");
	}
	return success;
};

var importCookies = 0;

function _importSave(save, noAlerts) {
	// console.log(save);

	// save = save.split("|");
	save = splitSave(save);

	var version = parseFloat(save[0]);
	if (isNaN(version) || save.length < 5 || version < 1) {
		if (!noAlerts) {
			alert("Oops, looks like the import string is all wrong!");
		}
		return false;
	}
	if (version > Game.version && !noAlerts) {
		alert("Error : you are attempting to load a save from a future version (v." + version + "; you are using v." + Game.version + ").");
	}

	Game.predictiveMode = false;
	var i, building, upgrade, achieve, mestr, bought;

	var spl = save[2].split(";"); //save stats
	Game.setInput("#sessionStartTime", parseInt(spl[0], 10));
	Game.bakeryName = spl[3] || Game.RandomBakeryName();
	Game.bakeryNameLowerCase = Game.bakeryName.toLowerCase();
	byId("bakeryNameIn").value = Game.bakeryName;
	Game.setSeed(spl[4]);

	//save[3] is preferences so meh

	spl = save[4].split(";"); //cookies and lots of other stuff
	importCookies = Math.floor(parseFloat(spl[0]));
	var cookiesBaked = Game.setInput("#cookiesBaked", Math.floor(parseFloat(spl[1])));

	var cookiesReset = Game.setInput("#cookiesReset", Math.floor(parseFloat(spl[8])) || 0);
	Game.pledges = parseInt(spl[10], 10) || 0;

	Game.santaLevel = parseInt(spl[18], 10) || 0;
	Game.santa.dropEle.selectedIndex = Game.santaLevel ? Game.santaLevel + 1 : 0;
	Game.setInput("#seasonCountIn", parseInt(spl[21], 10) || 0);

	var season = spl[22] || Game.defaultSeason; //will set season later
	var wrinklers = parseInt(spl[24], 10) || 0;

	// Game.prestige = Game.setInput('#prestigeIn', parseFloat(spl[25]) || 0);
	Game.ascensionMode = parseInt(spl[29], 10) || 0;
	byId("bornAgainCheck").checked = Game.ascensionMode === 1;

	Game.permanentUpgrades = [30, 31, 32, 33, 34].map(function (i) {
		return (spl[i] ? parseInt(spl[i], 10) : -1);
	});

	var dragonLevel = parseInt(spl[35], 10);
	if (version < 2.0041 && dragonLevel === Game.dragonLevels.length - 2) { dragonLevel = Game.dragonLevels.length - 1; }
	Game.setInput("#dragonLevelIn", dragonLevel);
	Game.setAura(0, 0); //reset auras to make sure there's not a problem
	Game.setAura(1, 0);
	Game.setAura(0, parseInt(spl[36], 10) || 0);
	Game.setAura(1, parseInt(spl[37], 10) || 0);

	var lumps = parseFloat(spl[42]) || -1;
	Game.setInput("#lumpsIn", lumps);
	Game.setInput("#heraldsIn", parseFloat(spl[48], 10) || 0);


	spl = save[5].split(";"); //buildings
	for (i = 0; i < Game.ObjectsById.length; i++) {
		building = Game.ObjectsById[i];
		var amount = 0;
		var level = 0;

		var minigameStr = "";

		if (spl[i]) {
			mestr = spl[i].toString().split(",");
			amount = parseInt(mestr[0], 10) || 0;
			level = parseInt(mestr[3], 10) || 0;

			minigameStr = mestr[4];
		}

		building.amount = Game.setInput(building.amountIn, amount);
		building.level = Game.setInput(building.levelIn, level);
		building.free = 0;
		building.priceCache = {};

		if (building.minigame) {
			building.minigame.reset();
			building.minigame.load(minigameStr);
		}
	}


	if (version < 1.035) { //old non-binary algorithm
		spl = save[6].split(";"); //upgrades
		for (i = 0; i < Game.UpgradesById.length; i++) {
			upgrade = Game.UpgradesById[i];
			upgrade.unlocked = false;
			bought = false;
			if (spl[i]) {
				mestr = spl[i].split(",");
				upgrade.unlocked = parseBoolean(mestr[0]);
				bought = parseBoolean(mestr[1]);
			}
			upgrade.setBought(bought);
		}

		spl = save[7] ? save[7].split(";") : []; //achievements
		for (i = 0; i < Game.AchievementsById.length; i++) {
			achieve = Game.AchievementsById[i];
			achieve.won = false;
			if (spl[i]) {
				mestr = spl[i].split(",");
				achieve.won = parseBoolean(mestr[0]);
			}
		}

	} else if (version < 1.0502) { //old awful packing system
		spl = save[6] || []; //upgrades
		spl = version < 1.05 ? UncompressLargeBin(spl) : unpack(spl);

		for (i = 0; i < Game.UpgradesById.length; i++) {
			upgrade = Game.UpgradesById[i];
			upgrade.unlocked = false;
			bought = false;
			if (spl[i * 2]) {
				upgrade.unlocked = parseBoolean(spl[i * 2]);
				bought = parseBoolean(spl[i * 2 + 1]);
			}
			upgrade.setBought(bought);
		}

		spl = save[7] || []; //achievements
		spl = version < 1.05 ? UncompressLargeBin(spl) : unpack(spl);
		for (i = 0; i < Game.AchievementsById.length; i++) {
			achieve = Game.AchievementsById[i];
			achieve.won = false;
			if (spl[i]) {
				achieve.won = parseBoolean(spl[i]);
			}
		}
	} else {

		spl = save[6] || []; //upgrades
		if (version < 2.0046) { spl = unpack2(spl); }
		spl = spl.split("");
		for (i = 0; i < Game.UpgradesById.length; i++) {
			upgrade = Game.UpgradesById[i];
			upgrade.unlocked = false;
			bought = false;
			if (spl[i * 2]) {
				upgrade.unlocked = parseBoolean(spl[i * 2]);
				bought = parseBoolean(spl[i * 2 + 1]);
			}
			upgrade.setBought(bought);
		}

		spl = save[7] || []; //achievements
		if (version < 2.0046) { spl = unpack2(spl); }
		spl = spl.split("");
		for (i = 0; i < Game.AchievementsById.length; i++) {
			achieve = Game.AchievementsById[i];
			achieve.won = false;
			if (spl[i]) {
				achieve.won = parseBoolean(spl[i]);
			}
		}
	}
	Game.setSeason(season);

	if (version < 1.0503) { //upgrades that used to be regular, but are now heavenly
		upgrade = Game.Upgrades["Persistent memory"];
		upgrade.unlocked = false;
		upgrade.setBought(false);
		upgrade = Game.Upgrades["Season switcher"];
		upgrade.unlocked = false;
		upgrade.setBought(false);
	}

	Game.prestige = Game.setInput("#prestigeIn", Math.floor(Game.HowMuchPrestige(cookiesReset)));

	if (version === 1.9) { //are we importing from the 1.9 beta? remove all heavenly upgrades
		for (i = 0; i < Game.UpgradesByPool.prestige.length; i++) {
			upgrade = Game.UpgradesByPool.prestige[i];
			upgrade.unlocked = false;
			upgrade.setBought(false);
		}
	}

	for (i = 0; i < Game.AchievementsById.length; i++) {
		achieve = Game.AchievementsById[i];
		if (achieve.toggleFunc) {
			achieve.toggleFunc();
		}
	}

	//set after to make sure it's properly limited by elder spice
	Game.setInput("#numWrinklersIn", wrinklers);

	Game.killBuffs();
	spl = (save[8] || "").split(";"); //buffs
	for (i = 0; i < spl.length; i++) {
		if (spl[i]) {
			mestr = spl[i].toString().split(",");
			var type = Game.BuffTypes[parseInt(mestr[0], 10)];
			if (type && !type.hidden) {
				Game.gainBuff(type.name, [(parseFloat(mestr[1])) / Game.fps, parseFloat(mestr[3] || 0), parseFloat(mestr[4] || 0), parseFloat(mestr[5] || 0)]);
			}
		}
	}

	Game.setPriceMultArrays();
	var minCumu = Game.getMinCumulative() + importCookies;
	Game.minCumulativeOffset = Math.max(minCumu - cookiesBaked, 0);

	Game.clearBuffSelection();
	Game.setBuffObjectInputs();
	Game.clearAuraSelection();
	Game.clearPantheonSelection();
	Game.update();
	return true;
}


Game._saveCalc = function () {

	var i;

	//not saving version intentionally

	var save = ( //save stats
		(Game.startDate || "NaN") + ";;;" +
		Game.bakeryName + ";" +
		Game.seed +
		"||"); //skip preferences

	var fields = []; //cookies and lots of other stuff

	fields[0]  = importCookies;
	fields[1]  = Game.cookiesBaked;
	fields[8]  = byId("cookiesReset").parsedValue;
	fields[10] = Game.pledges;
	fields[18] = Game.santaLevel;
	fields[21] = Game.seasonUses;
	fields[22] = Game.season || "";
	fields[24] = Math.min(byId("numWrinklersIn").parsedValue, Game.maxWrinklers);
	fields[29] = Game.ascensionMode;
	fields[30] = Game.permanentUpgrades[0];
	fields[31] = Game.permanentUpgrades[1];
	fields[32] = Game.permanentUpgrades[2];
	fields[33] = Game.permanentUpgrades[3];
	fields[34] = Game.permanentUpgrades[4];
	fields[35] = Game.dragonLevel;
	fields[36] = Game.dragonAura;
	fields[37] = Game.dragonAura2;
	fields[42] = Game.lumps;
	fields[48] = Game.heralds;
	save += fields.join(";") + "|";


	for (i = 0; i < Game.ObjectsById.length; i++) { //buildings
		var building = Game.ObjectsById[i];
		save += building.amount + ",,," + building.level + ",";

		if (building.minigame && building.minigame.save) {
			save += building.minigame.save();
		}

		save += ",,;";
	}
	save += "|";


	var toCompress = [];
	for (i = 0; i < Game.UpgradesById.length; i++) {
		var upgrade = Game.UpgradesById[i];
		var bought = upgrade.bought;
		toCompress.push(asBoolNum(bought || upgrade.unlocked), asBoolNum(bought));
	}
	save += toCompress.join("") + "|";

	toCompress = [];
	for (i = 0; i < Game.AchievementsById.length; i++) {
		var achieve = Game.AchievementsById[i];
		toCompress.push(asBoolNum(achieve.won));
	}
	save += toCompress.join("") + "|";

	for (var key in Game.Buffs) {
		var buff = Game.Buffs[key];
		if (buff && buff.buffType) {
			save += buff.buffType.id + "," + buff.time + ",";
			if (typeof buff.arg1 !== "undefined") { save += "," + parseFloat(buff.arg1); }
			if (typeof buff.arg2 !== "undefined") { save += "," + parseFloat(buff.arg2); }
			if (typeof buff.arg3 !== "undefined") { save += "," + parseFloat(buff.arg3); }
			save += ";";
		}
	}

	localStorage.setItem("CCalc.CalcSave", LZString.compressToBase64(save));
	$("#calcLoad, #calcClearSave").removeClass("hidden");
};

Game._loadCalc = function () {
	var str = localStorage.getItem("CCalc.CalcSave");
	if (!str) {
		return false;
	}

	var save = LZString.decompressFromBase64(str);
	if (!save) {
		return false;
	}

	return _importSave(Game.version + "||" + save, true);
};


})(this, this.jQuery);
