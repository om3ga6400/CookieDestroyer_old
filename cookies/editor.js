/* global encodeSave, decodeSave, splitSave, UncompressLargeBin, unpack, unpack2, parseBoolean:true */

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

	infinitySymbol: "∞",

	Objects: {}, //buildings
	ObjectsById: [],
	ObjectsByGroup: {},
	ObjectsOwned: 0,

	Upgrades: {},
	UpgradesById: [],
	UpgradesByPool: {},
	UpgradesByGroup: {},
	UpgradesOwned: 0,
	maxCountedUpgrades: 0,
	permanentUpgrades: [-1, -1, -1, -1, -1],
	permanentUpgradeSlots: [],

	Achievements: {},
	AchievementsById: [],
	AchievementsByPool: {},
	AchievementsByGroup: {},
	AchievementsToBeWon: [],
	AchievementsOwned: 0,
	AchievementsTotal: 0,

	defaultSeason: "",
	season: "",
	seasons: {
		"": {season: "", text: "---"},
		halloween: {season: "halloween", text: "Halloween"},
		christmas: {season: "christmas", text: "Christmas"},
		valentines: {season: "valentines", text: "Business Day"},
		fools: {season: "fools", text: "Business Day"},
		easter: {season: "easter", text: "Easter"}
	},
	seasonTriggerBasePrice: 1000000000,
	seasonUses: 0,

	pledges: 0,
	pledgeTime: 0,

	nextResearch: null,
	researchTime: 0,

	ascensionMode: 0,
	sellMultiplier: 0.5,

	milkType: 0,
	backgroundType: 0,
	chimeType: 0,

	startDate: Date.now(),

	ObjectPriceMultArray: [], //used for Object price caches
	UpgradePriceMultArray: [],

	heralds: 0,

	cookies: 0,
	cookiesEarned: 0,
	cookiesReset: 0,
	cookieClicks: 0,
	handmadeCookies: 0,
	goldenClicks: 0,
	goldenClicksLocal: 0,
	numResets: 0,

	heavenlyPower: 1, //% cps bonus per prestige level
	cookiesPs: 0,
	cookiesPerClick: 0,
	globalCpsMult: 1,
	rawMult: 1,
	rawCookiesPs: 0,
	rawCookiesPsHighest: 0,
	unbuffedMult: 0,
	unbuffedCookiesPs: 0,

	prestige: 0,
	heavenlyChips: 0,
	heavenlyChipsSpent: 0,
	heavenlyCookies: 0,

	santa: {},
	santaLevel: 0,
	santaLevels: ["Festive test tube", "Festive ornament", "Festive wreath", "Festive tree", "Festive present",
		"Festive elf fetus", "Elf toddler", "Elfling", "Young elf", "Bulky elf", "Nick", "Santa Claus", "Elder Santa", "True Santa", "Final Claus"],

	elderWrath: 0,
	wrathLevels: ["appeased", "awoken", "displeased", "angered"],
	numWrinklers: 0,
	numShinyWrinklers: 0,
	wrinklerLimit: 14, //hard limit regardless of boosts
	maxWrinklers: 0, //current max
	cookiesSucked: 0,
	cookiesSuckedShiny: 0,

	dragonLevel: 0,
	dragonAura: 0,
	dragonAura2: 0,
	HighestBuilding: null,

	fortuneGC: 0,
	fortuneCPS: 0,

	Buffs: {},
	BuffTypes: [],
	BuffTypesByName: {},

	lumps: -1,
	lumpsTotal: -1,
	lumpRefill: 0,
	lumpCurrentType: -1,
	lumpTypes: ["Normal", "Bifurcated", "Golden", "Meaty", "Caramelized"],

	vault: [],

	YouCustomizer: {
		genes: [
			{id: "hair", isList: true, def: 0, choices: [
				[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1], [3, 1], [4, 1], [4, 2], [5, 3], [8, 2], [7, 1], [5, 5], [4, 5], [10, 0], [9, 1], [9, 2],
			]},
			{id: "hairCol", isList: true, def: 1, choices: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37]},
			{id: "skinCol", isList: true, def: 0, choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]},
			{id: "head", isList: true, def: 0, choices: [
				[0, 0], [1, 1], [0, 1], [4, 3], [10, 3]
			]},
			{id: "face", isList: true, def: 0, choices: [
				[3, 5], [0, 0], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [1, 3], [2, 3], [3, 3]
			]},
			{id: "acc1", isList: true, def: 0, choices: [
				[0, 0], [5, 1], [5, 0], [5, 2], [0, 4], [1, 4], [2, 4], [6, 4], [8, 5], [3, 4], [7, 5], [6, 0], [6, 1], [4, 4],
				[5, 4], [2, 5], [7, 4], [0, 5], [1, 5], [6, 5], [6, 2], [6, 3], [7, 0], [7, 2], [7, 3], [8, 1], [8, 3], [8, 4],
				[9, 3], [9, 0], [10, 1], [10, 2], [9, 4], [9, 5], [10, 4], [10, 5]
			]},
			{id: "acc2", isList: true, def: 0, choices: [[]]} //choices are copied from acc1 in startup
		],
		genesById: {},
		currentGenes: []
	},

	effs: {},

	pantheon: {
		gods: {},
		godsById: [],
		slot: [-1, -1, -1],
		slotNames: ["Diamond", "Ruby", "Jade"],
		swaps: 3,
		swapsMax: 3
	},

	grimoire: {
		magic: 0,
		magicMax: 0,
		magicPs: 0,
		spellsCast: 0,
		spellsCastTotal: 0
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

		freeze: 0,
		nextFreeze: 0,

		stepT: 1,
		nextStep: 0,
		harvests: 0,
		harvestsTotal: 0,
		soil: 0,
		nextSoil: 0,
		convertTimes: 0
	},

	market: {
		goods: {},
		goodsById: [],

		offices: {},
		officeLevel: 0,

		brokers: 0,

		profit: 0
	},

	Milks: [],

	milkChoices: [
		{name: "Automatic",          icon: [0,  7],  type: -1},
		{name: "Plain milk",         icon: [1,  8],  type: 0},
		{name: "Chocolate milk",     icon: [2,  8],  type: 0},
		{name: "Raspberry milk",     icon: [3,  8],  type: 0},
		{name: "Orange milk",        icon: [4,  8],  type: 0},
		{name: "Caramel milk",       icon: [5,  8],  type: 0},
		{name: "Banana milk",        icon: [6,  8],  type: 0},
		{name: "Lime milk",          icon: [7,  8],  type: 0},
		{name: "Blueberry milk",     icon: [8,  8],  type: 0},
		{name: "Strawberry milk",    icon: [9,  8],  type: 0},
		{name: "Vanilla milk",       icon: [10, 8],  type: 0},
		{name: "Zebra milk",         icon: [10, 7],  type: 1, order: 10, hasLine: true},
		{name: "Cosmic milk",        icon: [9,  7],  type: 1, order: 10},
		{name: "Flaming milk",       icon: [8,  7],  type: 1, order: 10},
		{name: "Sanguine milk",      icon: [7,  7],  type: 1, order: 10},
		{name: "Midas milk",         icon: [6,  7],  type: 1, order: 10},
		{name: "Midnight milk",      icon: [5,  7],  type: 1, order: 10},
		{name: "Green inferno milk", icon: [4,  7],  type: 1, order: 10},
		{name: "Frostfire milk",     icon: [3,  7],  type: 1, order: 10},
		{name: "Honey milk",         icon: [21, 23], type: 0},
		{name: "Coffee milk",        icon: [22, 23], type: 0},
		{name: "Tea milk",           icon: [23, 23], type: 0},
		{name: "Coconut milk",       icon: [24, 23], type: 0},
		{name: "Cherry milk",        icon: [25, 23], type: 0},
		{name: "Soy milk",           icon: [27, 23], type: 1, order: 10},
		{name: "Spiced milk",        icon: [26, 23], type: 0},
		{name: "Maple milk",         icon: [28, 23], type: 0},
		{name: "Mint milk",          icon: [29, 23], type: 0},
		{name: "Licorice milk",      icon: [30, 23], type: 0},
		{name: "Rose milk",          icon: [31, 23], type: 0},
		{name: "Dragonfruit milk",   icon: [21, 24], type: 0},
		{name: "Melon milk",         icon: [22, 24], type: 0},
		{name: "Blackcurrant milk",  icon: [23, 24], type: 0},
		{name: "Peach milk",         icon: [24, 24], type: 0},
		{name: "Hazelnut milk",      icon: [25, 24], type: 0}
	],

	chimeChoices: [
		{name: "No sound", icon: [0, 7]},
		{name: "Chime",    icon: [22, 6]},
		{name: "Fortune",  icon: [27, 6]},
		{name: "Cymbal",   icon: [9, 10]},
		{name: "Squeak",   icon: [8, 10]}
	],

	backgroundChoices: [
		{name: "Automatic",           icon: [0, 7]},
		{name: "Blue",                icon: [21, 21]},
		{name: "Red",                 icon: [22, 21]},
		{name: "White",               icon: [23, 21]},
		{name: "Black",               icon: [24, 21]},
		{name: "Gold",                icon: [25, 21]},
		{name: "Grandmas",            icon: [26, 21]},
		{name: "Displeased grandmas", icon: [27, 21]},
		{name: "Angered grandmas",    icon: [28, 21]},
		{name: "Money",               icon: [29, 21]},
		{name: "Purple",              icon: [21, 22], order: 1.1},
		{name: "Pink",                icon: [24, 22], order: 2.1},
		{name: "Mint",                icon: [22, 22], order: 2.2},
		{name: "Silver",              icon: [25, 22], order: 4.9},
		{name: "Black & White",       icon: [23, 22], order: 4.1},
		{name: "Spectrum",            icon: [28, 22], order: 4.2},
		{name: "Candy",               icon: [26, 22]},
		{name: "Biscuit store",       icon: [27, 22]},
		{name: "Chocolate",           icon: [30, 21]},
		{name: "Dark Chocolate",      icon: [31, 21]},
		{name: "Painter",             icon: [24, 34]},
		{name: "Snow",                icon: [30, 22]},
		{name: "Sky",                 icon: [29, 22]},
		{name: "Night",               icon: [31, 22]},
		{name: "Foil",                icon: [25, 34]}
	],

	minCumulative: 0, //minimum cookies needed for everything (see getMinCumulative method)
	minCumulativeDiff: 0,
	minCumulativeOffset: 0, //used to try to prevent minCumulative from being excessively wrong large due to saves from old game versions
	includeDragonSacrifices: true, //whether to include the cost of sacrificing buildings to train Krumblor (if relevant)

	volume: 75,
	defaultVolume: 75,
	volumeMusic: 50,
	defaultVolumeMusic: 50,
	prefs: {
		particles: true, numbers: true, autosave: true, autoupdate: true, milk: true, fancy: true,
		warn: false, cursors: true, focus: true, format: false, notifs: false, wobbly: true,
		monospace: false, filters: true, cookiesound: true, crates: false, showBackupWarning: true,
		extraButtons: true, askLumps: false, customGrandmas: true, timeout: false,
		cloudSave: true, bgMusic: true, notScary: false, fullscreen: false, screenreader: false, discordPresence: true
	},
	defaultPrefs: {},
	prefsSaveOrder: ["particles", "numbers", "autosave", "autoupdate", "milk", "fancy", "warn", "cursors",
		"focus", "format", "notifs", "wobbly", "monospace", "filters", "cookiesound", "crates",
		"showBackupWarning", "extraButtons", "askLumps", "customGrandmas", "timeout",
		"cloudSave", "bgMusic", "notScary", "fullscreen", "screenreader", "discordPresence"],

	abbrOn: true, //whether to abbreviate with letters/words or with commas/exponential notation
	lockChecked: false, //sets behavior when clicking on upgrades, controlled by various checkboxes on the page
	showDebug: false, //whether to always show debug upgrades
	maxNamesList: 25, //maximum number of upgrades/achievements to show in the to be earned tooltips
	warnOnNewSeed: false,
	altMode: false
};
window.Game = Game;
Game.santaMax = Game.santaLevels.length - 1;
Game.lastUpdateTime = Game.startDate;
Game.fullDate = Game.startDate;

Game.baseResearchTime = Game.fps * 60 * 30;
Game.researchDuration = Game.baseResearchTime;
Game.seasonDuration = Game.fps * 60 * 60 * 24; //24 hours
Game.pledgeDuration = Game.fps * 60 * 30; //30 minutes
Game.maxPledgeDuration = Game.fps * 60 * 60; //60 minutes

var ele = byId("pVersion");
ele.textContent = Game.version + (Game.beta ? " beta" : "");
ele.title = "main.js?v=" + Game.mainJS;

if (Game.beta) { document.title += " Beta"; }

//#endregion definitions


//#region methods

//debug method to check whether upgrades and achievements and maybe other things match the ingame definitions
Game.debugCheckProperties = function (calcList, property) {
	var gameList = JSON.parse(prompt("gameList")); //because why would JSON want to be easy to use in the console
	if (calcList.length > gameList.length) {
		console.log("calcList longer than gameList", calcList.slice(gameList.length));
	}
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

Game.randomFloor = function (x) {
	if ((x % 1) < Math.random()) {
		return Math.floor(x);
	} else {
		return Math.ceil(x);
	}
};

Game.makeSeed = function () {
	var chars = "abcdefghijklmnopqrstuvwxyz".split("");
	var str = "";
	for (var i = 0; i < 5; i++) { str += Game.choose(chars); }
	return str;
};

Game.setSeed = function (seed) {
	Game.seed = Game.setInput("#gameSeed", seed || Game.makeSeed()); //each run has its own seed, used for deterministic random stuff
};

//sets obj[key] to an array if it is not already and pushes value to it
Game.ArrayPush = function (obj, key, value) {
	if (!Array.isArray(obj[key])) {
		obj[key] = [];
	}
	obj[key].push(value);
};

//checks event for keys for alt mode
Game.checkEventAltMode = function (ev) {
	return ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey;
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
	var hours = Math.floor(seconds / 3600);
	if (hours > 0) {
		hours = Game.BeautifyAbbr(hours) + (hours >= 1e7 ? " " : "") + "h ";
	} else {
		hours = "";
	}

	seconds %= 3600;
	var minutes = Math.floor(seconds / 60);
	minutes = minutes > 0 ? minutes + "m " : "";
	seconds %= 60;
	seconds = seconds > 0 ? seconds + "s" : "";
	return (hours + minutes + seconds).trim();
};

Game.getPlural = function (amount, singular, plural) {
	singular = singular || "";
	plural = plural || (singular + "s");
	return amount === 1 ? singular : plural;
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
	if (cost > Game.cookies) { priceInfo += loc("in %1", Game.sayTime(((cost - Game.cookies) / cps + 1) * Game.fps)) + "<br>"; }
	priceInfo += loc("%1 worth", Game.sayTime((cost / cps + 1) * Game.fps)) + "<br>";
	priceInfo += loc("%1% of bank", Game.Beautify((cost / Game.cookies) * 100, 1)) + "<br>";
	return ('<div class="costDetails">' + priceInfo + "</div>");
};

Game.safeSaveString = function (str) {
	//look as long as it works
	str = replaceAll("|", "[P]", str);
	str = replaceAll(";", "[S]", str);
	return str;
};
Game.safeLoadString = function (str) {
	str = replaceAll("[P]", "|", str);
	str = replaceAll("[S]", ";", str);
	return str;
};
Game.cleanNonWord = function (id) {
	return id.replace(/\W+/g, " ");
};

//overkill safety measure - clamp `ele.selectedIndex` to [0, max] or [0, ele.options.length - 1]
Game.getSelectedIndex = function (ele, max) {
	var index = ele.selectedIndex;
	if (!max) {
		max = ele.options.length - 1;
	}
	if (max > 0) {
		index = Math.min(index, max);
	}
	if (!index || index < 0) {
		index = 0;
	}
	if (ele.selectedIndex !== index) {
		ele.selectedIndex = index;
	}
	return index;
};

Game.setSelectedIndex = function (ele, index, max) {
	index = Math.floor(index);
	if (!max) {
		max = ele.options.length - 1;
	}
	if (max > 0) {
		index = Math.min(index, max);
	}
	if (!index || index < 0) {
		index = 0;
	}
	ele.selectedIndex = index;
};

Game.setInput = function (ele, value) {
	var $ele = $(ele);
	ele = $ele[0];
	if ($ele.hasClass("text")) {
		ele.value = value;

	} else {
		var isDeci = $ele.hasClass("deci");

		if (typeof (value) === "undefined") {
			value = ele.parsedValue || 0; //refresh values and stuff
		}
		value = Game.parseNumber(value, ele.minIn, ele.maxIn, !isDeci);

		ele.parsedValue = value;
		if ($ele.hasClass("exp")) {
			ele.dataset.title = value < 1e7 || Game.abbrOn ? Game.Beautify(value) : Game.abbreviateNumber(value, 0, true);
			ele.displayValue = Game.BeautifyAbbr(value, isDeci ? 1 : 0, true);
		}

		if ($ele.hasClass("bankS")) {
			ele.displayValue = Game.BeautifyAbbr(value, 2);
		}

		if (typeof ele.setDisplayValue === "function") {
			ele.setDisplayValue();
		}

		if (document.activeElement !== ele) {
			ele.value = ele.displayValue || value;
		}

		if ($ele.hasClass("date") && !ele.tooltipFunc) {
			ele.dataset.title = Game.sayTime((Date.now() - value) / 1000 * Game.fps) || "Just now";
		}

		if ((ele === Game.tooltipAnchor || ele.nextElementSibling === Game.tooltipAnchor) &&
		typeof Game.updateTooltip === "function") {
			Game.updateTooltip(true);
		}

		if (ele.twin) {
			ele.twin.parsedValue = ele.parsedValue;
			ele.twin.displayValue = ele.displayValue;
			if (document.activeElement !== ele.twin) {
				ele.twin.value = ele.displayValue || value;
			}
			if (typeof ele.dataset.title !== "undefined") {
				ele.twin.dataset.title = ele.dataset.title;
			}
		}
	}

	if (ele.metaObj && ele.dataProp) {
		ele.metaObj[ele.dataProp] = value;
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

Game.setDisabled = function (ele, disable, force) {
	var $ele = $(ele);
	ele = $ele[0];
	if (!ele) { return; }

	if (typeof disable !== "boolean") {
		disable = !ele.disabled;
	}

	if (document.activeElement === ele || (ele.disableOnBlue && !disable)) {
		ele.disableOnBlur = disable;
	}
	if (force || !disable || !ele.disableOnBlur || document.activeElement !== ele) {
		ele.disabled = disable;
	}

	var toggleClass = Boolean(disable || ele.disableOnBlur);
	if (ele.$disableParent) {
		ele.$disableParent.toggleClass("disabled", toggleClass);
	}

	if (ele.id) {
		$('label[for="' + ele.id + '"]').toggleClass("disabled", toggleClass);
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

Game.Has = Game.HasUpgrade = function (what) {
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
	if (Game.ascensionMode === 1) {
		if (upgrade.pool === "prestige" || upgrade.tier === "fortune") {
			return false;
		}
		if (upgrade.isPerm) {
			return upgrade.bought;
		}
	}
	return upgrade.getBought();
};

Game.Unlock = function (what, full) {
	if (Array.isArray(what)) {
		for (var i = 0; i < what.length; i++) {
			Game.Unlock(what[i], full);
		}
	} else {
		var upgrade = Game.GetUpgrade(what);
		if (upgrade) {
			if (upgrade.pool === "prestige") {
				upgrade.displayUnlocked = true;
				return;
			}
			if (full) {
				upgrade.unlocked = true;
			} else {
				upgrade.toBeUnlocked = true;
			}
			if (Game.autoUnlockUpgrades) {
				upgrade.unlocked = true; //both
			}
		}
	}
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

Game.HasAchiev = Game.HasAchieve = function (what) {
	var achieve = Game.GetAchiev(what);
	return achieve ? achieve.won : false;
};

Game.Win = function (what, full) {
	if (Array.isArray(what)) {
		for (var i = 0; i < what.length; i++) {
			Game.Win(what[i], full);
		}
	} else {
		var achieve = Game.GetAchiev(what);
		if (achieve) {
			if (full) {
				achieve.won = true;
			} else {
				achieve.toBeWon = true;
			}
			if (Game.autoWinAchievements) {
				achieve.won = true; //both
			}
		}
	}
};

Game.UnlockTiered = function (me) {
	for (var i in me.tieredUpgrades) {
		if (Game.Tiers[me.tieredUpgrades[i].tier].unlock != -1 && me.amount >= Game.Tiers[me.tieredUpgrades[i].tier].unlock) {
			Game.Unlock(me.tieredUpgrades[i]);
		}
	}
	for (i in me.tieredAchievs) {
		if (me.amount >= Game.Tiers[me.tieredAchievs[i].tier].achievUnlock) {
			Game.Win(me.tieredAchievs[i]);
		}
	}
	for (i = 0; i < me.synergies.length; i++) {
		var syn = me.synergies[i];
		var tier = Game.Tiers[syn.tier];
		if (!syn.unlocked && !syn.toBeUnlocked && Game.HasUpgrade(tier.require) &&
		syn.buildingTie1.amount >= tier.unlock && syn.buildingTie2.amount >= tier.unlock) {
			Game.Unlock(syn);
		}
	}
};

Game.GetTieredCpsMult = function (building) {
	var mult = 1;
	var isUnshackled = Game.HasUpgrade(building.unshackleUpgrade);
	for (var i in building.tieredUpgrades) {
		var upgrade = building.tieredUpgrades[i];
		var tier = Game.Tiers[upgrade.tier];
		if (!tier.special && Game.HasUpgrade(upgrade)) {
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
				mult *= 1 + 0.05 * syn.buildingTie2.amount;
			} else if (syn.buildingTie2 === building) {
				mult *= 1 + 0.001 * syn.buildingTie1.amount;
			}
		}
	}
	if (building.fortune && Game.HasUpgrade(building.fortune)) { mult *= 1.07; }
	if (building.grandmaSynergy && Game.HasUpgrade(building.grandmaSynergy)) {
		mult *= (1 + Game.Objects["Grandma"].amount * 0.01 * (1 / (building.id - 1)));
	}
	return mult;
};

Game.ComputeCps = function (base, mult, bonus) {
	return (base) * (Math.pow(2, mult)) + (bonus || 0);
};

Game.getWrinklersPopGain = function () {
	var sumSucked = 0;
	if (Game.numWrinklers > 0 && Game.cookiesSuckedTotal > 0) {
		var numRegularWrinklers = Game.numWrinklers - Game.numShinyWrinklers;

		var sucked = numRegularWrinklers > 0 ? Game.cookiesSucked / numRegularWrinklers : 0;
		var suckedShiny = Game.numShinyWrinklers > 0 ? Game.cookiesSuckedShiny / Game.numShinyWrinklers : 0;
		var toSuck = 1.1;
		if (Game.HasUpgrade("Sacrilegious corruption")) {
			toSuck *= 1.05;
		}
		sucked *= toSuck;
		suckedShiny *= toSuck * 3;
		if (Game.HasUpgrade("Wrinklerspawn")) {
			sucked *= 1.05;
			suckedShiny *= 1.05;
		}
		var godLvl = Game.hasGod("scorn");
		if (godLvl == 1) {      sucked *= 1.15; suckedShiny *= 1.15; }
		else if (godLvl == 2) { sucked *= 1.1;  suckedShiny *= 1.1; }
		else if (godLvl == 3) { sucked *= 1.05; suckedShiny *= 1.05; }

		for (var i = 0; i < Game.numShinyWrinklers; i++) { //good ol' floating point
			sumSucked += suckedShiny;
		}
		for (i = 0; i < numRegularWrinklers; i++) {
			sumSucked += sucked;
		}
	}
	return sumSucked || 0;
};

Game.popWrinklers = function () {
	if (Game.numWrinklers > 0) {

		var cookies = Game.getWrinklersPopGain();
		Game.setInput("#cookiesBank", Game.cookies + cookies);
		Game.setInput("#cookiesEarned", Game.cookiesEarned + cookies);
		Game.setInput("#wrinklersPopped", Game.wrinklersPopped + Game.numWrinklers);

		var spookyCookies = Game.dropSpookyCookies(Game.numWrinklers, Game.numShinyWrinklers);
		for (var i in spookyCookies) {
			spookyCookies[i].unlocked = true;
		}

		var eggs = Game.dropEggs(Game.numWrinklers, 0.98);
		for (i in eggs) {
			eggs[i].unlocked = true;
		}
	}
	Game.setInput("#numWrinklers", 0);
	Game.setInput("#numShinyWrinklers", 0);
	Game.setInput("#cooksMunchedSaved", 0);
	Game.setInput("#cooksMunchedShinySaved", 0);
};

Game.dropSpookyCookies = function (times, timesShiny) { //halloween cookie drops
	var dropped = {};
	timesShiny = Number(timesShiny) || 0;
	times = Math.max(times, timesShiny);
	if (Game.season === "halloween" && Number(times) >= 1 && isFinite(times)) {
		var failRate = 0.95;
		if (Game.HasAchieve("Spooky cookies")) { failRate = 0.8; }
		if (Game.HasUpgrade("Starterror")) { failRate *= 0.9; }
		failRate *= 1 / Game.dropRateMult();
		if (Game.hasGod) {
			var godLvl = Game.hasGod("seasons"); //Selebrak
			if (godLvl == 1) {      failRate *= 0.9; }
			else if (godLvl == 2) { failRate *= 0.95; }
			else if (godLvl == 3) { failRate *= 0.97; }
		}
		var failRateShiny = failRate * 0.9;
		for (var i = 0; i < times; i++) {
			var rate = failRate;
			if (timesShiny > 0) {
				rate = failRateShiny;
				timesShiny--;
			}
			if (Math.random() > rate) {
				var cookie = Game.choose(Game.UpgradesByGroup.halloweenAch);
				if (!cookie.unlocked && !cookie.bought) {
					dropped[cookie.name] = cookie;
				}
			}
		}
	}
	return dropped;
};

Game.dropEggs = function (failRate, times) {
	var dropped = {};
	if (Game.season === "easter" && Number(times) >= 1 && isFinite(times)) {
		failRate *= 1 / Game.dropRateMult();
		if (Game.season != "easter") { return; }
		if (Game.HasAchieve("Hide & seek champion")) { failRate *= 0.7; }
		if (Game.HasUpgrade("Omelette")) {  failRate *= 0.9; }
		if (Game.HasUpgrade("Starspawn")) { failRate *= 0.9; }
		if (Game.hasGod) {
			var godLvl = Game.hasGod("seasons"); //Selebrak
			if (godLvl == 1) {      failRate *= 0.9; }
			else if (godLvl == 2) { failRate *= 0.95; }
			else if (godLvl == 3) { failRate *= 0.97; }
		}

		for (var i = 0; i < times; i++) {
			if (Math.random() >= failRate) {
				var egg = Game.choose(Game.UpgradesByGroup[Math.random() < 0.1 ? "rareEgg" : "commonEgg"]);
				if (egg.unlocked || egg.bought || dropped[egg.name]) { //reroll if we have it
					egg = Game.choose(Game.UpgradesByGroup[Math.random() < 0.1 ? "rareEgg" : "commonEgg"]);
				}
				if (!egg.unlocked && !egg.bought) {
					dropped[egg.name] = egg;
				}
			}
		}
	}
	return dropped;
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
	/* if (Game.dragonAuras[Game.dragonAura].name === name) {
		return Game.dragonLevel >= 5;
	} else if (Game.dragonAuras[Game.dragonAura2].name === name) {
		return Game.dragonLevel >= Game.dragonLevelMax;
	}
	return false; */
	return Game.dragonAuras[Game.dragonAura].name === name || Game.dragonAuras[Game.dragonAura2].name === name;
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

Game.processNamesList = function (list) {
	if (!list || !Array.isArray(list) || !list.length) {
		return "";
	}
	var str = "";
	for (var i = 0; i < list.length && i < Game.maxNamesList; i++) {
		var line = list[i];
		str += "<div>" + (line && line.iconName ? line.iconName : String(line)) + "</div>";
	}
	if (list.length > Game.maxNamesList) {
		str += "<div>+ " + (list.length - Game.maxNamesList) + " more...</div>";
	}
	return ('<div class="tooltipNamesList"><div>' + str.replace("<br>", "") + "</div></div>");
};

Game.calcCookiesFromIdling = function (now) {
	if (typeof now === "undefined") { now = Date.now(); }
	var cookies = 0;
	var hasPerfectIdling = Game.HasUpgrade("Perfect idling");

	//compute cookies earned while the game was closed
	if (Game.unbuffedCookiesPs > 0 && (hasPerfectIdling || Game.HasUpgrade("Twin Gates of Transcendence"))) {
		var maxTime, percent;
		if (hasPerfectIdling) {
			maxTime = 60 * 60 * 24 * 1000000000;
			percent = 100;
		} else {
			maxTime = 60 * 60 * Math.pow(2, Game.countUpgradesByGroup("demon"));
			percent = 5 + 10 * Game.countUpgradesByGroup("angel");
			if (Game.HasUpgrade("Chimera")) {
				maxTime += 60 * 60 * 24 * 2;
				percent += 5;
			}
			if (Game.HasUpgrade("Fern tea")) { percent += 3; }
			if (Game.HasUpgrade("Ichor syrup")) { percent += 7; }
			if (Game.HasUpgrade("Fortune #102")) { percent += 1; }
		}

		var timeOffline = (now - Game.lastSavedTime) / 1000;
		var timeOfflineOptimal = Math.min(timeOffline, maxTime);
		var timeOfflineReduced = Math.max(0, timeOffline - timeOfflineOptimal);
		cookies = (timeOfflineOptimal + timeOfflineReduced * 0.1) * Game.unbuffedCookiesPs * (percent / 100);
	}
	return cookies;
};

Game.canLumps = function () {
	return Game.lumpsTotal > 0 || byId("sugarLumpsUnlocked").checked;
	// return (Game.lumpsTotal > 0 || (Game.ascensionMode != 1 && (Game.cookiesEarned + Game.cookiesReset) >= 1000000000));
};

Game.getLumpRefillMax = function () {
	return (1000 * 60 * 15); //15 minutes
};

Game.getLumpRefillRemaining = function (now) {
	if (typeof now === "undefined") { now = Date.now(); }
	return (Game.getLumpRefillMax() - (now - Game.lumpRefill));
};

Game.canRefillLump = function (now) {
	if (typeof now === "undefined") { now = Date.now(); }
	return ((now - Game.lumpRefill) >= Game.getLumpRefillMax());
};

Game.getLumpTime = function (now) {
	if (typeof now === "undefined") { now = Date.now(); }
	var age = Math.max(now - Game.lumpTime, 0);
	var amount = Game.getOfflineLumps(now);
	var lumpTime = Game.lumpTime;
	if (amount > 0) {
		lumpTime = now - (age - amount * Game.lumpOverripeAge);
	}
	return lumpTime;
};

Game.computeLumpType = function (now) {
	Math.seedrandom(Game.seed + "/" + Game.getLumpTime(now));
	var types = [0];
	var loop = 1;
	loop += Game.auraMult("Dragon's Curve");
	loop = Game.randomFloor(loop);
	for (var i = 0; i < loop; i++) {
		if (Math.random() < (Game.HasUpgrade("Sucralosia Inutilis") ? 0.15 : 0.1)) { types.push(1); } //bifurcated
		if (Math.random() < 3 / 1000) { types.push(2); } //golden
		if (Math.random() < 0.1 * Game.elderWrath) { types.push(3); } //meaty
		if (Math.random() < 1 / 50) { types.push(4); } //carmelized
	}
	Game.lumpCurrentType = Game.choose(types);
	Math.seedrandom();
	byId("sugarLumpsType").selectedIndex = Game.lumpCurrentType;
};

Game.computeLumpTimes = function () {
	var hour = 1000 * 60 * 60;
	Game.lumpMatureAge = hour * 20;
	Game.lumpRipeAge = hour * 23;
	if (Game.HasUpgrade("Stevia Caelestis")) { Game.lumpRipeAge -= hour; }
	if (Game.HasUpgrade("Diabetica Daemonicus")) { Game.lumpMatureAge -= hour; }
	if (Game.HasUpgrade("Ichor syrup")) { Game.lumpMatureAge -= 1000 * 60 * 7; }
	if (Game.HasUpgrade("Sugar aging process")) { Game.lumpRipeAge -= 6000 * Math.min(600, Game.Objects["Grandma"].amount); }
	if (Game.ObjectsOwned % 10 == 0) {
		var godLvl = Game.hasGod("order"); //Rigidel
		if (godLvl == 1) {      Game.lumpRipeAge -= hour; }
		else if (godLvl == 2) { Game.lumpRipeAge -= (hour / 3) * 2; }
		else if (godLvl == 3) { Game.lumpRipeAge -= (hour / 3); }
	}
	Game.lumpMatureAge /= 1 + Game.auraMult("Dragon's Curve") * 0.05;
	Game.lumpRipeAge /= 1 + Game.auraMult("Dragon's Curve") * 0.05;
	Game.lumpOverripeAge = Game.lumpRipeAge + hour;
	if (Game.HasUpgrade("Glucose-charged air")) {
		Game.lumpMatureAge /= 2000;
		Game.lumpRipeAge /= 2000;
		Game.lumpOverripeAge /= 2000;
	}
};

Game.harvestLumps = function () {
	if (!Game.canLumps()) { return 0; }
	var total = 1;
	if (Game.lumpCurrentType == 1 && Game.HasUpgrade("Sucralosia Inutilis") && Math.random() < 0.05) { total *= 2; }
	else if (Game.lumpCurrentType == 1) { total *= Game.choose([1, 2]); }
	else if (Game.lumpCurrentType == 2) { total *= Game.choose([2, 3, 4, 5, 6, 7]); }
	else if (Game.lumpCurrentType == 3) { total *= Game.choose([0, 0, 1, 2, 2]); }
	else if (Game.lumpCurrentType == 4) { total *= Game.choose([1, 2, 3]); }
	return Math.floor(total);
};

Game.getOfflineLumps = function (now) {
	if (typeof now === "undefined") { now = Date.now(); }
	var age = Math.max(now - Game.lumpTime, 0);
	var amount = Math.floor(age / Game.lumpOverripeAge); //how many lumps did we harvest since we closed the game?
	var lumps = 0;
	if (amount >= 1) {
		lumps += Game.harvestLumps();
		if (amount > 1) {
			lumps += amount - 1;
		}
	}
	return lumps;
};

Game.dropRateMult = function () {
	var rate = 1;
	if (Game.HasUpgrade("Green yeast digestives")) { rate *= 1.03; }
	if (Game.HasUpgrade("Dragon teddy bear")) { rate *= 1.03; }
	rate *= Game.eff("itemDrops");
	rate *= 1 + Game.auraMult("Mind Over Matter") * 0.25;
	if (Game.HasUpgrade("Santa's bottomless bag")) { rate *= 1.1; }
	if (Game.HasUpgrade("Cosmic beginner's luck") && !Game.HasUpgrade("Heavenly chip secret")) { rate *= 5; }
	return rate;
};

Game.updatePieTimer = function (ele, time, timeMax) {
	$(ele).toggleClass("hidden", !(time > -1)); //NaN guard
	if (time > -1) {
		var T = 1 - (time / timeMax);
		T = (T * 144) % 144;
		$(ele).css("background-position", (-Math.floor(T % 18)) * 48 + "px " + (-Math.floor(T / 18)) * 48 + "px");
	}
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
		byId("numWrinklers").maxIn = n;
		byId("numShinyWrinklers").maxIn = n;
		Game.setInput("#numWrinklers");
		Game.setInput("#numShinyWrinklers");
	}
};

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

//guesstimates the minimum cookies baked this ascension you'd need for everything
//assumes everything is bought with current price reduction upgrades
//(including the very upgrades that provide said reduction 'cause to do otherwise is a pain)
//also to set a difference when importing just in case the save is from a version with different prices and this voodoo would be thrown off
Game.getMinCumulative = function () {
	var cumu = Game.cookies;
	var upgrade, i;

	for (i = 0; i < Game.ObjectsById.length; i++) {
		var building = Game.ObjectsById[i];
		var free = Game.ascensionMode === 1 ? 0 : building.free;
		cumu += building.getPriceSum(free, building.amount);
		// var diff = building.bought - Math.max(building.amount, building.free);
		// if (diff > 0) {
		// 	cumu += building.getPrice(0) * diff;
		// }
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
	clearTimeout(Game.updateTimer);
	clearTimeout(updateScheduleTimer);
	lastUpdateDelay = 1;
	Game.lastUpdateTime = Game.saveImportTime || Date.now();
	Game.saveImportTime = null;
	Game.updating = true;

	$(document.body).toggleClass("extraButtons", Game.prefs.extraButtons);

	// Game.autoUnlockUpgrades = byId('upgradeAutoUnlock').checked;

	$("#offVerse").toggleClass("hidden", byId("versionIn").parsedValue === Game.version);

	Game.steam = byId("steamCheck").checked;
	document.body.classList.toggle("steam", Game.steam);
	Game.ascensionMode = asBoolNum(byId("bornAgainCheck").checked);

	var i, building, upgrade, achieve;

	for (i = 0; i < Game.ObjectsById.length; i++) {
		building = Game.ObjectsById[i];

		var free = Game.ascensionMode === 1 ? 0 : building.free;
		building.bought = Math.max(building.boughtIn.parsedValue, building.amount, free);
		building.highest = Math.max(building.highestIn.parsedValue, building.amount, free);
		building.$tooltipBlock = null;

		building.muteButton.textContent = building.muted ? "Unmute" : "Mute";
	}

	// sighs in stock market needing all buildings' .highest set to calculate right
	for (i = 0; i < Game.ObjectsById.length; i++) {
		building = Game.ObjectsById[i];
		if (building.minigame) {
			building.minigame.enabled = building.level > 0;
			if (building.minigame.$disabledBlock) {
				building.minigame.$disabledBlock.toggleClass("hidden", building.minigame.enabled);
			}
			if (building.minigame.updateFunc) {
				building.minigame.updateFunc();
			}
		}
	}

	Game.setEffs();
	Game.setPriceMultArrays();

	Game.prestige = Math.floor(Game.HowMuchPrestige(Game.cookiesReset));
	Game.numResets = byId("numResets").parsedValue;
	if (Game.cookiesReset > 0 && !Game.numResets) {
		Game.numResets = 1;
	}

	var prestigeStr = Game.formatNumber(Game.prestige, 0, true);
	byId("prestigeCurrent").innerHTML = prestigeStr;
	byId("prestigeReset").innerHTML = prestigeStr;

	Game.goldenClicksLocal = byId("goldClicks").parsedValue;
	Game.goldenClicks = Math.max(byId("goldClicksAll").parsedValue, Game.goldenClicksLocal);
	if (!Game.numResets && Game.goldenClicks > Game.goldenClicksLocal) {
		Game.goldenClicksLocal = Game.goldenClicks;
	}

	Game.pledges = byId("numPledges").parsedValue;
	if (!Game.pledges && Game.HasUpgrade("Elder Pledge")) {
		Game.pledges = 1;
	}

	// Game.setDisabled("#foolsNameCheck", Game.season === "fools");

	var hasHat = Game.HasUpgrade("A festive hat");
	$("#santaNoHatSpan").toggleClass("hidden", hasHat);

	Game.santaLevel = hasHat ? Game.getSelectedIndex(Game.santa.levelEle, Game.santaMax) : 0;
	Game.setDisabled(Game.santa.levelEle, !hasHat);

	Game.santa.dropsUnlocked = 0;
	Game.santa.dropsBought = 0;

	var cond = hasHat && Game.santaLevel < Game.santaMax;
	byId("nextSanta").textContent = cond ? Game.santaLevels[Game.santaLevel + 1] : "---";
	byId("santaPrice").innerHTML = Game.formatNumber(Math.pow(Game.santaLevel + 1, Game.santaLevel + 1), 0, true);
	$("#santaClick").toggleClass("hidden", !cond);

	var hasCrumblyEgg = Game.HasUpgrade("A crumbly egg");
	Game.dragonLevel = hasCrumblyEgg ? byId("dragonLevelIn").parsedValue : 0;
	$("#noDragonEggSpan").toggleClass("hidden", Boolean(hasCrumblyEgg));

	Game.lumpsTotal = Math.max(byId("sugarLumpsTotal").parsedValue, Game.lumps);
	var lumpsUnlockedEle = byId("sugarLumpsUnlocked");
	lumpsUnlockedEle.checked = Game.lumpsTotal > 0 || lumpsUnlockedEle.manualChecked;
	Game.setDisabled(lumpsUnlockedEle, Game.lumpsTotal > 0);


	var prevAchsOwned = Game.AchievementsOwned;
	Game.AchievementsOwned = 0;
	var achievementsOwnedOther = 0;

	for (i = 0; i < Game.AchievementsById.length; i++) {
		achieve = Game.AchievementsById[i];
		achieve.toBeWon = false;

		if (achieve.won) {
			if (Game.CountsAsAchievementOwned(achieve.pool)) {
				Game.AchievementsOwned++;
			} else {
				achievementsOwnedOther++;
			}
		}
	}

	byId("numAchieves").innerHTML = Game.AchievementsOwned + " / " + Game.AchievementsTotal +
		" (" + Math.floor((Game.AchievementsOwned / Game.AchievementsTotal) * 100) + "%)";
	$("#numAchievesOther").text(" (+" + achievementsOwnedOther + ")").toggleClass("hidden", !achievementsOwnedOther);

	Game.milkProgress = Game.AchievementsOwned / 25;
	// byId("achMilk").innerHTML = Math.round(Game.milkProgress * 100) + "% (" +
	// 	Game.Milks[Math.min(Math.floor(Game.milkProgress), Game.Milks.length - 1)].name + ")";
	byId("achMilk").innerHTML = Game.Milks[Math.min(Math.floor(Game.milkProgress), Game.Milks.length - 1)].rankStr;

	for (i = 0; i < Game.BankAchievements.length; i++) {
		achieve = Game.BankAchievements[i];
		if (Game.cookiesEarned >= achieve.threshold) {
			Game.Win(achieve);
		}
	}

	Game.UpgradesOwned = 0;
	var prestigeUpgradesOwned = 0;
	var hasNeuro = Game.HasUpgrade("Neuromancy");
	var showDebugBlock = hasNeuro ? true : Game.showDebug;
	Game.hasSeasonSwitch = false;
	var hasSeasonSwitchUnlocked = Game.HasUpgrade("Season switcher");

	for (i = 0; i < Game.UpgradesById.length; i++) {
		upgrade = Game.UpgradesById[i];
		upgrade.isPerm = false;
		upgrade.toBeUnlocked = false;
		upgrade.displayUnlocked = false;
		upgrade.exportUnlocked = false;
		upgrade.$tooltipBlock = null;

		if (upgrade.noBuy && upgrade.bought) { //safety switch
			upgrade.bought = false;
		}

		if (upgrade.runFunc) {
			upgrade.runFunc();
		}

		var hasRequire = typeof upgrade.require === "function";
		var hasParents = Boolean(upgrade.parents);

		//need a require function and/or parents
		//can pass with either if just one is present, but need to pass both if both
		if (
			(hasRequire || hasParents) &&
			(!hasParents || Game.HasUpgrade(upgrade.parents)) &&
			(!hasRequire || upgrade.require()) &&
			(!upgrade.isChild || Game.HasUpgrade(upgrade.toggleInto))
		) {
			Game.Unlock(upgrade, Boolean(upgrade.isChild));
		}

		if (upgrade.bought) {
			if (upgrade.groups.countedUpgrade) {
				if (!upgrade.hidden) {
					Game.UpgradesOwned++;
				}
			} else if (upgrade.pool === "prestige") {
				prestigeUpgradesOwned++;
			}
		}

		if (!showDebugBlock && upgrade.pool === "debug" && (upgrade.unlocked || upgrade.bought)) {
			showDebugBlock = true;
		}

		if (upgrade.groups.seasonSwitch) {
			Game.hasSeasonSwitch = Game.hasSeasonSwitch || upgrade.bought;
			hasSeasonSwitchUnlocked = hasSeasonSwitchUnlocked || upgrade.bought || upgrade.unlocked;
		}
	}

	var max = Game.UpgradesByPool.prestige.length;
	byId("numPrestigeUpgrades").innerHTML = prestigeUpgradesOwned + " / " + max + " (" +
		Math.floor((prestigeUpgradesOwned / max) * 100) + "%)";

	$("#upgradeDebugBlock").toggleClass("hidden", !showDebugBlock);

	/* for (i = 0; i < Game.UnlockAt.length; i++) {
		var unlock = Game.UnlockAt[i];
		var pass = false;
		if (typeof unlock.require === "function") {
			if (unlock.require()) {
				pass = true;
			}
		} else if (Game.cookiesEarned >= unlock.cookies) {
			pass = true;
			if (unlock.require && !Game.HasUpgrade(unlock.require)) { pass = false; } // && !Game.HasAchieve(unlock.require)
			if (unlock.season && Game.season != unlock.season) { pass = false; }
		}
		if (pass) {
			Game.Unlock(unlock.name);
			// Game.Win(unlock.name);
		}
	} */

	for (i = 0; i < Game.UpgradesByGroup.selector.length; i++) {
		upgrade = Game.UpgradesByGroup.selector[i];
		var unlocked = upgrade.getUnlocked();

		upgrade.$toggleCrate.toggleClass("unlocked", unlocked || Game[upgrade.choiceProp] > 0);

		upgrade.$choiceCrates.each(function (index) {
			var choiceObj = Game[upgrade.groups.selector][this.choiceIndex];
			var choiceUnlocked = !choiceObj.require || Game.HasUpgrade(choiceObj.require);
			//bit ugly check for normal milks
			if (choiceObj.rank && choiceObj.rank > Game.milkProgress) {
				choiceUnlocked = false;
			}
			$(this).toggleClass("unlocked", !index || (unlocked && choiceUnlocked));
		});
	}

	$("#milkLineChoice").toggleClass("hidden", !Game.HasUpgrade("Fanciful dairy selection") && Game._fancifulMilkChoiceIndeces.indexOf(Game.milkType) === -1);

	Game.updateResearch();
	Game.updateGrandmapocalypse();

	//seasons
	Game.seasonUses = byId("seasonCount").parsedValue;
	var seasonTimeEle = byId("seasonTime");
	Game.seasonTime = 0;
	var seasonDisplayStr = "---";

	Game.setDisabled("#seasonCount", !hasSeasonSwitchUnlocked);

	var hasEternalSeasons = Game.HasUpgrade("Eternal seasons");
	if (Game.hasSeasonSwitch) {
		if (Game.seasonUses < 1) {
			Game.seasonUses = 1;
		}
		if (hasEternalSeasons) {
			seasonDisplayStr = Game.infinitySymbol;
		} else {
			seasonDisplayStr = "";
		}
	}
	byId("nextSeason").innerHTML = Game.formatNumber(Game.UpgradesByGroup.seasonSwitch[0].getPrice(Game.seasonUses), 0, true);

	seasonTimeEle.displayValue = seasonDisplayStr;
	Game.setInput(seasonTimeEle);
	Game.setDisabled(seasonTimeEle, hasEternalSeasons || !Game.hasSeasonSwitch);
	$("#seasonTimeClick").toggleClass("hidden", !Game.hasSeasonSwitch || Game.seasonTime === Game.seasonDuration);

	var hasPermUpgrade = false;
	var hasPermSlot = false;
	for (i = 0; i < Game.permanentUpgrades.length; i++) {
		var slot = Game.permanentUpgradeSlots[i];
		hasPermSlot = hasPermSlot || slot.bought;
		hasPermUpgrade = hasPermUpgrade || Game.permanentUpgrades[i] > -1;

		upgrade = slot.permUpgrade;
		if (
			Game.ascensionMode !== 1 && slot.bought && upgrade && upgrade.type === "upgrade" &&
			!upgrade.isPerm && upgrade.groups.canPerm
		) {
			upgrade.isPerm = true;

			if (!upgrade.bought) {
				Game.UpgradesOwned++;
			}
		}
		slot.$permCrate.toggleClass("hidden", !slot.bought && !upgrade);
	}

	byId("numUpgrades").innerHTML = Game.UpgradesOwned + " / " + Game.maxCountedUpgrades + " (" +
		Math.floor((Game.UpgradesOwned / Game.maxCountedUpgrades) * 100) + "%)";

	$("#permUpgradeSlots").toggleClass("hidden", !hasPermSlot);
	$("#permUpgradeNoSlots").toggleClass("hidden", hasPermSlot);
	$("#permUpgradeClear").toggleClass("invisible", !hasPermUpgrade);

	Game.minLumpsTotal = Game.lumps + Game.HasUpgrade("Sugar frenzy");

	Game.ObjectsOwned = 0;
	Game.HighestBuilding = null;
	for (i = 0; i < Game.ObjectsById.length; i++) {
		building = Game.ObjectsById[i];

		building.priceCache = {};
		Game.minLumpsTotal += building.level;

		building.price = building.getPrice();
		building.$priceSpan.html(Game.formatNumber(building.price));
		building.checkUnlocks();

		building.$boughtExpectedSpan.text("(" + building.bought + ")")
			.toggleClass("clickme", building.bought > building.boughtIn.parsedValue);
		building.$highestExpectedSpan.text("(" + building.highest + ")")
			.toggleClass("clickme", building.highest > building.highestIn.parsedValue);

		Game.ObjectsOwned += building.amount;
		if (building.amount > 0) {
			Game.HighestBuilding = building;
		}
	}

	// $("#sugarLumpsTotalExpected").html("(expected: " + Game.minLumpsTotal + ")")
	// 	.toggleClass("hidden", Game.lumpsTotal >= Game.minLumpsTotal);

	Game.CalculateGains();
	var witherStr = "";
	if (Game.cpsSucked > 0) {
		witherStr = " (withered: " + Game.Beautify(Math.round(Game.cpsSucked * 100), 1) + "%)";
	}
	$("#cookiesPerSecond").html(Game.formatNumber(Game.cookiesPs * (1 - Game.cpsSucked), 1, true) + witherStr)
		.toggleClass("warning", Game.cpsSucked > 0);
	$("#cookiesMultiplier").html(Game.formatNumber(Math.round(Game.globalCpsMult * 100)));

	ele = byId("rawCookiesPsIn");
	Game.rawCookiesPsHighest = Math.max(Game.rawCookiesPs, ele.parsedValue);

	$("#rawCookiesPsCurrent").html(Game.formatNumber(Game.rawCookiesPsHighest, 1, true));
	$("#rawCookiesPsExpected").toggleClass("hidden", Game.rawCookiesPsHighest === ele.parsedValue);

	var showLockUpgrades = false;
	var showDisableUpgrades = false;
	var showUnlockUpgrades = false;
	var showEnableUpgrades = false;

	Game.UpgradesToBeUnlocked = [];
	Game.chipsSpentExpected = 0;

	for (i = 0; i < Game.UpgradesById.length; i++) {
		upgrade = Game.UpgradesById[i];
		upgrade.setPrice();

		upgrade.updateCrates();

		if (upgrade.toBeUnlocked && !upgrade.unlocked && !upgrade.bought) {
			Game.UpgradesToBeUnlocked.unshift(upgrade);
		}
		showLockUpgrades = showLockUpgrades || upgrade.unlocked;
		showDisableUpgrades = showDisableUpgrades || upgrade.bought;

		if (upgrade.pool !== "debug") {
			if (upgrade.pool !== "prestige") {
				showUnlockUpgrades = showUnlockUpgrades || !upgrade.unlocked;
			}
			if (upgrade.pool !== "toggle") {
				showEnableUpgrades = showEnableUpgrades || !upgrade.bought;
			}
		}

		if (upgrade.bought && upgrade.pool === "prestige") {
			Game.chipsSpentExpected += upgrade.price;
		}

		if (upgrade.groups.santaDrop) {
			if (upgrade.getBought()) {
				Game.santa.dropsBought++;
				Game.santa.dropsUnlocked++;
			} else if (upgrade.unlocked || upgrade.toBeUnlocked) {
				Game.santa.dropsUnlocked++;
			}
		}
	}

	ele = byId("upgradeAward");
	ele.tooltipHTML = Game.processNamesList(Game.UpgradesToBeUnlocked);
	$(ele).toggleClass("invisible", !Game.UpgradesToBeUnlocked.length);
	byId("upgradeAwardCount").textContent = Game.UpgradesToBeUnlocked.length;

	$("#upgradeLockAll").toggleClass("hidden", !showLockUpgrades);
	$("#upgradeDisableAll").toggleClass("hidden", !showDisableUpgrades);
	$("#upgradeUnlockAll").toggleClass("hidden", !showUnlockUpgrades);
	$("#upgradeEnableAll").toggleClass("hidden", !showEnableUpgrades);

	var len = Game.santa.drops.length;
	unlocked = Game.santa.dropsUnlocked;
	var expectedUnlocked = Math.min(Game.santaLevel + 1, len);
	var santaDiff = expectedUnlocked - unlocked;
	$("#pickSantaDrops, #pickSantaDropsUp").toggleClass("hidden", !hasHat || santaDiff <= 0);
	$("#pickSantaDropsCount, #pickSantaDropsUpCount").text(Math.max(santaDiff, 0));
	$("#rerollSantaDrops").toggleClass("invisible", !hasHat || unlocked <= 0 ||
		unlocked === Game.santa.dropsBought || expectedUnlocked === len);

	if (hasHat && santaDiff > 0) {
		Game.pickSantaDrops(santaDiff, true);
	}

	$(".productDragonBoost").toggleClass("hidden", !Game.hasAura("Supreme Intellect"));

	Game.updatePrestige();
	Game.updateDragon();
	Game.updateBuffs();
	Game.updateModData();

	Game.AchievementsToBeWon = [];

	var showDisableAchs = false;
	var showAwardAchs = false;
	var showEnableAchs = false;
	for (i = 0; i < Game.AchievementsById.length; i++) {
		achieve = Game.AchievementsById[i];

		if (!achieve.toBeWon && typeof achieve.require === "function" && achieve.require()) {
			Game.Win(achieve);
		}
		if (achieve.toBeWon && !achieve.won) {
			Game.AchievementsToBeWon.unshift(achieve);
		}

		if (!achieve.autoAward) {
			showDisableAchs = showDisableAchs || achieve.won;
		}
		if (achieve.pool !== "dungeon") {
			showEnableAchs = showEnableAchs || !achieve.won;
		}
		showAwardAchs = showAwardAchs || (achieve.toBeWon && !achieve.won);

		achieve.$crateNodes.toggleClass("unlocked", achieve.toBeWon)
			.toggleClass("enabled", achieve.won);
	}

	var achNamesList = Game.processNamesList(Game.AchievementsToBeWon);

	$("#achDisableAll").toggleClass("hidden", !showDisableAchs);
	$("#achEnableAll").toggleClass("hidden", !showEnableAchs);
	$("#achAward, #warnAchievesBlock").toggleClass("hidden", !showAwardAchs);
	$("#achAward, #warnAchievesSpan").each(function () {
		this.tooltipHTML = achNamesList;
	});
	byId("achAwardCount").textContent = Game.AchievementsToBeWon.length;
	byId("warnAchievesCount").textContent = Game.AchievementsToBeWon.length + Game.getPlural(Game.AchievementsToBeWon.length, " achievement");

	if (typeof Game.updateTooltip === "function") {
		Game.updateTooltip(true);
	}

	$("#idleGainCookies").toggleClass("hidden", !Game.cookiesPs || (!Game.HasUpgrade("Perfect idling") && !Game.HasUpgrade("Twin Gates of Transcendence")));

	if (!Game.lumpTypes[Game.lumpCurrentType]) {
		Game.computeLumpType();
	}
	Game.computeLumpTimes();
	var offlineLumps = Game.getOfflineLumps(Game.lastUpdateTime);
	$("#idleGainSugarLumps").toggleClass("hidden", !offlineLumps || !Game.canLumps());

	$(".tabs > .tab").each(updateTab);

	byId("exportField").value = Game.exportSave();

	var opensesame = Game.bakeryNameLowerCase.indexOf("saysopensesame", Game.bakeryNameLowerCase.length - ("saysopensesame").length) > 0;
	$("#warnCheat").toggleClass("invisible", Game.HasAchieve("Cheated cookies taste awful") || !(opensesame || Game.cookies > Game.cookiesEarned));

	Game.minCumulative = Math.max(Game.getMinCumulative() - Game.minCumulativeOffset, 0);
	Game.minCumulativeDiff = Math.max(Game.minCumulative - Game.cookiesEarned, 0);

	$("#warnCookiesCount").html(loc("%1 cookie", Game.LBeautify(Game.minCumulativeDiff)));
	$("#warnCookiesSpan").toggleClass("hidden", !Game.minCumulativeDiff);

	var $ele = $("#warnBlock");
	$ele.toggleClass("hidden", !$ele.children(":not(.hidden)").length);

	$("#cookiesAllTime").html(Game.formatNumber(Game.cookiesEarned + Game.cookiesReset, 1, true));
	var prestigeGain = Math.floor(Game.HowMuchPrestige(Game.cookiesEarned + Game.cookiesReset));
	$("#prestigeResetGain").html(Game.formatNumber(Math.max(prestigeGain - Game.prestige, 0), 0, true));

	Game.filterUpgrades();
	Game.filterAchievements();

	if (Game.autoWinAchievements && prevAchsOwned !== Game.AchievementsOwned) {
		Game.update();
	} else {
		Game.updateTimer = setTimeout(Game.update, 1000 * 10); //10 seconds
	}
	Game.updating = false;
};

function updateTab() {
	if (this && typeof this.updateTabFunc === "function") {
		this.updateTabFunc();
	}
}


Game.updateResearch = function () {
	var bingoCenter = Game.Upgrades["Bingo center/Research facility"];
	Game.researchTime = bingoCenter.bought ? -1 : 0;

	Game.nextResearch = null;
	for (var i = 0; i < Game.UpgradesByPool.tech.length; i++) {
		var upgrade = Game.UpgradesByPool.tech[i];
		if (!upgrade.bought) {
			var prevTech = Game.UpgradesByPool.tech[i - 1] || bingoCenter;
			if (!upgrade.unlocked && prevTech.bought) {
				Game.nextResearch = upgrade;
			}
			break;
		}
	}

	$("#researchRow").toggleClass("disabled", !Game.nextResearch);
	var researchTimeEle = byId("researchTime");
	if (Game.nextResearch) {
		Game.researchTime = researchTimeEle.parsedValue;
	}
	researchTimeEle.displayValue = Game.nextResearch ? "" : "---";
	Game.setInput(researchTimeEle);
	Game.setDisabled(researchTimeEle, !Game.nextResearch);

	$("#researchClick").html(Game.nextResearch ? Game.nextResearch.name : "---")
		.toggleClass("clickme", Boolean(Game.nextResearch));
	$("#researchTimeClick").toggleClass("hidden", !Game.nextResearch || Game.researchTime === Game.researchDuration);

	Game.hasAllResearch = false;
	if (!Game.nextResearch) {
		Game.hasAllResearch = Game.countUpgradesByGroup(Game.UpgradesByPool.tech, -1, true) === Game.UpgradesByPool.tech.length;
	}
};

Game.updateGrandmapocalypse = function () {
	//pledges
	var hasPact = Game.HasUpgrade("Elder Pact");
	var hasOneMind = Game.HasUpgrade("One mind");
	var pledge = Game.GetUpgrade("Elder Pledge");
	var hasCovenant = Game.HasUpgrade("Elder Covenant");
	var pledgeTimeEle = byId("pledgeTime");
	byId("pledgePrice").innerHTML = Game.formatNumber(pledge.getPrice(), 0, true);
	Game.pledgeTime = 0;

	Game.setDisabled("#wrinklersPopped", !hasOneMind);
	Game.setDisabled("#cooksMunchedAll", !hasOneMind);

	var pledgeDisplayValue = "---";
	if (hasCovenant) {
		pledgeDisplayValue = Game.infinitySymbol;
	} else if (pledge.bought) {
		pledgeDisplayValue = "";
		Game.pledgeTime = pledgeTimeEle.parsedValue;
	}
	pledgeTimeEle.displayValue = pledgeDisplayValue;
	Game.setInput(pledgeTimeEle);
	Game.setDisabled("#numPledges", !hasPact);
	Game.setDisabled(pledgeTimeEle, pledgeDisplayValue.length > 0);

	//wrath
	Game.elderWrath = 0;
	if (!hasCovenant && !pledge.bought && Game.Objects["Grandma"].amount > 0) {
		if (hasPact) {
			Game.elderWrath = 3;
		} else if (Game.HasUpgrade("Communal brainsweep")) {
			Game.elderWrath = 2;
		} else if (hasOneMind) {
			Game.elderWrath = 1;
		}
	}
	var wrathStr = "---";
	if (Game.elderWrath > 0 || Game.pledges > 0) {
		wrathStr = Game.wrathLevels[Game.elderWrath] || Game.wrathLevels[0];
	}
	byId("elderWrathCell").textContent = wrathStr;
	$("#elderWrathRow").toggleClass("disabled", !Game.elderWrath && !Game.pledges);

	Game.updateMaxWrinklers();
	var wrinklersEle = byId("numWrinklers");
	var shinyWrinklersEle = byId("numShinyWrinklers");
	Game.numShinyWrinklers = Math.min(shinyWrinklersEle.parsedValue, Game.maxWrinklers);
	Game.numWrinklers = Math.max(Math.min(wrinklersEle.parsedValue, Game.maxWrinklers), Game.numShinyWrinklers);
	// if (Game.numWrinklers < Game.numShinyWrinklers) {
	// 	Game.numWrinklers = Game.setInput(wrinklersEle, Game.numShinyWrinklers);
	// }
	Game.setDisabled(wrinklersEle, !Game.elderWrath);
	Game.setDisabled(shinyWrinklersEle, !Game.elderWrath);

	var cookiesSuckedEle = byId("cooksMunchedSaved");
	Game.cookiesSucked = Game.numWrinklers > 0 ? cookiesSuckedEle.parsedValue : 0;
	Game.setDisabled(cookiesSuckedEle, !Game.elderWrath || !Game.numWrinklers);
	Game.setInput(cookiesSuckedEle);

	var cookiesSuckedShinyEle = byId("cooksMunchedShinySaved");
	Game.cookiesSuckedShiny = Game.numShinyWrinklers > 0 ? cookiesSuckedShinyEle.parsedValue : 0;
	Game.setDisabled(cookiesSuckedShinyEle, !Game.elderWrath || !Game.numWrinklers);
	Game.setInput(cookiesSuckedShinyEle);

	Game.cookiesSuckedTotal = Game.cookiesSucked + Game.cookiesSuckedShiny;

	var popCookies = Game.getWrinklersPopGain();
	var popPlural = loc("%1 cookie", Game.LBeautify(popCookies));
	var popCookiesTitle = popCookies > 0 ? "+" + popPlural : "";
	$("#popWrinklers").toggleClass("hidden", !Game.numWrinklers).attr("data-title", popCookiesTitle);
	$("#cooksMunchedAdd").html("(" + popCookiesTitle + ")")
		.toggleClass("hidden", !popCookies);
	$("#warnWrinklersBlock").toggleClass("hidden", !(!Game.elderWrath && Game.numWrinklers));
	byId("warnWrinklers").dataset.title = popCookiesTitle;

	var showReset = Game.pledgeTime > 0 && Game.pledgeTime !== Game.pledgeDuration;
	byId("pledgeClickText").textContent = showReset ? "Reset time" : "Pledge";
	$("#pledgeClickIcon").toggleClass("hidden", showReset);
	$("#pledgeClick").toggleClass("hidden", !((Game.pledgeTime !== Game.pledgeDuration && pledge.bought) || (pledge.unlocked && !pledge.bought && !Game.pledgeTime)))
		.attr("data-title", !showReset && popCookies > 0 ? popCookiesTitle + " from wrinklers" : "");
};

Game.updatePrestige = function () {
	Game.cookiesPrestigeDesired = Game.HowManyCookiesResetAdjusted(Game.prestigeDesired);
	var str = "(" + Game.formatNumber(Game.cookiesPrestigeDesired, 0, true) + " forfeited cookies";
	if (Game.prestige !== Game.prestigeDesired) {
		var diff = Game.cookiesPrestigeDesired - Game.cookiesReset;
		str += " (" + (diff > 0 ? "+" : "") + Game.formatNumber(diff, 0, true) + ")";
	}
	$("#prestigeDesiredCookies").html(str + ")").toggleClass("clickme", Game.prestige !== Game.prestigeDesired);

	Game.chipsExpected = Game.prestige - Game.heavenlyChipsSpent;
	var chipsExpectedFormat = Game.formatNumber(Game.chipsExpected, 0, true);
	if (Game.chipsExpected < 0) {
		chipsExpectedFormat = '<span class="negative">' + chipsExpectedFormat + "</span>";
	}
	$("#chipsExpected").html("(expected: " + chipsExpectedFormat + ")")
		.toggleClass("clickme", Game.chipsExpected !== Game.heavenlyChips);

	Game.cookiesToZed = 0;
	var toZedDiff = 0;
	if (Game.heavenlyChips < 0) {
		Game.cookiesToZed = Game.HowManyCookiesResetAdjusted(Game.prestige - Game.heavenlyChips);
		toZedDiff = Game.cookiesToZed - Game.cookiesReset;
	}

	$("#chipsExpectedToZero").html("(to zero: +" + Game.formatNumber(toZedDiff, 0, true) + " cookie" + (toZedDiff === 1 ? ")" : "s)"))
		.toggleClass("hidden", toZedDiff <= 0);

	$("#chipsSpentExpected").html("(expected: " + Game.formatNumber(Game.chipsSpentExpected, 0, true) + ")")
		.toggleClass("clickme", Game.chipsSpentExpected !== Game.heavenlyChipsSpent);
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

	$("#auraBlock").toggleClass("hidden", Game.dragonLevel < 5 && !Game.dragonAura && !Game.dragonAura2);

	var $switchAura = $("#auraAvailable .aura.enabled");
	var switchId = $switchAura.attr("data-aura");
	var currentId = Game.$enabledAuraSlot ? Game.$enabledAuraSlot.attr("data-aura") : null;
	var otherId = Game.$enabledAuraSlot ? Game.$enabledAuraSlot.siblings().attr("data-aura") : null;

	$("#switchAuraBuy").html("Change aura (" + (Game.HighestBuilding ? "sacrifice 1 " + Game.HighestBuilding.name : "---") + ")")
		.toggleClass("hidden", !Game.HighestBuilding || !Game.$enabledAuraSlot || !$switchAura.length ||
			currentId == switchId || (switchId > 0 && otherId == switchId));
	$("#switchAuraFree").toggleClass("hidden", Game.$enabledAuraSlot && $switchAura.length && currentId == switchId);

	if (Game.$enabledAuraSlot) {
		var slot = Game.$enabledAuraSlot[0].dataset.slot;
		for (var i = Game.dragonAuras.length - 1; i >= 1; i--) {
			var unlocked = (slot == 1 ? Game.dragonLevel >= Game.dragonLevelMax : Game.dragonLevel >= i + 4) && i != otherId;
			Game.dragonAuras[i].$crateNode.toggleClass("unlocked", unlocked)
				.toggleClass("hidden", !unlocked && i != currentId)
				.toggleClass("choiceLocked", !unlocked && i == currentId);
		}
	}
	$("#auraSlot0").toggleClass("unlocked", Game.dragonLevel > 4)
		.toggleClass("hidden", Game.dragonLevel < 5 && !Game.dragonAura);
	$("#auraSlot1").toggleClass("unlocked", Game.dragonLevel >= Game.dragonLevelMax)
		.toggleClass("hidden", Game.dragonLevel < Game.dragonLevelMax && !Game.dragonAura2);

	$("#auraClearSlots").toggleClass("invisible", Game.dragonAura < 1 && Game.dragonAura2 < 1);
};

Game.updateBuffs = function () {
	for (var i = 0; i < Game.BuffTypes.length; i++) {
		Game.BuffTypes[i].updateFunc();
	}

	for (i in Game.Buffs) {
		var buff = Game.Buffs[i];
		Game.updatePieTimer(buff.$pieTimer, buff.time, buff.maxTime);
	}
};

Game.addModDataEle = function (id, data) {
	var $ele = $('<div class="modDataLine">' +
		'Mod id <input class="modDataId text update" type="text">' +
		' Data <input class="modDataData text update" type="text">' +
		' &nbsp; <a class="modDataRemove" data-title="Delete mod">X</a>' +
	"</div>").appendTo("#modDataBlock");
	$ele.find(".modDataId").val(id || "");
	$ele.find(".modDataData").val(data || "");
	return $ele;
};

Game.updateModData = function () {
	var modIds = {};
	var foundModData = false;
	var foundDupeModId = false;
	var foundUnescapedModData = false;
	var unescapedModRgx = /\[p\]|\[s\]/;

	$("#modDataBlock .modDataLine").each(function () {
		foundModData = true;
		var $self = $(this);
		var id = Game.cleanNonWord($self.find(".modDataId").val());
		var data = $self.find(".modDataData").val();
		if (!foundDupeModId && modIds.hasOwnProperty(id)) {
			foundDupeModId = true;
		}
		if (data && !foundUnescapedModData && unescapedModRgx.test(data)) {
			foundUnescapedModData = true;
		}
		modIds[id] = true;
	});

	$("#modDataEmpty").toggleClass("hidden", foundModData);
	$("#modDataClear").toggleClass("invisible", !foundModData);

	$("#warnModsDupe").toggleClass("hidden", !foundDupeModId);
	$("#warnModsInvalidDataChars").toggleClass("hidden", !foundUnescapedModData);
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
		if (building.minigame && building.minigame.enabled && building.minigame.effs) {
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

Game.CalculateGains = function () {
	Game.cookiesPs = 0;
	Game.cookiesPsByType = {};
	Game.cookiesMultByType = {};
	var mult = 1;

	if (Game.ascensionMode !== 1) {
		mult += Game.prestige * 0.01 * Game.heavenlyPower * Game.GetHeavenlyMultiplier();
	}

	mult *= Game.eff("cps");

	if (Game.HasUpgrade("Heralds") && Game.ascensionMode !== 1) {
		mult *= 1 + 0.01 * Game.heralds;
	}

	var hasResidualLuck = Game.HasUpgrade("Residual luck");

	var goldenSwitchMult = 1.5;
	var eggMult = 1;
	var cookieMult = 1;
	var addCpsBase = 0;
	for (var i = 0; i < Game.UpgradesById.length; i++) {
		var upgrade = Game.UpgradesById[i];
		if (upgrade.getBought()) {
			if (upgrade.pool === "cookie" || upgrade.pseudoCookie) {
				cookieMult *= 1 + (typeof(upgrade.power) === "function" ? upgrade.power(upgrade) : upgrade.power) * 0.01;
			}
			if (typeof upgrade.groups.plus === "number") {
				mult *= upgrade.groups.plus;
			}

			var addCps = upgrade.groups.addCps;
			if (typeof addCps === "number") { //"egg"
				addCpsBase += addCps;
				Game.cookiesPsByType[upgrade.name] = addCps;
			}
			if (hasResidualLuck && upgrade.groups.goldSwitchMult) {
				goldenSwitchMult += 0.1;
			}
			if (upgrade.groups.commonEgg) {
				eggMult *= 1.01;
			}
		}
	}

	Game.cookiesMultByType["cookie"] = cookieMult;
	mult *= cookieMult;

	var buildMult = 1;
	var godLvl = Game.hasGod("asceticism"); //Holobore
	if (godLvl == 1) {      mult *= 1.15; }
	else if (godLvl == 2) { mult *= 1.1; }
	else if (godLvl == 3) { mult *= 1.05; }

	godLvl = Game.hasGod("ages"); //Cyclius
	if (godLvl == 1) {      mult *= 1 + 0.15 * Math.sin((Game.lastUpdateTime / 1000 / (60 * 60 * 3)) * Math.PI * 2); }
	else if (godLvl == 2) { mult *= 1 + 0.15 * Math.sin((Game.lastUpdateTime / 1000 / (60 * 60 * 12)) * Math.PI * 2); }
	else if (godLvl == 3) { mult *= 1 + 0.15 * Math.sin((Game.lastUpdateTime / 1000 / (60 * 60 * 24)) * Math.PI * 2); }

	godLvl = Game.hasGod("decadence"); //Vomitrax
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

	if (Game.HasUpgrade("Santa's legacy")) {
		mult *= 1 + (Game.santaLevel + 1) * 0.03;
	}

	var milkMult = 1;
	if (Game.HasUpgrade("Santa's milk and cookies")) { milkMult *= 1.05; }
	milkMult *= 1 + Game.auraMult("Breath of Milk") * 0.05;

	godLvl = Game.hasGod("mother"); //Mokalsium
	if (godLvl == 1) {      milkMult *= 1.1; }
	else if (godLvl == 2) { milkMult *= 1.05; }
	else if (godLvl == 3) { milkMult *= 1.03; }

	milkMult *= Game.eff("milk");

	var catMult = 1;

	if (Game.HasUpgrade("Kitten helpers")) {     catMult *= (1 + Game.milkProgress * 0.1 * milkMult); }
	if (Game.HasUpgrade("Kitten workers")) {     catMult *= (1 + Game.milkProgress * 0.125 * milkMult); }
	if (Game.HasUpgrade("Kitten engineers")) {   catMult *= (1 + Game.milkProgress * 0.15 * milkMult); }
	if (Game.HasUpgrade("Kitten overseers")) {   catMult *= (1 + Game.milkProgress * 0.175 * milkMult); }
	if (Game.HasUpgrade("Kitten managers")) {    catMult *= (1 + Game.milkProgress * 0.2 * milkMult); }
	if (Game.HasUpgrade("Kitten accountants")) { catMult *= (1 + Game.milkProgress * 0.2 * milkMult); }
	if (Game.HasUpgrade("Kitten specialists")) { catMult *= (1 + Game.milkProgress * 0.2 * milkMult); }
	if (Game.HasUpgrade("Kitten experts")) {     catMult *= (1 + Game.milkProgress * 0.2 * milkMult); }
	if (Game.HasUpgrade("Kitten consultants")) { catMult *= (1 + Game.milkProgress * 0.2 * milkMult); }
	if (Game.HasUpgrade("Kitten assistants to the regional manager")) { (catMult *= 1 + Game.milkProgress * 0.175 * milkMult); }
	if (Game.HasUpgrade("Kitten marketeers")) {  catMult *= (1 + Game.milkProgress * 0.15 * milkMult); }
	if (Game.HasUpgrade("Kitten analysts")) {    catMult *= (1 + Game.milkProgress * 0.125 * milkMult); }
	if (Game.HasUpgrade("Kitten executives")) {  catMult *= (1 + Game.milkProgress * 0.115 * milkMult); }
	if (Game.HasUpgrade("Kitten admins")) {      catMult *= (1 + Game.milkProgress * 0.11 * milkMult); }
	if (Game.HasUpgrade("Kitten strategists")) { catMult *= (1 + Game.milkProgress * 0.105 * milkMult); }
	if (Game.HasUpgrade("Kitten angels")) {      catMult *= (1 + Game.milkProgress * 0.1 * milkMult); }
	if (Game.HasUpgrade("Fortune #103")) {       catMult *= (1 + Game.milkProgress * 0.05 * milkMult); }

	Game.cookiesMultByType["kittens"] = catMult;
	mult *= catMult;

	for (i = 0; i < Game.ObjectsById.length; i++) {
		var building = Game.ObjectsById[i];
		var cps = building.calcCps(building);
		if (Game.ascensionMode !== 1) {
			cps *= (1 + building.level * 0.01) * buildMult;
		}
		if (building.id == 1 && Game.HasUpgrade("Milkhelp&reg; lactose intolerance relief tablets")) {
			cps *= 1 + 0.05 * Game.milkProgress * milkMult;
		}
		var cpsTotal = cps * building.amount;
		building.storedCps = cps;
		building.storedTotalCps = cpsTotal;
		Game.cookiesPs += cpsTotal;
		Game.cookiesPsByType[building.name] = cpsTotal;
	}
	Game.buildingCps = Game.cookiesPs;
	Game.cookiesPs += addCpsBase;

	if (Game.HasUpgrade("Century egg")) {
		//the boost increases a little every day, with diminishing returns up to +10% on the 100th day
		var day = Math.floor(Math.max(Game.lastUpdateTime - Game.startDate, 0) / 1000 / 10) * 10 / 60 / 60 / 24;
		day = Math.min(day, 100);
		eggMult *= 1 + (1 - Math.pow(1 - day / 100, 3)) * 0.1;
	}

	Game.cookiesMultByType["eggs"] = eggMult;
	mult *= eggMult;

	if (Game.HasUpgrade("Sugar baking")) {
		mult *= (1 + Math.min(100, Game.lumps) * 0.01);
	}

	mult *= 1 + Game.auraMult("Radiant Appetite");

	// var n = Game.numGoldenCookies;
	// var auraMult = Game.auraMult("Dragon's Fortune");
	// for (i = 0; i < n; i++) { mult *= 1 + auraMult * 1.23; }

	Game.rawCookiesPs = Game.cookiesPs * mult;
	Game.rawMult = mult;
	for (i = 0; i < Game.CpsAchievements.length; i++) {
		if (Game.rawCookiesPs >= Game.CpsAchievements[i].threshold) {
			Game.Win(Game.CpsAchievements[i]);
		}
	}

	var name = Game.bakeryNameLowerCase;
	if (name === "orteil") {
		mult *= 0.99;
	} else if (name == "ortiel") { //or so help me
		mult *= 0.98;
	}

	var wrinklers = Game.elderWrath > 0 && Game.cookiesSuckedTotal > 0 ? Game.numWrinklers : 0;
	var suckRate = 1 / 20;
	suckRate *= Game.eff("wrinklerEat");
	suckRate *= 1 + Game.auraMult("Dragon Guts") * 0.2;

	Game.cpsSucked = Math.min(1, wrinklers * suckRate);

	if (Game.HasUpgrade("Elder Covenant")) { mult *= 0.95; }

	if (Game.HasUpgrade("Golden switch [off]")) { mult *= goldenSwitchMult; }
	if (Game.HasUpgrade("Shimmering veil [off]")) {
		mult *= 1 + Game.getVeilBoost();
	}
	if (Game.HasUpgrade("Magic shenanigans")) { mult *= 1000; }
	if (Game.HasUpgrade("Occult obstruction")) { mult *= 0; }

	Game.unbuffedCookiesPs = Game.cookiesPs * mult;

	var multCpSTotal = 1;
	for (var key in Game.Buffs) {
		var multCpS = Game.Buffs[key].multCpS;
		if (typeof multCpS !== "undefined") {
			multCpSTotal *= multCpS;
		}
	}

	Game.unbuffedMult = mult;
	Game.globalCpsMult = mult * multCpSTotal;
	Game.cookiesPs *= Game.globalCpsMult;
};


Game.filterUpgrades = function () {
	var searchText = Game.prepSearchText(byId("upgradeSearch").value);

	for (var i = 0; i < Game.UpgradesById.length; i++) {
		var upgrade = Game.UpgradesById[i];
		var show = true;
		if (searchText) {
			show = upgrade.searchName.indexOf(searchText) > -1 || upgrade.searchDesc.indexOf(searchText) > -1;
		}
		upgrade.$baseCrate.toggleClass("hidden", !show);
	}

	$(".upgradeList").each(function () {
		$(this.nextElementSibling).toggleClass("hidden", $(this).children(".upgrade:not(.hidden)").length > 0);
	});
};


Game.filterAchievements = function () {
	var searchText = Game.prepSearchText(byId("achSearch").value);

	for (var i = 0; i < Game.AchievementsById.length; i++) {
		var achieve = Game.AchievementsById[i];
		var show = true;
		if (searchText) {
			show = achieve.searchName.indexOf(searchText) > -1 || achieve.searchDesc.indexOf(searchText) > -1;
		}
		achieve.$baseCrate.toggleClass("hidden", !show);
	}

	$(".achList").each(function () {
		$(this.nextElementSibling).toggleClass("hidden", $(this).children(".achievement:not(.hidden)").length > 0);
	});
};

Game.toggleShowDebug = function (toggle) {
	var hasNeuro = Game.HasUpgrade("Neuromancy");
	toggle = typeof toggle === "undefined" ? !Game.showDebug : Boolean(toggle);
	Game.showDebug = toggle;
	$(document.body).toggleClass("hideDebug", hasNeuro ? false : !toggle);

	var showBlock = hasNeuro ? true : toggle;
	if (!showBlock) {
		showBlock = Game.countUpgradesByGroup(Game.UpgradesByPool.debug, 1, true) > 0;
	}
	$("#upgradeDebugBlock").toggleClass("hidden", !showBlock);

	return toggle;
};
$(document.body).toggleClass("hideDebug", !Game.showDebug);

//#endregion update()


Game.exportSave = function () {
	var lastSavedTime = byId("lastSavedCheck").checked ? Game.lastUpdateTime : Game.lastSavedTime;
	var i, upgrade;

	var numWrinklers = Game.numWrinklers;
	var numShinyWrinklers = Game.numShinyWrinklers;
	var cookiesSuckedTotal = Game.cookiesSuckedTotal;
	var cookiesSucked = Game.cookiesSucked;
	var cookiesSuckedShiny = Game.cookiesSuckedShiny;
	var wrinklerCookies = 0;
	var aura1 = Math.floor(Game.dragonAura);
	var aura2 = Math.floor(Game.dragonAura2);

	if (!numWrinklers || !cookiesSuckedTotal || !Game.elderWrath) {
		wrinklerCookies = Game.getWrinklersPopGain();
		numWrinklers = 0;
		numShinyWrinklers = 0;
		cookiesSucked = 0;
		cookiesSuckedShiny = 0;
	} //sigh

	var save = Game.version + "|" +
		"|"; //just in case we need some more stuff here

	save += ( //save stats
		(Game.startDate || "NaN") + ";" +
		(Game.fullDate || "NaN") + ";" +
		(lastSavedTime || "NaN") + ";" +
		Game.bakeryName + ";" +
		Game.seed + ";" +
		Game.YouCustomizer.save() +
		"|");

	var str = "";
	for (i = 0; i < Game.prefsSaveOrder.length; i++) {
		str += String(asBoolNum(Game.prefs[Game.prefsSaveOrder[i]]));
	}
	save += str + "|";

	save += ((Game.cookies + wrinklerCookies) + ";" +
		(Game.cookiesEarned + wrinklerCookies) + ";" +
		Game.cookieClicks + ";" +
		Game.goldenClicks + ";" +
		Game.handmadeCookies + ";" +
		Game.goldenCookiesMissed + ";" +
		Game.backgroundType + ";" +
		Game.milkType + ";" +
		Game.cookiesReset + ";" +
		Game.elderWrath + ";" +

		Game.pledges + ";" +
		(Game.HasUpgrade("Elder Pledge") ? Math.max(Game.pledgeTime, 1) : 0) + ";" +
		(Game.nextResearch ? Game.nextResearch.id : 0) + ";" +
		(Game.nextResearch ? Math.max(Game.researchTime, 1) : Game.researchTime) + ";" +
		Game.numResets + ";" +
		Game.goldenClicksLocal + ";" +
		Game.cookiesMunchedTotal + ";" +
		Game.wrinklersPopped + ";" +
		Game.santaLevel + ";" +
		Game.reindeerClicked + ";" +

		(Game.hasSeasonSwitch ? Math.max(Game.seasonTime, 1) : 0) + ";" +
		Game.seasonUses + ";" +
		(Game.season || "") + ";" +
		Math.floor(cookiesSucked) + ";" +
		Math.floor(numWrinklers) + ";" +
		Game.prestige + ";" +
		Game.heavenlyChips + ";" +
		Game.heavenlyChipsSpent + ";" +
		Game.heavenlyCookies + ";" +
		Game.ascensionMode + ";");

	var savedPerms = {};
	for (i = 0; i < 5; i++) { // 5 permanent upgrades
		var id = -1;
		var slot = Game.permanentUpgradeSlots[i];
		upgrade = Game.UpgradesById[Game.permanentUpgrades[i]];
		if (upgrade && slot && slot.bought && upgrade.groups.canPerm && !savedPerms[upgrade.id]) {
			id = upgrade.id;
			savedPerms[id] = true;
		}
		save += id + ";";
	}
	save += (Math.floor(Game.dragonLevel) + ";" +
		aura1 + ";" +
		(aura1 === aura2 ? 0 : aura2) + ";" +
		Game.chimeType + ";" +
		Math.max(Math.min(Math.floor(byId("optVolume").value, 100)), 0) + ";" +
		Math.floor(numShinyWrinklers) + ";" +
		Math.floor(cookiesSuckedShiny) + ";");

	var lumps = Game.lumps;
	var lumpsTotal = Game.lumpsTotal;
	if (!Game.canLumps()) {
		lumps = -1;
		lumpsTotal = -1;
	}

	var lumpType = Game.lumpCurrentType || 0;
	if (!Game.lumpTypes[lumpType]) {
		lumpType = 0;
	}

	save += (Math.floor(lumps) + ";" +
		Math.floor(lumpsTotal) + ";" +
		(Game.lumpTime || "NaN") + ";" +
		Game.lumpRefill + ";" +
		lumpType + ";" +
		Game.vault.join(",") + ";" +
		Game.heralds + ";" +
		asBoolNum(byId("fortuneGC").checked) + ";" +
		asBoolNum(byId("fortuneCPS").checked) + ";" +
		Game.rawCookiesPsHighest + ";" +
		Math.max(Math.min(Math.floor(byId("optVolumeMusic").value, 100)), 0) + ";" +
		byId("cookiesSent").parsedValue + ";" +
		byId("cookiesReceived").parsedValue + ";" +
		"|"); //cookies and lots of other stuff


	for (i = 0; i < Game.ObjectsById.length; i++) { //buildings
		var building = Game.ObjectsById[i];
		if (building.vanilla) {
			save += building.amount + "," + building.bought + "," + Math.floor(building.totalCookies) + "," + building.level + ",";

			if (building.minigame && building.level > 0) {
				save += building.minigame.save();
			}

			var muteStr = ",0";
			if (i > 0 && Game.prefs.extraButtons) {
				muteStr = "," + asBoolNum(building.muted);
			}

			save += muteStr + "," + building.highest + ";";
		}
	}
	save += "|";


	var toCompress = [];
	for (i = 0; i < Game.UpgradesById.length; i++) {
		upgrade = Game.UpgradesById[i];
		if (upgrade.vanilla) {
			var bought = upgrade.getBought();
			toCompress.push(asBoolNum(bought || upgrade.unlocked || upgrade.toBeUnlocked || upgrade.exportUnlocked), asBoolNum(bought));
		}
	}
	save += toCompress.join("") + "|";

	toCompress = [];
	for (i = 0; i < Game.AchievementsById.length; i++) {
		var achieve = Game.AchievementsById[i];
		if (achieve.vanilla) {
			toCompress.push(asBoolNum(achieve.won || achieve.toBeWon));
		}
	}
	save += toCompress.join("") + "|";

	for (var key in Game.Buffs) {
		var buff = Game.Buffs[key];
		if (buff && buff.buffType && buff.buffType.vanilla) {
			save += buff.buffType.id + "," + buff.maxTime + "," + buff.time;
			if (typeof buff.arg1 !== "undefined") { save += "," + parseFloat(buff.arg1); }
			if (typeof buff.arg2 !== "undefined") { save += "," + parseFloat(buff.arg2); }
			if (typeof buff.arg3 !== "undefined") { save += "," + parseFloat(buff.arg3); }
			save += ";";
		}
	}

	save += "|";

	var savedMods = {};
	$("#modDataBlock .modDataLine").each(function () {
		var $self = $(this);
		var id = Game.cleanNonWord($self.find(".modDataId").val());
		if (!savedMods.hasOwnProperty(id)) {
			save += id + ":" + Game.safeSaveString($self.find(".modDataData").val()) + ";";
		}
		savedMods[id] = true;
	});

	return encodeSave(save);
};

window.parseBoolean = function (n) {
	return Boolean(Game.parseNumber(n));
};

var clearSpaceRgx = /\s/g;

Game.importSave = function (str) {
	if (!str || typeof str !== "string") { return false; }
	str = str.replace(clearSpaceRgx, "");

	var save = decodeSave(str);
	if (!save) { return false; }

	// save = save.split("|");
	save = splitSave(save);

	var version = parseFloat(save[0]);
	if (isNaN(version) || save.length < 5 || version < 1) {
		alert("Oops, looks like the import string is all wrong!");
		return false;
	}
	if (version > Game.version) {
		alert("Warning : you are attempting to load a save from a future version (v." + version + "; you are using v." + Game.version + ").");
	}

	Game.lastUpdateTime = Date.now();
	Game.saveImportTime = Game.lastUpdateTime;

	var spl = save[2].split(";"); //save stats
	Game.setInput("#sessionStartTime", parseInt(spl[0], 10) || 0);
	Game.setInput("#saveCreationTime", parseInt(spl[1], 10) || 0);
	Game.setInput("#lastSavedTime", parseInt(spl[2], 10) || 0);
	Game.setBakeryName(spl[3] || Game.RandomBakeryName());
	Game.setSeed(spl[4]);
	Game.YouCustomizer.load(spl[5] || 0);
	Game.warnOnNewSeed = Boolean(spl[4]);

	// prefs
	if (version < 1.0503 || version > 2.0045) {
		spl = save[3].split("");
	} else {
		spl = unpack2(save[3]).split("");
	}

	var upgrade, achieve, mestr;

	for (var i = 0; i < Game.prefsSaveOrder.length; i++) {
		var pref = Game.prefsSaveOrder[i];
		Game.togglePref(pref, spl[i] ? parseBoolean(spl[i]) : Game.defaultPrefs[pref]);
	}

	// cookies and lots of other stuff
	spl = save[4].split(";");
	Game.setInput("#cookiesBank", parseFloat(spl[0]));
	Game.setInput("#cookiesEarned", parseFloat(spl[1]));
	Game.setInput("#cookieClicks", parseInt(spl[2], 10));
	Game.setInput("#goldClicksAll", parseInt(spl[3], 10));
	Game.setInput("#cookiesHandmade", parseFloat(spl[4]));
	Game.setInput("#goldMiss", parseInt(spl[5], 10));
	Game.backgroundType = Math.max(parseInt(spl[6], 10), 0);
	Game.milkType = Math.max(parseInt(spl[7], 10), 0);
	var cookiesReset = Game.setInput("#cookiesReset", parseFloat(spl[8]));
	// spl[9] is wrath, handled automagically

	Game.setInput("#numPledges", parseInt(spl[10], 10));
	Game.setInput("#pledgeTime", parseInt(spl[11], 10));
	// spl[12] is nextResearch, handled automagically
	Game.setInput("#researchTime", parseInt(spl[13], 10));
	Game.setInput("#numResets", parseInt(spl[14], 10));
	Game.setInput("#goldClicks", parseInt(spl[15], 10));
	Game.setInput("#cooksMunchedAll", parseFloat(spl[16]));
	Game.setInput("#wrinklersPopped", parseInt(spl[17], 10));
	Game.setSelectedIndex(Game.santa.levelEle, parseInt(spl[18], 10), Game.santaMax);
	Game.setInput("#reinClicks", parseInt(spl[19], 10));

	Game.setInput("#seasonTime", parseInt(spl[20], 10));
	Game.setInput("#seasonCount", parseInt(spl[21], 10));
	Game.setSeason(spl[22] || Game.defaultSeason);

	var cookiesSucked = parseFloat(spl[23]);
	var numRegularWrinklers = parseInt(spl[24], 10);
	// spl[25] is prestige, handled automagically
	var heavenlyChips = parseFloat(spl[26]);
	var heavenlyChipsSpent = parseFloat(spl[27]);
	// spl[28] is heavenly cookies which were removed
	byId("bornAgainCheck").checked = parseBoolean(spl[29]);

	var permUpgrades = [];
	for (i = 0; i < 5; i++) { //5 perm slots
		Game.setPermanentUpgrade(i, 0);
		permUpgrades.push(parseInt(spl[30 + i], 10) || -1);
	}

	var dragonLevel = parseInt(spl[35], 10);
	if (version < 2.0041 && dragonLevel === Game.dragonLevels.length - 2) { dragonLevel = Game.dragonLevels.length - 1; }
	Game.setInput("#dragonLevelIn", dragonLevel);
	Game.setAura(0, 0); //reset auras to make sure there's not a problem
	Game.setAura(1, 0);
	Game.setAura(0, parseInt(spl[36], 10));
	Game.setAura(1, parseInt(spl[37], 10));

	Game.chimeType = Math.max(parseInt(spl[38], 10), 0);
	Game.setVolume(spl[39] ? parseInt(spl[39], 10) : Game.defaultVolume);
	byId("optVolume").value = Game.volume;

	var numShinyWrinklers = parseInt(spl[40], 10);
	var cookiesSuckedShiny = parseFloat(spl[41]);
	var lumps = spl[42] ? parseInt(spl[42], 10) || -1 : -1;
	var lumpsTotal = Math.max(lumps, spl[43] ? parseInt(spl[43], 10) || -1 : -1);

	var lumpsUnlockedEle = byId("sugarLumpsUnlocked");
	lumpsUnlockedEle.checked = lumpsTotal > -1;
	lumpsUnlockedEle.manualChecked = lumpsTotal > -1;

	Game.setInput("#sugarLumps", lumps);
	Game.setInput("#sugarLumpsTotal", lumpsTotal);
	Game.setInput("#sugarLumpsTime", parseInt(spl[44], 10));
	Game.setInput("#sugarLumpsRefillTime", parseInt(spl[45], 10));
	var lumpType = spl[46] ? parseInt(spl[46], 10) || 0 : -1;
	if (Game.lumpTypes[lumpType]) {
		byId("sugarLumpsType").selectedIndex = lumpType;
	} else {
		Game.computeLumpType();
	}

	Game.clearVault();

	var saveVault = spl[47] ? spl[47].split(",") : [];
	for (i = 0; i < saveVault.length; i++) {
		upgrade = Game.UpgradesById[saveVault[i]];
		if (upgrade && upgrade.$vaultCrate) {
			upgrade.$vaultCrate.addClass("enabled");
			Game.vault.push(upgrade.id);
		}
	}

	Game.setInput("#heraldsIn", parseFloat(spl[48], 10) || 0);

	byId("fortuneGC").checked =  parseInt(spl[49], 10) || false;
	byId("fortuneCPS").checked = parseInt(spl[50], 10) || false;

	Game.rawCookiesPsHighest = parseFloat(spl[51]) || 0;
	Game.setInput("#rawCookiesPsIn", Game.rawCookiesPsHighest);
	Game.setVolumeMusic(spl[52] ? parseInt(spl[52], 10) : Game.defaultVolumeMusic);
	byId("optVolumeMusic").value = Game.volumeMusic;
	Game.setInput("#cookiesSent", parseInt(spl[53], 10) || 0);
	Game.setInput("#cookiesReceived", parseInt(spl[54], 10) || 0);

	spl = save[5].split(";"); //buildings
	for (i = 0; i < Game.ObjectsById.length; i++) {
		var building = Game.ObjectsById[i];
		var amount = 0;
		var bought = 0;
		var highest = 0;
		var level = 0;
		var totalCookies = 0;
		var minigameStr = "";

		if (spl[i]) {
			mestr = spl[i].toString().split(",");
			amount = parseInt(mestr[0], 10);
			bought = parseInt(mestr[1], 10);
			totalCookies = parseFloat(mestr[2]);
			level = parseInt(mestr[3], 10);
			minigameStr = mestr[4];

			building.muted = parseBoolean(mestr[5]);
			highest = parseInt(mestr[6], 10);
		}

		Game.setInput(building.amountIn, amount);
		Game.setInput(building.boughtIn, bought);
		Game.setInput(building.highestIn, highest || amount || 0);
		Game.setInput(building.levelIn, level);
		Game.setInput(building.totalCookiesIn, totalCookies);

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
			upgrade.bought = false;
			if (spl[i]) {
				mestr = spl[i].split(",");
				upgrade.unlocked = parseBoolean(mestr[0]);
				upgrade.bought = parseBoolean(mestr[1]);
			}
		}

		spl = save[7] ? save[7].split(";") : []; //achievements
		for (i = 0; i < Game.AchievementsById.length; i++) {
			achieve = Game.AchievementsById[i];
			achieve.won = false;
			if (achieve.autoAward) {
				achieve.won = true;
			} else if (spl[i]) {
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
			upgrade.bought = false;
			if (spl[i * 2]) {
				upgrade.unlocked = parseBoolean(spl[i * 2]);
				upgrade.bought = parseBoolean(spl[i * 2 + 1]);
			}
		}

		spl = save[7] || []; //achievements
		spl = version < 1.05 ? UncompressLargeBin(spl) : unpack(spl);
		for (i = 0; i < Game.AchievementsById.length; i++) {
			achieve = Game.AchievementsById[i];
			achieve.won = false;
			if (achieve.autoAward) {
				achieve.won = true;
			} else if (spl[i]) {
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
			upgrade.bought = false;
			if (spl[i * 2]) {
				upgrade.unlocked = parseBoolean(spl[i * 2]);
				upgrade.bought = parseBoolean(spl[i * 2 + 1]);
			}
		}

		spl = save[7] || []; //achievements
		if (version < 2.0046) { spl = unpack2(spl); }
		spl = spl.split("");
		for (i = 0; i < Game.AchievementsById.length; i++) {
			achieve = Game.AchievementsById[i];
			achieve.won = false;
			if (achieve.autoAward) {
				achieve.won = true;
			} else if (spl[i]) {
				achieve.won = parseBoolean(spl[i]);
			}
		}
	}
	Game.prestige = Math.floor(Game.HowMuchPrestige(cookiesReset));

	if (version < 1.0503) { //upgrades that used to be regular, but are now heavenly
		upgrade = Game.Upgrades["Persistent memory"];
		upgrade.unlocked = false;
		upgrade.bought = false;
		upgrade = Game.Upgrades["Season switcher"];
		upgrade.unlocked = false;
		upgrade.bought = false;
	}
	if (version === 1.9) { //are we importing from the 1.9 beta? remove all heavenly upgrades and refund heavenly chips
		for (i = 0; i < Game.UpgradesByPool.prestige.length; i++) {
			upgrade = Game.UpgradesByPool.prestige[i];
			if (upgrade.bought) {
				upgrade.unlocked = false;
				upgrade.bought = false;
			}
		}
		heavenlyChips = Game.prestige;
		heavenlyChipsSpent = 0;
	}
	if (version <= 1.0466) { //are we loading from the old live version? reset HCs
		heavenlyChips = Game.prestige;
		heavenlyChipsSpent = 0;
	}

	Game.setInput("#chipsIn", heavenlyChips);
	Game.setInput("#chipsSpentIn", heavenlyChipsSpent);

	for (i = 0; i < Game.AchievementsById.length; i++) {
		achieve = Game.AchievementsById[i];
		if (achieve.toggleFunc) {
			achieve.toggleFunc();
		}
	}

	for (i = 0; i < permUpgrades.length; i++) {
		Game.setPermanentUpgrade(i, permUpgrades[i], true);
	}

	Game.killBuffs();
	spl = (save[8] || "").split(";");
	for (i = 0; i < spl.length; i++) {
		if (spl[i]) {
			mestr = spl[i].split(",");
			var buffType = Game.BuffTypes[mestr[0]];
			if (buffType) {
				var buff = Game.gainBuff(buffType.name, parseFloat(mestr[1]) / Game.fps, parseFloat(mestr[3] || 0), parseFloat(mestr[4] || 0), parseFloat(mestr[5] || 0));
				buff.time = Math.max(parseFloat(mestr[2]), 1) || 1;
			}
		}
	}

	$("#modDataBlock").empty();
	spl = (save[9] || "").split(";"); //mod data
	for (i in spl) {
		if (spl[i]) {
			var modData = spl[i].split(":");
			var modId = modData[0];
			modData.shift();
			modData = Game.safeLoadString(modData.join(":"));
			Game.addModDataEle(modId, modData);
		}
	}

	//run buy functions and stuff
	for (i = 0; i < Game.UpgradesById.length; i++) {
		upgrade = Game.UpgradesById[i];
		upgrade.setBought(upgrade.bought);
	}

	Game.setInput("#cooksMunchedSaved", cookiesSucked);
	Game.setInput("#numWrinklers", numRegularWrinklers);
	Game.setInput("#numShinyWrinklers", numShinyWrinklers);
	Game.setInput("#cooksMunchedShinySaved", cookiesSuckedShiny);

	Game.setPriceMultArrays();
	var minCumu = Game.getMinCumulative();
	Game.minCumulativeOffset = Math.max(minCumu - Game.cookiesEarned, 0);

	Game.clearBuffSelection();
	Game.setBuffObjectInputs();
	Game.clearToggleSelection();
	Game.clearSelectedPermUpgrade();
	Game.update();
	return true;
};

}).call(this, this, this.jQuery);
