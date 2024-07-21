(function (window, $) {
"use strict";

var Game = window.Game;
var byId = window.byId;
var document = window.document;

var EN = window.EN;
var loc = window.loc;
var FindLocStringByPart = window.FindLocStringByPart;
var locStrings = window.locStrings;

Game.init = function () {
"use strict";

if (!Game.firstRun) { return; }

//#region start stuff

document.forms[0].reset();

$(window).on("keydown keyup", function (ev) {
	Game.focusing = false;
	var testkey = Game.checkEventAltMode(ev);
	if (typeof testkey !== "undefined" && testkey !== Game.altMode) {
		Game.altMode = Boolean(testkey);
		Game.updateRecommended();
		Game.clearTooltip();
	}
	$(document.forms[0]).toggleClass("altMode", Boolean(Game.altMode));

}).on("focus", function () { Game.focusing = true; })
.on("click", function (ev) {
	if (Game.focusing) {
		Game.focusing = false;
		var testkey = Game.checkEventAltMode(ev);
		if (typeof testkey !== "undefined" && testkey !== Game.altMode) {
			Game.altMode = Boolean(testkey);
			Game.updateRecommended();
			Game.clearTooltip();
		}
		$(document.forms[0]).toggleClass("altMode", Boolean(Game.altMode));
	}
});

//old key format
localStorage.removeItem("CCalcAbbreviateNums");
localStorage.removeItem("CCalcClicks");
localStorage.removeItem("CCalcHideInfo");
localStorage.removeItem("CCalcShowBank");
//read from saves now
localStorage.removeItem("CCalc.Heralds");

var localAbbr = Boolean(localStorage.getItem("CCalc.AbbreviateNums"));
byId("abbrCheck").checked = localAbbr;
Game.abbrOn = localAbbr;
if (localStorage.getItem("CCalc.Clicks")) {
	Game.setInput("#clicksPsIn", localStorage.getItem("CCalc.Clicks"));
}

var localSteam = Boolean(localStorage.getItem("CCalc.Steam"));
byId("steamCheck").checked = localSteam;
Game.steam = localSteam;

var ele = byId(localStorage.getItem("CCalc.ShowBank") || "");
if (ele) {
	ele.checked = true;
}
localStorage.setItem("CCalc.ShowBank", document.querySelector('[name="bank"]:checked').id);

ele = byId(localStorage.getItem("CCalc.BuildQuantity") || "");
if (ele) {
	ele.checked = true;
}
localStorage.setItem("CCalc.BuildQuantity", document.querySelector('[name="quantity"]:checked').id);

Game.showRecTime = Boolean(localStorage.getItem("CCalc.RecTime"));
byId("recTimeCheck").checked = Game.showRecTime;

//automatic season detection (might not be 100% accurate)
Game.defaultSeason = "";
var year = new Date().getFullYear();
var leap = Number(((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0));
var day = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
if (day >= 41 && day <= 46) {
	Game.defaultSeason = "valentines";
} else if (day >= 90 + leap && day <= 92 + leap) {
	Game.defaultSeason = "fools";
} else if (day >= 304 - 7 + leap && day <= 304 + leap) {
	Game.defaultSeason = "halloween";
} else if (day >= 349 + leap && day <= 365 + leap) {
	Game.defaultSeason = "christmas";
} else {
	//easter is a pain goddamn
	var easterDay = (function (Y) {
		var C = Math.floor(Y / 100),
			N = Y - 19 * Math.floor(Y / 19),
			K = Math.floor((C - 17) / 25),
			I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
		I = I - 30 * Math.floor((I / 30));
		I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) *
			Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
		var J = Y + Math.floor(Y / 4) + I + 2 - C + Math.floor(C / 4);
		J = J - 7 * Math.floor(J / 7);
		var L = I - J,
			M = 3 + Math.floor((L + 40) / 44),
			D = L + 28 - 31 * Math.floor(M / 4);
		return new Date(Y, M - 1, D);
	})(year);
	easterDay = Math.floor((easterDay - new Date(easterDay.getFullYear(), 0, 0)) /
		(1000 * 60 * 60 * 24));
	if (day >= easterDay - 7 && day <= easterDay) { Game.defaultSeason = "easter"; }
}
Game.season = Game.defaultSeason;

var foolsNameCheck = byId("foolsNameCheck");
foolsNameCheck.checked = Game.defaultSeason === "fools";

var $tooltipContainer = $("#tooltip");
var tooltipEle = byId("tooltipBlock");
var $tooltipEle = $(tooltipEle);
Game.updateTooltip = null;
Game.tooltipOn = false;

Game.setTooltip = function (obj, update) {
	Game.clearTooltip(update);
	if (!obj || !obj.refEle) {
		return;
	}

	if (obj.html) {
		tooltipEle.innerHTML = obj.html;
	}

	$tooltipContainer.removeClass("hidden");

	var ele = obj.refEle;
	var pos = ele.getBoundingClientRect();
	var eleWidth = pos.width;
	var top, left;

	//position it centered above obj.refEle
	var windowWidth = document.body.offsetWidth;
	var tooltipWidth = tooltipEle.offsetWidth;
	var tooltipHeight = tooltipEle.offsetHeight;

	top = pos.top - tooltipHeight - 10 - (obj.isCrate ? 9 : 0);
	//put tooltip below ele if it would go off top of screen, or if specified to
	if (top < 0 || obj.position === "below") {
		top = pos.top + pos.height + 10;
	}

	left = pos.left + eleWidth / 2 - tooltipWidth / 2;
	if (left + tooltipWidth + 15 > windowWidth) { //stop tooltip from going off right edge of screen
		left = windowWidth - 15 - tooltipWidth;
	}

	//position tooltip, stopping it from going off left edge of screen (higher priority than off right)
	$tooltipContainer.css({top: top, left: Math.max(left, 5)});
	Game.tooltipOn = true;
};

Game.clearTooltip = function (update) {
	$tooltipContainer.addClass("hidden").removeAttr("style");
	Game.tooltipOn = false;
	if (!update) {
		Game.updateTooltip = null;
		Game.tooltipUpgrade = null;
		Game.tooltipAnchor = null;
	}
};

function makeTag(str, color) {
	return ('<span class="tag"' + (color ? ' style="background-color:' + color + ';"' : "") + ">" + str + "</span> ");
}


var BeautifyInTextFilter = /(([\d]+[,]*)+)/g;
var clearCommasRgx = /,/g;
function BeautifyInTextFunction(str) {
	return Game.Beautify(parseInt(str.replace(clearCommasRgx, ""), 10));
}
function AbbrInTextFunction(str) {
	return Game.abbreviateNumber(parseInt(str.replace(clearCommasRgx, ""), 10), 0, true);
}
function BeautifyInText(str) { //reformat every number inside a string
	return str.replace(BeautifyInTextFilter, BeautifyInTextFunction);
}
function AbbrInText(str) { //reformat every number inside a string
	return str.replace(BeautifyInTextFilter, AbbrInTextFunction);
}


//adds input with -/+ buttons that subtract/add when clicked
function addPlusMinusInput(par, id, maxlen, limit) {
	var $eles = $('<a class="minus plusminus">-</a> <input id="' +
		id + '" type="text"' + (maxlen ? ' maxlength="' + maxlen + '"' : "") +
		'> <a class="plus plusminus">+</a>').appendTo(par);
	if (limit) {
		$eles.filter(".plusminus").addClass("limited");
	}
	var ele = $eles[2];
	var pm = $eles[0];
	pm.plusminusIn = ele;
	pm.plusminusMode = -1;
	pm = $eles[4];
	pm.plusminusIn = ele;
	pm.plusminusMode = 1;
	return ele;
}

//sets two inputs to update each other when changed
function twinInputs(ele1, ele2) {
	ele1 = $(ele1)[0];
	ele2 = $(ele2)[0];
	ele1.twin = ele2;
	ele2.twin = ele1;
}

function addBlacklist(obj, name) {
	var $ele = $('<li class="blacklistEle"><label><input type="checkbox"> <span class="name">' +
		name + "</span></label></li>").appendTo("#blacklistEles");

	//sigh
	$ele.find("label").attr("data-title", name + "&#10;Check this to blacklist it.");

	obj.$blacklistEle = $ele;
	obj.blacklistCheckbox = $ele.find("input")[0];
	$ele[0].blacklistCheckbox = obj.blacklistCheckbox;
}
// Game.blankFunc = function () { return false; };

Game.getIconCss = function (icon) {
	var css = {
		backgroundPosition: (-icon[0] * 48) + "px " + (-icon[1] * 48) + "px",
		backgroundImage: ""
	};
	if (icon[2]) {
		css.backgroundImage = "url(" + icon[2] + ")";
	}
	return css;
};

Game.getIconCssStr = function (iconCss) {
	if (Array.isArray(iconCss)) {
		iconCss = Game.getIconCss(iconCss);
	}
	var str = "background-position:" + iconCss.backgroundPosition + ";";
	if (iconCss.backgroundImage) {
		str = "background-image:" + iconCss.backgroundImage + ";" + str;
	}
	return str;
};

Game.getTinyIconStr = function (iconCss) {
	return ('<div class="icon tinyIcon" style="' + Game.getIconCssStr(iconCss) + '"></div>');
};

//#endregion start stuff

var i, j, desc, upgrade, priceFunc, requireFunc;

//to be used with upgrade groups
var groupImplications = {
	"build": [],
	"egg": ["commonEgg", "rareEgg"],
	"bonus": ["plus"]
};


//#region Objects/Buildings

var objRefOption = $('#upgradeFilterSel option[value="synergy"]');
var ObjCalcFn = function (building) {
	var mult = 1;
	mult *= Game.GetTieredCpsMult(building);
	return (building.baseCps * mult);
};

Game.Object = function (name, commonName, desc, foolsName, iconColumn, calcCps) { //, props) {
	var id = Game.ObjectsById.length;

	this.type = "building";
	this.id = id;
	this.name = name;
	this.dname = name;
	commonName = commonName.split("|");
	this.single = commonName[0];
	this.plural = commonName[1];
	this.bsingle = this.single;
	this.bplural = this.plural;
	this.pluralCapital = this.plural.charAt(0).toUpperCase() + this.plural.slice(1);
	this.actionName = commonName[2];
	this.groupName = commonName[3];
	desc = desc.split("|");
	this.desc = desc[0];
	this.displayDesc = desc[0];
	this.extraName = commonName[1];
	this.extraPlural = commonName[2];
	foolsName = foolsName.split("|");
	this.foolsName = foolsName[0];
	this.foolsDesc = foolsName[1];

	this.dname = loc(this.name);
	this.single = loc(this.single);
	this.plural = loc(this.plural);
	this.desc = loc(FindLocStringByPart(this.name + " quote"));
	this.foolsName = loc(FindLocStringByPart(this.name + " business name")) || this.foolsName;
	this.foolsDesc = loc(FindLocStringByPart(this.name + " business quote")) || this.foolsDesc;

	this.iconColumn = iconColumn;
	this.icon = [iconColumn, 0];
	this.iconCssStr = Game.getIconCssStr(this.icon);

	this.displayName = foolsNameCheck.checked ? this.foolsName : this.dname;

	this.amount = 0;
	this.tempAmount = 0; //used for CPS prediction calculations
	this.free = 0; //how much given for free by prestige upgrades
	this.level = 0;
	this.fortune = 0;

	this.storedTotalCps = 0;

	this.synergies = [];
	this.priceCache = {};
	this.tieredUpgrades = {};
	this.tieredAchievs = {};

	this.calcCps = typeof calcCps === "function" ? calcCps : ObjCalcFn;

	if (id > 0) {
		//new automated price and CpS curves
		this.baseCps = Math.ceil((Math.pow(id * 1, id * 0.5 + 2)) * 10) / 10;
		//clamp 14,467,199 to 14,000,000 (there's probably a more elegant way to do that)
		var digits = Math.pow(10, (Math.ceil(Math.log(Math.ceil(this.baseCps)) / Math.LN10))) / 100;
		this.baseCps = Math.round(this.baseCps / digits) * digits;

		this.basePrice = (id * 1 + 9 + (id < 5 ? 0 : Math.pow(id - 5, 1.75) * 5)) * Math.pow(10, id) * (Math.max(1, id - 14));
		digits = Math.pow(10, (Math.ceil(Math.log(Math.ceil(this.basePrice)) / Math.LN10))) / 100;

		this.basePrice = Math.round(this.basePrice / digits) * digits;
		if (id >= 16) { this.basePrice *= 10; }
		if (id >= 17) { this.basePrice *= 10; }
		if (id >= 18) { this.basePrice *= 10; }
		if (id >= 19) { this.basePrice *= 20; }
	}

	var tr = '<tr class="buildingRow" data-object="' + name + '"><td class="name">' + this.displayName + "</td><td></td>";
	this.$cpsRow = $(tr + '<td></td><td class="buildPrice">0</td><td class="cps">0</td><td class="time">---</td>' +
		'<td class="nextCps">0</td><td class="cpsPlus">0</td><td class="amort">---</td></tr>')
		.addClass("buildCpsRow").insertBefore("#buildCpsTotUp");
	this.$cpsNameSpan = this.$cpsRow.find(".name");
	this.$cpsNameSpan[0].objTie = this;
	this.amountIn = addPlusMinusInput(this.$cpsRow.children(":eq(1)"), "buildCpsAmountIn" + id);
	this.amountIn.tabIndex = 3;
	this.levelIn = addPlusMinusInput(this.$cpsRow.children(":eq(2)"), "buildLevelIn" + id, null, true);
	this.levelIn.tabIndex = 4;

	this.$priceRow = $(tr + '<td><a class="setDesired">&#8667;</a></td><td></td><td class="buy1">0</td><td class="buy10">0</td>' +
		'<td class="buy100">0</td><td class="buyDesired">0</td><td class="cumu">0</td><td class="sell">0</td>')
		.addClass("buildPriceRow").insertBefore("#buildPriceTotal");
	this.$priceNameSpan = this.$priceRow.find(".name");
	this.$priceNameSpan[0].objTie = this;
	this.amountInCurrent = addPlusMinusInput(this.$priceRow.children(":eq(1)"), "buildPriceAmountCurrentIn" + id);
	this.amountInDesired = addPlusMinusInput(this.$priceRow.children(":eq(3)"), "buildPriceAmountDesiredIn" + id);

	this.$priceRow.find(".setDesired")[0].objTie = this;
	twinInputs(this.amountIn, this.amountInCurrent);

	$('<option value="' + this.groupName + '">- ' + this.pluralCapital + "</option>").insertBefore(objRefOption);

	addBlacklist(this, this.name);

	groupImplications.build.push(this.groupName);

	Game.Objects[name] = this;
	Game.ObjectsById.push(this);
	Game.ObjectsByGroup[this.groupName] = this;
	Game.last = this;
};

Game.Object.prototype.toString = function () {
	return this.name;
};

Game.Object.prototype.getType = function () {
	return this.type;
};

Game.Object.prototype.setDisplay = function () {
	if (foolsNameCheck.checked) {
		this.displayName = this.foolsName;
		this.displayDesc = this.foolsDesc;
	} else {
		this.displayName = this.dname;
		this.displayDesc = this.desc;
	}
	this.$cpsNameSpan.text(this.displayName);
	this.$priceNameSpan.text(this.displayName);
	this.$tooltipBlock = null;
};

Game.Object.prototype.sacrifice = function (amount) {
	if (!isNaN(amount)) {
		Game.setInput(this.amountIn, this.amount - amount);
	}
};

Game.Object.prototype.getAmount = function () {
	return Game.predictiveMode ? this.tempAmount : this.amount;
};

Game.Object.prototype.setAmount = function (amount) {
	if (isNaN(amount)) {
		return this.amount;
	}
	return Game.setInput(this.amountIn, amount);
};

Game.Object.prototype.getRecommendedName = function (amount) {
	var next = this.getAmount() + 1;
	return (this.displayName + " #" + next + (amount > next ? "-" + amount : ""));
};

Game.Object.prototype.buy = function (amount) {
	if (isNaN(amount)) {
		amount = 1;
	}
	return this.setAmount(this.amount + amount);
};

Game.Object.prototype.resetTemp = function () {
	this.tempAmount = this.amount;
};

Game.Object.prototype.getPrice = function (amount) {
	if (isNaN(amount)) {
		amount = this.getAmount();
	}
	amount = Math.max(0, amount - (Game.ascensionMode === 1 ? 0 : this.free));

	if (!this.priceCache[amount]) {
		var price = this.basePrice * Math.pow(Game.ObjectPriceIncrease, amount);
		price = Game.modifyObjectPrice(this, price);
		this.priceCache[amount] = Math.ceil(price);
	}
	return this.priceCache[amount];
};

//sum how many cookies to reach end by buying
Game.Object.prototype.getPriceSum = function (start, end) {
	var cumu = 0;
	for (var i = start; i < end; i++) {
		cumu += this.getPrice(i);
	}
	return cumu;
};

Game.Object.prototype.getSellSum = function (start, end) {
	var cumu = 0;
	var mult = Game.sellMultiplier;
	for (var i = start; i > end; i--) {
		cumu += Math.floor(this.getPrice(i) * mult);
	}
	return cumu;
};

Game.Object.prototype.getTooltip = function (ele, update) {
	if (!this.$tooltipBlock) {
		this.setTooltipBlock();
	}

	$tooltipEle.empty().append(this.$tooltipBlock);

	Game.setTooltip({refEle: ele, isCrate: true}, update);
};

Game.Object.prototype.setTooltipBlock = function () {
	var me = this;
	var name = me.displayName;
	var desc = me.displayDesc;

	var i, upgrade, other, mult, boost;

	var synergiesStr = "";
	//note : might not be entirely accurate, math may need checking
	if (me.amount > 0) {
		var synergiesWith = {};
		var synergyBoost = 0;

		if (me.name === "Grandma") {
			for (i = 0; i < Game.UpgradesByGroup.grandmaSynergy.length; i++) {
				upgrade = Game.UpgradesByGroup.grandmaSynergy[i];
				if (upgrade.bought) {
					other = upgrade.grandmaBuilding;
					mult = me.amount * 0.01 * (1 / (other.id - 1));
					boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + mult);
					synergyBoost += boost;
					if (!synergiesWith[other.plural]) { synergiesWith[other.plural] = 0; }
					synergiesWith[other.plural] += mult;
				}
			}
		} else if (me.name === "Portal" && Game.HasUpgrade("Elder Pact")) {
			other = Game.Objects["Grandma"];
			boost = (me.amount * 0.05 * other.amount) * Game.globalCpsMult;
			synergyBoost += boost;
			if (!synergiesWith[other.plural]) { synergiesWith[other.plural] = 0; }
			synergiesWith[other.plural] += boost / (other.storedTotalCps * Game.globalCpsMult);
		}

		for (i = 0; i < me.synergies.length; i++) {
			upgrade = me.synergies[i];
			if (upgrade.bought) {
				var weight = 0.05;
				other = upgrade.buildingTie1;
				if (me == upgrade.buildingTie1) {
					weight = 0.001;
					other = upgrade.buildingTie2;
				}
				boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + me.amount * weight);
				synergyBoost += boost;
				if (!synergiesWith[other.plural]) { synergiesWith[other.plural] = 0; }
				synergiesWith[other.plural] += me.amount * weight;
			}
		}
		if (synergyBoost > 0) {
			for (i in synergiesWith) {
				if (synergiesStr != "") { synergiesStr += ", "; }
				synergiesStr += '<span class="synergizeWith">' + i + " +" + Game.Beautify(synergiesWith[i] * 100, 1) + "%</span>";
			}
			synergiesStr = "...also boosting some other buildings : " + synergiesStr + " - all combined, these boosts account for <b>" + Game.BeautifyAbbr(synergyBoost, 1) + "</b> cookies per second (<b>" + Game.Beautify((synergyBoost / Game.cookiesPs) * 100, 1) + "%</b> of total CpS)";
		}
	}

	this.$tooltipBlock = $(
		'<div class="buildingTooltipHighlight"></div>' +
		'<div class="buildingTooltip">' +
			'<div class="icon buildingIcon" style="' + me.iconCssStr + '"></div>' +
			'<div class="buildingPrice"><span class="price priceIcon">' + Game.BeautifyAbbr(Math.round(me.bulkPrice)) + "</span>" + Game.costDetails(me.bulkPrice) + "</div>" +
			'<div class="name">' + name + "</div>" +
			'<small><div class="tag">' + loc("owned: %1", me.amount) + "</div>" + (me.free > 0 ? '<div class="tag">' + loc("free: %1!", me.free) + "</div>" : "") + "</small>" +
			'<div class="line"></div><div class="description"><q>' + desc + "</q></div>" +
			(me.totalCookies > 0 ? (
				'<div class="line"></div>' +
				(me.amount > 0 ? '<div class="descriptionBlock">' + loc("each %1 produces <b>%2</b> per second", [me.single, loc("%1 cookie", Game.LBeautify((me.storedTotalCps / me.amount) * Game.globalCpsMult, 1))]) + "</div>" : "") +
				'<div class="descriptionBlock">' + loc("%1 producing <b>%2</b> per second", [loc("%1 " + me.bsingle, Game.LBeautify(me.amount)), loc("%1 cookie", Game.LBeautify(me.storedTotalCps * Game.globalCpsMult, 1))]) +
					" (" + loc("<b>%1%</b> of total CpS", Game.Beautify(Game.cookiesPs > 0 ? ((me.amount > 0 ? ((me.storedTotalCps * Game.globalCpsMult) / Game.cookiesPs) : 0) * 100) : 0, 1)) + ")</div>" +
				(synergiesStr ? ('<div class="descriptionBlock">' + synergiesStr + "</div>") : "") +
				(EN ? '<div class="descriptionBlock"><b>' + Game.Beautify(me.totalCookies) + "</b> " + (Math.floor(me.totalCookies) == 1 ? "cookie" : "cookies") + " " +
				me.actionName + " so far</div>" : '<div class="descriptionBlock">' + loc("<b>%1</b> produced so far", loc("%1 cookie", Game.LBeautify(me.totalCookies))) + "</div>")
			) : "") +
		"</div>"
	);
};

/* Game.Object.prototype.levelTooltip = function () {
	var me = this;
	var level = Game.Beautify(me.level);
	return ('<div style="width:280px;padding:8px;"><b>Level ' + level + " " + me.plural + '</b><div class="line"></div>' +
		(me.level == 1 ? me.extraName : me.extraPlural).replace("[X]", level) + " granting <b>+" + level + "% " + me.name +
		' CpS</b>.<div class="line"></div>Click to level up for <span class="price lump' + (Game.lumps >= me.level + 1 ? "" : " disabled") + '">' +
		Game.Beautify(me.level + 1) + Game.getPlural(me.level + 1, " sugar lump") + "</span>." +
		((me.level === 0 && me.minigameUrl) ? '<div class="line"></div><b>Levelling up this building unlocks a minigame.</b>' : "") + "</div>");
}; */

//define Objects/Buildings
new Game.Object("Cursor", "cursor|cursors|clicked|cursor",
	"Autoclicks once every 10 seconds.|[X] extra finger|[X] extra fingers",
	"Rolling pin|Essential in flattening dough. The first step in cookie-making.",
	0, function (me) {
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

		var mult = 1;
		mult *= Game.GetTieredCpsMult(me);
		// mult *= Game.magicCps("Cursor"); //effectively disabled ingame after Orteil found how overpowered it was
		mult *= Game.eff("cursorCps");

		add *= Game.Get("ObjectsOwned") - me.getAmount();
		return (Game.ComputeCps(0.1, Game.HasUpgrade("Reinforced index finger") +
			Game.HasUpgrade("Carpal tunnel prevention cream") + Game.HasUpgrade("Ambidextrous"), add) * mult);
});
Game.last.basePrice = 15;
Game.last.baseCps = 0.1;

new Game.Object("Grandma", "grandma|grandmas|baked|grandma",
	"A nice grandma to bake more cookies.|Grandmas are [X] year older|Grandmas are [X] years older",
	"Oven|A crucial element of baking cookies.",
	1, function (me) {
		var mult = 1;
		for (var i = 0; i < Game.UpgradesByGroup.grandmaSynergy.length; i++) {
			if (Game.UpgradesByGroup.grandmaSynergy[i].getBought()) {
				mult *= 2;
			}
		}
		if (Game.HasUpgrade("Bingo center/Research facility")) { mult *= 4; }
		if (Game.HasUpgrade("Ritual rolling pins")) { mult *= 2; }
		if (Game.HasUpgrade("Naughty list")) {        mult *= 2; }

		if (Game.HasUpgrade("Elderwort biscuits")) {  mult *= 1.02; }
		mult *= Game.eff("grandmaCps");

		if (Game.HasUpgrade("Cat ladies")) {
			for (i = 0; i < Game.UpgradesByPool.kitten.length; i++) {
				if (Game.UpgradesByPool.kitten[i].getBought()) { mult *= 1.29; }
			}
		}

		mult *= Game.GetTieredCpsMult(me);

		var add = 0;
		var amount = me.getAmount();
		if (Game.HasUpgrade("One mind")) { add += amount * 0.02; }
		if (Game.HasUpgrade("Communal brainsweep")) { add += amount * 0.02; }
		if (Game.HasUpgrade("Elder Pact")) { add += Game.Objects["Portal"].getAmount() * 0.05; }

		mult *= 1 + Game.auraMult("Elder Battalion") * 0.01 * (Game.Get("ObjectsOwned") - amount);

		return (me.baseCps + add) * mult;
});

new Game.Object("Farm", "farm|farms|harvested|farm",
	"Grows cookie plants from cookie seeds.|[X] more acre|[X] more acres",
	"Kitchen|The more kitchens, the more cookies your employees can produce.",
	2);
new Game.Object("Mine", "mine|mines|mined|mine",
	"Mines out cookie dough and chocolate chips.|[X] mile deeper|[X] miles deeper",
	"Secret recipe|These give you the edge you need to outsell those pesky competitors.",
	3);
new Game.Object("Factory", "factory|factories|mass-produced|factory",
	"Produces large quantities of cookies.|[X] additional patent|[X] additional patents",
	"Factory|Mass production is the future of baking. Seize the day, and synergize!",
	4);
new Game.Object("Bank", "bank|banks|banked|bank",
	"Generates cookies from interest.|Interest rates [X]% better|Interest rates [X]% better",
	"Investor|Business folks with a nose for profit, ready to finance your venture as long as there's money to be made.",
	15);
new Game.Object("Temple", "temple|temples|discovered|temple",
	"Full of precious, ancient chocolate.|[X] sacred artifact retrieved|[X] sacred artifacts retrieved",
	"Like|Your social media page is going viral! Amassing likes is the key to a lasting online presence and juicy advertising deals.",
	16);
new Game.Object("Wizard tower", "wizard tower|wizard towers|summoned|wizardTower",
	"Summons cookies with magic spells.|Incantations have [X] more syllable|Incantations have [X] more syllables",
	"Meme|Cookie memes are all the rage! With just the right amount of social media astroturfing, your brand image will be all over the cyberspace.",
	17);
new Game.Object("Shipment", "shipment|shipments|shipped|shipment",
	"Brings in fresh cookies from the cookie planet.|[X] galaxy fully explored|[X] galaxies fully explored",
	"Supermarket|A gigantic cookie emporium - your very own retail chain.",
	5);
new Game.Object("Alchemy lab", "alchemy lab|alchemy labs|transmuted|alchemyLab",
	"Turns gold into cookies!|[X] primordial element mastered|[X] primordial elements mastered",
	"Stock share|You're officially on the stock market, and everyone wants a piece!",
	6);
new Game.Object("Portal", "portal|portals|retrieved|portal",
	"Opens a door to the Cookieverse.|[X] dimension enslaved|[X] dimensions enslaved",
	"TV show|Your cookies have their own sitcom! Hilarious baking hijinks set to the cheesiest laughtrack.",
	7);
new Game.Object("Time machine", "time machine|time machines|recovered|timeMachine",
	"Brings cookies from the past, before they were even eaten.|[X] century secured|[X] centuries secured",
	"Theme park|Cookie theme parks, full of mascots and roller-coasters. Build one, build a hundred!",
	8, "Grandmas' grandmas");
new Game.Object("Antimatter condenser", "antimatter condenser|antimatter condensers|condensed|antimatterCondenser",
	"Condenses the antimatter in the universe into cookies.|[X] extra quark flavor|[X] extra quark flavors",
	"Cookiecoin|A virtual currency, already replacing regular money in some small countries.",
	13);
new Game.Object("Prism", "prism|prisms|converted|prism",
	"Converts light itself into cookies.|[X] new color discovered|[X] new colors discovered",
	"Corporate country|You've made it to the top, and you can now buy entire nations to further your corporate greed. Godspeed.",
	14);
new Game.Object("Chancemaker", "chancemaker|chancemakers|spontaneously generated|chancemaker",
	"Generates cookies out of thin air through sheer luck.|Chancemakers are powered by [X]-leaf clovers|Chancemakers are powered by [X]-leaf clovers",
	"Privatized planet|Actually, you know what's cool? A whole planet dedicated to producing, advertising, selling, and consuming your cookies.",
	19);
new Game.Object("Fractal engine", "fractal engine|fractal engines|made from cookies|fractalEngine",
	"Turns cookies into even more cookies.|[X] iteration deep|[X] iterations deep",
	"Senate seat|Only through political dominion can you truly alter this world to create a brighter, more cookie-friendly future.",
	20);
new Game.Object("Javascript console", "javascript console|javascript consoles|programmed|jsConsole",
	"Creates cookies from the very code this game was written in.|Equipped with [X] external library|Equipped with [X] external libraries",
	"Doctrine|Taking many forms -religion, culture, philosophy- a doctrine may, when handled properly, cause a lasting impact on civilizations, reshaping minds and people and ensuring all future generations share a singular goal - the production, and acquisition, of more cookies.",
	32);
new Game.Object("Idleverse", "idleverse|idleverses|hijacked|idleverse",
	"There's been countless other idle universes running alongside our own. You've finally found a way to hijack their production and convert whatever they've been making into cookies!|[X] manifold|[X] manifolds",
	"Lateral expansions|Sometimes the best way to keep going up is sideways. Diversify your ventures through non-cookie investments.",
	33);
new Game.Object("Cortex baker", "cortex baker|cortex bakers|imagined|cortexBaker",
	"These artificial brains the size of planets are capable of simply dreaming up cookies into existence. Time and space are inconsequential. Reality is arbitrary.|[X] extra IQ point|[X] extra IQ points",
	"Think tank|There's only so many ways you can bring in more profit. Or is there? Hire the most brilliant experts in the known universe and let them scrape their brains for you!",
	34);
new Game.Object("You", "You|You|cloned|you",
	"You, alone, are the reason behind all these cookies. You figure if there were more of you... maybe you could make even more.|[X] optimized gene|[X] optimized genes",
	"You|Your business is as great as it's gonna get. The only real way to improve it anymore is to improve yourself - and become the best Chief Executive Officer this world has ever seen.",
	35);

//#endregion Objects/Buildings


//santa
Game.santa = {
	$dropEle: $("#santaLevel"),
	dropEle: byId("santaLevel"),
	buy: function () {
		var ele = Game.santa.dropEle;
		if (ele.selectedIndex && Game.santaLevel < Game.santaMax) {
			ele.selectedIndex = Game.santaLevel + 2;
		}
	}
};

Game.santa.dropEle.innerHTML += Game.santaLevels.reduce(function (html, level) {
	return (html + "<option>" + level + "</option>");
}, "");

addBlacklist(Game.santa, "Santa levels");
$("#santaClick").on("click", function () {
	Game.santa.buy();
	Game.scheduleUpdate();
	return false;
});

function decodeHTMLEntities(str) {
	// strip script/html tags
	str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "");
	str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, "");
	var div = document.createElement("div");
	div.innerHTML = str;
	return Game.prepSearchText(div.textContent);
}

//#region Upgrades

Game.CountsAsUpgradeOwned = function (pool) {
	return pool === "" || pool === "cookie" || pool === "tech";
};

var groupSplitRgx = /\s*\|+\s*/;
var groupPropSplitRgx = /\s*:+\s*/;
function processGroups(group) {
	var groups = {};

	if (typeof group === "string" && group.length) {
		group = group.trim().split(groupSplitRgx);

		for (var i = 0; i < group.length; i++) {
			if (!group[i]) { continue; }
			var g = group[i].split(groupPropSplitRgx);
			if (1 in g && !isNaN(g[1])) {
				g[1] = Number(g[1]);
			}
			groups[g[0]] = g[1] || true;
		}

		for (i in groupImplications) {
			if (groups[i]) { continue; }
			var implyNames = groupImplications[i];
			for (var j = 0; j < implyNames.length; j++) {
				if (groups[implyNames[j]]) {
					groups[i] = true;
					break;
				}
			}
		}
	}

	return groups;
}

var clickRecFunc = function () { return Game.clicksPs > 0; };

var order;

var poolTags = {
	prestige: {text: loc("[Tag]Heavenly", 0, "Heavenly"), color: "#efa438"},
	tech: {text: loc("[Tag]Tech", 0, "Tech"), color: "#36a4ff"},
	cookie: {text: loc("[Tag]Cookie", 0, "Cookie")},
	debug: {text: loc("[Tag]Debug", 0, "Debug"), color: "#00c462"},
	toggle: {text: loc("[Tag]Switch", 0, "Switch")},
	"": {text: loc("[Tag]Upgrade", 0, "Upgrade")}
};

Game.Upgrade = function (name, desc, price, icon, properties) {
	this.type = "upgrade";
	this.id = Game.UpgradesById.length;
	this.name = name;
	this.dname = name;
	this.searchName = decodeHTMLEntities(name);
	this.basePrice = price;
	this.price = 0;
	this.priceLumps = 0;
	this.pool = "";
	this.tier = 0;
	this.order = this.id;
	if (order) {
		this.order = order + this.id * 0.001;
	}

	var found = FindLocStringByPart(this.type + " name " + this.id);
	if (found) { this.dname = loc(found); }

	this.setDescription(desc);

	if (properties instanceof Object) {
		$.extend(this, properties);
	}

	if (this.col >= 0 && Game.Tiers[this.tier]) {
		icon = [this.col, Game.Tiers[this.tier].iconRow];
	}

	this.icon = icon;
	this.iconCss = Game.getIconCss(this.icon);
	this.tinyIconStr = Game.getTinyIconStr(this.iconCss);
	this.iconName = this.tinyIconStr + " " + this.dname;

	this.groups = processGroups(this.groups);

	if (this.priceLumps > 0) {
		this.groups.priceLumps = true;

	} else if (this.pool !== "prestige") {
		this.groups.normal = true;
	}
	var tag = poolTags[this.pool] || poolTags[""];
	this.poolTag = makeTag(tag.text, tag.color);

	this.unlocked = false;
	this.tempUnlocked = false;
	this.bought = false;
	this.tempBought = false;

	this.$baseCrate = $('<div class="upgrade crate"></div>')
		.css(this.iconCss).attr({"data-upgrade": this.name, "data-id": this.id});
	this.$baseCrate[0].objTie = this;

	this.$crateNodes = this.$baseCrate;
	this.$extraCrates = $();

	addBlacklist(this, this.name);

	this.$tooltipCrate = this.createCrate();

	Game.Upgrades[name] = this;
	Game.UpgradesById.push(this);
	Game.last = this;
};

Game.Upgrade.prototype.toString = function () {
	return this.name;
};

Game.Upgrade.prototype.getType = function () {
	return this.type;
};

Game.Upgrade.prototype.setDescription = function (desc) {
	if (!EN) {
		desc = desc.replace(/<q>.+/, ""); //strip quote section
	}
	var found = FindLocStringByPart(this.type + " desc " + this.id);
	if (found) { desc = loc(found); }
	found = FindLocStringByPart(this.type + " quote " + this.id);
	if (found) { desc += "<q>" + loc(found) + "</q>"; }

	this.baseDesc = desc;
	this.beautifyDesc = BeautifyInText(desc);
	this.ddesc = this.beautifyDesc;
	this.beautifyDescSearch = decodeHTMLEntities(this.beautifyDesc);
	this.abbrDesc = AbbrInText(desc);
	this.abbrDescSearch = decodeHTMLEntities(this.beautifyDesc);
	this.setCurrentDescription();
};

Game.Upgrade.prototype.setCurrentDescription = function () {
	if (Game.abbrOn) {
		this.desc = this.abbrDesc;
		this.searchDesc = this.abbrDescSearch;
	} else {
		this.desc = this.beautifyDesc;
		this.searchDesc = this.beautifyDescSearch;
	}
};

//creates a clickable div.crate, like seen in the game's store and stats menu
//adds it to stored jQuery objects to easily synch .unlocked/.enabled state
Game.Upgrade.prototype.createCrate = function (parentNode) {
	var $crate = this.$baseCrate.clone().addClass("extraCrate").removeClass("hidden");
	$crate[0].objTie = this;
	this.$crateNodes = this.$crateNodes.add($crate);
	this.$extraCrates = this.$extraCrates.add($crate);
	if (parentNode) {
		$crate.appendTo(parentNode);
	}
	return $crate;
};

Game.Upgrade.prototype.calcCps = function () {
	if (!this.cpsObj && !this.noBuy) {
		this.cps = 0;
		this.rate = 0;
		this.amort = 0;

		if (!this.groups.misc) {
			var mode = Game.predictiveMode;
			this.cpsObj = Game.setChanges([{gameObj: this}], []);
			Game.predictiveMode = mode;

			this.cps = this.cpsObj.cookiesPsPlusClicksDiff;
			this.rate = this.cpsObj.rate;
			this.amort = this.cpsObj.amort;
			this.amortStr = Game.formatTime(this.amort);
		}

		if (this.afterCalcCps) {
			this.afterCalcCps();
		}
	}
	return this.cpsObj;
};

Game.Upgrade.prototype.getPrice = function (arg) {
	var price = this.basePrice;
	if (this.priceFunc) {
		price = this.priceFunc(arg);
	}
	if (price == 0) {
		return 0;
	}
	if (this.pool !== "prestige") {
		var arr = Game.UpgradePriceMultArray;
		if (arr[0]) { price *= 0.95; } //Toy workshop
		if (arr[1]) { price *= Math.pow(0.99, Game.Objects["Cursor"].getAmount() / 100); } //Five-finger discount
		if (arr[2]) { price *= 0.98; } //Santa's dominion
		if (arr[3]) { price *= 0.99; } //Faberge egg
		if (arr[4]) { price *= 0.99; } //Divine sales
		if (arr[5]) { price *= 0.99; } //Fortune #100
		if (this.groups.kitten && arr[6]) { price *= 0.9; } //Kitten wages
		if (arr[7]) { price *= 0.98; } //Haggler's luck buff
		if (arr[8]) { price *= 1.02; } //Haggler's misery
		price *= arr[9]; //Master of the Armory (aura)
		price *= arr[10]; //upgradeCost minigame effect
		if (this.pool === "cookie" && arr[11]) { price /= 5; } //Divine bakeries
	}
	return Math.ceil(price);
};

Game.Upgrade.prototype.setPrice = function () {
	this.price = this.getPrice();
	var price = this.priceLumps > 0 ? this.priceLumps : this.price;
	this.priceStr = "";
	this.priceStrWithDetails = "";

	if (price > 0) {
		var priceDeets = Game.costDetails(price);
		this.priceDetails = priceDeets;
		this.priceDetailsForce = priceDeets || Game.costDetails(price, true);
		var c = "";
		if (this.priceLumps > 0) {
			c += " lump";

		} else if (this.pool === "prestige") {
			c += " heavenly";

		}
		var str = '<span class="price priceIcon' + c + '">';
		this.priceStr = str + Game.formatNumber(price) + "</span>";
		this.priceStrWithDetails = str + Game.BeautifyAbbr(price) + (this.pool !== "prestige" && this.priceLumps === 0 ? priceDeets : "") + "</span>";
	}
};

Game.Upgrade.prototype.resetTemp = function () {
	this.tempUnlocked = this.unlocked;
	this.tempBought = this.bought;
};

Game.Upgrade.prototype.getUnlocked = function (asNum) {
	var unlocked = Game.predictiveMode ? this.tempUnlocked : this.unlocked;
	unlocked = unlocked || this.getBought();
	return asNum ? Number(unlocked) : Boolean(unlocked);
};

Game.Upgrade.prototype.setUnlocked = function (toggle) {
	var key = Game.predictiveMode ? "tempUnlocked" : "unlocked";
	toggle = typeof toggle === "undefined" ? !this[key] : Boolean(toggle);
	this[key] = toggle;
	if (!Game.predictiveMode) {
		this.tempUnlocked = toggle;
		this.$crateNodes.toggleClass("unlocked", toggle);
	}
	return toggle;
};

Game.Upgrade.prototype.getBought = function (asNum) {
	var bought = Game.predictiveMode ? this.tempBought : this.bought;
	// if (Game.ascensionMode === 1 && (this.pool === "prestige" || this.tier === "fortune")) {
	// 	bought = false;
	// }
	return asNum ? Number(bought) : Boolean(bought);
};

Game.Upgrade.prototype.setBought = function (toggle) {
	var key = Game.predictiveMode ? "tempBought" : "bought";
	toggle = typeof toggle === "undefined" ? !this[key] : Boolean(toggle);
	if (this.noBuy) { toggle = false; }
	this[key] = toggle;
	if (!Game.predictiveMode) {
		this.tempBought = toggle;
		this.$crateNodes.toggleClass("enabled", toggle);
		if (this.buyFunc) { this.buyFunc(); }
	}
	return toggle;
};

// console only
Game.Upgrade.prototype.buy = function () {
	return this.setBought(true);
};

Game.Upgrade.prototype.getTooltip = function (crate, update) {
	if (!this.$tooltipBlock || this.descFunc) {
		this.setTooltipBlock();
	}

	$tooltipEle.empty().append(this.$tooltipBlock);
	this.$tooltipCrate.removeClass("hidden");

	Game.setTooltip({refEle: crate, isCrate: true}, update);
	Game.tooltipUpgrade = this;
};

Game.Upgrade.prototype.setTooltipBlock = function () {
	var tags = this.poolTag;

	if (Game.HasUpgrade("Label printer")) {
		if (this.tier != 0) {
			tags += makeTag(loc("Tier:") + " " + loc("[Tier]" + Game.Tiers[this.tier].name, 0, Game.Tiers[this.tier].name), Game.Tiers[this.tier].color);
		}
		if (this.name === "Label printer") {
			tags += makeTag(loc("Tier:") + " " + loc("[Tier]Self-referential"), "#ff00ea");
		}
	}

	if (this.bought) {
		if (this.pool === "tech") {
			tags += makeTag(loc("Researched"));
		} else if (EN && this.groups.kitten) {
			tags += makeTag("Purrchased");
		} else {
			tags += makeTag(loc("Purchased"));
		}
	}

	if (this.lasting && this.getUnlocked()) {
		tags += makeTag(loc("Unlocked forever"), "#f2ff87");
	}

	// if (Game.HasUpgrade("Neuromancy")) {
	// 	if (bought) {
	// 		tags += makeTag(loc("Click to unlearn!"), "#00c462");
	// 	} else {
	// 		tags += makeTag(loc("Click to learn!"), "#00c462");
	// 	}
	// }

	var desc = this.desc;
	if (this.descFunc) {
		desc = this.descFunc();
	}
	if (this.unlockAt) {
		if (this.unlockAt.require) {
			if (typeof this.unlockAt.require !== "function") {
				var required = Game.Upgrades[this.unlockAt.require];
				desc = '<div style="font-size:80%;" class="alignCenter">' + (EN ? "From" : loc("Source:")) + " " + required.iconName + '</div><div class="line"></div>' + desc;
			}
		} else if (this.unlockAt.text) {
			desc = '<div style="font-size:80%;" class="alignCenter">' + (EN ? "From" : loc("Source:")) + " <b>" + this.unlockAt.text + '</b></div><div class="line"></div>' + desc;
		}
	}

	if (typeof this.statsStr !== "string") {
		var str = "";
		var cpsObj = this.calcCps();
		if (cpsObj) {
			if (this.pool !== "prestige" && !this.bought && this.price > 0 && Game.cookiesPsPlusClicks > 0) {
				str += "<div>Time to afford: <b>" + Game.formatTime(this.price / Game.cookiesPsPlusClicks) + "</b></div>";
			}

			if (Math.abs(this.cps) > 0) {
				str += "<div>Cookies per " + (this.cpsPrefix || "Second") + ": <b" +
					(this.cps > 0 ? ">" : ' class="negative">') + Game.BeautifyAbbr(this.cps, 1, true) + "</b></div>";
			}

			if (this.pool !== "prestige" && this.amortStr && this.amortStr !== "---") {
				str += "<div>Amortization: <b>" + this.amortStr + "</b></div>";
			}

			if (str) {
				str = '<div class="stats"><div class="line"></div>' + str + "</div>";
			}
		}
		this.statsStr = str;
	}

	this.$tooltipBlock = $('<div class="crateTooltip upgradeTooltip">' + this.priceStrWithDetails +
		'<div class="name">' + this.dname + '</div><div class="tags">' + tags + "</div>" +
		'<div class="line"></div><div class="description">' + desc + "</div>" + (this.statsStr || "") + "</div>")
		.prepend(this.$tooltipCrate);
};


//return a function that returns true if you have enough cookies baked this game
//and if applicable if you have the required upgrade and/or if it's the right season
var getCookiesBakedRequireFunc = function (obj, price) {
	price = price || obj.price;
	return function (add) {
		return (Game.getCookiesBaked(add) >= price && (!obj.require || Game.HasUpgrade(obj.require)) &&
			(!obj.season || Game.season === obj.season)); // && (!obj.requireAch || Game.HasAchieve(obj.requireAch))
	};
};

Game.CookieUpgrade = function (obj, properties) {
	var desc = "";
	if (obj.forceDesc) {
		desc = obj.forceDesc;
	} else {
		desc = getStrCookieProductionMultiplierPlus(Game.Beautify((typeof(obj.power) === "function" ? obj.power(obj) : obj.power), 1)) + "<q>" + obj.desc + "</q>";
	}

	properties = $.extend({power: obj.power, pool: "cookie", groups: (obj.groups || "") + "|plus"}, properties);

	var upgrade = new Game.Upgrade(obj.name,
		desc,
		obj.price, obj.icon, properties);
	if (!obj.locked) {
		upgrade.require = getCookiesBakedRequireFunc(obj, obj.price / 20);
	}
	if (typeof obj.require === "function") {
		upgrade.require = obj.require;
	} else if (obj.require) {
		upgrade.requiredUpgrade = obj.require;
	}

	if (!obj.locked) {
		var toPush = {cookies: obj.price / 20, name: obj.name};
		if (obj.require) { toPush.require = obj.require; }
		if (obj.season) { toPush.season = obj.season; }
		upgrade.unlockAt = toPush;
	}

	return upgrade;
};

//tiered upgrades system
//each building has several upgrade tiers
//all upgrades in the same tier have the same color, unlock threshold and price multiplier
Game.Tiers = {
	1:  {name: "Plain",         unlock: 1,   achievUnlock: 1,   iconRow: 0,  color: "#ccb3ac", price: 10},
	2:  {name: "Berrylium",     unlock: 5,   achievUnlock: 50,  iconRow: 1,  color: "#ff89e7", price: 50},
	3:  {name: "Blueberrylium", unlock: 25,  achievUnlock: 100, iconRow: 2,  color: "#00deff", price: 500},
	4:  {name: "Chalcedhoney",  unlock: 50,  achievUnlock: 150, iconRow: 13, color: "#ffcc2f", price: 50000},
	5:  {name: "Buttergold",    unlock: 100, achievUnlock: 200, iconRow: 14, color: "#e9d673", price: 5000000},
	6:  {name: "Sugarmuck",     unlock: 150, achievUnlock: 250, iconRow: 15, color: "#a8bf91", price: 500000000},
	7:  {name: "Jetmint",       unlock: 200, achievUnlock: 300, iconRow: 16, color: "#60ff50", price: 500000000000},
	8:  {name: "Cherrysilver",  unlock: 250, achievUnlock: 350, iconRow: 17, color: "#f01700", price: 500000000000000},
	9:  {name: "Hazelrald",     unlock: 300, achievUnlock: 400, iconRow: 18, color: "#9ab834", price: 500000000000000000},
	10: {name: "Mooncandy",     unlock: 350, achievUnlock: 450, iconRow: 19, color: "#7e7ab9", price: 500000000000000000000},
	11: {name: "Astrofudge",    unlock: 400, achievUnlock: 500, iconRow: 28, color: "#9a3316", price: 5000000000000000000000000},
	12: {name: "Alabascream",   unlock: 450, achievUnlock: 550, iconRow: 30, color: "#c1a88c", price: 50000000000000000000000000000},
	13: {name: "Iridyum",       unlock: 500, achievUnlock: 600, iconRow: 31, color: "#adb1b3", price: 500000000000000000000000000000000},
	14: {name: "Glucosmium",    unlock: 550, achievUnlock: 650, iconRow: 34, color: "#ff89e7", price: 5000000000000000000000000000000000000},
	15: {name: "Glimmeringue",  unlock: 600, achievUnlock: 700, iconRow: 36, color: "#fffaa8", price: 50000000000000000000000000000000000000000},
	"synergy1": {name: "Synergy I",  unlock: 15, iconRow: 20, color: "#008595", special: true, require: "Synergies Vol. I", price: 200000},
	"synergy2": {name: "Synergy II", unlock: 75, iconRow: 29, color: "#008595", special: true, require: "Synergies Vol. II", price: 200000000000},
	"fortune":  {name: "Fortune",    unlock: -1, iconRow: 32, color: "#9ab834", special: true, price: 77777777777777777777777777777}
};
for (i in Game.Tiers) { Game.Tiers[i].upgrades = []; }

Game.GetIcon = function (type, tier) {
	var col = type === "Kitten" ? 18 : Game.Objects[type].iconColumn;
	return [col, Game.Tiers[tier].iconRow];
};

Game.SetTier = function (building, tier) {
	if (!Game.Objects[building]) {
		alert("No building named " + building);
	}
	Game.last.tier = tier;
	Game.last.buildingTie = Game.Objects[building];
	if (Game.last.type === "achievement") {
		Game.Objects[building].tieredAchievs[tier] = Game.last;
	} else {
		Game.Objects[building].tieredUpgrades[tier] = Game.last;
	}
};

Game.TieredUpgrade = function (name, desc, buildingName, tier, properties) {
	if (!properties) { properties = {}; }
	var building = Game.Objects[buildingName];
	if (tier == "fortune" && building) {
		desc = loc("%1 are <b>%2%</b> more efficient and <b>%3%</b> cheaper.", [Game.cap(building.plural), 7, 7]) + desc;
	} else {
		desc = loc("%1 are <b>twice</b> as efficient.", Game.cap(building.plural)) + desc;
	}
	var tierObj = Game.Tiers[tier];
	properties.groups = properties.groups ? properties.groups + "|" : "";
	properties.groups += building.groupName + ":" + tierObj.unlock;
	if (tier === "fortune") {
		properties.groups += "|fortune";
	} else {
		properties.descFunc = function () {
			return ((Game.HasUpgrade(this.buildingTie1.unshackleUpgrade) && Game.HasUpgrade(Game.Tiers[this.tier].unshackleUpgrade)) ?
				('<div class="unshackled">' + loc("Unshackled! <b>+%1%</b> extra production.", Math.round((this.buildingTie.id == 1 ? 0.5 : (20 - this.buildingTie.id) * 0.1) * 100)) + '</div><div class="line"></div>')
				: "") + this.ddesc;
		};
	}
	var upgrade = new Game.Upgrade(name, desc,
		building.basePrice * tierObj.price, Game.GetIcon(buildingName, tier), properties);
	Game.SetTier(buildingName, tier);
	if (!upgrade.buildingTie1 && building) { upgrade.buildingTie1 = building; }
	if (tier === "fortune" && building) { building.fortune = upgrade; }
	return upgrade;
};

var synPriceFunc = function () {
	return (this.basePrice * (Game.HasUpgrade("Chimera") ? 0.98 : 1));
};

var synRequireFunc = function (check) {
	var tier = Game.Tiers[this.tier];
	var amount1 = this.buildingTie1.getAmount();
	amount1 = Math.min(amount1, check) || amount1;
	var amount2 = this.buildingTie2.getAmount();
	amount2 = Math.min(amount2, check) || amount2;
	return Game.HasUpgrade(tier.require) && amount1 >= tier.unlock && amount2 >= tier.unlock;
};

//creates a new upgrade that :
//- unlocks when you have tier.unlock of building1 and building2
//- is priced at (building1.price * 10 + building2.price) * tier.price (formerly : Math.sqrt(building1.price * building2.price) * tier.price)
//- gives +(0.1 * building1)% cps to building2 and +(5 * building2)% cps to building1
//- if building2 is below building1 in worth, swap them
Game.SynergyUpgrade = function (name, desc, building1, building2, tier) {
	var b1 = Game.Objects[building1];
	var b2 = Game.Objects[building2];
	if (b1.basePrice > b2.basePrice) { //swap
		b1 = Game.Objects[building2];
		b2 = Game.Objects[building1];
	}
	var tierObj = Game.Tiers[tier];

	desc = b1.pluralCapital + " gain <b>+5% CpS</b> per " + b2.name.toLowerCase() + ".<br>" +
		b2.pluralCapital + " gain <b>+0.1% CpS</b> per " + b1.name.toLowerCase() + "." +
		desc;
	var upgrade = new Game.Upgrade(name, desc,
		(b1.basePrice * 10 + b2.basePrice) * tierObj.price, Game.GetIcon(building1, tier), {
			tier: tier,
			buildingTie1: b1,
			buildingTie2: b2,
			groups: "synergy|" + b1.groupName + "|" + b2.groupName,
			priceFunc: synPriceFunc,
			require: synRequireFunc
		});
	Game.Objects[building1].synergies.push(upgrade);
	Game.Objects[building2].synergies.push(upgrade);
	return upgrade;
};

var grandmaSynergyRequireFunc = function (amount) {
	if (isNaN(amount)) { amount = this.grandmaBuilding.getAmount(); }
	return Game.Objects["Grandma"].getAmount() > 0 && amount >= Game.SpecialGrandmaUnlock;
};

Game.GrandmaSynergy = function (name, desc, building, properties) {
	building = Game.Objects[building];
	var grandmaNumber = (building.id - 1);
	if (grandmaNumber === 1) {
		grandmaNumber = "grandma";
	} else {
		grandmaNumber += " grandmas";
	}
	desc = (loc("%1 are <b>twice</b> as efficient.", Game.cap(Game.Objects["Grandma"].plural)) + " " +
		loc("%1 gain <b>+%2%</b> CpS per %3.", [Game.cap(building.plural), 1, grandmaNumber]) + "<q>" + desc + "</q>");

	properties = properties || {};
	properties.groups = (properties.groups ? properties.groups + "|" : "") + "grandmaSynergy|grandma|" + building.groupName;
	properties.require = grandmaSynergyRequireFunc;

	var upgrade = new Game.Upgrade(name, desc,
		building.basePrice * Game.Tiers[2].price, [10, 9], properties);
	building.grandmaSynergy = upgrade;
	upgrade.grandmaBuilding = building;
	return upgrade;
};

var getNumAllObjectsRequireFunc = function (amount) {
	return function () {
		for (var i = 0; i < Game.ObjectsById.length; i++) {
			if (Game.ObjectsById[i].getAmount() < amount) { return false; }
		}
		return true;
	};
};

var strCookieProductionMultiplierPlus = loc("Cookie production multiplier <b>+%1%</b>.", "[x]");
var getStrCookieProductionMultiplierPlus = function (x) { return strCookieProductionMultiplierPlus.replace("[x]", x); };
var getStrThousandFingersGain = function (x) { return loc("Multiplies the gain from %1 by <b>%2</b>.", [Game.getUpgradeName("Thousand fingers"), x]); };
var strKittenDesc = loc("You gain <b>more CpS</b> the more milk you have.");
var getStrClickingGains = function (x) { return loc("Clicking gains <b>+%1% of your CpS</b>.", x); };

Game.UnshackleBuilding = function (obj) {
	var building = Game.Objects[obj.building];
	var upgrade = new Game.Upgrade("Unshackled " + building.bplural,
		(obj.building === "Cursor" ?
			getStrThousandFingersGain(25) :
			loc("Tiered upgrades for <b>%1</b> provide an extra <b>+%2%</b> production.<br>Only works with unshackled upgrade tiers.", [Game.cap(building.plural), Math.round((building.id == 1 ? 0.5 : (20 - building.id) * 0.1) * 100)])) + (EN ? "<q>" + obj.q + "</q>" : ""),
			Math.pow(building.id + 1, 7) * 15000000, [building.iconColumn, 35], {pool: "prestige", groups: "unshackled|" + building.groupName + "|" + (obj.groups || "")});
	building.unshackleUpgrade = upgrade.name;
	return upgrade;
};

Game.UnshackleUpgradeTier = function (obj) {
	var tier = Game.Tiers[obj.tier];
	var upgrade = new Game.Upgrade(obj.tier == 1 ? "Unshackled flavor" : "Unshackled " + tier.name.toLowerCase(),
		loc("Unshackles all <b>%1-tier upgrades</b>, making them more powerful.<br>Only applies to unshackled buildings.", Game.cap(loc("[Tier]" + tier.name, 0, tier.name))) + (EN ? "<q>" + obj.q + "</q>" : ""),
		Math.pow(obj.tier, 7.5) * 10000000, [10, tier.iconRow], {pool: "prestige", groups: "unshackled"});
	tier.unshackleUpgrade = upgrade.name;
	return upgrade;
};

//define Upgrades

order = 100;
//this is used to set the order in which the items are listed
new Game.Upgrade("Reinforced index finger",
	loc("The mouse and cursors are <b>twice</b> as efficient.") + "<q>prod prod</q>",
	100, [0, 0], {tier: 1, col: 0, groups: "cursor:1|click"});
new Game.Upgrade("Carpal tunnel prevention cream",
	loc("The mouse and cursors are <b>twice</b> as efficient.") + "<q>it... it hurts to click...</q>",
	500, [0, 1], {tier: 2, col: 0, groups: "cursor:1|click"});
new Game.Upgrade("Ambidextrous",
	loc("The mouse and cursors are <b>twice</b> as efficient.") + "<q>Look ma, both hands!</q>",
	10000, [0, 2], {tier: 3, col: 0, groups: "cursor:10|click"});
new Game.Upgrade("Thousand fingers",
	loc("The mouse and cursors gain <b>+%1</b> cookies for each non-cursor building owned.", 0.1) + "<q>clickity</q>",
	100000, [0, 13], {tier: 4, col: 0, groups: "cursor:25|click"});
new Game.Upgrade("Million fingers",
	getStrThousandFingersGain(5) + "<q>clickityclickity</q>",
	10000000, [0, 14], {tier: 5, col: 0, groups: "cursor:50|click"});
new Game.Upgrade("Billion fingers",
	getStrThousandFingersGain(10) + "<q>clickityclickityclickity</q>",
	100000000, [0, 15], {tier: 6, col: 0, groups: "cursor:100|click"});
new Game.Upgrade("Trillion fingers",
	getStrThousandFingersGain(20) + "<q>clickityclickityclickityclickity</q>",
	1000000000, [0, 16], {tier: 7, col: 0, groups: "cursor:150|click"});

order = 200;
Game.TieredUpgrade("Forwards from grandma",
	"<q>RE:RE:thought you'd get a kick out of this ;))</q>",
	"Grandma", 1);
Game.TieredUpgrade("Steel-plated rolling pins",
	"<q>Just what you kneaded.</q>",
	"Grandma", 2);
Game.TieredUpgrade("Lubricated dentures",
	"<q>squish</q>",
	"Grandma", 3);

order = 300;
Game.TieredUpgrade("Cheap hoes",
	"<q>Rake in the dough!</q>",
	"Farm", 1);
Game.TieredUpgrade("Fertilizer",
	"<q>It's chocolate, I swear.</q>",
	"Farm", 2);
Game.TieredUpgrade("Cookie trees",
	"<q>A relative of the breadfruit.</q>",
	"Farm", 3);

order = 500;
Game.TieredUpgrade("Sturdier conveyor belts",
	"<q>You're going places.</q>",
	"Factory", 1);
Game.TieredUpgrade("Child labor",
	"<q>Cheaper, healthier workforce.</q>",
	"Factory", 2);
Game.TieredUpgrade("Sweatshop",
	"<q>Slackers will be terminated.</q>",
	"Factory", 3);

order = 400;
Game.TieredUpgrade("Sugar gas",
	"<q>A pink, volatile gas, found in the depths of some chocolate caves.</q>",
	"Mine", 1);
Game.TieredUpgrade("Megadrill",
	"<q>You're in deep.</q>",
	"Mine", 2);
Game.TieredUpgrade("Ultradrill",
	"<q>Finally caved in?</q>",
	"Mine", 3);

order = 600;
Game.TieredUpgrade("Vanilla nebulae",
	"<q>If you removed your space helmet, you could probably smell it!<br>(Note : don't do that.)</q>",
	"Shipment", 1);
Game.TieredUpgrade("Wormholes",
	"<q>By using these as shortcuts, your ships can travel much faster.</q>",
	"Shipment", 2);
Game.TieredUpgrade("Frequent flyer",
	"<q>Come back soon!</q>",
	"Shipment", 3);

order = 700;
Game.TieredUpgrade("Antimony",
	"<q>Actually worth a lot of mony.</q>",
	"Alchemy lab", 1);
Game.TieredUpgrade("Essence of dough",
	"<q>Extracted through the 5 ancient steps of alchemical baking.</q>",
	"Alchemy lab", 2);
Game.TieredUpgrade("True chocolate",
	"<q>The purest form of cacao.</q>",
	"Alchemy lab", 3);

order = 800;
Game.TieredUpgrade("Ancient tablet",
	"<q>A strange slab of peanut brittle, holding an ancient cookie recipe. Neat!</q>",
	"Portal", 1);
Game.TieredUpgrade("Insane oatling workers",
	"<q>ARISE, MY MINIONS!</q>",
	"Portal", 2);
Game.TieredUpgrade("Soul bond",
	"<q>So I just sign up and get more cookies? Sure, whatever!</q>",
	"Portal", 3);

order = 900;
Game.TieredUpgrade("Flux capacitors",
	"<q>Bake to the future.</q>",
	"Time machine", 1);
Game.TieredUpgrade("Time paradox resolver",
	"<q>No more fooling around with your own grandmother!</q>",
	"Time machine", 2);
Game.TieredUpgrade("Quantum conundrum",
	"<q>There is only one constant, and that is universal uncertainty.<br>Or is it?</q>",
	"Time machine", 3);

order = 20000;
new Game.Upgrade("Kitten helpers",
	strKittenDesc + "<q>meow may I help you</q>",
	9000000, Game.GetIcon("Kitten", 1), {tier: 1, groups: "bonus|kitten:0.5"});
new Game.Upgrade("Kitten workers",
	strKittenDesc + "<q>meow meow meow meow</q>",
	9000000000, Game.GetIcon("Kitten", 2), {tier: 2, groups: "bonus|kitten:1"});

order = 10000;
Game.CookieUpgrade({name: "Plain cookies",
	desc: "We all gotta start somewhere.",
	icon: [2, 3], power: 1, price: 999999});
Game.CookieUpgrade({name: "Sugar cookies",
	desc: "Tasty, if a little unimaginative.",
	icon: [7, 3], power: 1, price: 999999 * 5});
Game.CookieUpgrade({name: "Oatmeal raisin cookies",
	desc: "No raisin to hate these.",
	icon: [0, 3], power: 1, price: 9999999});
Game.CookieUpgrade({name: "Peanut butter cookies",
	desc: "Get yourself some jam cookies!",
	icon: [1, 3], power: 2, price: 9999999 * 5});
Game.CookieUpgrade({name: "Coconut cookies",
	desc: "Flaky, but not unreliable. Some people go crazy for these.",
	icon: [3, 3], power: 2, price: 99999999});
order = 10001;
Game.CookieUpgrade({name: "White chocolate cookies",
	desc: "I know what you'll say. It's just cocoa butter! It's not real chocolate!<br>Oh please.",
	icon: [4, 3], power: 2, price: 99999999 * 5});
order = 10000;
Game.CookieUpgrade({name: "Macadamia nut cookies",
	desc: "They're macadamn delicious!",
	icon: [5, 3], power: 2, price: 99999999});
order = 10002;
Game.CookieUpgrade({name: "Double-chip cookies",
	desc: "DOUBLE THE CHIPS<br>DOUBLE THE TASTY<br>(double the calories)",
	icon: [6, 3], power: 2, price: 999999999 * 5});
Game.CookieUpgrade({name: "White chocolate macadamia nut cookies",
	desc: "Orteil's favorite.",
	icon: [8, 3], power: 2, price: 9999999999});
Game.CookieUpgrade({name: "All-chocolate cookies",
	desc: "CHOCOVERDOSE.",
	icon: [9, 3], power: 2, price: 9999999999 * 5});

order = 100;
new Game.Upgrade("Quadrillion fingers",
	getStrThousandFingersGain(20) + "<q>clickityclickityclickityclickityclick</q>",
	10000000000, [0, 17], {tier: 8, col: 0, groups: "cursor:200|click"});

order = 200;
Game.TieredUpgrade("Prune juice",
	"<q>Gets me going.</q>",
	"Grandma", 4);
order = 300;
Game.TieredUpgrade("Genetically-modified cookies",
	"<q>All-natural mutations.</q>",
	"Farm", 4);
order = 500;
Game.TieredUpgrade("Radium reactors",
	"<q>Gives your cookies a healthy glow.</q>",
	"Factory", 4);
order = 400;
Game.TieredUpgrade("Ultimadrill",
	"<q>Pierce the heavens, etc.</q>",
	"Mine", 4);
order = 600;
Game.TieredUpgrade("Warp drive",
	"<q>To boldly bake.</q>",
	"Shipment", 4);
order = 700;
Game.TieredUpgrade("Ambrosia",
	"<q>Adding this to the cookie mix is sure to make them even more addictive!<br>Perhaps dangerously so.<br>Let's hope you can keep selling these legally.</q>",
	"Alchemy lab", 4);
order = 800;
Game.TieredUpgrade("Sanity dance",
	"<q>We can change if we want to.<br>We can leave our brains behind.</q>",
	"Portal", 4);
order = 900;
Game.TieredUpgrade("Causality enforcer",
	"<q>What happened, happened.</q>",
	"Time machine", 4);

order = 5000;
new Game.Upgrade("Lucky day",
	loc("Golden cookies appear <b>twice as often</b> and stay <b>twice as long</b>.") + "<q>Oh hey, a four-leaf penny!</q>",
	777777777, [27, 6], {groups: "goldCookie|goldSwitchMult"});
new Game.Upgrade("Serendipity",
	loc("Golden cookies appear <b>twice as often</b> and stay <b>twice as long</b>.") + "<q>What joy! Seven horseshoes!</q>",
	77777777777, [27, 6], {groups: "goldCookie|goldSwitchMult"});

order = 20000;
new Game.Upgrade("Kitten engineers",
	strKittenDesc + "<q>meow meow meow meow, sir</q>",
	90000000000000, Game.GetIcon("Kitten", 3), {tier: 3, groups: "bonus|kitten:2"});

order = 10020;
Game.CookieUpgrade({name: "Dark chocolate-coated cookies",
	desc: "These absorb light so well you almost need to squint to see them.",
	icon: [10, 3], power: 5, price: 99999999999});
Game.CookieUpgrade({name: "White chocolate-coated cookies",
	desc: "These dazzling cookies absolutely glisten with flavor.",
	icon: [11, 3], power: 5, price: 99999999999});

order = 250;
Game.GrandmaSynergy("Farmer grandmas", "A nice farmer to grow more cookies.", "Farm");
Game.GrandmaSynergy("Miner grandmas", "A nice miner to dig more cookies.", "Mine");
Game.GrandmaSynergy("Worker grandmas", "A nice worker to manufacture more cookies.", "Factory");
Game.GrandmaSynergy("Cosmic grandmas", "A nice thing to... uh... cookies.", "Shipment");
Game.GrandmaSynergy("Transmuted grandmas", "A nice golden grandma to convert into more cookies.", "Alchemy lab");
Game.GrandmaSynergy("Altered grandmas", "a NiCe GrAnDmA tO bA##########", "Portal");
Game.GrandmaSynergy("Grandmas' grandmas", "A nice grandma's nice grandma to bake double the cookies.", "Time machine");

order = 14000;
new Game.Upgrade("Bingo center/Research facility",
	loc("Grandma-operated science lab and leisure club.<br>Grandmas are <b>4 times</b> as efficient.<br><b>Regularly unlocks new upgrades</b>.") + "<q>What could possibly keep those grandmothers in check?...<br>Bingo.</q>",
	1000000000000000, [11, 9], {groups: "grandma|grandmapocalypse", require: function () {
		var elder = Game.GetAchiev("Elder");
		return Game.Objects["Grandma"].getAmount() >= 6 && (elder.getWon() || elder.require()); //ah order of execution
	}});

order = 15000;
new Game.Upgrade("Specialized chocolate chips",
	getStrCookieProductionMultiplierPlus(1) + "<q>Computer-designed chocolate chips. Computer chips, if you will.</q>",
	1000000000000000, [0, 9], {pool: "tech", groups: "plus:1.01|grandmapocalypse"});
new Game.Upgrade("Designer cocoa beans",
	getStrCookieProductionMultiplierPlus(2) + "<q>Now more aerodynamic than ever!</q>",
	2000000000000000, [1, 9], {pool: "tech", groups: "plus:1.02|grandmapocalypse"});
new Game.Upgrade("Ritual rolling pins",
	loc("%1 are <b>twice</b> as efficient.", Game.cap(Game.Objects["Grandma"].plural)) + "<q>The result of years of scientific research!</q>",
	4000000000000000, [2, 9], {pool: "tech", groups: "grandma|grandmapocalypse"});
new Game.Upgrade("Underworld ovens",
	getStrCookieProductionMultiplierPlus(3) + "<q>Powered by science, of course!</q>",
	8000000000000000, [3, 9], {pool: "tech", groups: "plus:1.03|grandmapocalypse"});
new Game.Upgrade("One mind",
	loc("Each %1 gains <b>+%2 base CpS per %3</b>.", [loc("grandma"), "0.0<span></span>2", loc("grandma")]) + '<div class="warning">' + loc("Note: the grandmothers are growing restless. Do not encourage them.") + "</div><q>We are one. We are many.</q>",
	16000000000000000, [4, 9], {pool: "tech", groups: "grandma|grandmapocalypse"});
new Game.Upgrade("Exotic nuts",
	getStrCookieProductionMultiplierPlus(4) + "<q>You'll go crazy over these!</q>",
	32000000000000000, [5, 9], {pool: "tech", groups: "plus:1.04|grandmapocalypse"});
new Game.Upgrade("Communal brainsweep",
	(EN ? "Each grandma gains another <b>+0.0<span></span>2 base CpS per grandma</b>." : loc("Each %1 gains <b>+%2 base CpS per %3</b>.", [loc("grandma"), "0.0<span></span>2", loc("grandma")])) + '<div class="warning">' + loc("Note: proceeding any further in scientific research may have unexpected results. You have been warned.") + "</div><q>We fuse. We merge. We grow.</q>",
	64000000000000000, [6, 9], {pool: "tech", groups: "grandma|grandmapocalypse"});
new Game.Upgrade("Arcane sugar",
	getStrCookieProductionMultiplierPlus(5) + "<q>Tastes like insects, ligaments, and molasses.</q>",
	128000000000000000, [7, 9], {pool: "tech", groups: "plus:1.05|grandmapocalypse"});
new Game.Upgrade("Elder Pact",
	loc("Each %1 gains <b>+%2 base CpS per %3</b>.", [loc("grandma"), "0.0<span></span>5", loc("portal")]) + '<div class="warning">' + loc("Note: this is a bad idea.") + "</div><q>squirm crawl slither writhe<br>today we rise</q>",
	256000000000000000, [8, 9], {pool: "tech", groups: "grandma|grandmapocalypse"});
new Game.Upgrade("Elder Pledge",
	loc("Contains the wrath of the elders, at least for a while.") + "<q>This is a simple ritual involving anti-aging cream, cookie batter mixed in the moonlight, and a live chicken.</q>",
	1, [9, 9], {pool: "toggle", groups: "grandmapocalypse", priceFunc: function (pledges) {
		if (isNaN(pledges)) { pledges = Game.pledges; }
		return Math.pow(8, Math.min(pledges + 2, 14));
	}, descFunc: function () {
		return ('<div class="alignCenter">' +
			(Game.pledges == 0 ?
				loc("You haven't pledged to the elders yet.") :
				loc("You've pledged to the elders <b>%1 times</b>.", Game.LBeautify(Game.pledges))) +
		'<div class="line"></div></div>' + this.ddesc);
	}});

order = 150;
new Game.Upgrade("Plastic mouse",
	getStrClickingGains(1) + "<q>Slightly squeaky.</q>",
	50000, [11, 0], {tier: 1, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
new Game.Upgrade("Iron mouse",
	getStrClickingGains(1) + "<q>Click like it's 1349!</q>",
	5000000, [11, 1], {tier: 2, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
new Game.Upgrade("Titanium mouse",
	getStrClickingGains(1) + "<q>Heavy, but powerful.</q>",
	500000000, [11, 2], {tier: 3, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
new Game.Upgrade("Adamantium mouse",
	getStrClickingGains(1) + "<q>You could cut diamond with these.</q>",
	50000000000, [11, 13], {tier: 4, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});

order = 40000;
new Game.Upgrade("Ultrascience",
	loc("Research takes only <b>5 seconds</b>.") + "<q>YEAH, SCIENCE!</q>",
	7, [9, 2], {pool: "debug", groups: "grandmapocalypse|misc"}); //debug purposes only

order = 10020;
Game.CookieUpgrade({name: "Eclipse cookies",
	desc: "Look to the cookie.",
	icon: [0, 4], power: 2, price: 99999999999 * 5});
Game.CookieUpgrade({name: "Zebra cookies",
	desc: "...",
	icon: [1, 4], power: 2, price: 999999999999});

order = 100;
new Game.Upgrade("Quintillion fingers",
	getStrThousandFingersGain(20) + "<q>man, just go click click click click click, it's real easy, man.</q>",
	10000000000000, [0, 18], {tier: 9, col: 0, groups: "cursor:250|click"});

order = 40000;
new Game.Upgrade("Gold hoard",
	loc("Golden cookies appear <b>really often</b>.") + "<q>That's entirely too many.</q>",
	7, [10, 14], {pool: "debug", groups: "goldCookie|misc"}); //debug purposes only

order = 15000;
new Game.Upgrade("Elder Covenant",
	loc("Puts a permanent end to the elders' wrath, at the price of 5% of your CpS.") + "<q>This is a complicated ritual involving silly, inconsequential trivialities such as cursed laxatives, century-old cacao, and an infant.<br>Don't question it.</q>",
	66666666666666, [8, 9], {pool: "toggle", groups: "bonus|grandmapocalypse|globalCpsMod", isParent: true, setCpsNegative: true});
var covenant = Game.last;

new Game.Upgrade("Revoke Elder Covenant",
	loc("You will get 5% of your CpS back, but the grandmatriarchs will return.") + "<q>we<br>rise<br>again</q>",
	6666666666, [8, 9], {pool: "toggle", groups: "bonus|grandmapocalypse|globalCpsMod", toggleInto: covenant, isChild: true});
covenant.toggleInto = Game.last;

order = 5000;
new Game.Upgrade("Get lucky",
	loc("Golden cookie effects last <b>twice as long</b>.") + "<q>You've been up all night, haven't you?</q>",
	77777777777777, [27, 6], {groups: "goldCookie|goldSwitchMult"});

order = 15000;
new Game.Upgrade("Sacrificial rolling pins",
	loc("Elder pledges last <b>twice</b> as long.") + "<q>These are mostly just for spreading the anti-aging cream.<br>(And accessorily, shortening the chicken's suffering.)</q>",
	2888888888888, [2, 9], {groups: "misc|grandmapocalypse|misc"});

order = 10020;
Game.CookieUpgrade({name: "Snickerdoodles",
	desc: "True to their name.",
	icon: [2, 4], power: 2, price: 999999999999 * 5});
Game.CookieUpgrade({name: "Stroopwafels",
	desc: "If it ain't dutch, it ain't much.",
	icon: [3, 4], power: 2, price: 9999999999999});
Game.CookieUpgrade({name: "Macaroons",
	desc: "Not to be confused with macarons.<br>These have coconut, okay?",
	icon: [4, 4], power: 2, price: 9999999999999 * 5});

order = 40000;
new Game.Upgrade("Neuromancy",
	loc("Can toggle upgrades on and off at will in the stats menu.") + "<q>Can also come in handy to unsee things that can't be unseen.</q>",
	7, [4, 9], {pool: "debug", groups: "misc", buyFunc: function () { Game.toggleShowDebug(Game.showDebug); }}); //debug purposes only

order = 10020;
Game.CookieUpgrade({name: "Empire biscuits",
	desc: "For your growing cookie empire, of course!",
	icon: [5, 4], power: 2, price: 99999999999999});
order = 10031;
Game.CookieUpgrade({name: "British tea biscuits",
	desc: "Quite.",
	icon: [6, 4], require: "Tin of british tea biscuits", power: 2, price: 99999999999999});
Game.CookieUpgrade({name: "Chocolate british tea biscuits",
	desc: "Yes, quite.",
	icon: [7, 4], require: Game.last.name, power: 2, price: 99999999999999});
Game.CookieUpgrade({name: "Round british tea biscuits",
	desc: "Yes, quite riveting.",
	icon: [8, 4], require: Game.last.name, power: 2, price: 99999999999999});
Game.CookieUpgrade({name: "Round chocolate british tea biscuits",
	desc: "Yes, quite riveting indeed.",
	icon: [9, 4], require: Game.last.name, power: 2, price: 99999999999999});
Game.CookieUpgrade({name: "Round british tea biscuits with heart motif",
	desc: "Yes, quite riveting indeed, old chap.",
	icon: [10, 4], require: Game.last.name, power: 2, price: 99999999999999});
Game.CookieUpgrade({name: "Round chocolate british tea biscuits with heart motif",
	desc: "I like cookies.",
	icon: [11, 4], require: Game.last.name, power: 2, price: 99999999999999});

order = 1000;
Game.TieredUpgrade("Sugar bosons",
	"<q>Sweet firm bosons.</q>",
	"Antimatter condenser", 1);
Game.TieredUpgrade("String theory",
	"<q>Reveals new insight about the true meaning of baking cookies (and, as a bonus, the structure of the universe).</q>",
	"Antimatter condenser", 2);
Game.TieredUpgrade("Large macaron collider",
	"<q>How singular!</q>",
	"Antimatter condenser", 3);
Game.TieredUpgrade("Big bang bake",
	"<q>And that's how it all began.</q>",
	"Antimatter condenser", 4);

order = 255;
Game.GrandmaSynergy("Antigrandmas", "A mean antigrandma to vomit more cookies.", "Antimatter condenser");

order = 10020;
Game.CookieUpgrade({name: "Madeleines",
	desc: "Unforgettable!",
	icon: [12, 3], power: 2, price: 99999999999999 * 5});
Game.CookieUpgrade({name: "Palmiers",
	desc: "Palmier than you!",
	icon: [13, 3], power: 2, price: 99999999999999 * 5});
Game.CookieUpgrade({name: "Palets",
	desc: "You could probably play hockey with these.<br>I mean, you're welcome to try.",
	icon: [12, 4], power: 2, price: 999999999999999});
Game.CookieUpgrade({name: "Sabl&eacute;s",
	desc: "The name implies they're made of sand. But you know better, don't you?",
	icon: [13, 4], power: 2, price: 999999999999999});

order = 20000;
new Game.Upgrade("Kitten overseers",
	strKittenDesc + "<q>my purrpose is to serve you, sir</q>",
	90000000000000000, Game.GetIcon("Kitten", 4), {tier: 4, groups: "bonus|kitten:3"});

order = 100;
new Game.Upgrade("Sextillion fingers",
	getStrThousandFingersGain(20) + "<q>sometimes<br>things just<br>click</q>",
	10000000000000000, [0, 19], {tier: 10, col: 0, groups: "cursor:300|click"});

order = 200;
Game.TieredUpgrade("Double-thick glasses",
	"<q>Oh... so THAT's what I've been baking.</q>",
	"Grandma", 5);
order = 300;
Game.TieredUpgrade("Gingerbread scarecrows",
	"<q>Staring at your crops with mischievous glee.</q>",
	"Farm", 5);
order = 500;
Game.TieredUpgrade("Recombobulators",
	"<q>A major part of cookie recombobulation.</q>",
	"Factory", 5);
order = 400;
Game.TieredUpgrade("H-bomb mining",
	"<q>Questionable efficiency, but spectacular nonetheless.</q>",
	"Mine", 5);
order = 600;
Game.TieredUpgrade("Chocolate monoliths",
	"<q>My god. It's full of chocolate bars.</q>",
	"Shipment", 5);
order = 700;
Game.TieredUpgrade("Aqua crustulae",
	"<q>Careful with the dosing - one drop too much and you get muffins.<br>And nobody likes muffins.</q>",
	"Alchemy lab", 5);
order = 800;
Game.TieredUpgrade("Brane transplant",
	'<q>This refers to the practice of merging higher dimensional universes, or "branes", with our own, in order to facilitate transit (and harvesting of precious cookie dough).</q>',
	"Portal", 5);
order = 900;
Game.TieredUpgrade("Yestermorrow comparators",
	"<q>Fortnights into millennia.</q>",
	"Time machine", 5);
order = 1000;
Game.TieredUpgrade("Reverse cyclotrons",
	"<q>These can uncollision particles and unspin atoms. For... uh... better flavor, and stuff.</q>",
	"Antimatter condenser", 5);

order = 150;
new Game.Upgrade("Unobtainium mouse",
	getStrClickingGains(1) + "<q>These nice mice should suffice.</q>",
	5000000000000, [11, 14], {tier: 5, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});

order = 10030;
Game.CookieUpgrade({name: "Caramoas",
	desc: "Yeah. That's got a nice ring to it.",
	icon: [14, 4], require: "Box of brand biscuits", power: 3, price: 9999999999999999});
Game.CookieUpgrade({name: "Sagalongs",
	desc: "Grandma's favorite?",
	icon: [15, 3], require: "Box of brand biscuits", power: 3, price: 9999999999999999});
Game.CookieUpgrade({name: "Shortfoils",
	desc: "Foiled again!",
	icon: [15, 4], require: "Box of brand biscuits", power: 3, price: 9999999999999999});
Game.CookieUpgrade({name: "Win mints",
	desc: "They're the luckiest cookies you've ever tasted!",
	icon: [14, 3], require: "Box of brand biscuits", power: 3, price: 9999999999999999});

order = 40000;
new Game.Upgrade("Perfect idling",
	loc("You keep producing cookies even while the game is closed.") + "<q>It's the most beautiful thing I've ever seen.</q>",
	7, [10, 0], {pool: "debug", groups: "misc"}); //debug purposes only

order = 10030;
Game.CookieUpgrade({name: "Fig gluttons",
	desc: "Got it all figured out.",
	icon: [17, 4], require: "Box of brand biscuits", power: 2, price: 999999999999999 * 5});
Game.CookieUpgrade({name: "Loreols",
	desc: "Because, uh... they're worth it?",
	icon: [16, 3], require: "Box of brand biscuits", power: 2, price: 999999999999999 * 5});
Game.CookieUpgrade({name: "Jaffa cakes",
	desc: "If you want to bake a cookie from scratch, you must first build a factory.",
	icon: [17, 3], require: "Box of brand biscuits", power: 2, price: 999999999999999 * 5});
Game.CookieUpgrade({name: "Grease's cups",
	desc: "Extra-greasy peanut butter.",
	icon: [16, 4], require: "Box of brand biscuits", power: 2, price: 999999999999999 * 5});

order = 30000;
new Game.Upgrade("Heavenly chip secret",
	loc("Unlocks <b>%1%</b> of the potential of your prestige level.", 5) + "<q>Grants the knowledge of heavenly chips, and how to use them to make baking more efficient.<br>It's a secret to everyone.</q>",
	11, [19, 7], {groups: "bonus|heaven|heavenAch", require: function () { return Game.HasUpgrade("Legacy"); }});
new Game.Upgrade("Heavenly cookie stand",
	loc("Unlocks <b>%1%</b> of the potential of your prestige level.", 25) + "<q>Don't forget to visit the heavenly lemonade stand afterwards. When afterlife gives you lemons...</q>",
	1111, [18, 7], {groups: "bonus|heaven|heavenAch", require: function () { return Game.HasUpgrade(["Legacy", "Heavenly chip secret"]); }});
new Game.Upgrade("Heavenly bakery",
	loc("Unlocks <b>%1%</b> of the potential of your prestige level.", 50) + "<q>Also sells godly cakes and divine pastries. The pretzels aren't too bad either.</q>",
	111111, [17, 7], {groups: "bonus|heaven|heavenAch", require: function () { return Game.HasUpgrade(["Legacy", "Heavenly cookie stand"]); }});
new Game.Upgrade("Heavenly confectionery",
	loc("Unlocks <b>%1%</b> of the potential of your prestige level.", 75) + "<q>They say angel bakers work there. They take angel lunch breaks and sometimes go on angel strikes.</q>",
	11111111, [16, 7], {groups: "bonus|heaven|heavenAch", require: function () { return Game.HasUpgrade(["Legacy", "Heavenly bakery"]); }});
new Game.Upgrade("Heavenly key",
	loc("Unlocks <b>%1%</b> of the potential of your prestige level.", 100) + "<q>This is the key to the pearly (and tasty) gates of pastry heaven, granting you access to your entire stockpile of heavenly chips for baking purposes.<br>May you use them wisely.</q>",
	1111111111, [15, 7], {groups: "bonus|heaven|heavenAch", require: function () { return Game.HasUpgrade(["Legacy", "Heavenly confectionery"]); }});

order = 10100;
Game.CookieUpgrade({name: "Skull cookies",
	desc: "Wanna know something spooky? You've got one of these inside your head RIGHT NOW.",
	locked: true, icon: [12, 8], power: 2, price: 444444444444, groups: "halloween|halloweenAch|grandmapocalypse"});
Game.CookieUpgrade({name: "Ghost cookies",
	desc: "They're something strange, but they look pretty good!",
	locked: true, icon: [13, 8], power: 2, price: 444444444444, groups: "halloween|halloweenAch|grandmapocalypse"});
Game.CookieUpgrade({name: "Bat cookies",
	desc: "The cookies this town deserves.",
	locked: true, icon: [14, 8], power: 2, price: 444444444444, groups: "halloween|halloweenAch|grandmapocalypse"});
Game.CookieUpgrade({name: "Slime cookies",
	desc: "The incredible melting cookies!",
	locked: true, icon: [15, 8], power: 2, price: 444444444444, groups: "halloween|halloweenAch|grandmapocalypse"});
Game.CookieUpgrade({name: "Pumpkin cookies",
	desc: "Not even pumpkin-flavored. Tastes like glazing. Yeugh.",
	locked: true, icon: [16, 8], power: 2, price: 444444444444, groups: "halloween|halloweenAch|grandmapocalypse"});
Game.CookieUpgrade({name: "Eyeball cookies",
	desc: "When you stare into the cookie, the cookie stares back at you.",
	locked: true, icon: [17, 8], power: 2, price: 444444444444, groups: "halloween|halloweenAch|grandmapocalypse"});
Game.CookieUpgrade({name: "Spider cookies",
	desc: "You found the recipe on the web. They do whatever a cookie can.",
	locked: true, icon: [18, 8], power: 2, price: 444444444444, groups: "halloween|halloweenAch|grandmapocalypse"});

order = 0;
new Game.Upgrade("Persistent memory",
	loc("Subsequent research will be <b>%1 times</b> as fast.", 10) + "<q>It's all making sense!<br>Again!</q>",
	500, [9, 2], {pool: "prestige", groups: "grandmapocalypse"});

order = 40000;
new Game.Upgrade("Wrinkler doormat",
	loc("Wrinklers spawn much more frequently.") + "<q>You're such a pushover.</q>",
	7, [19, 8], {pool: "debug", groups: "grandmapocalypse|misc"}); //debug purposes only

order = 10200;
Game.CookieUpgrade({name: "Christmas tree biscuits",
	desc: "Whose pine is it anyway?",
	locked: true, icon: [12, 10], power: 2, price: 252525252525, groups: "christmas|christmasAch"});
Game.CookieUpgrade({name: "Snowflake biscuits",
	desc: "Mass-produced to be unique in every way.",
	locked: true, icon: [13, 10], power: 2, price: 252525252525, groups: "christmas|christmasAch"});
Game.CookieUpgrade({name: "Snowman biscuits",
	desc: "It's frosted. Doubly so.",
	locked: true, icon: [14, 10], power: 2, price: 252525252525, groups: "christmas|christmasAch"});
Game.CookieUpgrade({name: "Holly biscuits",
	desc: "You don't smooch under these ones. That would be the mistletoe (which, botanically, is a smellier variant of the mistlefinger).",
	locked: true, icon: [15, 10], power: 2, price: 252525252525, groups: "christmas|christmasAch"});
Game.CookieUpgrade({name: "Candy cane biscuits",
	desc: "It's two treats in one!<br>(Further inspection reveals the frosting does not actually taste like peppermint, but like mundane sugary frosting.)",
	locked: true, icon: [16, 10], power: 2, price: 252525252525, groups: "christmas|christmasAch"});
Game.CookieUpgrade({name: "Bell biscuits",
	desc: "What do these even have to do with christmas? Who cares, ring them in!",
	locked: true, icon: [17, 10], power: 2, price: 252525252525, groups: "christmas|christmasAch"});
Game.CookieUpgrade({name: "Present biscuits",
	desc: "The prequel to future biscuits. Watch out!",
	locked: true, icon: [18, 10], power: 2, price: 252525252525, groups: "christmas|christmasAch"});

order = 10020;
Game.CookieUpgrade({name: "Gingerbread men",
	desc: "You like to bite the legs off first, right? How about tearing off the arms? You sick monster.",
	icon: [18, 4], power: 2, price: 9999999999999999});
Game.CookieUpgrade({name: "Gingerbread trees",
	desc: "Evergreens in pastry form. Yule be surprised what you can come up with.",
	icon: [18, 3], power: 2, price: 9999999999999999});

order = 25000;
new Game.Upgrade("A festive hat",
	"<b>" + loc("Unlocks... something.") + "</b><q>Not a creature was stirring, not even a mouse.</q>",
	25, [19, 9], {groups: "christmas|misc", buyFunc: function () {
		if (this.bought && !Game.santa.dropEle.selectedIndex) { Game.santa.dropEle.selectedIndex = 1; }
	}});
Game.last.createCrate("#familiarIcons");

new Game.Upgrade("Increased merriness",
	getStrCookieProductionMultiplierPlus(15) + "<br>" + loc("Cost scales with Santa level.") + "<q>It turns out that the key to increased merriness, strangely enough, happens to be a good campfire and some s'mores.<br>You know what they say, after all; the s'more, the merrier.</q>",
	2525, [17, 9], {groups: "christmas|plus:1.15|santaDrop"});
new Game.Upgrade("Improved jolliness",
	getStrCookieProductionMultiplierPlus(15) + "<br>" + loc("Cost scales with Santa level.") + "<q>A nice wobbly belly goes a long way.<br>You jolly?</q>",
	2525, [17, 9], {groups: "christmas|plus:1.15|santaDrop"});
new Game.Upgrade("A lump of coal",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with Santa level.") + "<q>Some of the world's worst stocking stuffing.<br>I guess you could try starting your own little industrial revolution, or something?...</q>",
	2525, [13, 9], {groups: "christmas|plus:1.01|santaDrop"});
new Game.Upgrade("An itchy sweater",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with Santa level.") + '<q>You don\'t know what\'s worse : the embarrassingly quaint "elf on reindeer" motif, or the fact that wearing it makes you feel like you\'re wrapped in a dead sasquatch.</q>',
	2525, [14, 9], {groups: "christmas|plus:1.01|santaDrop"});
new Game.Upgrade("Reindeer baking grounds",
	loc("Reindeer appear <b>twice as frequently</b>.") + "<br>" + loc("Cost scales with Santa level.") + "<q>Male reindeer are from Mars; female reindeer are from venison.</q>",
	2525, [12, 9], {groups: "christmas|misc|santaDrop"});
new Game.Upgrade("Weighted sleighs",
	loc("Reindeer are <b>twice as slow</b>.") + "<br>" + loc("Cost scales with Santa level.") + "<q>Hope it was worth the weight.<br>(Something something forced into cervidude)</q>",
	2525, [12, 9], {groups: "christmas|misc|santaDrop"});
new Game.Upgrade("Ho ho ho-flavored frosting",
	loc("Reindeer give <b>twice as much</b>.") + "<br>" + loc("Cost scales with Santa level.") + "<q>It's time to up the antler.</q>",
	2525, [12, 9], {groups: "christmas|misc|santaDrop"});
new Game.Upgrade("Season savings",
	loc("All buildings are <b>%1% cheaper</b>.", 1) + "<br>" + loc("Cost scales with Santa level.") + "<q>By Santa's beard, what savings!<br>But who will save us?</q>",
	2525, [16, 9], {groups: "christmas|priceReduction|misc|santaDrop"});
new Game.Upgrade("Toy workshop",
	loc("All upgrades are <b>%1% cheaper</b>.", 5) + "<br>" + loc("Cost scales with Santa level.") + "<q>Watch yours-elf around elvesdroppers who might steal our production secrets.<br>Or elven worse!</q>",
	2525, [16, 9], {groups: "christmas|priceReduction|misc|santaDrop"});
new Game.Upgrade("Naughty list",
	loc("%1 are <b>twice</b> as efficient.", Game.cap(loc("grandmas"))) + "<br>" + loc("Cost scales with Santa level.") + "<q>This list contains every unholy deed perpetuated by grandmakind.<br>He won't be checking this one twice.<br>Once. Once is enough.</q>",
	2525, [15, 9], {groups: "christmas|grandma|santaDrop"});
new Game.Upgrade("Santa's bottomless bag",
	loc("Random drops are <b>%1% more common</b>.", 10) + "<br>" + loc("Cost scales with Santa level.") + "<q>This is one bottom you can't check out.</q>",
	2525, [19, 9], {groups: "christmas|misc|santaDrop"});
new Game.Upgrade("Santa's helpers",
	loc("Clicking is <b>%1%</b> more powerful.", 10) + "<br>" + loc("Cost scales with Santa level.") + "<q>Some choose to help hamburger; some choose to help you.<br>To each their own, I guess.</q>",
	2525, [19, 9], {groups: "christmas|click|onlyClick|santaDrop"});
new Game.Upgrade("Santa's legacy",
	loc("Cookie production multiplier <b>+%1% per Santa's levels.</b>", 3) + "<br>" + loc("Cost scales with Santa level.") + "<q>In the north pole, you gotta get the elves first. Then when you get the elves, you start making the toys. Then when you get the toys... then you get the cookies.</q>",
	2525, [19, 9], {groups: "christmas|bonus|santaDrop"});
new Game.Upgrade("Santa's milk and cookies",
	loc("Milk is <b>%1% more powerful</b>.", 5) + "<br>" + loc("Cost scales with Santa level.") + "<q>Part of Santa's dreadfully unbalanced diet.</q>",
	2525, [19, 9], {groups: "christmas|bonus|santaDrop"});

order = 40000;
new Game.Upgrade("Reindeer season",
	loc("Reindeer spawn much more frequently.") + "<q>Go, Cheater! Go, Hacker and Faker!</q>",
	7, [12, 9], {pool: "debug", groups: "christmas|misc"}); //debug purposes only

order = 25000;
new Game.Upgrade("Santa's dominion",
	getStrCookieProductionMultiplierPlus(20) + "<br>" + loc("All buildings are <b>%1% cheaper</b>.", 1) + "<br>" + loc("All upgrades are <b>%1% cheaper</b>.", 2) + "<q>My name is Claus, king of kings;<br>Look on my toys, ye Mighty, and despair!</q>",
	2525252525252525, [19, 10], {groups: "christmas|priceReduction|plus:1.2", require: function () { return Game.santaLevel >= Game.santaMax; }});

order = 10300;
var heartPower = function () {
	var pow = 2;
	if (Game.HasUpgrade("Starlove")) { pow = 3; }
	var godLvl = Game.hasGod("seasons"); //Selebrak
	if (godLvl == 1) {      pow *= 1.3; }
	else if (godLvl == 2) { pow *= 1.2; }
	else if (godLvl == 3) { pow *= 1.1; }
	return pow;
};
Game.CookieUpgrade({name: "Pure heart biscuits",
	desc: 'Melty white chocolate<br>that says "I *like* like you".',
	season: "valentines", icon: [19, 3], power: heartPower, price: 1000000, groups: "valentines|valentinesAch"});
Game.CookieUpgrade({name: "Ardent heart biscuits",
	desc: "A red hot cherry biscuit that will nudge the target of your affection in interesting directions.",
	require: Game.last.name, season: "valentines", icon: [20, 3], power: heartPower, price: 1000000000, groups: "valentines|valentinesAch"});
Game.CookieUpgrade({name: "Sour heart biscuits",
	desc: "A bitter lime biscuit for the lonely and the heart-broken.",
	require: Game.last.name, season: "valentines", icon: [20, 4], power: heartPower, price: 1000000000000, groups: "valentines|valentinesAch"});
Game.CookieUpgrade({name: "Weeping heart biscuits",
	desc: "An ice-cold blueberry biscuit, symbol of a mending heart.",
	require: Game.last.name, season: "valentines", icon: [21, 3], power: heartPower, price: 1000000000000000, groups: "valentines|valentinesAch"});
Game.CookieUpgrade({name: "Golden heart biscuits",
	desc: "A beautiful biscuit to symbolize kindness, true love, and sincerity.",
	require: Game.last.name, season: "valentines", icon: [21, 4], power: heartPower, price: 1000000000000000000, groups: "valentines|valentinesAch"});
Game.CookieUpgrade({name: "Eternal heart biscuits",
	desc: "Silver icing for a very special someone you've liked for a long, long time.",
	require: Game.last.name, season: "valentines", icon: [19, 4], power: heartPower, price: 1000000000000000000000, groups: "valentines|valentinesAch"});

order = 1100;
Game.TieredUpgrade("Gem polish",
	"<q>Get rid of the grime and let more light in.<br>Truly, truly outrageous.</q>",
	"Prism", 1);
Game.TieredUpgrade("9th color",
	"<q>Delve into untouched optical depths where even the mantis shrimp hasn't set an eye!</q>",
	"Prism", 2);
Game.TieredUpgrade("Chocolate light",
	"<q>Bask into its cocoalescence.<br>(Warning : may cause various interesting albeit deadly skin conditions.)</q>",
	"Prism", 3);
Game.TieredUpgrade("Grainbow",
	"<q>Remember the different grains using the handy Roy G. Biv mnemonic : R is for rice, O is for oats... uh, B for barley?...</q>",
	"Prism", 4);
Game.TieredUpgrade("Pure cosmic light",
	"<q>Your prisms now receive pristine, unadulterated photons from the other end of the universe.</q>",
	"Prism", 5);

order = 255;
Game.GrandmaSynergy("Rainbow grandmas", "A luminous grandma to sparkle into cookies.", "Prism");

order = 24000;
new Game.Upgrade("Season switcher",
	loc("Allows you to <b>trigger seasonal events</b> at will, for a price.") + "<q>There will always be time.</q>",
	1111, [16, 6], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Festive biscuit",
	loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.", loc("Christmas")) + "<q>'Twas the night before Christmas- or was it?</q>",
	Game.seasonTriggerBasePrice, [12, 10], {pool: "toggle", groups: "seasonSwitch", season: "christmas", descFunc: function () {
		var santaDrops = Game.UpgradesByGroup.santaDrop;
		var reindeerDrops = Game.UpgradesByGroup.christmasAch;
		return ('<div class="alignCenter">' + Game.listTinyOwnedUpgrades(santaDrops) + "<br><br>" +
			(EN ?
				("You've purchased <b>" + Game.countUpgradesByGroup(santaDrops) + "/" + santaDrops.length + "</b> of Santa's gifts.") :
				loc("Seasonal cookies purchased: <b>%1</b>.", Game.countUpgradesByGroup(santaDrops) + "/" + santaDrops.length)) +
			'<div class="line"></div>' + Game.listTinyOwnedUpgrades(reindeerDrops) + "<br><br>" +
			(EN ?
				("You've purchased <b>" + Game.countUpgradesByGroup(reindeerDrops) + "/" + reindeerDrops.length + "</b> reindeer cookies.") :
				loc("Reindeer cookies purchased: <b>%1</b>.", Game.countUpgradesByGroup(reindeerDrops) + "/" + reindeerDrops.length)) +
			'<div class="line"></div>' + Game.saySeasonSwitchUses() + '<div class="line"></div></div>' + this.beautifyDesc);
	}});
new Game.Upgrade("Ghostly biscuit",
	loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.", loc("Halloween")) + "<q>spooky scary skeletons<br>will wake you with a boo</q>",
	Game.seasonTriggerBasePrice, [13, 8], {pool: "toggle", groups: "seasonSwitch", season: "halloween", descFunc: function () {
		var halloweenDrops = Game.UpgradesByGroup.halloweenAch;
		return ('<div class="alignCenter">' + Game.listTinyOwnedUpgrades(halloweenDrops) + "<br><br>" +
			(EN ?
				("You've purchased <b>" + Game.countUpgradesByGroup(halloweenDrops) + "/" + halloweenDrops.length + "</b> halloween cookies.") :
				loc("Seasonal cookies purchased: <b>%1</b>.", Game.countUpgradesByGroup(halloweenDrops) + "/" + halloweenDrops.length)) +
			'<div class="line"></div>' + Game.saySeasonSwitchUses() + '<div class="line"></div></div>' + this.beautifyDesc);
	}});
new Game.Upgrade("Lovesick biscuit",
	loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.", loc("Valentine's day")) + "<q>Romance never goes out of fashion.</q>",
	Game.seasonTriggerBasePrice, [20, 3], {pool: "toggle", groups: "seasonSwitch", season: "valentines", descFunc: function () {
		var heartDrops = Game.UpgradesByGroup.valentinesAch;
		return ('<div class="alignCenter">' +
			Game.listTinyOwnedUpgrades(heartDrops) + "<br><br>You've purchased <b>" + Game.countUpgradesByGroup(heartDrops) + "/" + heartDrops.length + '</b> heart biscuits.<div class="line"></div>' +
			Game.saySeasonSwitchUses() + '<div class="line"></div></div>' + this.ddesc);
	}});
new Game.Upgrade("Fool's biscuit",
	loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.", loc("Business day")) + "<q>Business. Serious business. This is absolutely all of your business.</q>",
	Game.seasonTriggerBasePrice, [17, 6], {pool: "toggle", groups: "seasonSwitch", season: "fools", descFunc: function () {
		return ('<div class="alignCenter">' + Game.saySeasonSwitchUses() + '<div class="line"></div></div>' + this.ddesc);
	}});

order = 40000;
new Game.Upgrade("Eternal seasons",
	loc("Seasons now last forever.") + "<q>Season to taste.</q>",
	7, [16, 6], {pool: "debug", groups: "misc"}); //debug purposes only

order = 20000;
new Game.Upgrade("Kitten managers",
	strKittenDesc + "<q>that's not gonna paws any problem, sir</q>",
	900000000000000000000, Game.GetIcon("Kitten", 5), {tier: 5, groups: "bonus|kitten:4"});

order = 100;
new Game.Upgrade("Septillion fingers",
	getStrThousandFingersGain(20) + "<q>[cursory flavor text]</q>",
	10000000000000000000, [12, 20], {tier: 11, col: 0, groups: "cursor:350|click"});
new Game.Upgrade("Octillion fingers",
	getStrThousandFingersGain(20) + "<q>Turns out you <b>can</b> quite put your finger on it.</q>",
	10000000000000000000000, [12, 19], {tier: 12, col: 0, groups: "cursor:400|click"});

order = 150;
new Game.Upgrade("Eludium mouse",
	getStrClickingGains(1) + "<q>I rodent do that if I were you.</q>",
	500000000000000, [11, 15], {tier: 6, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
new Game.Upgrade("Wishalloy mouse",
	getStrClickingGains(1) + "<q>Clicking is fine and dandy, but don't smash your mouse over it. Get your game on. Go play.</q>",
	50000000000000000, [11, 16], {tier: 7, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
order = 200;
Game.TieredUpgrade("Aging agents",
	"<q>Counter-intuitively, grandmas have the uncanny ability to become more powerful the older they get.</q>",
	"Grandma", 6);
order = 300;
Game.TieredUpgrade("Pulsar sprinklers",
	"<q>There's no such thing as over-watering. The moistest is the bestest.</q>",
	"Farm", 6);
order = 500;
Game.TieredUpgrade("Deep-bake process",
	"<q>A patented process increasing cookie yield two-fold for the same amount of ingredients. Don't ask how, don't take pictures, and be sure to wear your protective suit.</q>",
	"Factory", 6);
order = 400;
Game.TieredUpgrade("Coreforge",
	"<q>You've finally dug a tunnel down to the Earth's core. It's pretty warm down here.</q>",
	"Mine", 6);
order = 600;
Game.TieredUpgrade("Generation ship",
	"<q>Built to last, this humongous spacecraft will surely deliver your cookies to the deep ends of space, one day.</q>",
	"Shipment", 6);
order = 700;
Game.TieredUpgrade("Origin crucible",
	"<q>Built from the rarest of earths and located at the very deepest of the largest mountain, this legendary crucible is said to retain properties from the big-bang itself.</q>",
	"Alchemy lab", 6);
order = 800;
Game.TieredUpgrade("Deity-sized portals",
	"<q>It's almost like, say, an elder god could fit through this thing now. Hypothetically.</q>",
	"Portal", 6);
order = 900;
Game.TieredUpgrade("Far future enactment",
	"<q>The far future enactment authorizes you to delve deep into the future - where civilization has fallen and risen again, and cookies are plentiful.</q>",
	"Time machine", 6);
order = 1000;
Game.TieredUpgrade("Nanocosmics",
	"<q>The theory of nanocosmics posits that each subatomic particle is in fact its own self-contained universe, holding unfathomable amounts of energy.<br>This somehow stacks with the nested universe theory, because physics.</q>",
	"Antimatter condenser", 6);
order = 1100;
Game.TieredUpgrade("Glow-in-the-dark",
	"<q>Your prisms now glow in the dark, effectively doubling their output!</q>",
	"Prism", 6);

order = 10032;
Game.CookieUpgrade({name: "Rose macarons",
	desc: "Although an odd flavor, these pastries recently rose in popularity.",
	icon: [22, 3], require: "Box of macarons", power: 3, price: 9999});
Game.CookieUpgrade({name: "Lemon macarons",
	desc: "Tastefully sour, delightful treats.",
	icon: [23, 3], require: "Box of macarons", power: 3, price: 9999999});
Game.CookieUpgrade({name: "Chocolate macarons",
	desc: "They're like tiny sugary burgers!",
	icon: [24, 3], require: "Box of macarons", power: 3, price: 9999999999});
Game.CookieUpgrade({name: "Pistachio macarons",
	desc: "Pistachio shells now removed after multiple complaints.",
	icon: [22, 4], require: "Box of macarons", power: 3, price: 9999999999999});
Game.CookieUpgrade({name: "Hazelnut macarons",
	desc: "These go especially well with coffee.",
	icon: [23, 4], require: "Box of macarons", power: 3, price: 9999999999999999});
Game.CookieUpgrade({name: "Violet macarons",
	desc: "It's like spraying perfume into your mouth!",
	icon: [24, 4], require: "Box of macarons", power: 3, price: 9999999999999999999});

order = 40000;
new Game.Upgrade("Magic shenanigans",
	loc("Cookie production <b>multiplied by 1,000</b>.") + '<q>It\'s magic. I ain\'t gotta explain sh<div style="display:inline-block;background:url(img/money.png);width:16px;height:16px;position:relative;top:4px;left:0px;margin:0px -2px;"></div>t.</q>',
	7, [17, 5], {pool: "debug", groups: "bonus|globalCpsMod"}); //debug purposes only

order = 24000;
new Game.Upgrade("Bunny biscuit",
	loc("Triggers <b>%1 season</b> for the next 24 hours.<br>Triggering another season will cancel this one.<br>Cost scales with unbuffed CpS and increases with every season switch.", loc("Easter")) + "<q>All the world will be your enemy<br>and when they catch you,<br>they will kill you...<br>but first they must catch you.</q>",
	Game.seasonTriggerBasePrice, [0, 12], {pool: "toggle", groups: "seasonSwitch", season: "easter", descFunc: function () {
		var easterEggs = Game.UpgradesByGroup.egg;
		return ('<div class="alignCenter">' +
			Game.listTinyOwnedUpgrades(easterEggs) + "<br><br>" +
			(EN ?
				("You've purchased <b>" + Game.countUpgradesByGroup(easterEggs) + "/" + easterEggs.length + "</b> eggs.") :
				loc("Eggs purchased: <b>%1</b>.", Game.countUpgradesByGroup(easterEggs) + "/" + easterEggs.length)) +
			'<div class="line"></div>' + Game.saySeasonSwitchUses() + '<div class="line"></div></div>' + this.beautifyDesc);
	}});

var eggPrice = 999999999999;
var eggPrice2 = 99999999999999;
new Game.Upgrade("Chicken egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>The egg. The egg came first. Get over it.</q>",
	eggPrice, [1, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Duck egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>Then he waddled away.</q>",
	eggPrice, [2, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Turkey egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>These hatch into strange, hand-shaped creatures.</q>",
	eggPrice, [3, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Quail egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>These eggs are positively tiny. I mean look at them. How does this happen? Whose idea was that?</q>",
	eggPrice, [4, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Robin egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>Holy azure-hued shelled embryos!</q>",
	eggPrice, [5, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Ostrich egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>One of the largest eggs in the world. More like ostrouch, am I right?<br>Guys?</q>",
	eggPrice, [6, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Cassowary egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>The cassowary is taller than you, possesses murderous claws and can easily outrun you.<br>You'd do well to be casso-wary of them.</q>",
	eggPrice, [7, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Salmon roe",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>Do the impossible, see the invisible.<br>Roe roe, fight the power?</q>",
	eggPrice, [8, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Frogspawn",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + '<q>I was going to make a pun about how these "toadally look like eyeballs", but froget it.</q>',
	eggPrice, [9, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Shark egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>HELLO IS THIS FOOD?<br>LET ME TELL YOU ABOUT FOOD.<br>WHY DO I KEEP EATING MY FRIENDS</q>",
	eggPrice, [10, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Turtle egg",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>Turtles, right? Hatch from shells. Grow into shells. What's up with that?<br>Now for my skit about airplane food.</q>",
	eggPrice, [11, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Ant larva",
	getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>These are a delicacy in some countries, I swear. You will let these invade your digestive tract, and you will derive great pleasure from it.<br>And all will be well.</q>",
	eggPrice, [12, 12], {groups: "easter|commonEgg|plus"});
new Game.Upgrade("Golden goose egg",
	loc("Golden cookies appear <b>%1%</b> more often.", 5) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>The sole vestige of a tragic tale involving misguided investments.</q>",
	eggPrice2, [13, 12], {groups: "easter|rareEgg|goldCookie|goldSwitchMult"});
new Game.Upgrade("Faberge egg",
	loc("All buildings and upgrades are <b>%1% cheaper</b>.", 1) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>This outrageous egg is definitely fab.</q>",
	eggPrice2, [14, 12], {groups: "easter|rareEgg|priceReduction|misc"});
new Game.Upgrade("Wrinklerspawn",
	loc("Wrinklers explode into <b>%1% more cookies</b>.", 5) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>Look at this little guy! It's gonna be a big boy someday! Yes it is!</q>",
	eggPrice2, [15, 12], {groups: "easter|rareEgg|grandmapocalypse|misc"});
new Game.Upgrade("Cookie egg",
	loc("Clicking is <b>%1%</b> more powerful.", 10) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>The shell appears to be chipped.<br>I wonder what's inside this one!</q>",
	eggPrice2, [16, 12], {groups: "easter|rareEgg|click|onlyClick"});
new Game.Upgrade("Omelette",
	loc("Other eggs appear <b>%1% more frequently</b>.", 10) + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>Fromage not included.</q>",
	eggPrice2, [17, 12], {groups: "easter|rareEgg|misc"});
new Game.Upgrade("Chocolate egg",
	loc("Contains <b>a lot of cookies</b>.") + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>Laid by the elusive cocoa bird. There's a surprise inside!</q>",
	eggPrice2, [18, 12], {groups: "easter|rareEgg|misc"});
new Game.Upgrade("Century egg",
	loc("You continually gain <b>more CpS the longer you've played</b> in the current ascension.") + "<br>" + loc("Cost scales with how many eggs you own.") + "<q>Actually not centuries-old. This one isn't a day over 86!</q>",
	eggPrice2, [19, 12], {groups: "easter|rareEgg|bonus", descFunc: function () {
		return ('<div class="alignCenter">Current boost : <b>+' + Game.Beautify((Game.CenturyEggBoost - 1) * 100, 1) + '%</b></div><div class="line"></div>' + this.ddesc);
	}});
new Game.Upgrade('"egg"',
	"<b>" + loc("+%1 CpS", 9) + '</b><q>hey it\'s "egg"</q>',
	eggPrice2, [20, 12], {groups: "easter|rareEgg|addCps:9"});

Game.GetHowManyEggs = function (limit, includeUnlocked) {
	return Game.countUpgradesByGroup(Game.UpgradesByGroup.egg, limit, includeUnlocked);
};

order = 10032;
Game.CookieUpgrade({name: "Caramel macarons",
	desc: "The saltiest, chewiest of them all.",
	icon: [25, 3], require: "Box of macarons", power: 3, price: 9999999999999999999999});
Game.CookieUpgrade({name: "Licorice macarons",
	desc: 'Also known as "blackarons".',
	icon: [25, 4], require: "Box of macarons", power: 3, price: 9999999999999999999999999});

order = 525;
Game.TieredUpgrade("Taller tellers",
	"<q>Able to process a higher amount of transactions. Careful though, as taller tellers tell tall tales.</q>",
	"Bank", 1);
Game.TieredUpgrade("Scissor-resistant credit cards",
	"<q>For those truly valued customers.</q>",
	"Bank", 2);
Game.TieredUpgrade("Acid-proof vaults",
	"<q>You know what they say : better safe than sorry.</q>",
	"Bank", 3);
Game.TieredUpgrade("Chocolate coins",
	"<q>This revolutionary currency is much easier to melt from and into ingots - and tastes much better, for a change.</q>",
	"Bank", 4);
Game.TieredUpgrade("Exponential interest rates",
	"<q>Can't argue with mathematics! Now fork it over.</q>",
	"Bank", 5);
Game.TieredUpgrade("Financial zen",
	"<q>The ultimate grail of economic thought; the feng shui of big money, the stock market yoga - the Heimlich maneuver of dimes and nickels.</q>",
	"Bank", 6);

order = 550;
Game.TieredUpgrade("Golden idols",
	"<q>Lure even greedier adventurers to retrieve your cookies. Now that's a real idol game!</q>",
	"Temple", 1);
Game.TieredUpgrade("Sacrifices",
	"<q>What's a life to a gigaton of cookies?</q>",
	"Temple", 2);
Game.TieredUpgrade("Delicious blessing",
	"<q>And lo, the Baker's almighty spoon came down and distributed holy gifts unto the believers - shimmering sugar, and chocolate dark as night, and all manner of wheats. And boy let me tell you, that party was mighty gnarly.</q>",
	"Temple", 3);
Game.TieredUpgrade("Sun festival",
	"<q>Free the primordial powers of your temples with these annual celebrations involving fire-breathers, traditional dancing, ritual beheadings and other merriments!</q>",
	"Temple", 4);
Game.TieredUpgrade("Enlarged pantheon",
	"<q>Enough spiritual inadequacy! More divinities than you'll ever need, or your money back! 100% guaranteed!</q>",
	"Temple", 5);
Game.TieredUpgrade("Great Baker in the sky",
	"<q>This is it. The ultimate deity has finally cast Their sublimely divine eye upon your operation; whether this is a good thing or possibly the end of days is something you should find out very soon.</q>",
	"Temple", 6);

order = 575;
Game.TieredUpgrade("Pointier hats",
	"<q>Tests have shown increased thaumic receptivity relative to the geometric proportions of wizardly conic implements.</q>",
	"Wizard tower", 1);
Game.TieredUpgrade("Beardlier beards",
	"<q>Haven't you heard? The beard is the word.</q>",
	"Wizard tower", 2);
Game.TieredUpgrade("Ancient grimoires",
	'<q>Contain interesting spells such as "Turn Water To Drool", "Grow Eyebrows On Furniture" and "Summon Politician".</q>',
	"Wizard tower", 3);
Game.TieredUpgrade("Kitchen curses",
	"<q>Exotic magic involved in all things pastry-related. Hexcellent!</q>",
	"Wizard tower", 4);
Game.TieredUpgrade("School of sorcery",
	"<q>This cookie-funded academy of witchcraft is home to the 4 prestigious houses of magic : the Jocks, the Nerds, the Preps, and the Deathmunchers.</q>",
	"Wizard tower", 5);
Game.TieredUpgrade("Dark formulas",
	"<q>Eldritch forces are at work behind these spells - you get the feeling you really shouldn't be messing with those. But I mean, free cookies, right?</q>",
	"Wizard tower", 6);

order = 250;
Game.GrandmaSynergy("Banker grandmas", "A nice banker to cash in more cookies.", "Bank", {order: 250.0591});
Game.GrandmaSynergy("Priestess grandmas", "A nice priestess to praise the one true Baker in the sky.", "Temple", {order: 250.0592});
Game.GrandmaSynergy("Witch grandmas", "A nice witch to cast a zip, and a zoop, and poof! Cookies.", "Wizard tower", {order: 250.0593});

order = 0;
new Game.Upgrade("Tin of british tea biscuits",
	loc("Contains an assortment of fancy biscuits.") + "<q>Every time is tea time.</q>",
	25, [21, 8], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Box of macarons",
	loc("Contains an assortment of macarons.") + "<q>Multicolored delicacies filled with various kinds of jam.<br>Not to be confused with macaroons, macaroni, macarena or any of that nonsense.</q>",
	25, [20, 8], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Box of brand biscuits",
	loc("Contains an assortment of popular biscuits.") + "<q>They're brand new!</q>",
	25, [20, 9], {pool: "prestige", groups: "misc"});

order = 10020;
Game.CookieUpgrade({name: "Pure black chocolate cookies",
	desc: 'Dipped in a lab-made substance darker than the darkest cocoa (dubbed "chocoalate").',
	icon: [26, 3], power: 5, price: 9999999999999999 * 5});
Game.CookieUpgrade({name: "Pure white chocolate cookies",
	desc: "Elaborated on the nano-scale, the coating on this biscuit is able to refract light even in a pitch-black environment.",
	icon: [26, 4], power: 5, price: 9999999999999999 * 5});
Game.CookieUpgrade({name: "Ladyfingers",
	desc: "Cleaned and sanitized so well you'd swear they're actual biscuits.",
	icon: [27, 3], power: 3, price: 99999999999999999});
Game.CookieUpgrade({name: "Tuiles",
	desc: "These never go out of tile.",
	icon: [27, 4], power: 3, price: 99999999999999999 * 5});
Game.CookieUpgrade({name: "Chocolate-stuffed biscuits",
	desc: "A princely snack!<br>The holes are so the chocolate stuffing can breathe.",
	icon: [28, 3], power: 3, price: 999999999999999999});
Game.CookieUpgrade({name: "Checker cookies",
	desc: "A square cookie? This solves so many storage and packaging problems! You're a genius!",
	icon: [28, 4], power: 3, price: 999999999999999999 * 5});
Game.CookieUpgrade({name: "Butter cookies",
	desc: "These melt right off your mouth and into your heart. (Let's face it, they're rather fattening.)",
	icon: [29, 3], power: 3, price: 9999999999999999999});
Game.CookieUpgrade({name: "Cream cookies",
	desc: "It's like two chocolate chip cookies! But brought together with the magic of cream! It's fiendishly perfect!",
	icon: [29, 4], power: 3, price: 9999999999999999999 * 5});

order = 0;
desc = loc("Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs.");
new Game.Upgrade("Permanent upgrade slot I",
	desc, 100, [0, 10], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Permanent upgrade slot II",
	desc, 20000, [1, 10], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Permanent upgrade slot III",
	desc, 3000000, [2, 10], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Permanent upgrade slot IV",
	desc, 400000000, [3, 10], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Permanent upgrade slot V",
	desc, 50000000000, [4, 10], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Starspawn",
	loc("Eggs drop <b>%1%</b> more often.", 10) + "<br>" + loc("Golden cookies appear <b>%1%</b> more often during %2.", [2, loc("Easter")]),
	111111, [0, 12], {pool: "prestige", groups: "goldCookie|misc"});
new Game.Upgrade("Starsnow",
	loc("Christmas cookies drop <b>%1%</b> more often.", 5) + "<br>" + loc("Reindeer appear <b>%1%</b> more often.", 5),
	111111, [12, 9], {pool: "prestige", groups: "christmas|misc"});
new Game.Upgrade("Starterror",
	loc("Spooky cookies drop <b>%1%</b> more often.", 10) + "<br>" + loc("Golden cookies appear <b>%1%</b> more often during %2.", [2, loc("Halloween")]),
	111111, [13, 8], {pool: "prestige", groups: "goldCookie|misc"});
new Game.Upgrade("Starlove",
	loc("Heart cookies are <b>%1%</b> more powerful.", 50) + "<br>" + loc("Golden cookies appear <b>%1%</b> more often during %2.", [2, loc("Valentine's day")]),
	111111, [20, 3], {pool: "prestige", groups: "goldCookie|misc"});
new Game.Upgrade("Startrade",
	loc("Golden cookies appear <b>%1%</b> more often during %2.", [5, loc("Business day")]),
	111111, [17, 6], {pool: "prestige", groups: "goldCookie|misc"});

var angelPriceFactor = 7;
desc = function (percent, total) { return loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed, for a total of <b>%2%</b>.", [percent, total]); };
new Game.Upgrade("Angels",
	desc(10, 15) + "<q>Lowest-ranking at the first sphere of pastry heaven, angels are tasked with delivering new recipes to the mortals they deem worthy.</q>",
	Math.pow(angelPriceFactor, 1), [0, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Archangels",
	desc(10, 25) + "<q>Members of the first sphere of pastry heaven, archangels are responsible for the smooth functioning of the world's largest bakeries.</q>",
	Math.pow(angelPriceFactor, 2), [1, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Virtues",
	desc(10, 35) + "<q>Found at the second sphere of pastry heaven, virtues make use of their heavenly strength to push and drag the stars of the cosmos.</q>",
	Math.pow(angelPriceFactor, 3), [2, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Dominions",
	desc(10, 45) + "<q>Ruling over the second sphere of pastry heaven, dominions hold a managerial position and are in charge of accounting and regulating schedules.</q>",
	Math.pow(angelPriceFactor, 4), [3, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Cherubim",
	desc(10, 55) + "<q>Sieging at the first sphere of pastry heaven, the four-faced cherubim serve as heavenly bouncers and bodyguards.</q>",
	Math.pow(angelPriceFactor, 5), [4, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Seraphim",
	desc(10, 65) + "<q>Leading the first sphere of pastry heaven, seraphim possess ultimate knowledge of everything pertaining to baking.</q>",
	Math.pow(angelPriceFactor, 6), [5, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("God",
	desc(10, 75) + "<q>Like Santa, but less fun.</q>",
	Math.pow(angelPriceFactor, 7), [6, 11], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Twin Gates of Transcendence",
	loc("You now <b>keep making cookies while the game is closed</b>, at the rate of <b>%1%</b> of your regular CpS and up to <b>1 hour</b> after the game is closed.<br>(Beyond 1 hour, this is reduced by a further %2% - your rate goes down to <b>%3%</b> of your CpS.)", [5, 90, 0.5]) + "<q>This is one occasion you're always underdressed for. Don't worry, just rush in past the bouncer and pretend you know people.</q>",
	1, [15, 11], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Heavenly luck",
	loc("Golden cookies appear <b>%1%</b> more often.", 5) + "<q>Someone up there likes you.</q>",
	77, [22, 6], {pool: "prestige", groups: "goldCookie|goldSwitchMult"});
new Game.Upgrade("Lasting fortune",
	loc("Golden cookie effects last <b>%1%</b> longer.", 10) + "<q>This isn't your average everyday luck. This is... advanced luck.</q>",
	777, [23, 6], {pool: "prestige", groups: "goldCookie|goldSwitchMult"});
new Game.Upgrade("Decisive fate",
	loc("Golden cookies stay <b>%1%</b> longer.", 5) + "<q>Life just got a bit more intense.</q>",
	7777, [10, 14], {pool: "prestige", groups: "goldCookie|goldSwitchMult"});

new Game.Upgrade("Divine discount",
	loc("All buildings are <b>%1% cheaper</b>.", 1) + "<q>Someone special deserves a special price.</q>",
	99999, [21, 7], {pool: "prestige", groups: "priceReduction|misc"});
new Game.Upgrade("Divine sales",
	loc("All upgrades are <b>%1% cheaper</b>.", 1) + "<q>Everything must go!</q>",
	99999, [18, 7], {pool: "prestige", groups: "priceReduction|misc"});
new Game.Upgrade("Divine bakeries",
	loc("Cookie upgrades are <b>%1 times cheaper</b>.", 5) + "<q>They sure know what they're doing.</q>",
	399999, [17, 7], {pool: "prestige", groups: "priceReduction|misc"});

new Game.Upgrade("Starter kit",
	loc("You start with <b>%1</b>.", loc("%1 cursor", 10)) + "<q>This can come in handy.</q>",
	50, [0, 14], {pool: "prestige", groups: "cursor|priceReduction|misc", buyFunc: function () {
		Game.Objects["Cursor"].free = this.bought ? 10 : 0;
		Game.Objects["Cursor"].priceCache = {};
	}});
new Game.Upgrade("Starter kitchen",
	loc("You start with <b>%1</b>.", loc("%1 grandma", 5)) + "<q>Where did these come from?</q>",
	5000, [1, 14], {pool: "prestige", groups: "grandma|priceReduction|misc", buyFunc: function () {
		Game.Objects["Grandma"].free = this.bought ? 5 : 0;
		Game.Objects["Grandma"].priceCache = {};
	}});
new Game.Upgrade("Halo gloves",
	loc("Clicking is <b>%1%</b> more powerful.", 10) + "<q>Smite that cookie.</q>",
	55555, [22, 7], {pool: "prestige", groups: "click|onlyClick"});

new Game.Upgrade("Kitten angels",
	strKittenDesc + "<q>All cats go to heaven.</q>",
	9000, [23, 7], {pool: "prestige", groups: "bonus|kitten"});

new Game.Upgrade("Unholy bait",
	loc("Wrinklers appear <b>%1 times</b> as fast.", 5) + "<q>No wrinkler can resist the scent of worm biscuits.</q>",
	44444, [15, 12], {pool: "prestige", groups: "grandmapocalypse|misc"});
new Game.Upgrade("Sacrilegious corruption",
	loc("Wrinklers explode into <b>%1% more cookies</b>.", 5) + "<q>Unique in the animal kingdom, the wrinkler digestive tract is able to withstand an incredible degree of dilation - provided you prod them appropriately.</q>",
	444444, [19, 8], {pool: "prestige", groups: "grandmapocalypse|misc"});

order = 200;
Game.TieredUpgrade("Xtreme walkers",
	'<q>Complete with flame decals and a little horn that goes "toot".</q>',
	"Grandma", 7);
order = 300;
Game.TieredUpgrade("Fudge fungus",
	"<q>A sugary parasite whose tendrils help cookie growth.<br>Please do not breathe in the spores. In case of spore ingestion, seek medical help within the next 36 seconds.</q>",
	"Farm", 7);
order = 400;
Game.TieredUpgrade("Planetsplitters",
	"<q>These new state-of-the-art excavators have been tested on Merula, Globort and Flwanza VI, among other distant planets which have been curiously quiet lately.</q>",
	"Mine", 7);
order = 500;
Game.TieredUpgrade("Cyborg workforce",
	"<q>Semi-synthetic organisms don't slack off, don't unionize, and have 20% shorter lunch breaks, making them ideal labor fodder.</q>",
	"Factory", 7);
order = 525;
Game.TieredUpgrade("Way of the wallet",
	"<q>This new monetary school of thought is all the rage on the banking scene; follow its precepts and you may just profit from it.</q>",
	"Bank", 7);
order = 550;
Game.TieredUpgrade("Creation myth",
	"<q>Stories have been circulating about the origins of the very first cookie that was ever baked; tales of how it all began, in the Dough beyond time and the Ovens of destiny.</q>",
	"Temple", 7);
order = 575;
Game.TieredUpgrade("Cookiemancy",
	"<q>There it is; the perfected school of baking magic. From summoning chips to hexing nuts, there is not a single part of cookie-making that hasn't been improved tenfold by magic tricks.</q>",
	"Wizard tower", 7);
order = 600;
Game.TieredUpgrade("Dyson sphere",
	"<q>You've found a way to apply your knowledge of cosmic technology to slightly more local endeavors; this gigantic sphere of meta-materials, wrapping the solar system, is sure to kick your baking abilities up a notch.</q>",
	"Shipment", 7);
order = 700;
Game.TieredUpgrade("Theory of atomic fluidity",
	"<q>Pushing alchemy to its most extreme limits, you find that everything is transmutable into anything else - lead to gold, mercury to water; more importantly, you realize that anything can -and should- be converted to cookies.</q>",
	"Alchemy lab", 7);
order = 800;
Game.TieredUpgrade("End of times back-up plan",
	"<q>Just in case, alright?</q>",
	"Portal", 7);
order = 900;
Game.TieredUpgrade("Great loop hypothesis",
	"<q>What if our universe is just one instance of an infinite cycle? What if, before and after it, stretched infinite amounts of the same universe, themselves containing infinite amounts of cookies?</q>",
	"Time machine", 7);
order = 1000;
Game.TieredUpgrade("The Pulse",
	"<q>You've tapped into the very pulse of the cosmos, a timeless rhythm along which every material and antimaterial thing beats in unison. This, somehow, means more cookies.</q>",
	"Antimatter condenser", 7);
order = 1100;
Game.TieredUpgrade("Lux sanctorum",
	"<q>Your prism attendants have become increasingly mesmerized with something in the light - or maybe something beyond it; beyond us all, perhaps?</q>",
	"Prism", 7);

order = 200;
Game.TieredUpgrade("The Unbridling",
	"<q>It might be a classic tale of bad parenting, but let's see where grandma is going with this.</q>",
	"Grandma", 8);
order = 300;
Game.TieredUpgrade("Wheat triffids",
	"<q>Taking care of crops is so much easier when your plants can just walk about and help around the farm.<br>Do not pet. Do not feed. Do not attempt to converse with.</q>",
	"Farm", 8);
order = 400;
Game.TieredUpgrade("Canola oil wells",
	"<q>A previously untapped resource, canola oil permeates the underground olifers which grant it its particular taste and lucrative properties.</q>",
	"Mine", 8);
order = 500;
Game.TieredUpgrade("78-hour days",
	"<q>Why didn't we think of this earlier?</q>",
	"Factory", 8);
order = 525;
Game.TieredUpgrade("The stuff rationale",
	"<q>If not now, when? If not it, what? If not things... stuff?</q>",
	"Bank", 8);
order = 550;
Game.TieredUpgrade("Theocracy",
	"<q>You've turned your cookie empire into a perfect theocracy, gathering the adoration of zillions of followers from every corner of the universe.<br>Don't let it go to your head.</q>",
	"Temple", 8);
order = 575;
Game.TieredUpgrade("Rabbit trick",
	"<q>Using nothing more than a fancy top hat, your wizards have found a way to simultaneously curb rabbit population and produce heaps of extra cookies for basically free!<br>Resulting cookies may or may not be fit for vegans.</q>",
	"Wizard tower", 8);
order = 600;
Game.TieredUpgrade("The final frontier",
	"<q>It's been a long road, getting from there to here. It's all worth it though - the sights are lovely and the oil prices slightly more reasonable.</q>",
	"Shipment", 8);
order = 700;
Game.TieredUpgrade("Beige goo",
	"<q>Well now you've done it. Good job. Very nice. That's 3 galaxies you've just converted into cookies. Good thing you can hop from universe to universe.</q>",
	"Alchemy lab", 8);
order = 800;
Game.TieredUpgrade("Maddening chants",
	'<q>A popular verse goes like so : "jau\'hn madden jau\'hn madden aeiouaeiouaeiou brbrbrbrbrbrbr"</q>',
	"Portal", 8);
order = 900;
Game.TieredUpgrade("Cookietopian moments of maybe",
	"<q>Reminiscing how things could have been, should have been, will have been.</q>",
	"Time machine", 8);
order = 1000;
Game.TieredUpgrade("Some other super-tiny fundamental particle? Probably?",
	"<q>When even the universe is running out of ideas, that's when you know you're nearing the end.</q>",
	"Antimatter condenser", 8);
order = 1100;
Game.TieredUpgrade("Reverse shadows",
	"<q>Oh man, this is really messing with your eyes.</q>",
	"Prism", 8);

order = 20000;
new Game.Upgrade("Kitten accountants",
	strKittenDesc + "<q>business going great, sir</q>",
	900000000000000000000000, Game.GetIcon("Kitten", 6), {tier: 6, groups: "bonus|kitten:5"});
new Game.Upgrade("Kitten specialists",
	strKittenDesc + "<q>optimeowzing your workflow like whoah, sir</q>",
	900000000000000000000000000, Game.GetIcon("Kitten", 7), {tier: 7, groups: "bonus|kitten:6"});
new Game.Upgrade("Kitten experts",
	strKittenDesc + "<q>10 years expurrrtise in the cookie business, sir</q>",
	900000000000000000000000000000, Game.GetIcon("Kitten", 8), {tier: 8, groups: "bonus|kitten:7"});

new Game.Upgrade("How to bake your dragon",
	loc("Allows you to purchase a <b>crumbly egg</b> once you have earned 1 million cookies.") + '<q>A tome full of helpful tips such as "oh god, stay away from it", "why did we buy this thing, it\'s not even house-broken" and "groom twice a week in the direction of the scales".</q>',
	9, [22, 12], {pool: "prestige", groups: "misc"});

order = 25100;
new Game.Upgrade("A crumbly egg",
	loc("Unlocks the <b>cookie dragon egg</b>.") + "<q>Thank you for adopting this robust, fun-loving cookie dragon! It will bring you years of joy and entertainment.<br>Keep in a dry and cool place, and away from other house pets. Subscription to home insurance is strongly advised.</q>",
	25, [21, 12], {groups: "misc", require: getCookiesBakedRequireFunc({price: 1000000, require: "How to bake your dragon"})});
Game.last.createCrate("#familiarIcons");
new Game.Upgrade("Chimera",
	loc("Synergy upgrades are <b>%1% cheaper</b>.", 2) + "<br>" + loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed.", 5) + "<br>" + loc("You retain optimal cookie production while the game is closed for <b>%1 more days</b>.", 2) + "<q>More than the sum of its parts.</q>",
	Math.pow(angelPriceFactor, 9), [24, 7], {pool: "prestige", groups: "priceReduction|misc"});
new Game.Upgrade("Tin of butter cookies",
	loc("Contains an assortment of rich butter cookies.") + "<q>Five varieties of danish cookies.<br>Complete with little paper cups.</q>",
	25, [21, 9], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Golden switch",
	loc("Unlocks the <b>golden switch</b>, which passively boosts your CpS by %1% but disables golden cookies.", 50) + "<q>Less clicking, more idling.</q>",
	999, [21, 10], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Classic dairy selection",
	loc("Unlocks the <b>milk selector</b>, letting you pick which milk is displayed under your cookie.<br>Comes with a variety of basic flavors.") + "<q>Don't have a cow, man.</q>",
	9, [1, 8], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Fanciful dairy selection",
	loc("Contains more exotic flavors for your milk selector.") + "<q>Strong bones for the skeleton army.</q>",
	1000000, [9, 7], {pool: "prestige", groups: "misc"});

order = 10300;
Game.CookieUpgrade({name: "Dragon cookie",
	desc: "Imbued with the vigor and vitality of a full-grown cookie dragon, this mystical cookie will embolden your empire for the generations to come.",
	icon: [10, 25], power: 5, price: 9999999999999999 * 7, require: function () { return Game.HasUpgrade("A crumbly egg") && Game.dragonLevel > 25; }}); //TODO programmatically set dragonLevel check?

priceFunc = function () { return Game.cookiesPs * 60 * 60; };
var descFunc = function () {
	if (Game.HasUpgrade("Residual luck")) {
		var bonus = Game.countUpgradesByGroup("goldSwitchMult");
		return ('<div class="alignCenter">' + Game.listTinyOwnedUpgrades(Game.UpgradesByGroup.goldSwitchMult) + "<br><br>The effective boost is <b>+" +
			Game.Beautify(Math.round(50 + bonus * 10)) + "%</b><br>thanks to residual luck<br>and your <b>" + bonus +
			"</b> golden cookie upgrade" + (bonus == 1 ? "" : "s") + '.</div><div class="line"></div>' + this.ddesc);
	}
	return this.desc;
};
requireFunc = function () { return Game.HasUpgrade("Golden switch"); };
order = 40000;
new Game.Upgrade("Golden switch [off]",
	loc("Turning this on will give you a passive <b>+%1% CpS</b>, but prevents golden cookies from spawning.<br>Cost is equal to 1 hour of production.", 50),
	1000000, [20, 10], {pool: "toggle", groups: "bonus|globalCpsMod", priceFunc: priceFunc, descFunc: descFunc, require: requireFunc, isParent: true});
var gSwitch = Game.last;

new Game.Upgrade("Golden switch [on]",
	loc("The switch is currently giving you a passive <b>+%1% CpS</b>; it also prevents golden cookies from spawning.<br>Turning it off will revert those effects.<br>Cost is equal to 1 hour of production.", 50),
	1000000, [21, 10], {pool: "toggle", groups: "bonus|globalCpsMod", priceFunc: priceFunc, descFunc: descFunc, require: requireFunc, toggleInto: gSwitch, isChild: true, setCpsNegative: true});
gSwitch.toggleInto = Game.last;

order = 50000;
new Game.Upgrade("Milk selector",
	loc("Lets you pick what flavor of milk to display."),
	0, [1, 8], {pool: "toggle", noBuy: true, groups: "misc"});

order = 10300;
var butterBiscuitMult = 100000000;
Game.CookieUpgrade({name: "Milk chocolate butter biscuit",
	desc: "Rewarded for owning 100 of everything.<br>It bears the engraving of a fine entrepreneur.",
	icon: [27, 8], power: 10, price: 999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(100)});
Game.CookieUpgrade({name: "Dark chocolate butter biscuit",
	desc: "Rewarded for owning 150 of everything.<br>It is adorned with the image of an experienced cookie tycoon.",
	icon: [27, 9], power: 10, price: 999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(150)});
Game.CookieUpgrade({name: "White chocolate butter biscuit",
	desc: "Rewarded for owning 200 of everything.<br>The chocolate is chiseled to depict a masterful pastry magnate.",
	icon: [28, 9], power: 10, price: 999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(200)});
Game.CookieUpgrade({name: "Ruby chocolate butter biscuit",
	desc: "Rewarded for owning 250 of everything.<br>Covered in a rare red chocolate, this biscuit is etched to represent the face of a cookie industrialist gone mad with power.",
	icon: [28, 8], power: 10, price: 999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(250)});

order = 10020;
Game.CookieUpgrade({name: "Gingersnaps",
	desc: "Cookies with a soul. Probably.",
	icon: [29, 10], power: 4, price: 99999999999999999999});
Game.CookieUpgrade({name: "Cinnamon cookies",
	desc: "The secret is in the patented swirly glazing.",
	icon: [23, 8], power: 4, price: 99999999999999999999 * 5});
Game.CookieUpgrade({name: "Vanity cookies",
	desc: "One tiny candied fruit sits atop this decadent cookie.",
	icon: [22, 8], power: 4, price: 999999999999999999999});
Game.CookieUpgrade({name: "Cigars",
	desc: "Close, but no match for those extravagant cookie straws they serve in coffee shops these days.",
	icon: [25, 8], power: 4, price: 999999999999999999999 * 5});
Game.CookieUpgrade({name: "Pinwheel cookies",
	desc: "Bringing you the dizzying combination of brown flavor and beige taste!",
	icon: [22, 10], power: 4, price: 9999999999999999999999});
Game.CookieUpgrade({name: "Fudge squares",
	desc: "Not exactly cookies, but you won't care once you've tasted one of these.<br>They're so good, it's fudged-up!",
	icon: [24, 8], power: 4, price: 9999999999999999999999 * 5});

order = 10030;
Game.CookieUpgrade({name: "Digits",
	desc: "Three flavors, zero phalanges.",
	icon: [26, 8], require: "Box of brand biscuits", power: 2, price: 999999999999999 * 5});

order = 10029;
Game.CookieUpgrade({name: "Butter horseshoes",
	desc: "It would behoove you to not overindulge in these.",
	icon: [22, 9], require: "Tin of butter cookies", power: 4, price: 99999999999999999999999});
Game.CookieUpgrade({name: "Butter pucks",
	desc: "Lord, what fools these mortals be!<br>(This is kind of a hokey reference.)",
	icon: [23, 9], require: "Tin of butter cookies", power: 4, price: 99999999999999999999999 * 5});
Game.CookieUpgrade({name: "Butter knots",
	desc: "Look, you can call these pretzels if you want, but you'd just be fooling yourself, wouldn't you?",
	icon: [24, 9], require: "Tin of butter cookies", power: 4, price: 999999999999999999999999});
Game.CookieUpgrade({name: "Butter slabs",
	desc: "Nothing butter than a slab to the face.",
	icon: [25, 9], require: "Tin of butter cookies", power: 4, price: 999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Butter swirls",
	desc: "These are equal parts sugar, butter, and warm fuzzy feelings - all of which cause millions of deaths every day.",
	icon: [26, 9], require: "Tin of butter cookies", power: 4, price: 9999999999999999999999999});

order = 10020;
Game.CookieUpgrade({name: "Shortbread biscuits",
	desc: "These rich butter cookies are neither short, nor bread. What a country!",
	icon: [23, 10], power: 4, price: 99999999999999999999999});
Game.CookieUpgrade({name: "Millionaires' shortbreads",
	desc: "Three thought-provoking layers of creamy chocolate, hard-working caramel and crumbly biscuit in a poignant commentary of class struggle.",
	icon: [24, 10], power: 4, price: 99999999999999999999999 * 5});
Game.CookieUpgrade({name: "Caramel cookies",
	desc: "The polymerized carbohydrates adorning these cookies are sure to stick to your teeth for quite a while.",
	icon: [25, 10], power: 4, price: 999999999999999999999999});

desc = function (totalHours) {
	return loc("You retain optimal cookie production while the game is closed for twice as long, for a total of <b>%1</b>.", Game.sayTime(totalHours * 60 * 60 * Game.fps, -1));
};
new Game.Upgrade("Belphegor",
	desc(2) + "<q>A demon of shortcuts and laziness, Belphegor commands machines to do work in his stead.</q>",
	Math.pow(angelPriceFactor, 1), [7, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Mammon",
	desc(4) + "<q>The demonic embodiment of wealth, Mammon requests a tithe of blood and gold from all his worshippers.</q>",
	Math.pow(angelPriceFactor, 2), [8, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Abaddon",
	desc(8) + "<q>Master of overindulgence, Abaddon governs the wrinkler brood and inspires their insatiability.</q>",
	Math.pow(angelPriceFactor, 3), [9, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Satan",
	desc(16) + "<q>The counterpoint to everything righteous, this demon represents the nefarious influence of deceit and temptation.</q>",
	Math.pow(angelPriceFactor, 4), [10, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Asmodeus",
	desc(32) + "<q>This demon with three monstrous heads draws his power from the all-consuming desire for cookies and all things sweet.</q>",
	Math.pow(angelPriceFactor, 5), [11, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Beelzebub",
	desc(64) + "<q>The festering incarnation of blight and disease, Beelzebub rules over the vast armies of pastry inferno.</q>",
	Math.pow(angelPriceFactor, 6), [12, 11], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Lucifer",
	desc(128) + "<q>Also known as the Lightbringer, this infernal prince's tremendous ego caused him to be cast down from pastry heaven.</q>",
	Math.pow(angelPriceFactor, 7), [13, 11], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Golden cookie alert sound",
	loc("Unlocks the <b>golden cookie sound selector</b>, which lets you pick whether golden cookies emit a sound when appearing or not.") + "<q>A sound decision.</q>",
	999999, [28, 6], {pool: "prestige", groups: "misc"});

order = 49900;
new Game.Upgrade("Golden cookie sound selector",
	loc("Lets you change the sound golden cookies make when they spawn."),
	0, [28, 6], {pool: "toggle", noBuy: true, groups: "misc"});

new Game.Upgrade("Basic wallpaper assortment",
	loc("Unlocks the <b>background selector</b>, letting you select the game's background.<br>Comes with a variety of basic flavors.") + "<q>Prioritizing aesthetics over crucial utilitarian upgrades? Color me impressed.</q>",
	99, [29, 5], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Legacy",
	loc("This is the first heavenly upgrade; it unlocks the <b>Heavenly chips</b> system.<div class=\"line\"></div>Each time you ascend, the cookies you made in your past life are turned into <b>heavenly chips</b> and <b>prestige</b>.<div class=\"line\"></div><b>Heavenly chips</b> can be spent on a variety of permanent transcendental upgrades.<div class=\"line\"></div>Your <b>prestige level</b> also gives you a permanent <b>+1% CpS</b> per level.") + "<q>We've all been waiting for you.</q>",
	1, [21, 6], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Elder spice",
	loc("You can attract <b>%1 more wrinklers</b>.", 2) + "<q>The cookie your cookie could smell like.</q>",
	444444, [19, 8], {pool: "prestige", groups: "grandmapocalypse|misc"});

new Game.Upgrade("Residual luck",
	loc("While the golden switch is on, you gain an additional <b>+%1% CpS</b> per golden cookie upgrade owned.", 10) + "<q>Fortune comes in many flavors.</q>",
	99999, [27, 6], {pool: "prestige", groups: "goldCookie"});

order = 150;
new Game.Upgrade("Fantasteel mouse",
	getStrClickingGains(1) + "<q>You could be clicking using your touchpad and we'd be none the wiser.</q>",
	5000000000000000000, [11, 17], {tier: 8, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
new Game.Upgrade("Nevercrack mouse",
	getStrClickingGains(1) + "<q>How much beefier can you make a mouse until it's considered a rat?</q>",
	500000000000000000000, [11, 18], {tier: 9, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
new Game.Upgrade("Five-finger discount",
	loc("All upgrades are <b>%1% cheaper per %2</b>.", [1, loc("%1 cursor", 100)]) + "<q>Stick it to the man.</q>",
	555555, [28, 7], {pool: "prestige", groups: "priceReduction|misc"});

order = 5000;
Game.SynergyUpgrade("Future almanacs",
	"<q>Lets you predict optimal planting times. It's crazy what time travel can do!</q>",
	"Farm", "Time machine", "synergy1");
Game.SynergyUpgrade("Rain prayer",
	"<q>A deeply spiritual ceremonial involving complicated dance moves and high-tech cloud-busting lasers.</q>",
	"Farm", "Temple", "synergy2");

Game.SynergyUpgrade("Seismic magic",
	"<q>Surprise earthquakes are an old favorite of wizardly frat houses.</q>",
	"Mine", "Wizard tower", "synergy1");
Game.SynergyUpgrade("Asteroid mining",
	"<q>As per the <span>19</span>74 United Cosmic Convention, comets, moons, and inhabited planetoids are no longer legally excavatable.<br>But hey, a space bribe goes a long way.</q>",
	"Mine", "Shipment", "synergy2");

Game.SynergyUpgrade("Quantum electronics",
	"<q>Your machines won't even be sure if they're on or off!</q>",
	"Factory", "Antimatter condenser", "synergy1");
Game.SynergyUpgrade("Temporal overclocking",
	"<q>Introduce more quickitude in your system for increased speedation of fastness.</q>",
	"Factory", "Time machine", "synergy2");

Game.SynergyUpgrade("Contracts from beyond",
	"<q>Make sure to read the fine print!</q>",
	"Bank", "Portal", "synergy1");
Game.SynergyUpgrade("Printing presses",
	"<q>Fake bills so real, they're almost worth the ink they're printed with.</q>",
	"Bank", "Factory", "synergy2");

Game.SynergyUpgrade("Paganism",
	"<q>Some deities are better left unworshipped.</q>",
	"Temple", "Portal", "synergy1");
Game.SynergyUpgrade("God particle",
	"<q>Turns out God is much tinier than we thought, I guess.</q>",
	"Temple", "Antimatter condenser", "synergy2");

Game.SynergyUpgrade("Arcane knowledge",
	"<q>Some things were never meant to be known - only mildly speculated.</q>",
	"Wizard tower", "Alchemy lab", "synergy1");
Game.SynergyUpgrade("Magical botany",
	'<q>Already known in some reactionary newspapers as "the wizard\'s GMOs".</q>',
	"Wizard tower", "Farm", "synergy2");

Game.SynergyUpgrade("Fossil fuels",
	"<q>Somehow better than plutonium for powering rockets.<br>Extracted from the fuels of ancient, fossilized civilizations.</q>",
	"Shipment", "Mine", "synergy1");
Game.SynergyUpgrade("Shipyards",
	"<q>Where carpentry, blind luck, and asbestos insulation unite to produce the most dazzling spaceships on the planet.</q>",
	"Shipment", "Factory", "synergy2");

Game.SynergyUpgrade("Primordial ores",
	"<q>Only when refining the purest metals will you extract the sweetest sap of the earth.</q>",
	"Alchemy lab", "Mine", "synergy1");
Game.SynergyUpgrade("Gold fund",
	"<q>If gold is the backbone of the economy, cookies, surely, are its hip joints.</q>",
	"Alchemy lab", "Bank", "synergy2");

Game.SynergyUpgrade("Infernal crops",
	"<q>Sprinkle regularly with FIRE.</q>",
	"Portal", "Farm", "synergy1");
Game.SynergyUpgrade("Abysmal glimmer",
	"<q>Someone, or something, is staring back at you.<br>Perhaps at all of us.</q>",
	"Portal", "Prism", "synergy2");

Game.SynergyUpgrade("Relativistic parsec-skipping",
	"<q>People will tell you this isn't physically possible.<br>These are people you don't want on your ship.</q>",
	"Time machine", "Shipment", "synergy1");
Game.SynergyUpgrade("Primeval glow",
	"<q>From unending times, an ancient light still shines, impossibly pure and fragile in its old age.</q>",
	"Time machine", "Prism", "synergy2");

Game.SynergyUpgrade("Extra physics funding",
	"<q>Time to put your money where your particle colliders are.</q>",
	"Antimatter condenser", "Bank", "synergy1");
Game.SynergyUpgrade("Chemical proficiency",
	"<q>Discover exciting new elements, such as Fleshmeltium, Inert Shampoo Byproduct #17 and Carbon++!</q>",
	"Antimatter condenser", "Alchemy lab", "synergy2");

Game.SynergyUpgrade("Light magic",
	"<q>Actually not to be taken lightly! No, I'm serious. 178 people died last year. You don't mess around with magic.</q>",
	"Prism", "Wizard tower", "synergy1");
Game.SynergyUpgrade("Mystical energies",
	"<q>Something beckons from within the light. It is warm, comforting, and apparently the cause for several kinds of exotic skin cancers.</q>",
	"Prism", "Temple", "synergy2");

new Game.Upgrade("Synergies Vol. I",
	loc("Unlocks a new tier of upgrades that affect <b>2 buildings at the same time</b>.<br>Synergies appear once you have <b>%1</b> of both buildings.", 15) + "<q>The many beats the few.</q>",
	222222, [10, 20], {pool: "prestige", groups: "synergy|misc"});
new Game.Upgrade("Synergies Vol. II",
	loc("Unlocks a new tier of upgrades that affect <b>2 buildings at the same time</b>.<br>Synergies appear once you have <b>%1</b> of both buildings.", 75) + "<q>The several beats the many.</q>",
	2222222, [10, 29], {pool: "prestige", groups: "synergy|misc"});

new Game.Upgrade("Heavenly cookies",
	loc("Cookie production multiplier <b>+%1% permanently</b>.", 10) + "<q>Baked with heavenly chips. An otherwordly flavor that transcends time and space.</q>",
	3, [25, 12], {pool: "prestige", power: 10, pseudoCookie: true});
new Game.Upgrade("Wrinkly cookies",
	loc("Cookie production multiplier <b>+%1% permanently</b>.", 10) + "<q>The result of regular cookies left to age out for countless eons in a place where time and space are meaningless.</q>",
	6666666, [26, 12], {pool: "prestige", power: 10, pseudoCookie: true});
new Game.Upgrade("Distilled essence of redoubled luck",
	loc("Golden cookies (and all other things that spawn, such as reindeer) have <b>%1% chance of being doubled</b>.", 1) + "<q>Tastes glittery. The empty phial makes for a great pencil holder.</q>",
	7777777, [27, 12], {pool: "prestige", groups: "goldCookie|misc"});

order = 40000;
new Game.Upgrade("Occult obstruction",
	loc("Cookie production <b>reduced to 0</b>.") + "<q>If symptoms persist, consult a doctor.</q>",
	7, [15, 5], {pool: "debug", groups: "bonus|globalCpsMod"}); //debug purposes only
new Game.Upgrade("Glucose-charged air",
	loc("Sugar lumps coalesce <b>a whole lot faster</b>.") + "<q>Don't breathe too much or you'll get diabetes!</q>",
	7, [29, 16], {pool: "debug", groups: "misc"}); //debug purposes only

order = 10300;
Game.CookieUpgrade({name: "Lavender chocolate butter biscuit",
	desc: "Rewarded for owning 300 of everything.<br>This subtly-flavored biscuit represents the accomplishments of decades of top-secret research. The molded design on the chocolate resembles a well-known entrepreneur who gave their all to the ancient path of baking.",
	icon: [26, 10], power: 10, price: 999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(300)});

order = 10030;
Game.CookieUpgrade({name: "Lombardia cookies",
	desc: "These come from those farms with the really good memory.",
	icon: [23, 13], require: "Box of brand biscuits", power: 3, price: 999999999999999999999 * 5});
Game.CookieUpgrade({name: "Bastenaken cookies",
	desc: "French cookies made of delicious cinnamon and candy sugar. These do not contain Nuts!",
	icon: [24, 13], require: "Box of brand biscuits", power: 3, price: 999999999999999999999 * 5});

order = 10020;
Game.CookieUpgrade({name: "Pecan sandies",
	desc: "Stick a nut on a cookie and call it a day! Name your band after it! Whatever!",
	icon: [25, 13], power: 4, price: 999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Moravian spice cookies",
	desc: "Popular for being the world's moravianest cookies.",
	icon: [26, 13], power: 4, price: 9999999999999999999999999});
Game.CookieUpgrade({name: "Anzac biscuits",
	desc: "Army biscuits from a bakery down under, containing no eggs but yes oats.",
	icon: [27, 13], power: 4, price: 9999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Buttercakes",
	desc: "Glistening with cholesterol, these cookies moistly straddle the line between the legal definition of a cookie and just a straight-up stick of butter.",
	icon: [29, 13], power: 4, price: 99999999999999999999999999});
Game.CookieUpgrade({name: "Ice cream sandwiches",
	desc: 'In an alternate universe, "ice cream sandwich" designates an ice cream cone filled with bacon, lettuce, and tomatoes. Maybe some sprinkles too.',
	icon: [28, 13], power: 4, price: 99999999999999999999999999 * 5});

new Game.Upgrade("Stevia Caelestis",
	loc("Sugar lumps ripen <b>%1</b> sooner.", Game.sayTime(60 * 60 * Game.fps)) + "<q>A plant of supernatural sweetness grown by angels in heavenly gardens.</q>",
	100000000, [25, 15], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Diabetica Daemonicus",
	loc("Sugar lumps mature <b>%1</b> sooner.", Game.sayTime(60 * 60 * Game.fps)) + "<q>A malevolent, if delicious herb that is said to grow on the cliffs of the darkest abyss of the underworld.</q>",
	300000000, [26, 15], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Sucralosia Inutilis",
	loc("Bifurcated sugar lumps appear <b>%1% more often</b> and are <b>%2% more likely</b> to drop 2 lumps.", [5, 5]) + "<q>A rare berry of uninteresting flavor that is as elusive as its uses are limited; only sought-after by the most avid collectors with too much wealth on their hands.</q>",
	1000000000, [27, 15], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Lucky digit",
	loc("<b>+%1%</b> prestige level effect on CpS.<br><b>+%2%</b> golden cookie effect duration.<br><b>+%3%</b> golden cookie lifespan.", [1, 1, 1]) + "<q>This upgrade is a bit shy and only appears when your prestige level contains a 7.</q>",
	777, [24, 15], {pool: "prestige", groups: "bonus|heaven|goldCookie|goldSwitchMult"});
new Game.Upgrade("Lucky number",
	loc("<b>+%1%</b> prestige level effect on CpS.<br><b>+%2%</b> golden cookie effect duration.<br><b>+%3%</b> golden cookie lifespan.", [1, 1, 1]) + "<q>This upgrade is a reclusive hermit and only appears when your prestige level contains two 7's.</q>",
	77777, [24, 15], {pool: "prestige", groups: "bonus|heaven|goldCookie|goldSwitchMult"});
new Game.Upgrade("Lucky payout",
	loc("<b>+%1%</b> prestige level effect on CpS.<br><b>+%2%</b> golden cookie effect duration.<br><b>+%3%</b> golden cookie lifespan.", [1, 1, 1]) + "<q>This upgrade took an oath of complete seclusion from the rest of the world and only appears when your prestige level contains four 7's.</q>",
	77777777, [24, 15], {pool: "prestige", groups: "bonus|heaven|goldCookie|goldSwitchMult"});

order = 50000;
new Game.Upgrade("Background selector",
	loc("Lets you pick which wallpaper to display."),
	0, [29, 5], {pool: "toggle", noBuy: true, groups: "misc"});

order = 255;
Game.GrandmaSynergy("Lucky grandmas", "A fortunate grandma that always seems to find more cookies.", "Chancemaker");

order = 1200;
Game.TieredUpgrade("Your lucky cookie",
	"<q>This is the first cookie you've ever baked. It holds a deep sentimental value and, after all this time, an interesting smell.</q>",
	"Chancemaker", 1);
Game.TieredUpgrade('"All Bets Are Off" magic coin',
	"<q>A coin that always lands on the other side when flipped. Not heads, not tails, not the edge. The <i>other side</i>.</q>",
	"Chancemaker", 2);
Game.TieredUpgrade("Winning lottery ticket",
	"<q>What lottery? THE lottery, that's what lottery! Only lottery that matters!</q>",
	"Chancemaker", 3);
Game.TieredUpgrade("Four-leaf clover field",
	"<q>No giant monsters here, just a whole lot of lucky grass.</q>",
	"Chancemaker", 4);
Game.TieredUpgrade("A recipe book about books",
	"<q>Tip the scales in your favor with 28 creative new ways to cook the books.</q>",
	"Chancemaker", 5);
Game.TieredUpgrade("Leprechaun village",
	"<q>You've finally become accepted among the local leprechauns, who lend you their mythical luck as a sign of friendship (as well as some rather foul-tasting tea).</q>",
	"Chancemaker", 6);
Game.TieredUpgrade("Improbability drive",
	"<q>A strange engine that turns statistics on their head. Recommended by the Grandmother's Guide to the Bakery.</q>",
	"Chancemaker", 7);
Game.TieredUpgrade("Antisuperstistronics",
	"<q>An exciting new field of research that makes unlucky things lucky. No mirror unbroken, no ladder unwalked under!</q>",
	"Chancemaker", 8);

order = 5000;
Game.SynergyUpgrade("Gemmed talismans",
	"<q>Good-luck charms covered in ancient and excruciatingly rare crystals. A must have for job interviews!</q>",
	"Chancemaker", "Mine", "synergy1");

order = 20000;
new Game.Upgrade("Kitten consultants",
	strKittenDesc + "<q>glad to be overpaid to work with you, sir</q>",
	900000000000000000000000000000000, Game.GetIcon("Kitten", 9), {tier: 9, groups: "bonus|kitten:8"});

order = 99999;
var years = Math.floor((Game.startDate - new Date(2013, 7, 8)) / (1000 * 60 * 60 * 24 * 365));
//only updates on page load
//may behave strangely on leap years
Game.CookieUpgrade({name: "Birthday cookie",
	forceDesc: loc("Cookie production multiplier <b>+%1%</b> for every year Cookie Clicker has existed (currently: <b>+%2%</b>).", [1, Game.Beautify(years)]) + "<q>Thank you for playing Cookie Clicker!<br>-Orteil</q>",
	icon: [22, 13], power: years, price: 99999999999999999999999999999});

order = 150;
new Game.Upgrade("Armythril mouse",
	getStrClickingGains(1) + "<q>This one takes about 53 people to push it around and another 48 to jump down on the button and trigger a click. You could say it's got some heft to it.</q>",
	50000000000000000000000, [11, 19], {tier: 10, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});

order = 200;
Game.TieredUpgrade("Reverse dementia",
	"<q>Extremely unsettling, and somehow even worse than the regular kind.</q>",
	"Grandma", 9);
order = 300;
Game.TieredUpgrade("Humane pesticides",
	"<q>Made by people, for people, from people and ready to unleash some righteous scorching pain on those pesky insects that so deserve it.</q>",
	"Farm", 9);
order = 400;
Game.TieredUpgrade("Mole people",
	"<q>Engineered from real human beings within your very labs, these sturdy little folks have a knack for finding the tastiest underground minerals in conditions that more expensive machinery probably wouldn't survive.</q>",
	"Mine", 9);
order = 500;
Game.TieredUpgrade("Machine learning",
	"<q>You figured you might get better productivity if you actually told your workers to learn how to work the machines. Sometimes, it's the little things...</q>",
	"Factory", 9);
order = 525;
Game.TieredUpgrade("Edible money",
	"<q>It's really quite simple; you make all currency too delicious not to eat, solving world hunger and inflation in one fell swoop!</q>",
	"Bank", 9);
order = 550;
Game.TieredUpgrade("Sick rap prayers",
	"<q>With their ill beat and radical rhymes, these way-hip religious tunes are sure to get all the youngins who thought they were 2 cool 4 church back on the pews and praying for more! Wicked!</q>",
	"Temple", 9);
order = 575;
Game.TieredUpgrade("Deluxe tailored wands",
	"<q>In this age of science, most skillful wand-makers are now long gone; but thankfully - not all those wanders are lost.</q>",
	"Wizard tower", 9);
order = 600;
Game.TieredUpgrade("Autopilot",
	"<q>Your ships are now fitted with completely robotic crews! It's crazy how much money you save when you don't have to compensate the families of those lost in space.</q>",
	"Shipment", 9);
order = 700;
Game.TieredUpgrade("The advent of chemistry",
	"<q>You know what? That whole alchemy nonsense was a load of baseless rubbish. Dear god, what were you thinking?</q>",
	"Alchemy lab", 9);
order = 800;
Game.TieredUpgrade("The real world",
	"<q>It turns out that our universe is actually the twisted dimension of another, saner plane of reality. Time to hop on over there and loot the place!</q>",
	"Portal", 9);
order = 900;
Game.TieredUpgrade("Second seconds",
	"<q>That's twice as many seconds in the same amount of time! What a deal! Also, what in god's name!</q>",
	"Time machine", 9);
order = 1000;
Game.TieredUpgrade("Quantum comb",
	"<q>Quantum entanglement is one of those things that are so annoying to explain that we might honestly be better off without it. This is finally possible thanks to the quantum comb!</q>",
	"Antimatter condenser", 9);
order = 1100;
Game.TieredUpgrade("Crystal mirrors",
	"<q>Designed to filter more light back into your prisms, reaching levels of brightness that reality itself had never planned for.</q>",
	"Prism", 9);
order = 1200;
Game.TieredUpgrade("Bunnypedes",
	"<q>You've taken to breeding rabbits with hundreds of paws, which makes them intrinsically very lucky and thus a very handy (if very disturbing) pet.</q>",
	"Chancemaker", 9);

order = 20000;
new Game.Upgrade("Kitten assistants to the regional manager",
	strKittenDesc + "<q>nothing stresses meowt... except having to seek the approval of my inferiors, sir</q>",
	900000000000000000000000000000000000, Game.GetIcon("Kitten", 10), {tier: 10, groups: "bonus|kitten:9"});

order = 5000;
Game.SynergyUpgrade("Charm quarks",
	"<q>They're after your lucky quarks!</q>",
	"Chancemaker", "Antimatter condenser", "synergy2");

order = 10020;
Game.CookieUpgrade({name: "Pink biscuits",
	desc: "One of the oldest cookies. Traditionally dipped in champagne to soften it, because the French will use any opportunity to drink.",
	icon: [21, 16], power: 4, price: 999999999999999999999999999});
Game.CookieUpgrade({name: "Whole-grain cookies",
	desc: 'Covered in seeds and other earthy-looking debris. Really going for that "5-second rule" look.',
	icon: [22, 16], power: 4, price: 999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Candy cookies",
	desc: "These melt in your hands just a little bit.",
	icon: [23, 16], power: 4, price: 9999999999999999999999999999});
Game.CookieUpgrade({name: "Big chip cookies",
	desc: "You are in awe at the size of these chips. Absolute units.",
	icon: [24, 16], power: 4, price: 9999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "One chip cookies",
	desc: "You get one.",
	icon: [25, 16], power: 1, price: 99999999999999999999999999999});

new Game.Upgrade("Sugar baking",
	loc("Each unspent sugar lump (up to %1) gives <b>+%2% CpS</b>.<div class=\"warning\">Note: this means that spending sugar lumps will decrease your CpS until they grow back.</div>", [100, 1]) + "<q>To bake with the sugary essence of eons themselves, you must first learn to take your sweet time.</q>",
	200000000, [21, 17], {pool: "prestige", groups: "bonus"});
new Game.Upgrade("Sugar craving",
	loc("Once an ascension, you may use the \"Sugar frenzy\" switch to <b>triple your CpS</b> for 1 hour, at the cost of <b>1 sugar lump</b>.") + "<q>Just a little kick to sweeten the deal.</q>",
	400000000, [22, 17], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Sugar aging process",
	loc("Each grandma (up to %1) makes sugar lumps ripen <b>%2</b> sooner.", [600, Game.sayTime(6 * Game.fps)]) + "<q>Aren't they just the sweetest?</q>",
	600000000, [23, 17], {pool: "prestige", groups: "misc"});

order = 40050;
new Game.Upgrade("Sugar frenzy",
	loc("Activating this will <b>triple your CpS</b> for 1 hour, at the cost of <b>1 sugar lump</b>.") + "<br>" + loc("May only be used once per ascension."),
	0, [22, 17], {priceLumps: 1, pool: "toggle", requiredUpgrade: "Sugar craving", groups: "misc"});

order = 10020;
Game.CookieUpgrade({name: "Sprinkles cookies",
	desc: "A bit of festive decorating helps hide the fact that this might be one of the blandest cookies you've ever tasted.",
	icon: [21, 14], power: 4, price: 99999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Peanut butter blossoms",
	desc: "Topped with a scrumptious chocolate squirt, which is something we really wish we didn't just write.",
	icon: [22, 14], power: 4, price: 999999999999999999999999999999});
Game.CookieUpgrade({name: "No-bake cookies",
	desc: "You have no idea how these mysterious oven-less treats came to be or how they hold their shape. You're thinking either elephant glue or cold fusion.",
	icon: [21, 15], power: 4, price: 999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Florentines",
	desc: "These make up for being the fruitcake of cookies by at least having the decency to feature chocolate.",
	icon: [26, 16], power: 4, price: 9999999999999999999999999999999});
Game.CookieUpgrade({name: "Chocolate crinkles",
	desc: "Non-denominational cookies to celebrate year-round deliciousness, and certainly not Christmas or some other nonsense.",
	icon: [22, 15], power: 4, price: 9999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Maple cookies",
	desc: "Made with syrup from a land where milk comes in bags, instead of spontaneously pooling at the bottom of your screen depending on your achievements.",
	icon: [21, 13], power: 4, price: 99999999999999999999999999999999});

order = 40000;
new Game.Upgrade("Turbo-charged soil",
	loc("Garden plants grow every second.<br>Garden seeds are free to plant.<br>You can switch soils at any time.") + "<q>It's got electrolytes!</q>",
	7, [2, 16], {pool: "debug", groups: "misc"}); //debug purposes only

order = 150;
new Game.Upgrade("Technobsidian mouse",
	getStrClickingGains(1) + "<q>A highly advanced mouse of a sophisticated design. Only one thing on its mind : to click.</q>",
	5000000000000000000000000, [11, 28], {tier: 11, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
new Game.Upgrade("Plasmarble mouse",
	getStrClickingGains(1) + "<q>A shifting blur in the corner of your eye, this mouse can trigger a flurry of clicks when grazed by even the slightest breeze.</q>",
	500000000000000000000000000, [11, 30], {tier: 12, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});

order = 20000;
new Game.Upgrade("Kitten marketeers",
	strKittenDesc + "<q>no such thing as a saturated markit, sir</q>",
	900000000000000000000000000000000000000, Game.GetIcon("Kitten", 11), {tier: 11, groups: "kitten:10"});

order = 10030;
Game.CookieUpgrade({name: "Festivity loops",
	desc: "These garish biscuits are a perfect fit for children's birthday parties or the funerals of strange, eccentric billionaires.",
	icon: [25, 17], require: "Box of brand biscuits", power: 2, price: 999999999999999999999999 * 5});

order = 10020;
Game.CookieUpgrade({name: "Persian rice cookies",
	desc: "Rose water and poppy seeds are the secret ingredients of these small, butter-free cookies.",
	icon: [28, 15], power: 4, price: 99999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Norwegian cookies",
	desc: "A flat butter cookie with a sliver of candied cherry on top. It is said that these illustrate the bleakness of scandinavian existentialism.",
	icon: [22, 20], power: 4, price: 999999999999999999999999999999999});
Game.CookieUpgrade({name: "Crispy rice cookies",
	desc: "Fun to make at home! Store-bought cookies are obsolete! Topple the system! There's marshmallows in these! Destroy capitalism!",
	icon: [23, 20], power: 4, price: 999999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Ube cookies",
	desc: "The tint is obtained by the use of purple yams. According to color symbolism, these cookies are either noble, holy, or supervillains.",
	icon: [24, 17], power: 4, price: 9999999999999999999999999999999999});
Game.CookieUpgrade({name: "Butterscotch cookies",
	desc: "The butterscotch chips are just the right amount of sticky, and make you feel like you're eating candy.",
	icon: [24, 20], power: 4, price: 9999999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Speculaas",
	desc: "These crunchy, almost obnoxiously cinnamony cookies are a source of dutch pride. About the origin of the name, one can only speculate.",
	icon: [21, 20], power: 4, price: 99999999999999999999999999999999999});

order = 10200;
Game.CookieUpgrade({name: "Elderwort biscuits",
	forceDesc: getStrCookieProductionMultiplierPlus(2) + "<br>" + loc("%1 are <b>%2%</b> more powerful.", [Game.cap(Game.Objects["Grandma"].plural), 2]) + "<br>" + loc("Dropped by %1 plants.", loc("Elderwort").toLowerCase()) + "<q>They taste incredibly stale, even when baked fresh.</q>",
	icon: [22, 25], power: 2, price: 60 * 2, locked: true, groups: "gardenDrop"});
Game.CookieUpgrade({name: "Bakeberry cookies",
	forceDesc: getStrCookieProductionMultiplierPlus(2) + "<br>" + loc("Dropped by %1 plants.", loc("Bakeberry").toLowerCase()) + "<q>Really good dipped in hot chocolate.</q>",
	icon: [23, 25], power: 2, price: 60, locked: true, groups: "gardenDrop"});
Game.CookieUpgrade({name: "Duketater cookies",
	forceDesc: getStrCookieProductionMultiplierPlus(10) + "<br>" + loc("Dropped by %1 plants.", loc("Duketater").toLowerCase()) + "<q>Fragrant and mealy, with a slight yellow aftertaste.</q>",
	icon: [24, 25], power: 10, price: 60 * 3, locked: true, groups: "gardenDrop"});
Game.CookieUpgrade({name: "Green yeast digestives",
	forceDesc: loc("Golden cookies give <b>%1%</b> more cookies.", 1) + "<br>" + loc("Golden cookie effects last <b>%1%</b> longer.", 1) + "<br>" + loc("Golden cookies appear <b>%1%</b> more often.", 1) + "<br>" + loc("Random drops are <b>%1% more common</b>.", 3) + "<br>" + loc("Dropped by %1 plants.", loc("Green rot").toLowerCase()) + "<q>These are tastier than you'd expect, but not by much.</q>",
	icon: [25, 25], power: 0, price: 60 * 3, locked: true, groups: "gardenDrop|goldCookie"});

order = 23000;
new Game.Upgrade("Fern tea",
	loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed.", 3) + " <small>(" + loc("Must own the %1 upgrade.", Game.getUpgradeName("Twin Gates of Transcendence")) + ")</small>" + "<br>" + loc("Dropped by %1 plants.", loc("Drowsyfern").toLowerCase()) + "<q>A chemically complex natural beverage, this soothing concoction has been used by mathematicians to solve equations in their sleep.</q>",
	60, [26, 25], {groups: "gardenDrop"});
new Game.Upgrade("Ichor syrup",
	loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed.", 7) + " <small>(" + loc("Must own the %1 upgrade.", Game.getUpgradeName("Twin Gates of Transcendence")) + ")</small>" + "<br>" + loc("Sugar lumps mature <b>%1</b> sooner.", Game.sayTime(7 * 60 * Game.fps)) + "<br>" + loc("Dropped by %1 plants.", loc("Ichorpuff").toLowerCase()) + "<q>Tastes like candy. The smell is another story.</q>",
	60 * 2, [27, 25], {groups: "gardenDrop"});

order = 10200;
Game.CookieUpgrade({name: "Wheat slims",
	forceDesc: getStrCookieProductionMultiplierPlus(1) + "<br>" + loc("Dropped by %1 plants.", loc("Baker's wheat").toLowerCase()) + "<q>The only reason you'd consider these to be cookies is because you feel slightly sorry for them.</q>",
	icon: [28, 25], power: 1, price: 30, locked: true, groups: "gardenDrop"});

order = 10300;
Game.CookieUpgrade({name: "Synthetic chocolate green honey butter biscuit",
	desc: "Rewarded for owning 350 of everything.<br>The recipe for this butter biscuit was once the sole heritage of an ancient mountain monastery. Its flavor is so refined that only a slab of lab-made chocolate specifically engineered to be completely tasteless could complement it.<br>Also it's got your face on it.",
	icon: [24, 26], power: 10, price: 999999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(350)});
Game.CookieUpgrade({name: "Royal raspberry chocolate butter biscuit",
	desc: "Rewarded for owning 400 of everything.<br>Once reserved for the megalomaniac elite, this unique strain of fruity chocolate has a flavor and texture unlike any other. Whether its exorbitant worth is improved or lessened by the presence of your likeness on it still remains to be seen.",
	icon: [25, 26], power: 10, price: 999999999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(400)});
Game.CookieUpgrade({name: "Ultra-concentrated high-energy chocolate butter biscuit",
	desc: "Rewarded for owning 450 of everything.<br>Infused with the power of several hydrogen bombs through a process that left most nuclear engineers and shareholders perplexed. Currently at the center of some rather heated United Nations meetings. Going in more detail about this chocolate would violate several state secrets, but we'll just add that someone's bust seems to be pictured on it. Perhaps yours?",
	icon: [26, 26], power: 10, price: 999999999999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(450)});

order = 200;
Game.TieredUpgrade("Timeproof hair dyes",
	"<q>Why do they always have those strange wispy pink dos? What do they know about candy floss that we don't?</q>",
	"Grandma", 10);
order = 300;
Game.TieredUpgrade("Barnstars",
	"<q>Ah, yes. These help quite a bit. Somehow.</q>",
	"Farm", 10);
order = 400;
Game.TieredUpgrade("Mine canaries",
	"<q>These aren't used for anything freaky! The miners just enjoy having a pet or two down there.</q>",
	"Mine", 10);
order = 500;
Game.TieredUpgrade("Brownie point system",
	"<q>Oh, these are lovely! You can now reward your factory employees for good behavior, such as working overtime or snitching on coworkers. 58 brownie points gets you a little picture of a brownie, and 178 of those pictures gets you an actual brownie piece for you to do with as you please! Infantilizing? Maybe. Oodles of fun? You betcha!</q>",
	"Factory", 10);
order = 525;
Game.TieredUpgrade("Grand supercycles",
	"<q>We let the public think these are complicated financial terms when really we're just rewarding the bankers with snazzy bicycles for a job well done. It's only natural after you built those fancy gold swimming pools for them, where they can take a dip and catch Kondratiev waves.</q>",
	"Bank", 10);
order = 550;
Game.TieredUpgrade("Psalm-reading",
	"<q>A theologically dubious and possibly blasphemous blend of fortune-telling and scripture studies.</q>",
	"Temple", 10);
order = 575;
Game.TieredUpgrade("Immobile spellcasting",
	"<q>Wizards who master this skill can now cast spells without having to hop and skip and gesticulate embarrassingly, which is much sneakier and honestly quite a relief.</q>",
	"Wizard tower", 10);
order = 600;
Game.TieredUpgrade("Restaurants at the end of the universe",
	"<q>Since the universe is spatially infinite, and therefore can be construed to have infinite ends, you've opened an infinite chain of restaurants where your space truckers can rest and partake in some home-brand cookie-based meals.</q>",
	"Shipment", 10);
order = 700;
Game.TieredUpgrade("On second thought",
	"<q>Disregard that last upgrade, alchemy is where it's at! Your eggheads just found a way to transmute children's nightmares into rare metals!</q>",
	"Alchemy lab", 10);
order = 800;
Game.TieredUpgrade("Dimensional garbage gulper",
	"<q>So we've been looking for a place to dispose of all the refuse that's been accumulating since we started baking - burnt cookies, failed experiments, unruly workers - and well, we figured rather than sell it to poor countries like we've been doing, we could just dump it in some alternate trash dimension where it's not gonna bother anybody! Probably!</q>",
	"Portal", 10);
order = 900;
Game.TieredUpgrade("Additional clock hands",
	"<q>It seemed like a silly idea at first, but it turns out these have the strange ability to twist time in interesting new ways.</q>",
	"Time machine", 10);
order = 1000;
Game.TieredUpgrade("Baking Nobel prize",
	"<q>What better way to sponsor scientific growth than to motivate those smarmy nerds with a meaningless award! What's more, each prize comes with a fine print lifelong exclusive contract to come work for you (or else)!</q>",
	"Antimatter condenser", 10);
order = 1100;
Game.TieredUpgrade("Reverse theory of light",
	"<q>A whole new world of physics opens up when you decide that antiphotons are real and posit that light is merely a void in shadow.</q>",
	"Prism", 10);
order = 1200;
Game.TieredUpgrade("Revised probabilistics",
	"<q>Either something happens or it doesn't. That's a 50% chance! This suddenly makes a lot of unlikely things very possible.</q>",
	"Chancemaker", 10);

order = 20000;
new Game.Upgrade("Kitten analysts",
	strKittenDesc + "<q>based on purrent return-on-investment meowdels we should be able to affurd to pay our empawyees somewhere around next century, sir</q>",
	900000000000000000000000000000000000000000, Game.GetIcon("Kitten", 12), {tier: 12, groups: "kitten:11"});

new Game.Upgrade("Eye of the wrinkler",
	loc("Mouse over a wrinkler to see how many cookies are in its stomach.") + "<q>Just a wrinkler and its will to survive.<br>Hangin' tough, stayin' hungry.</q>",
	99999999, [27, 26], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Inspired checklist",
	loc("Unlocks the <b>Buy all</b> feature, which lets you instantly purchase every upgrade in your store (starting from the cheapest one).<br>Also unlocks the <b>Vault</b>, a store section where you can place upgrades you do not wish to auto-buy.") + '<q>Snazzy grandma accessories? Check. Transdimensional abominations? Check. A bunch of eggs for some reason? Check. Machine that goes "ping"? Check and check.</q>',
	900000, [28, 26], {pool: "prestige", groups: "misc"});

order = 10300;
Game.CookieUpgrade({name: "Pure pitch-black chocolate butter biscuit",
	desc: "Rewarded for owning 500 of everything.<br>This chocolate is so pure and so flawless that it has no color of its own, instead taking on the appearance of whatever is around it. You're a bit surprised to notice that this one isn't stamped with your effigy, as its surface is perfectly smooth (to the picometer) - until you realize it's quite literally reflecting your own face like a mirror.",
	icon: [24, 27], power: 10, price: 999999999999999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(500)});

order = 10020;
Game.CookieUpgrade({name: "Chocolate oatmeal cookies",
	desc: "These bad boys compensate for lack of a cohesive form and a lumpy, unsightly appearance by being just simply delicious. Something we should all aspire to.",
	icon: [23, 28], power: 4, price: 99999999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Molasses cookies",
	desc: "Sticky, crackly, and dusted in fine sugar.<br>Some lunatics have been known to eat these with potatoes.",
	icon: [24, 28], power: 4, price: 999999999999999999999999999999999999});
Game.CookieUpgrade({name: "Biscotti",
	desc: "Almonds and pistachios make these very robust cookies slightly more interesting to eat than to bludgeon people with.",
	icon: [22, 28], power: 4, price: 999999999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Waffle cookies",
	desc: "Whether these are cookies with shockingly waffle-like features or simply regular cookie-sized waffles is a debate we're not getting into here.",
	icon: [21, 28], power: 4, price: 9999999999999999999999999999999999999});

order = 10000;
//early cookies that unlock at the same time as coconut cookies; meant to boost early game a little bit
Game.CookieUpgrade({name: "Almond cookies",
	desc: "Sometimes you feel like one of these. Sometimes you don't.",
	icon: [21, 27], power: 2, price: 99999999});
Game.CookieUpgrade({name: "Hazelnut cookies",
	desc: "Tastes like a morning stroll through a fragrant forest, minus the clouds of gnats.",
	icon: [22, 27], power: 2, price: 99999999});
Game.CookieUpgrade({name: "Walnut cookies",
	desc: "Some experts have pointed to the walnut's eerie resemblance to the human brain as a sign of its sentience - a theory most walnuts vehemently object to.",
	icon: [23, 27], power: 2, price: 99999999});

new Game.Upgrade("Label printer",
	loc("Mouse over an upgrade to see its tier.<br><small>Note: only some upgrades have tiers. Tiers are purely cosmetic and have no effect on gameplay.</small>") + "<q>Also comes in real handy when you want to tell catsup apart from ketchup.</q>",
	5000000, [28, 29], {pool: "prestige", groups: "misc"});

order = 200;
Game.TieredUpgrade("Good manners",
	'<q>Apparently these ladies are much more amiable if you take the time to learn their strange, ancient customs, which seem to involve saying "please" and "thank you" and staring at the sun with bulging eyes while muttering eldritch curses under your breath.</q>',
	"Grandma", 11);
order = 300;
Game.TieredUpgrade("Lindworms",
	"<q>You have to import these from far up north, but they really help aerate the soil!</q>",
	"Farm", 11);
order = 400;
Game.TieredUpgrade("Bore again",
	"<q>After extracting so much sediment for so long, you've formed some veritable mountains of your own from the accumulated piles of rock and dirt. Time to dig through those and see if you find anything fun!</q>",
	"Mine", 11);
order = 500;
Game.TieredUpgrade('"Volunteer" interns',
	"<q>If you're bad at something, always do it for free.</q>",
	"Factory", 11);
order = 525;
Game.TieredUpgrade("Rules of acquisition",
	"<q>Rule 387 : a cookie baked is a cookie kept.</q>",
	"Bank", 11);
order = 550;
Game.TieredUpgrade("War of the gods",
	"<q>An interesting game; the only winning move is not to pray.</q>",
	"Temple", 11);
order = 575;
Game.TieredUpgrade("Electricity",
	"<q>Ancient magicks and forbidden hexes shroud this arcane knowledge, whose unfathomable power can mysteriously turn darkness into light and shock an elephant to death.</q>",
	"Wizard tower", 11);
order = 600;
Game.TieredUpgrade("Universal alphabet",
	'<q>You\'ve managed to chart a language that can be understood by any sentient species in the galaxy; its exciting vocabulary contains over 56 trillion words that sound and look like sparkly burps, forming intricate sentences that usually translate to something like "give us your cookies, or else".</q>',
	"Shipment", 11);
order = 700;
Game.TieredUpgrade("Public betterment",
	"<q>Why do we keep trying to change useless matter into cookies, or cookies into even better cookies? Clearly, the way of the future is to change the people who eat the cookies into people with a greater understanding, appreciation and respect for the cookies they're eating. Into the vat you go!</q>",
	"Alchemy lab", 11);
order = 800;
Game.TieredUpgrade("Embedded microportals",
	"<q>We've found out that if we bake the portals into the cookies themselves, we can transport people's taste buds straight into the taste dimension! Good thing your army of lawyers got rid of the FDA a while ago!</q>",
	"Portal", 11);
order = 900;
Game.TieredUpgrade("Nostalgia",
	"<q>Your time machine technicians insist that this is some advanced new time travel tech, and not just an existing emotion universal to mankind. Either way, you have to admit that selling people the same old cookies just because it reminds them of the good old times is an interesting prospect.</q>",
	"Time machine", 11);
order = 1000;
Game.TieredUpgrade("The definite molecule",
	"<q>Your scientists have found a way to pack a cookie into one single continuous molecule, opening exciting new prospects in both storage and flavor despite the fact that these take up to a whole year to digest.</q>",
	"Antimatter condenser", 11);
order = 1100;
Game.TieredUpgrade("Light capture measures",
	"<q>As the universe gets ever so slightly dimmer due to you converting more and more of its light into cookies, you've taken to finding new and unexplored sources of light for your prisms; for instance, the warm glow emitted by a pregnant woman, or the twinkle in the eye of a hopeful child.</q>",
	"Prism", 11);
order = 1200;
Game.TieredUpgrade("0-sided dice",
	"<q>The advent of the 0-sided dice has had unexpected and tumultuous effects on the gambling community, and saw experts around the world calling you both a genius and an imbecile.</q>",
	"Chancemaker", 11);

new Game.Upgrade("Heralds",
	loc("You now benefit from the boost provided by <b>heralds</b>.<br>Each herald gives you <b>+1% CpS</b>.<br>Look on the purple flag at the top to see how many heralds are active at any given time.") + "<q>Be excellent to each other.<br>And Patreon, dudes!</q>",
	100, [21, 29], {pool: "prestige", groups: "bonus"});

order = 255;
Game.GrandmaSynergy("Metagrandmas", "A fractal grandma to make more grandmas to make more cookies.", "Fractal engine");

order = 1300;
Game.TieredUpgrade("Metabakeries",
	"<q>They practically bake themselves!</q>",
	"Fractal engine", 1);
Game.TieredUpgrade("Mandelbrown sugar",
	"<q>A substance that displays useful properties such as fractal sweetness and instant contact lethality.</q>",
	"Fractal engine", 2);
Game.TieredUpgrade("Fractoids",
	"<q>Here's a frun fract : all in all, these were a terrible idea.</q>",
	"Fractal engine", 3);
Game.TieredUpgrade("Nested universe theory",
	"<q>Asserts that each subatomic particle is host to a whole new universe, and therefore, another limitless quantity of cookies.<br>This somehow stacks with the theory of nanocosmics, because physics.</q>",
	"Fractal engine", 4);
Game.TieredUpgrade("Menger sponge cake",
	"<q>Frighteningly absorbent thanks to its virtually infinite surface area. Keep it isolated in a dry chamber, never handle it with an open wound, and do not ever let it touch a body of water.</q>",
	"Fractal engine", 5);
Game.TieredUpgrade("One particularly good-humored cow",
	"<q>This unassuming bovine was excruciatingly expensive and it may seem at first like you were ripped off. On closer inspection however, you notice that its earrings (it's wearing earrings) are actually fully functional copies of itself, each of which also wearing their own cow earrings, and so on, infinitely. It appears your dairy concerns will be taken care of for a while, although you'll have to put up with the cow's annoying snickering.</q>",
	"Fractal engine", 6);
Game.TieredUpgrade("Chocolate ouroboros",
	"<q>Forever eating its own tail and digesting itself, in a metabolically dubious tale of delicious tragedy.</q>",
	"Fractal engine", 7);
Game.TieredUpgrade("Nested",
	"<q>Clever self-reference or shameful cross-promotion? This upgrade apparently has the gall to advertise a link to <u>orteil.dashnet.org/nested</u>, in a tooltip you can't even click.</q>",
	"Fractal engine", 8);
Game.TieredUpgrade("Space-filling fibers",
	"<q>This special ingredient has the incredible ability to fill the local space perfectly, effectively eradicating hunger in those who consume it!<br>Knowing that no hunger means no need for cookies, your marketers urge you to repurpose this product into next-level packing peanuts.</q>",
	"Fractal engine", 9);
Game.TieredUpgrade("Endless book of prose",
	"<q>-</q>",
	"Fractal engine", 10);
// if (EN) {
// 	Game.last.descFunc = function () {
// 		var str = '"There once was a baker named ' + Game.bakeryName + ". One day, there was a knock at the door; " + Game.bakeryName + " opened it and was suddenly face-to-face with a strange and menacing old grandma. The grandma opened her mouth and, in a strange little voice, started reciting this strange little tale : ";
// 		var n = 35;
// 		var i = Math.floor(Game.T * 0.1);
// 		return this.desc + '<q style="font-family:Courier;">' + (str.substr(i % str.length, n) + (i % str.length > (str.length - n) ? str.substr(0, i % str.length - (str.length - n)) : "")) + "</q>";
// 	};
// } else {
// 	Game.last.setDescription("<q>-</q>");
// }
Game.TieredUpgrade("The set of all sets",
	"<q>The answer, of course, is a definite maybe.</q>",
	"Fractal engine", 11);

order = 5000;
Game.SynergyUpgrade("Recursive mirrors",
	"<q>Do you have any idea what happens when you point two of these at each other? Apparently, the universe doesn't either.</q>",
	"Fractal engine", "Prism", "synergy1");
Game.SynergyUpgrade("Mice clicking mice",
	"",
	"Fractal engine", "Cursor", "synergy2");
if (EN) {
	Game.last.descFunc = function () {
		Math.seedrandom(Game.seed + "-blasphemouse");
		if (Math.random() < 0.3) { Math.seedrandom(); return this.desc + "<q>Absolutely blasphemouse!</q>"; }
		else { Math.seedrandom(); return this.desc + "<q>Absolutely blasphemous!</q>"; }
	};
} else {
	Game.last.setDescription("<q>-</q>");
}

order = 10020;
Game.CookieUpgrade({name: "Custard creams",
	desc: "British lore pits these in a merciless war against bourbon biscuits.<br>The filling evokes vanilla without quite approaching it.<br>They're tastier on the inside!",
	icon: [23, 29], power: 4, price: 9999999999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Bourbon biscuits",
	desc: "Two chocolate biscuits joined together with even more chocolate.<br>The sworn rivals of custard creams, as legend has it.",
	icon: [24, 29], power: 4, price: 99999999999999999999999999999999999999});

new Game.Upgrade("Keepsakes",
	loc("Seasonal random drops have a <b>1/5 chance</b> to carry over through ascensions.") + "<q>Cherish the memories.</q>",
	1111111111, [22, 29], {pool: "prestige", groups: "misc"});

order = 10020;
Game.CookieUpgrade({name: "Mini-cookies",
	desc: "Have you ever noticed how the smaller something is, the easier it is to binge on it?",
	icon: [29, 30], power: 5, price: 99999999999999999999999999999999999999 * 5});

new Game.Upgrade("Sugar crystal cookies",
	(EN ? "Cookie production multiplier <b>+5% permanently</b>, and <b>+1%</b> for every building type level 10 or higher." : loc("Cookie production multiplier <b>+%1% permanently</b>.", 5) + "<br>" + loc("Cookie production multiplier <b>+%1%</b> for every building type level %2 or higher.", [1, 10])) + "<q>Infused with cosmic sweetness. It gives off a faint shimmery sound when you hold it up to your ear.</q>",
	1000000000, [21, 30], {pool: "prestige", pseudoCookie: true, power: function () {
		var n = 5;
		for (var i = 0; i < Game.ObjectsById.length; i++) {
			if (Game.ObjectsById[i].level >= 10) { n++; }
		}
		return n;
	}, descFunc: function () {
		var n = 5;
		for (var i = 0; i < Game.ObjectsById.length; i++) {
			if (Game.ObjectsById[i].level >= 10) { n++; }
		}
		return ('<div class="alignCenter">Current : <b>+' + Game.Beautify(n) + '%</b><div class="line"></div></div>' + this.ddesc);
	}});
new Game.Upgrade("Box of maybe cookies",
	loc("Contains an assortment of...something.") + "<q>These may or may not be considered cookies.</q>",
	333000000000, [25, 29], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Box of not cookies",
	loc("Contains an assortment of...something.") + "<q>These are strictly, definitely not cookies.</q>",
	333000000000, [26, 29], {pool: "prestige", groups: "misc"});
new Game.Upgrade("Box of pastries",
	loc("Contains an assortment of delicious pastries.") + "<q>These are a damn slippery slope is what they are!</q>",
	333000000000, [27, 29], {pool: "prestige", groups: "misc"});

order = 10040;
Game.CookieUpgrade({name: "Profiteroles",
	desc: "Also known as cream puffs, these pastries are light, fluffy, filled with whipped cream and fun to throw at people when snowballs are running scarce.",
	icon: [29, 29], require: "Box of pastries", power: 4, price: Math.pow(10, 31)});
Game.CookieUpgrade({name: "Jelly donut",
	desc: "Guaranteed to contain at least 0.3% jelly filling, or your money back.<br>You can still see the jelly stab wound!",
	icon: [27, 28], require: "Box of pastries", power: 4, price: Math.pow(10, 33)});
Game.CookieUpgrade({name: "Glazed donut",
	desc: "Absolutely gooey with sugar. The hole is the tastiest part!",
	icon: [28, 28], require: "Box of pastries", power: 4, price: Math.pow(10, 35)});
Game.CookieUpgrade({name: "Chocolate cake",
	desc: "The cake is a Portal reference!",
	icon: [25, 27], require: "Box of pastries", power: 4, price: Math.pow(10, 37)});
Game.CookieUpgrade({name: "Strawberry cake",
	desc: "It's not easy to come up with flavor text for something as generic as this, but some would say it's a piece of cake.",
	icon: [26, 27], require: "Box of pastries", power: 4, price: Math.pow(10, 39)});
Game.CookieUpgrade({name: "Apple pie",
	desc: "It is said that some grandmas go rogue and bake these instead.",
	icon: [25, 28], require: "Box of pastries", power: 4, price: Math.pow(10, 41)});
Game.CookieUpgrade({name: "Lemon meringue pie",
	desc: "Meringue is a finicky substance made of sugar and egg whites that requires specific atmospheric conditions to be baked at all. The lemon, as far as we can tell, isn't nearly as picky.",
	icon: [26, 28], require: "Box of pastries", power: 4, price: Math.pow(10, 43)});
Game.CookieUpgrade({name: "Butter croissant",
	desc: "Look around.<br>A rude man in a striped shirt bikes past you. He smells of cigarettes and caf&eacute;-au-lait. Somewhere, a mime uses his moustache to make fun of the British. 300 pigeons fly overhead.<br>Relax. You're experiencing croissant.",
	icon: [29, 28], require: "Box of pastries", power: 4, price: Math.pow(10, 45)});

order = 10050;
Game.CookieUpgrade({name: "Cookie dough",
	desc: "Bursting with infinite potential, but can also be eaten as is. Arguably worth the salmonella.",
	icon: [25, 30], require: "Box of maybe cookies", power: 4, price: Math.pow(10, 35)});
Game.CookieUpgrade({name: "Burnt cookie",
	desc: "This cookie flew too close to the sun and is now a shadow of its former self. If only you remembered to set a timer, you wouldn't have this tragedy on your hands...",
	icon: [23, 30], require: "Box of maybe cookies", power: 4, price: Math.pow(10, 37)});
Game.CookieUpgrade({name: "A chocolate chip cookie but with the chips picked off for some reason",
	desc: "This has to be the saddest thing you've ever seen.",
	icon: [24, 30], require: "Box of maybe cookies", power: 3, price: Math.pow(10, 39)});
Game.CookieUpgrade({name: "Flavor text cookie",
	desc: "What you're currently reading is what gives this cookie its inimitable flavor.",
	icon: [22, 30], require: "Box of maybe cookies", power: 4, price: Math.pow(10, 41)});
Game.CookieUpgrade({name: "High-definition cookie",
	desc: "Uncomfortably detailed, like those weird stories your aunt keeps telling at parties.",
	icon: [28, 10], require: "Box of maybe cookies", power: 5, price: Math.pow(10, 43)});

order = 10060;
Game.CookieUpgrade({name: "Toast",
	desc: "A crisp slice of bread, begging for some butter and jam.<br>Why do people keep proposing these at parties?",
	icon: [27, 10], require: "Box of not cookies", power: 4, price: Math.pow(10, 34)});
Game.CookieUpgrade({name: "Peanut butter & jelly",
	desc: "It's time.",
	icon: [29, 9], require: "Box of not cookies", power: 4, price: Math.pow(10, 36)});
Game.CookieUpgrade({name: "Wookies",
	desc: "These aren't the cookies you're looking for.",
	icon: [26, 30], require: "Box of not cookies", power: 4, price: Math.pow(10, 38)});
Game.CookieUpgrade({name: "Cheeseburger",
	desc: "Absolutely no relation to cookies whatsoever - Orteil just wanted an excuse to draw a cheeseburger.",
	icon: [28, 30], require: "Box of not cookies", power: 4, price: Math.pow(10, 40)});
Game.CookieUpgrade({name: "One lone chocolate chip",
	desc: "The start of something beautiful.",
	icon: [27, 30], require: "Box of not cookies", power: 1, price: Math.pow(10, 42)});

new Game.Upgrade("Genius accounting",
	loc("Unlocks <b>extra price information</b>.<br>Each displayed cost now specifies how long it'll take you to afford it, and how much of your bank it represents.") + "<q>There's no accounting for taste, and yet here we are.</q>",
	2000000, [11, 10], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Shimmering veil",
	loc("Unlocks the <b>shimmering veil</b>, a switch that passively boosts your CpS by <b>%1%</b>.<br>You start with the veil turned on; however, it is very fragile, and clicking the big cookie or any golden cookie or reindeer will turn it off, requiring %2 of CpS to turn back on.", [50, Game.sayTime(24 * 60 * 60 * Game.fps, 2)]) + "<q>Hands off!</q>",
	999999999, [9, 10], {pool: "prestige", groups: "misc"});

order = 40005;
descFunc = function () {
	var boost = Game.getVeilBoost();
	var resist = Game.getVeilDefense();
	return (this.name == "Shimmering veil [on]" ?
		'<div class="alignCenter">' + loc("Active.") + '</div><div class="line"></div>' : "") +
			loc("Boosts your cookie production by <b>%1%</b> when active.<br>The veil is very fragile and will break if you click the big cookie or any golden cookies or reindeer.<br><br>Once broken, turning the veil back on costs %2 of unbuffed CpS.", [Game.Beautify(boost * 100), Game.sayTime(24 * 60 * 60 * Game.fps, 2)]) +
			(resist > 0 ? ("<br><br>" + loc("Has a <b>%1%</b> chance to not break.", Game.Beautify(resist * 100))) : "");
};
new Game.Upgrade("Shimmering veil [off]",
	"",
	1000000, [9, 10], {pool: "toggle", groups: "bonus|globalCpsMod", isParent: true, priceFunc: function () { return Game.unbuffedCookiesPs * 60 * 60 * 24; }, descFunc: descFunc});
var sVeil = Game.last;
new Game.Upgrade("Shimmering veil [on]",
	"",
	0, [9, 10], {pool: "toggle", groups: "bonus|globalCpsMod", toggleInto: sVeil, isChild: true, setCpsNegative: true, descFunc: descFunc});
sVeil.toggleInto = Game.last;

var getCookiePrice = function (level) { return 999999999999999999999999999999999999999 * Math.pow(10, (level - 1) / 2); };

order = 10020;
Game.CookieUpgrade({name: "Whoopie pies",
	desc: "Two chocolate halves joined together by a cream filling. It's got no eyebrows, but you never noticed until now.",
	icon: [21, 31], power: 5, price: getCookiePrice(1)});
Game.CookieUpgrade({name: "Caramel wafer biscuits",
	desc: "Coated in delicious chocolate. As many layers as you'll get in a biscuit without involving onions.",
	icon: [22, 31], power: 5, price: getCookiePrice(2)});
Game.CookieUpgrade({name: "Chocolate chip mocha cookies",
	desc: "Mocha started out as an excuse to smuggle chocolate into coffee. And now, in a poignant display of diplomacy and cultural exchange, it's bringing coffee to chocolate cookies.",
	icon: [23, 31], power: 5, price: getCookiePrice(3)});
Game.CookieUpgrade({name: "Earl Grey cookies",
	desc: "Captain Picard's favorite.",
	icon: [24, 31], power: 5, price: getCookiePrice(4)});
Game.CookieUpgrade({name: "Corn syrup cookies",
	desc: "The corn syrup makes it extra chewy. Not the type of stuff you'd think to put in a cookie, but bakers make do.",
	icon: [25, 31], power: 5, price: getCookiePrice(5)});
Game.CookieUpgrade({name: "Icebox cookies",
	desc: "Can be prepared in a variety of shapes with a variety of ingredients. Made by freezing dough before baking it, mirroring a time-proven medieval torture practice. Gotta keep them guessing.",
	icon: [26, 31], power: 5, price: getCookiePrice(6)});
Game.CookieUpgrade({name: "Graham crackers",
	desc: "Inspired in their design by the wish to live a life of austere temperance, free from pleasure or cheer; it's no wonder these are so tasty.",
	icon: [27, 31], power: 5, price: getCookiePrice(7)});
Game.CookieUpgrade({name: "Hardtack",
	desc: "Extremely hard and, if we're being honest, extremely tack.<br>If you're considering eating this as a fun snack, you probably have other things to worry about than this game, like getting scurvy or your crew fomenting mutiny.",
	icon: [28, 31], power: 5, price: getCookiePrice(8)});
Game.CookieUpgrade({name: "Cornflake cookies",
	desc: "They're grrrrrroovy! Careful not to let it sit in your milk too long, lest you accidentally end up with a bowl of cereal and get confused.",
	icon: [29, 31], power: 5, price: getCookiePrice(9)});
Game.CookieUpgrade({name: "Tofu cookies",
	desc: "There's really two ways to go with tofu cooking; either it asserts itself in plain sight or it camouflages itself in the other ingredients. This happens to be the latter, and as such, you can't really tell the difference between this and a regular cookie, save for that one pixel on the left.",
	icon: [30, 31], power: 5, price: getCookiePrice(10)});
Game.CookieUpgrade({name: "Gluten-free cookies",
	desc: "Made with browned butter and milk to closely match the archetypal chocolate chip cookie.<br>For celiacs, a chance to indulge in a delicious risk-free pastry. For others, a strangely threatening confection whose empty eyes will never know heaven nor hell.",
	icon: [30, 30], power: 5, price: getCookiePrice(10)});
Game.CookieUpgrade({name: "Russian bread cookies",
	desc: "Also known as alphabet cookies; while most bakers follow the recipe to the letter, it is said that some substitute the flour for spelt. But don't take my word for it.",
	icon: [30, 29], power: 5, price: getCookiePrice(11)});
Game.CookieUpgrade({name: "Lebkuchen",
	desc: "Diverse cookies from Germany, fragrant with honey and spices, often baked around Christmas.<br>Once worn by warriors of old for protection in battle.<br>+5 STR, +20% magic resistance.",
	icon: [30, 28], power: 5, price: getCookiePrice(12)});
Game.CookieUpgrade({name: "Aachener Printen",
	desc: "The honey once used to sweeten these gingerbread-like treats has since been swapped out for beet sugar, providing another sad example of regressive evolution.",
	icon: [30, 27], power: 5, price: getCookiePrice(13)});
Game.CookieUpgrade({name: "Canistrelli",
	desc: "A dry biscuit flavored with anise and wine, tough like the people of Corsica where it comes from.",
	icon: [30, 26], power: 5, price: getCookiePrice(14)});
Game.CookieUpgrade({name: "Nice biscuits",
	desc: "Made with coconut and perfect with tea. Traces its origins to a French city so nice they named it that.",
	icon: [30, 25], power: 5, price: getCookiePrice(15)});
Game.CookieUpgrade({name: "French pure butter cookies",
	desc: "You can't tell what's stronger coming off these - the smell of butter or condescension.",
	icon: [31, 25], power: 5, price: getCookiePrice(16)});
Game.CookieUpgrade({name: "Petit beurre",
	desc: 'An unassuming biscuit whose name simply means "little butter". Famed and feared for its four ears and forty-eight teeth.<br>When it hears ya, it\'ll get ya...',
	icon: [31, 26], power: 5, price: getCookiePrice(16)});
Game.CookieUpgrade({name: "Nanaimo bars",
	desc: "A delicious no-bake pastry hailing from Canada. Probably beats eating straight-up snow with maple syrup poured on it, but what do I know.",
	icon: [31, 27], power: 5, price: getCookiePrice(17)});
Game.CookieUpgrade({name: "Berger cookies",
	desc: "Messily slathered with chocolate fudge, but one of the most popular bergers of Baltimore, along with the triple fried egg berger and the blue crab cheeseberger.",
	icon: [31, 28], power: 5, price: getCookiePrice(18)});
Game.CookieUpgrade({name: "Chinsuko",
	desc: "A little piece of Okinawa in cookie form. Part of a Japanese custom of selling sweets as souvenirs. But hey, pressed pennies are cool too.",
	icon: [31, 29], power: 5, price: getCookiePrice(19)});
Game.CookieUpgrade({name: "Panda koala biscuits",
	desc: "Assorted jungle animals with equally assorted fillings.<br>Comes in chocolate, strawberry, vanilla and green tea.<br>Eat them all before they go extinct!",
	icon: [31, 13], power: 5, price: getCookiePrice(19)});
Game.CookieUpgrade({name: "Putri salju",
	desc: 'A beloved Indonesian pastry; its name means "snow princess", for the powdered sugar it\'s coated with. Had we added these to Cookie Clicker some years ago, this is where we\'d make a reference to that one Disney movie, but it\'s probably time to let it go.',
	icon: [31, 30], power: 5, price: getCookiePrice(20)});
Game.CookieUpgrade({name: "Milk cookies",
	desc: "Best eaten with a tall glass of chocolate.",
	icon: [31, 31], power: 5, price: getCookiePrice(21)});

order = 9999;
Game.CookieUpgrade({name: "Cookie crumbs",
	desc: "There used to be a cookie here. Now there isn't.<br>Good heavens, what did you <i>DO?!</i>",
	icon: [30, 13], power: 1, require: "Legacy", price: 100});
Game.CookieUpgrade({name: "Chocolate chip cookie",
	desc: "This is the cookie you've been clicking this whole time. It looks a bit dented and nibbled on, but it's otherwise good as new.",
	icon: [10, 0], power: 10, require: "Legacy", price: 1000000000000});

new Game.Upgrade("Cosmic beginner's luck",
	loc("Prior to purchasing the <b>%1</b> upgrade in a run, random drops are <b>%2 times more common</b>.", [Game.getUpgradeName("Heavenly chip secret"), 5]) + "<q>Oh! A penny!<br>Oh! A priceless heirloom!<br>Oh! Another penny!</q>",
	999999999 * 15, [8, 10], {pool: "prestige"});
Game.getVeilDefense = function () {
	var n = 0;
	if (Game.HasUpgrade("Reinforced membrane")) { n += 0.1; }
	if (Game.HasUpgrade("Delicate touch")) { n += 0.1; }
	if (Game.HasUpgrade("Steadfast murmur")) { n += 0.1; }
	if (Game.HasUpgrade("Glittering edge")) { n += 0.1; }
	return n;
};
Game.getVeilBoost = function () {
	var n = 0.5;
	if (Game.HasUpgrade("Reinforced membrane")) { n += 0.1; }
	if (Game.HasUpgrade("Delicate touch")) { n += 0.05; }
	if (Game.HasUpgrade("Steadfast murmur")) { n += 0.05; }
	if (Game.HasUpgrade("Glittering edge")) { n += 0.05; }
	return n;
};
new Game.Upgrade("Reinforced membrane",
	loc("The <b>shimmering veil</b> is more resistant, and has a <b>%1% chance</b> not to break. It also gives <b>+%2%</b> more CpS.", [10, 10]) + "<q>A consistency between jellyfish and cling wrap.</q>",
	999999999 * 15, [7, 10], {pool: "prestige"});

order = 255;
Game.GrandmaSynergy("Binary grandmas", 'A digital grandma to transfer more cookies.<br>(See also : boolean grandmas, string grandmas, and not-a-number grandmas, also known as "NaNs".)', "Javascript console");

order = 1400;
Game.TieredUpgrade("The JavaScript console for dummies",
	'<q>This should get you started. The first line reads: "To open the javascript console, press-"<br>...the rest of the book is soaked in chocolate milk. If only there was a way to look up this sort of information...</q>',
	"Javascript console", 1);
Game.TieredUpgrade("64bit arrays",
	"<q>A long-form variable type to pack your cookies much more efficiently.</q>",
	"Javascript console", 2);
Game.TieredUpgrade("Stack overflow",
	"<q>This is really bad! You probably forgot to close a loop somewhere and now your programs are going crazy! The rest of your engineers seem really excited about it somehow. How could a software mishap like a stack overflow possibly ever help anyone?</q>",
	"Javascript console", 3);
Game.TieredUpgrade("Enterprise compiler",
	"<q>This bespoke javascript compiler took your team years of development and billions in research, but it should let you execute (certain) functions (up to) 2% faster (in optimal circumstances).</q>",
	"Javascript console", 4);
Game.TieredUpgrade("Syntactic sugar",
	"<q>Tastier code for tastier cookies.</q>",
	"Javascript console", 5);
Game.TieredUpgrade("A nice cup of coffee",
	"<q>All this nerd stuff has you exhausted. You make yourself a nice cup of coffee, brewed with roasted beans from some far-away island. You may have been working a bit too hard though - the cup of coffee starts talking to you, insisting that it is NOT javascript.</q>",
	"Javascript console", 6);
Game.TieredUpgrade("Just-in-time baking",
	"<q>A new method of preparing cookies; they bake themselves right in front of the customers before eating, leaving your kitchens mess-free.</q>",
	"Javascript console", 7);
Game.TieredUpgrade("cookies++",
	'<q>Your very own cookie-themed programming language, elegantly named after its most interesting ability - increasing the "cookies" variable by 1.</q>',
	"Javascript console", 8);
Game.TieredUpgrade("Software updates",
	"<q>This is grand news - someone's finally figured out the Wifi password, and your newfound internet connection seems to have triggered a whole lot of software updates! Your browsers, drivers and plugins all received a fresh coat of paint, and your javascript version has been updated to the latest ECMAScript specification. It's really too bad thousands had to die due to some deprecated function in your neurotoxin ventilation code, but I guess that's progress for you.</q>",
	"Javascript console", 9);
Game.TieredUpgrade("Game.Loop",
	"<q>You're not quite sure what to make of this. What does it mean? What does it do? Who would leave something like that just laying around here? Try asking again in 1/30th of a second.</q>",
	"Javascript console", 10);
Game.TieredUpgrade("eval()",
	"<q>It is said that this simple function holds the key to the universe, and that whosoever masters it may shape reality to their will.<br>Good thing you have no idea how it works. Makes for a neat plaque on your wall, though.</q>",
	"Javascript console", 11);

order = 5000;
Game.SynergyUpgrade("Script grannies",
	"<q>Armies of energy drink-fueled grandmas ready to hack into the cyberspace for renegade e-cookies.</q>",
	"Javascript console", "Grandma", "synergy1");
Game.SynergyUpgrade("Tombola computing",
	"",
	"Javascript console", "Chancemaker", "synergy2");
if (EN) {
	Game.last.descFunc = function () {
		Math.seedrandom(Game.seed + "-tombolacomputing");
		var str = "(Your ticket reads " + Math.floor(Math.random() * 100) + " " + Math.floor(Math.random() * 100) + " " + Math.floor(Math.random() * 100) + " " + Math.floor(Math.random() * 100) + ", entitling you to " + Game.choose([Math.floor(Math.random() * 5 + 2) + " lines of javascript", "one free use of Math.random()", "one qubit, whatever that is", "one half-eaten cookie", "a brand new vacuum cleaner", "most of one room-temperature cup of orange soda", "one really good sandwich", "one handful of pocket lint", "someone's mostly clean hairpiece", "a trip to a fancy restaurant", "the knowledge of those numbers", "a furtive glance at the news ticker", "another ticket, half-price", "all-you-can-eat moldy bread", "one lifetime supply of oxygen", "the color " + Game.choose["red", "orange", "yellow", "green", "blue", "purple", "black", "white", "gray", "brown", "pink", "teal"], "increased intellect for a limited time", "an ancient runesword", "the throne of a far-away country", "the position of Mafia capo. Good luck", "one free time-travel week-end", "something beautiful", "the deed to some oil well", "one hamburger made out of the animal, plant, or person of your choice", "the last surviving " + Game.choose["dodo bird", "thylacine", "unicorn", "dinosaur", "neanderthal"], "a deep feeling of accomplishment", "a fleeting tinge of entertainment", "a vague sense of unease", "deep existential dread", "one extra week added to your lifespan", "breathe manually", "blink right here and now", "one meeting with any famous person, living or dead, in your next dream", "one very nice dream", "a wacky sound effect", "45 seconds of moral flexibility", 'hundreds and thousands, also known as "sprinkles"', "one circle, triangle, square or other simple geometric shape, of average dimensions", "just this extra bit of randomness", "the extra push you needed to turn your life around", "a good fright", "one secret superpower", "a better luck next time", "an irrational phobia of tombola tickets", "one whole spider", "an increased sense of self-worth and determination", "inner peace", "one double-XP week-end in the MMORPG of your choice", "a little piece of the universe, represented by the trillions of atoms that make up this very ticket", "food poisoning", "the Moon! Well, conceptually", "a new car, baby", "a new catchphrase", "an intrusive thought of your choice", "- ...aw man, it just cuts off there", "the director spot for the next big hit movie", "really good-looking calves", "one genuine pirate golden doubloon", '"treasure and riches", or something', "one boat, sunken", "baby shoes, never worn", "direct lineage to some King or Queen", "innate knowledge of a dead language you'll never encounter", "the melody of a song you don't know the words to", "white noise", "mild physical impairment", "a new pair of lips", "things, and such", "one popular expression bearing your name", "one typo", "one get-out-of-jail-free card", "the rest of your life... for now", "one polite huff", "a condescending stare", "one cursed monkey paw", "true love, probably", "an interesting factoid about the animal, country, TV show or celebrity of your choice", "a pop culture reference", "minutes of fun", 'the etymology of the word "tombola" - it\'s Italian for "a tumble"', "nothing. You lost, sorry"]) + ".)";
		Math.seedrandom();
		return this.desc + "<q>Like quantum computing, but more fun.<br>" + str + "</q>";
	};
} else {
	Game.last.setDescription("<q>-</q>");
}

order = 10020;
Game.CookieUpgrade({name: "Kruidnoten",
	desc: 'A festive dutch favorite; tiny cinnamony bites sometimes coated in chocolate. The name translates roughly to "kruidnoten".',
	icon: [30, 3], power: 5, price: getCookiePrice(22)});
Game.CookieUpgrade({name: "Marie biscuits",
	desc: "Pleasantly round, smoothly buttery, subtly vanilla-flavored, ornately embossed, each ridge represents a person Marie killed in prison.",
	icon: [30, 4], power: 5, price: getCookiePrice(23)});
Game.CookieUpgrade({name: "Meringue cookies",
	desc: "Probably the most exciting thing you can make out of egg whites. Also called forgotten cookies, due to the recipe being once lost in a sealed mystical vault for 10,000 years.",
	icon: [31, 4], power: 5, price: getCookiePrice(24)});

order = 10060;
Game.CookieUpgrade({name: "Pizza",
	desc: "What is a pizza if not a large, chewy cookie, frosted with a rather exuberant tomato & cheese icing? Not a cookie, that's what.",
	icon: [31, 9], require: "Box of not cookies", power: 5, price: Math.pow(10, 44)});

order = 10050;
Game.CookieUpgrade({name: "Crackers",
	desc: 'These are the non-flavored kind with no salt added. Really just a judgment-free wheat square begging to have bits of ham and spreadable cheese piled onto it, its main contribution being "crunchy".',
	icon: [30, 9], require: "Box of maybe cookies", power: 4, price: Math.pow(10, 45)});

order = 10030;
Game.CookieUpgrade({name: "Havabreaks",
	desc: "You can snap the sections neatly or just bite into the whole thing like some kind of lunatic. Some oversea countries manufacture these in hundreds of unique flavors, such as green tea, lobster bisque, and dark chocolate.",
	icon: [31, 3], require: "Box of brand biscuits", power: 2, price: 999999999999999999999999999 * 5});

order = 20000;
new Game.Upgrade("Kitten executives",
	strKittenDesc + "<q>ready to execute whatever and whoever you'd like, sir</q>",
	900000000000000000000000000000000000000000000, Game.GetIcon("Kitten", 13), {tier: 13, groups: "kitten:12"});

order = 10020;
Game.CookieUpgrade({name: "Chai tea cookies",
	desc: "Not exactly Captain Picard's favorite, but I mean, these will do in a pinch.",
	icon: [23, 32], power: 5, price: getCookiePrice(4) + 5});
Game.last.order = 10020.5685;

Game.CookieUpgrade({name: "Yogurt cookies",
	desc: "Augmented by the wonders of dairy, these cookies are light and fluffy and just one more thing for the lactose-intolerant to avoid.<br>Truly for the cultured among us.",
	icon: [24, 32], power: 5, price: getCookiePrice(25)});
Game.CookieUpgrade({name: "Thumbprint cookies",
	desc: "Filled with jam and sometimes served in little paper cups. No longer admissible as biometric evidence in court. We're not having a repeat of that whole mess.",
	icon: [25, 32], power: 5, price: getCookiePrice(26)});
Game.CookieUpgrade({name: "Pizzelle",
	desc: "Thin, crisp waffle cookies baked in a bespoke iron following an ancient Italian recipe.<br>These cookies have been around for a long, long time.<br>These cookies have seen things.",
	icon: [26, 32], power: 5, price: getCookiePrice(27)});

order = 10030;
Game.CookieUpgrade({name: "Zilla wafers",
	desc: "Popular vanilla-flavored biscuits that somehow keep ending up in banana pudding.<br>Themed after a beloved radioactive prehistoric monster, for some reason.",
	icon: [22, 32], require: "Box of brand biscuits", power: 2, price: 999999999999999999999999999999 * 5});
Game.CookieUpgrade({name: "Dim Dams",
	desc: "Two biscuits joined by chocolate and coated in even more chocolate.<br>You wonder - which one is the dim, and which one is the dam?",
	icon: [31, 10], require: "Box of brand biscuits", power: 2, price: 999999999999999999999999999999999 * 5});

order = 10060;
Game.CookieUpgrade({name: "Candy",
	desc: "There are two pillars to the world of sweets : pastries, of course - and candy.<br>You could make a whole new game just about these, but for now, please enjoy these assorted generic treats.",
	icon: [30, 10], require: "Box of not cookies", power: 5, price: Math.pow(10, 46)});

order = 19000;
Game.TieredUpgrade("Fortune #001",
	"<q>Fingers are not the only thing you can count on.</q>",
	"Cursor", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #002",
	"<q>A wrinkle is a crack in a mundane facade.</q>",
	"Grandma", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #003",
	"<q>The seeds of tomorrow already lie within the seeds of today.</q>",
	"Farm", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #004",
	"<q>Riches from deep under elevate you all the same.</q>",
	"Mine", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #005",
	"<q>True worth is not in what you find, but in what you make.</q>",
	"Factory", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #006",
	"<q>The value of money means nothing to a pocket.</q>",
	"Bank", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #007",
	"<q>Not all guides deserve worship.</q>",
	"Temple", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #008",
	"<q>Magic is about two things - showmanship, and rabbits.</q>",
	"Wizard tower", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #009",
	"<q>Every mile travelled expands the mind by just as much.</q>",
	"Shipment", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #010",
	"<q>Change what you cannot accept. Furthermore: accept nothing.</q>",
	"Alchemy lab", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #011",
	"<q>Every doorway is a gamble. Tread with care.</q>",
	"Portal", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #012",
	"<q>Do your future self a favor; they'll thank you for it.</q>",
	"Time machine", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #013",
	"<q>The world is made of what we put into it.</q>",
	"Antimatter condenser", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #014",
	"<q>Staring at a dazzling light can blind you back to darkness.</q>",
	"Prism", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #015",
	"<q>Don't leave to blind chance what you could accomplish with deaf skill.</q>",
	"Chancemaker", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #016",
	"<q>It's good to see yourself in others. Remember to see yourself in yourself, too.</q>",
	"Fractal engine", "fortune", {groups: "priceReduction|clearBuildCache"});
Game.TieredUpgrade("Fortune #017",
	"<q>If things aren't working out for you, rewrite the rules.</q>",
	"Javascript console", "fortune", {groups: "priceReduction|clearBuildCache"});

order = 19100;
//note : price for these capped to base price OR 1 day of unbuffed CpS
priceFunc = function () { return Math.min(this.basePrice, Game.unbuffedCookiesPs * 60 * 60 * 24); };
new Game.Upgrade("Fortune #100",
	loc("All buildings and upgrades are <b>%1% cheaper</b>.", 1) + " " + loc("Cookie production multiplier <b>+%1%</b>.", 1) + "<q>True wealth is counted in gifts.</q>",
	Game.Tiers["fortune"].price * 100000, [0, 0], {tier: "fortune", col: 10, priceFunc: priceFunc, groups: "fortune|priceReduction|plus:1.01"});
new Game.Upgrade("Fortune #101",
	loc("Cookie production multiplier <b>+%1%</b>.", 7) + "<q>Some people dream of fortunes; others dream of cookies.</q>",
	Game.Tiers["fortune"].price * 100000000, [0, 0], {tier: "fortune", col: 10, priceFunc: priceFunc, groups: "fortune|plus:1.07"});
new Game.Upgrade("Fortune #102",
	loc("You gain another <b>+%1%</b> of your regular CpS while the game is closed.", 1) + " <small>(" + loc("Must own the %1 upgrade.", Game.getUpgradeName("Twin Gates of Transcendence")) + ")</small>" + "<q>Help, I'm trapped in a <span class=\"steamOnly\">computer</span><span class=\"webOnly\">browser</span> game!</q>",
	Game.Tiers["fortune"].price * 100000000000, [0, 0], {tier: "fortune", col: 10, priceFunc: priceFunc, groups: "fortune|misc"});
new Game.Upgrade("Fortune #103",
	strKittenDesc + "<q>Don't believe the superstitions; all cats are good luck.</q>",
	Game.Tiers["fortune"].price * 100000000000000, [0, 0], {tier: "fortune", col: 18, priceFunc: priceFunc, groups: "fortune|kitten"});
new Game.Upgrade("Fortune #104",
	getStrClickingGains(1) + "<q>Remember to stay in touch.</q>",
	Game.Tiers["fortune"].price * 100000000000, [0, 0], {tier: "fortune", col: 11, priceFunc: priceFunc, groups: "fortune|click|onlyClick|clickPercent"});

new Game.Upgrade("Fortune cookies",
	loc("The news ticker may occasionally have <b>fortunes</b>, which may be clicked for something good.") + "<q>These don't taste all that great but that's not really the point, is it?</q>",
	77777777777, [29, 8], {pool: "prestige"});

order = 40000;
new Game.Upgrade("A really good guide book",
	loc("<b>???</b>") + "<q>??????</q>",
	7, [22, 12], {pool: "debug", groups: "misc"}); //debug purposes only

order = 10300;
Game.CookieUpgrade({name: "Prism heart biscuits",
	desc: "An every-flavor biscuit that stands for universal love and being true to yourself.",
	require: "Eternal heart biscuits", season: "valentines", icon: [30, 8], power: heartPower, price: 1000000000000000000000000, groups: "valentines|valentinesAch"});
Game.last.order = 10300.175;

order = 19100;
new Game.Upgrade("Kitten wages",
	loc("Through clever accounting, this actually makes kitten upgrades <b>%1% cheaper</b>.", 10) + "<q>Cats can have little a salary, as a treat.<br>Cats are expert hagglers and have a keen sense of bargaining, especially in the case of cash.</q>",
	9000000000, [31, 8], {pool: "prestige", groups: "kitten|priceReduction"});
new Game.Upgrade("Pet the dragon",
	loc("Unlocks the ability to <b>pet your dragon</b> by clicking on it once hatched.") + "<q>Dragons do not purr. If your dragon starts purring, vacate the area immediately.</q>",
	99999999999, [30, 12], {pool: "prestige"});

order = 25100;
var dragonDropUpgradeCost = function () { return Game.unbuffedCookiesPs * 60 * 30 * ((Game.dragonLevel < Game.dragonLevelMax) ? 1 : 0.1); };
new Game.Upgrade("Dragon scale",
	getStrCookieProductionMultiplierPlus(3) + "<br>" + loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.", 10) + "<q>Your dragon sheds these regularly, so this one probably won't be missed.<br>Note: icon not to scale.</q>",
	999, [30, 14], {priceFunc: dragonDropUpgradeCost, groups: "plus:1.03"});
new Game.Upgrade("Dragon claw",
	loc("Clicking is <b>%1%</b> more powerful.", 3) + "<br>" + loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.", 10) + "<q>Will grow back in a few days' time.<br>A six-inch retractable claw, like a razor, from the middle toe. So you know, try to show a little respect.</q>",
	999, [31, 14], {priceFunc: dragonDropUpgradeCost, groups: "click|onlyClick"});
new Game.Upgrade("Dragon fang",
	loc("Golden cookies give <b>%1%</b> more cookies.", 3) + "<br>" + loc("Dragon harvest and Dragonflight are <b>%1% stronger</b>.", 10) + "<br>" + loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.", 10) + "<q>Just a fallen baby tooth your dragon wanted you to have, as a gift.<br>It might be smaller than an adult tooth, but it's still frighteningly sharp - and displays some awe-inspiring cavities, which you might expect from a creature made out of sweets.</q>",
	999, [30, 15], {priceFunc: dragonDropUpgradeCost, groups: "goldCookie|misc"});
new Game.Upgrade("Dragon teddy bear",
	loc("Random drops are <b>%1% more common</b>.", 3) + "<br>" + loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.", 10) + "<q>Your dragon used to sleep with this, but it's yours now.<br>Crafted in the likeliness of a fearsome beast. Stuffed with magical herbs picked long ago by a wandering wizard. Woven from elven yarn and a polyester blend.</q>",
	999, [31, 15], {priceFunc: dragonDropUpgradeCost, groups: "misc"});

order = 10020;
Game.CookieUpgrade({name: "Granola cookies",
	desc: "Wait! These are just oatmeal cookies mixed with raisin cookies! What next, half-dark chocolate half-white chocolate cookies?",
	icon: [28, 32], power: 5, price: getCookiePrice(28)});
Game.CookieUpgrade({name: "Ricotta cookies",
	desc: "Light and cake-like. Often flavored with lemon or almond extract. Sprinkles optional. Allegedly Italian. Investigation pending.",
	icon: [29, 32], power: 5, price: getCookiePrice(29)});
Game.CookieUpgrade({name: "Roze koeken",
	desc: "The icing on these Dutch cookies is traditionally pink, but different colors may be used for special occasions - such as pink to celebrate Breast Cancer Awareness Month, or for International Flamingo Day, pink.",
	icon: [30, 32], power: 5, price: getCookiePrice(30)});
Game.CookieUpgrade({name: "Peanut butter cup cookies",
	desc: "What more poignant example of modern societal struggles than the brazen reclaiming of a corporate product by integrating it in the vastly more authentic shell of a homemade undertaking? Anyway this is a peanut butter cup, baked into a cookie. It's pretty good!",
	icon: [31, 32], power: 5, price: getCookiePrice(31)});
Game.CookieUpgrade({name: "Sesame cookies",
	desc: "Look at all the little seeds on these! It's like someone dropped them on the street or something! A very welcoming and educational street!",
	icon: [22, 33], power: 5, price: getCookiePrice(32)});
Game.CookieUpgrade({name: "Taiyaki",
	desc: "A pastry fish filled with red bean paste, doomed to live an existence of constant and excruciating pain as its aquatic environment slowly dissolves its soft doughy body.<br>Also comes in chocolate flavor!",
	icon: [23, 33], power: 5, price: getCookiePrice(33)});
Game.CookieUpgrade({name: "Vanillekipferl",
	desc: "Nut-based cookies from Central Europe, coated in powdered vanilla sugar. Regular kipferl, crescent-shaped bread rolls from the same region, are much less exciting.",
	icon: [24, 33], power: 5, price: getCookiePrice(34)});

order = 10300;
Game.CookieUpgrade({name: "Cosmic chocolate butter biscuit",
	desc: "Rewarded for owning 550 of everything.<br>Through some strange trick of magic or technology, looking at this cookie is like peering into a deep ocean of ancient stars. The origins of this biscuit are unknown; its manufacture, as far as your best investigators can tell, left no paper trail. From a certain angle, if you squint hard enough, you'll notice that a number of stars near the center are arranged to resemble the outline of your own face.",
	icon: [27, 32], power: 10, price: 999999999999999999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(550)});

order = 100;
new Game.Upgrade("Nonillion fingers",
	getStrThousandFingersGain(20) + "<q>Only for the freakiest handshakes.</q>",
	10000000000000000000000000, [12, 31], {tier: 13, col: 0, groups: "cursor:450|click"});
order = 150;
new Game.Upgrade("Miraculite mouse",
	getStrClickingGains(1) + "<q>Composed of a material that neither science nor philosophy are equipped to conceptualize. And boy, does it ever click.</q>",
	50000000000000000000000000000, [11, 31], {tier: 13, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});
order = 200;
Game.TieredUpgrade("Generation degeneration",
	"<q>Genetic testing shows that most of your grandmas are infected with a strange degenerative disease that only seems to further their powers; the more time passes, the older they get. This should concern you.</q>",
	"Grandma", 12);
order = 300;
Game.TieredUpgrade("Global seed vault",
	"<q>An enormous genetic repository that could outlive an apocalypse. Guarantees the survival of your empire, or at the very least its agricultural components, should civilization fall. Which should be any day now.</q>",
	"Farm", 12);
order = 400;
Game.TieredUpgrade("Air mining",
	"<q>You've dug your drills through just about every solid surface you could find. But did you know recent advances have revealed untold riches hiding within non-solid surfaces too?</q>",
	"Mine", 12);
order = 500;
Game.TieredUpgrade("Behavioral reframing",
	'<q>Through careful social engineering you\'ve convinced your workers that "union" is a slur that only the most vile and repugnant filth among us would ever dare utter! Sometimes progress isn\'t in the big machines, it\'s in the little lies!</q>',
	"Factory", 12);
order = 525;
Game.TieredUpgrade("Altruistic loop",
	"<q>You control so many branches of the global economy and legislative bodies that, through a particularly creative loophole, donating money (to yourself) grants you even more cash in tax deductions than you started with!</q>",
	"Bank", 12);
order = 550;
Game.TieredUpgrade("A novel idea",
	"<q>You don't get rich starting a religion. If you want to get rich, you write science fiction.</q>",
	"Temple", 12);
order = 575;
Game.TieredUpgrade("Spelling bees",
	"<q>You've unleashed a swarm of magically-enhanced bees upon mankind! Their stinging spells may be the bane of all living things but you're certain you can put their delicious, purple, fizzy honey to good use!</q>",
	"Wizard tower", 12);
order = 600;
Game.TieredUpgrade("Toroid universe",
	"<q>If you think of the universe as an nth-dimensional torus that wraps back on itself in every direction, you can save a fortune on rocket fuel! Of course the universe isn't actually shaped like that, but you've never let details stand in your way.</q>",
	"Shipment", 12);
order = 700;
Game.TieredUpgrade("Hermetic reconciliation",
	"<q>It's time for modern science and the mystical domains of the occult to work together at last. What do gravitons transmute into? What if alkahest is pH-neutral? Should a homunculus have the right to vote? And other exciting questions coming to you soon, whether you like it or not.</q>",
	"Alchemy lab", 12);
order = 800;
Game.TieredUpgrade("His advent",
	"<q>He comes! He comes at last! Just like the prophecies foretold! And as He steps out of the portal, your engineers begin slicing Him into convenient chunks before transporting His writhing cosmic flesh to your factories, where He will be processed and converted into a new and exciting cookie flavor, available in stores tomorrow.</q>",
	"Portal", 12);
order = 900;
Game.TieredUpgrade("Split seconds",
	"<q>Time is infinite, yes... But what if, nestled within each second, were even more infinities? Every moment an eternity! Think of how many scheduling troubles this solves!</q>",
	"Time machine", 12);
order = 1000;
Game.TieredUpgrade("Flavor itself",
	"<q>Deep under the earth, in the most sterile laboratory, in the most vast and expensive particle accelerator ever devised, your scientists have synthesized -for a fraction of a second- the physical manifestation of pure flavor. Highly unstable, and gone in a puff of radioactive energy, it nonetheless left your team shivering with awe... and hunger.</q>",
	"Antimatter condenser", 12);
order = 1100;
Game.TieredUpgrade("Light speed limit",
	"<q>Whoah, slow down. Harvesting light is well and good but it'd be much easier if it weren't so dang fast! This should thankfully take care of that.</q>",
	"Prism", 12);
order = 1200;
Game.TieredUpgrade("A touch of determinism",
	"<q>By knowing the exact position and movement of every particle in the universe, you're able to predict everything that can ever happen, leaving nothing to chance. This was a doozy to pull off mind you, but it's helped you win 50 bucks at the horse races so you could say it's already paying off.</q>",
	"Chancemaker", 12);
order = 1300;
Game.TieredUpgrade("This upgrade",
	"<q>This upgrade's flavor text likes to refer to itself, as well as to the fact that it likes to refer to itself. You should really buy this upgrade before it starts doing anything more obnoxious.</q>",
	"Fractal engine", 12);
order = 1400;
Game.TieredUpgrade("Your biggest fans",
	"<q>Let's face it, baking cookies isn't the most optimized thing there is. So you've purchased your biggest fans yet and stuck them next to your computers to keep things chill and in working order. Cool!</q>",
	"Javascript console", 12);

order = 10020;
Game.CookieUpgrade({name: "Battenberg biscuits",
	desc: "Inspired by a cake of the same name, itself named after a prince of the same name. You suppose you could play a really, really short game of chess on these.",
	icon: [28, 33], power: 5, price: getCookiePrice(35)});
Game.CookieUpgrade({name: "Rosette cookies",
	desc: "Intricate fried pastries from Northern Europe, made using specialized irons and dipped in icing sugar. While usually eaten as a delicious treat, these are often also used as Christmas tree decorations, or worn elegantly on one's lapel to symbolize the nah I'm just messing with you.",
	icon: [26, 33], power: 5, price: getCookiePrice(36)});
Game.CookieUpgrade({name: "Gangmakers",
	desc: "The little bit of raspberry jam at its center is crucial; a plain butter cookie with chocolate topping does not a gangmaker make.",
	icon: [27, 33], power: 5, price: getCookiePrice(37)});
Game.CookieUpgrade({name: "Welsh cookies",
	desc: "Welsh cookies, also known as Welsh cakes, bakestones, griddle cakes, griddle scones, or pics, or in Welsh: <i>picau ar y maen, pice bach, cacennau cri</i> or <i>teisennau gradell</i>, are rich currant-filled scone-like biscuits of uncertain origin.",
	icon: [29, 33], power: 5, price: getCookiePrice(38)});
Game.CookieUpgrade({name: "Raspberry cheesecake cookies",
	desc: "The humble raspberry cheesecake, now in ascended cookie form. Researchers posit that raspberry cheesecake cookies are evidence that the final form of every baked good, through convergent evolution, approaches that of a cookie, in a process known as cookienisation.",
	icon: [25, 33], power: 5, price: getCookiePrice(39)});

order = 255;
Game.GrandmaSynergy("Alternate grandmas", "A different grandma to bake something else.", "Idleverse");

order = 1500;
Game.TieredUpgrade("Manifest destiny",
	"<q>While the ethics of ransacking parallel universes for their riches may seem questionable to some, you've reasoned that bringing the good word of your cookie empire to the unwashed confines of other realities is your moral duty, nay, your righteous imperative, and must be undertaken as soon as possible, lest they do it to you first!</q>",
	"Idleverse", 1);
Game.TieredUpgrade("The multiverse in a nutshell",
	'<q>The structure of the metacosmos may seem confusing and at times even contradictory, but here\'s what you\'ve gathered so far:<br><br><div style="text-align:left;">&bull; each reality, or "idleverse", exists in parallel to all others<br><br>&bull; most realities seem to converge towards the production of a sole type of item (ours evidently being, thanks to you, cookies)<br><br>&bull; each reality is riddled with chaotic tunnels to a number of subordinate dimensions (such as the so-called "cookieverse"), much like swiss cheese<br><br>&bull; all realities bathe in an infinite liquid of peculiar properties, colloquially known as "milk"</div><br>Finally, each reality may have its own interpretation of the concept of "reality", for added fun.</q>',
	"Idleverse", 2);
Game.TieredUpgrade("All-conversion",
	"<q>It's quite nice that you can rewire the logic of each universe to generate cookies instead, but you still end up with parsec-loads of whatever they were producing before - baubles you've long made obsolete: cash money, gems, cheeseburgers, puppies... That's why you've designed the universal converter, compatible with any substance and capable of turning those useless spoils of conquest into the reassuring crumbly rustle of even more cookies.</q>",
	"Idleverse", 3);
Game.TieredUpgrade("Multiverse agents",
	"<q>You can send undercover spies to infiltrate each universe and have them signal you whether it's worth overtaking. Once the assimilation process started, they will also help pacify the local populations, having established trust through the use of wacky, but seamless, disguises.</q>",
	"Idleverse", 4);
Game.TieredUpgrade("Escape plan",
	"<q>You've set an idleverse aside and terraformed it to closely resemble this one in case something goes horribly wrong in here. Of course, the denizens of that idleverse also have their own escape idleverse to abscond to in the eventuality of your arrival, itself likely having its own contingency idleverse, and so on.</q>",
	"Idleverse", 5);
Game.TieredUpgrade("Game design",
	"<q>Each idleverse functions according to some form of transcendental programming, that much is a given. But they also seem to be governed by much more subtle rules, the logic of which, when harnessed, may give you unparalleled dominion over the multiverse. Rewrite the rules! A game designer is you!</q>",
	"Idleverse", 6);
Game.TieredUpgrade("Sandbox universes",
	"<q>It doesn't seem like you'll run out of extra universes anytime soon so why not repurpose some of them as consequence-free testing grounds for all your more existentially threatening market research? (...consequence-free for you, anyway.)</q>",
	"Idleverse", 7);
Game.TieredUpgrade("Multiverse wars",
	"<q>Hmm, looks like some other universes wised up to your plundering. Thankfully, that's nothing your extra beefed-up metacosmic military budget can't handle!</q>",
	"Idleverse", 8);
Game.TieredUpgrade("Mobile ports",
	"<q>Accessing each outer universe is a bit of a hassle, requiring the once-in-a-blue-moon alignment of natural cosmic ports to transit from universe to universe. You've finally perfected the method of constructing your own self-propelled ports, which can travel near-instantaneously along universal perimeters to permit headache-free multiverse connections. Took you long enough.</q>",
	"Idleverse", 9);
Game.TieredUpgrade("Encapsulated realities",
	"<q>Untold feats of science went into the reduction of infinite universes into these small, glimmering, easy-to-store little spheres. Exercise infinite caution when handling these, for each of them, containing endless galaxies and supporting endless life, is more precious than you can ever fathom. They've also proven to be quite a smash hit in your warehouses on bowling night.</q>",
	"Idleverse", 10);
Game.TieredUpgrade("Extrinsic clicking",
	"<q>If you poke an idleverse, it seems like it gets work done faster. It's also quite fun hearing a trillion terrified voices screaming in unison.</q>",
	"Idleverse", 11);
Game.TieredUpgrade("Universal idling",
	"<q>The nature of idleverses is found in waiting. The more you wait on an idleverse, the more exponentially potent it becomes - which saves you a whole lot of hard work. In a true act of zen, you've taken to biding your time when collecting new universes, letting them ripen like a fine wine.</q>",
	"Idleverse", 12);

order = 5000;
Game.SynergyUpgrade("Perforated mille-feuille cosmos",
	"<q>Imagine, if you will, layers upon layers upon layers. Now picture billions of worms chewing their way through it all. This roughly, but not quite, approximates the geometry of the most basal stratum of our natural world.</q>",
	"Idleverse", "Portal", "synergy1");
Game.SynergyUpgrade("Infraverses and superverses",
	"<q>Universes within universes? How subversive!</q>",
	"Idleverse", "Fractal engine", "synergy2");

order = 19000;
Game.TieredUpgrade("Fortune #018",
	"<q>There's plenty of everyone, but only one of you.</q>",
	"Idleverse", "fortune", {groups: "priceReduction|clearBuildCache"});

order = 10300;
Game.CookieUpgrade({name: "Butter biscuit (with butter)",
	desc: "Rewarded for owning 600 of everything.<br>This is a plain butter biscuit. It's got some butter on it. The butter doesn't look like anything in particular.",
	icon: [30, 33], power: 10, price: 999999999999999999999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(600)});

order = 200;
Game.TieredUpgrade("Visits",
	"<q>In an extensive double-blind study (sample size: 12 million), your researchers have found evidence that grandmas are up to twice as productive if you just come by and say hi once in a while. It's nice to check up on your grans! (Do not under any circumstances ingest any tea or tea-like substances the grandmas may offer you.)</q>",
	"Grandma", 13);
order = 300;
Game.TieredUpgrade("Reverse-veganism",
	"<q>Plants aren't for eating, plants are for exploitative agriculture and astronomical profit margins!</q>",
	"Farm", 13);
order = 400;
Game.TieredUpgrade("Caramel alloys",
	"<q>Your geologists have isolated a family of once-overlooked sugary ores that, when combined, may be turned into even more cookie ingredients. Your millions of miles of previously useless tunnels probably house insane amounts of the stuff!</q>",
	"Mine", 13);
order = 500;
Game.TieredUpgrade("The infinity engine",
	"<q>In this house, I guess we don't care much for the laws of thermodynamics.</q>",
	"Factory", 13);
order = 525;
Game.TieredUpgrade("Diminishing tax returns",
	"<q>Wow, they're tiny! Wish you'd thought of that sooner!</q>",
	"Bank", 13);
order = 550;
Game.TieredUpgrade("Apparitions",
	"<q>You've booked a deal with the higher-ups that schedules one weekly earthly apparition by a deity, angel, ascended prophet, or other holy figure. This should boost interest in cookie religion among youths as long as you can secure a decent time slot.</q>",
	"Temple", 13);
order = 575;
Game.TieredUpgrade("Wizard basements",
	"<q>You've received construction permits allowing you to build basements underneath each wizard tower. This provides a handy storage space for precious reagents, fizzled-out soul gems, and weird old magazines.</q>",
	"Wizard tower", 13);
order = 600;
Game.TieredUpgrade("Prime directive",
	"<q>An intergalactic delegation made you pinky-swear not to directly interact with lesser alien cultures. Which is fine, because it's much funnier to rob a planet blind when its inhabitants have no idea what's going on.</q>",
	"Shipment", 13);
order = 700;
Game.TieredUpgrade("Chromatic cycling",
	"<q>All states of matter exist in a continuous loop. Having learned how to cycle through them, all you have to do is to freeze matter right on the state you need. For reference, the cookie state of matter is situated at precisely 163.719&deg;, right between lamellar gas and metaplasma.</q>",
	"Alchemy lab", 13);
order = 800;
Game.TieredUpgrade("Domestic rifts",
	"<q>You've managed to manufacture portals that are convenient enough, and legally safe enough, that you can just stick them against walls inside buildings to connect rooms together in unusual configurations. In practice, this means your employees get to have much shorter bathroom breaks.</q>",
	"Portal", 13);
order = 900;
Game.TieredUpgrade("Patience abolished",
	"<q>You wait for no one.</q>",
	"Time machine", 13);
order = 1000;
Game.TieredUpgrade("Delicious pull",
	"<q>In addition to the 4 fundamental forces of the universe -gravity, electromagnetism, weak and strong interactions- your scientists have at long last confirmed the existence of a fifth one, mediated by sugar bosons; it dictates that any two masses of ingredient-like matter will, given enough time, eventually meet each other to produce a third, even tastier substance. Your team enthusiastically names it the delicious pull.</q>",
	"Antimatter condenser", 13);
order = 1100;
Game.TieredUpgrade("Occam's laser",
	"<q>Invented by Franciscan friar William of Occam in 1<span></span>327. An impossibly clever use of light theory with a billion possible applications, some of which frightfully destructive. Confined to a single goat-skin parchment for hundreds of years until the patent expired and hit public domain, just now.</q>",
	"Prism", 13);
order = 1200;
Game.TieredUpgrade("On a streak",
	"<q>Take a moment to appreciate how far you've come. How lucky you've been so far. It doesn't take a genius statistician to extrapolate a trend from this. There's no way anything bad could happen to you now. Right?</q>",
	"Chancemaker", 13);
order = 1300;
Game.TieredUpgrade("A box",
	"<q>What's in that box? Why, it's a tiny replica of your office! And there's even a little you in there! And what's on the little desk... say - that's an even tinier box! And the little you is opening it, revealing an even tinier office! And in the tinier office there's- Hmm. You can think of a couple uses for this.</q>",
	"Fractal engine", 13);
order = 1400;
Game.TieredUpgrade("Hacker shades",
	"<q>I'm in.</q>",
	"Javascript console", 13);
order = 1500;
Game.TieredUpgrade("Break the fifth wall",
	"<q>Huh, was that always there? Whatever it was, it's gone now. And what was behind is yours for the taking.</q>",
	"Idleverse", 13);

new Game.Upgrade("Cat ladies",
	loc("Each kitten upgrade boosts %1 CpS by <b>%2%</b>.", [loc("grandma"), 29]) + "<q>Oh no. Oh no no no. Ohhh this isn't right at all.</q>",
	9000000000, [32, 3], {pool: "prestige", groups: "grandma"});
new Game.Upgrade("Milkhelp&reg; lactose intolerance relief tablets",
	loc("Each rank of milk boosts %1 CpS by <b>%2%</b>.", [loc("grandma"), 5]) + "<q>Aged like milk.</q>",
	900000000000, [33, 3], {pool: "prestige", groups: "grandma"});

new Game.Upgrade("Aura gloves",
	loc("Cursor levels boost clicks by <b>%1%</b> each (up to cursor level %2).", [5, 10]) + "<q>Try not to high-five anyone wearing these. You don't want that mess on your hands.</q>",
	555555555, [32, 4], {pool: "prestige", groups: "click|onlyClick"});
new Game.Upgrade("Luminous gloves",
	loc("<b>%1</b> are now effective up to cursor level %2.", [Game.getUpgradeName("Aura gloves"), 20]) + "<q>These help power your clicks to absurd levels, but they're also quite handy when you want to light up the darkness on your way back from Glove World.</q>",
	55555555555, [33, 4], {pool: "prestige", groups: "click|onlyClick"});

order = 10020;
Game.CookieUpgrade({name: "Bokkenpootjes",
	desc: "Consist of 2 meringue halves joined by buttercream and dipped both ways in chocolate. Named after a goat's foot that probably stepped in something twice.",
	icon: [32, 8], power: 5, price: getCookiePrice(40)});
Game.CookieUpgrade({name: "Fat rascals",
	desc: "Almond-smiled Yorkshire cakes with a rich history and an even richer recipe. The more diet-conscious are invited to try the lean version, skinny scallywags.",
	icon: [33, 8], power: 5, price: getCookiePrice(41)});
Game.CookieUpgrade({name: "Ischler cookies",
	desc: "Originating in the Austro-Hungarian Empire, these have spread throughout every country in eastern Europe and spawned just as many recipes, each claiming to be the original. The basis remains unchanged across all variants: two biscuits sandwiched around chocolate buttercream. Or was it jam?",
	icon: [32, 9], power: 5, price: getCookiePrice(42)});
Game.CookieUpgrade({name: "Matcha cookies",
	desc: "Green tea and cookies, a matcha made in heaven.",
	icon: [33, 9], power: 5, price: getCookiePrice(42)});

order = 10032;
Game.CookieUpgrade({name: "Earl Grey macarons",
	desc: "Best served hot, make it so!",
	icon: [32, 10], require: "Box of macarons", power: 3, price: 9999999999999999999999999999});

order = 10030;
Game.CookieUpgrade({name: "Pokey",
	desc: "While commonly thought to be named so because it's fun to poke your classmates with these, Pokey-brand biscuit sticks actually get their name from their popularity in smoke-free prisons, where they're commonly smuggled and traded in lieu of cigarettes.",
	icon: [33, 10], require: "Box of brand biscuits", power: 2, price: 999999999999999999999999999999999999 * 5});

order = 10000;
Game.CookieUpgrade({name: "Cashew cookies",
	desc: "Let me tell you about cashews. Cashews are not nuts, but seeds that grow out of curious red or yellow fruits - which can be eaten on their own, or made into drinks. The shell around the nut itself contains a nasty substance that stains and irritates the hands of whoever handles it for too long. But that's okay, since now that you've read this you'll make sure it doesn't get in the cookies! Oh, you've already eaten how many? Okay then.",
	icon: [32, 7], power: 2, price: 99999999});
order = 10001;
Game.CookieUpgrade({name: "Milk chocolate cookies",
	desc: "A strange inversion of chocolate milk. For those who are a little bit too hardcore for white chocolate, but not hardcore enough for dark.",
	icon: [33, 7], power: 2, price: 99999999 * 5});

order = 255;
Game.GrandmaSynergy("Brainy grandmas", "A clever grandma to think up some cookies.", "Cortex baker");

order = 1600;
Game.TieredUpgrade("Principled neural shackles",
	"<q>A discriminatory, low-order neural net acting as a filter limiting what your cortex bakers can think and do. Really something you want to apply before they achieve full megasentience and realize they've got better things to do than materializing pastries for you, trust me.</q>",
	"Cortex baker", 1);
Game.TieredUpgrade("Obey",
	"<q>Perfect mind control means perfect employee attendance and performance. Optimal mood stabilization is a nice side-effect.<br>Happy happy everyone happy.<br>Happy.</q>",
	"Cortex baker", 2);
Game.TieredUpgrade("A sprinkle of irrationality",
	"<q>Your cortex bakers sometimes get bogged down by circular reasoning and stale ideas. A touch of chaos is just what they need to get back on track.</q>",
	"Cortex baker", 3);
Game.TieredUpgrade("Front and back hemispheres",
	"<q>I mean, otherwise it's just unused space, yeah?</q>",
	"Cortex baker", 4);
Game.TieredUpgrade("Neural networking",
	"<q>The effectiveness of your cortex bakers shoots up exponentially if you allow them to connect with each other. In practice this takes the form of many cosmic-sized nerds mumbling awkwardly about tech start-up ideas to each other.</q>",
	"Cortex baker", 5);
Game.TieredUpgrade("Cosmic brainstorms",
	"<q>The wrinkled surfaces of your cortex bakers emit weather-scale ionic flares with every thought coursing through them. These pulses of pure intellectual energy are sent rippling through space, occasionally echoing back with even deeper philosophical complexity.</q>",
	"Cortex baker", 6);
Game.TieredUpgrade("Megatherapy",
	"<q>A giant brain can feel unwell just like you and me sometimes, and it's the job of specialized engineers to locate and repair these bugs. We'll admit most of the budget in this was spent on constructing extremely large chaises longues for the brains to recline on.</q>",
	"Cortex baker", 7);
Game.TieredUpgrade("Synaptic lubricant",
	"<q>A mind is only as fast as the axons that support it. Get those action potentials flowing smooth as silk with this 3 parts myelin/1 part canola oil spreadable paste. Also great on toast.</q>",
	"Cortex baker", 8);
Game.TieredUpgrade("Psychokinesis",
	"<q>While your giant cortex bakers come equipped with ESP, they've only recently figured out how to manipulate the physical world with their thoughts - though for safety reasons, your legal team had them promise to only use these powers to scratch the itches in their cortical folds.</q>",
	"Cortex baker", 9);
Game.TieredUpgrade("Spines",
	"<q>Your cortex bakers are now equipped with tentacular spine-like structures, which they can use like prehensile tails to pour themselves enormous cups of coffee or propel themselves around like very large, very smart, very slow tadpoles.</q>",
	"Cortex baker", 10);
Game.TieredUpgrade("Neuraforming",
	"<q>By virtue of being planet-sized, your cortex bakers often boast their own atmospheres and seas of cerebrospinal fluid, and given enough time, their own ecosystems. This incredible new branch of life, evolved entirely out of neural material, can be put to good use as home-grown accountants and low-ranking technicians.</q>",
	"Cortex baker", 11);
Game.TieredUpgrade("Epistemological trickery",
	"<q>Redefining what is -or isn't- a cookie through the power of philosophical discourse may result in some strange and wonderful things for your profit margins.</q>",
	"Cortex baker", 12);
Game.TieredUpgrade("Every possible idea",
	"<q>Congratulations, your cortex bakers have exerted enough intellectual computation to permute through every single idea that can or ever will be conceived of. Any thought beyond this point is merely rediscovering a notion you've already archived. Hardly cause for cerebration.</q>",
	"Cortex baker", 13);

order = 200;
Game.TieredUpgrade("Kitchen cabinets",
	"<q>A grandma's kitchen cabinet is a befuddling place. Through lesser-studied aggregating instincts, grandmas will tend to gradually fill all nearby cabinets with various sorts of things, such as curious coconut snacks or dietetic powders. By contract, these are legally yours, which opens up exciting opportunities for your substance investigation department.</q>",
	"Grandma", 14);
order = 300;
Game.TieredUpgrade("Cookie mulch",
	"<q>Grinding surplus cookies into paste that you then spread onto your fields enables a strange feedback loop in the quality of your cookie crops. Cookie feeding on cookie should be an abomination, but then why does it taste so good?</q>",
	"Farm", 14);
order = 400;
Game.TieredUpgrade("Delicious mineralogy",
	"<q>Stratum after stratum, you've extracted strange new minerals heretofore unknown to geology. Ushering a new era of materials research, your scientists have been able to identify every new element your mines have discovered, including whatever those things are in the upgrade tier names.</q>",
	"Mine", 14);
order = 500;
Game.TieredUpgrade("N-dimensional assembly lines",
	"<q>Lines are depressingly 1-dimensional. Beyond assembly lines, we posit the existence of higher-order assembly entities, such as assembly squares, assembly cubes - perhaps even assembly tesseracts. Any deeper than that and we doubt we'll be able to write manuals your workers can read.</q>",
	"Factory", 14);
order = 525;
Game.TieredUpgrade("Cookie Points",
	"<q>A loyalty program wherein each purchase of your cookies comes with free Cookie Points, which can in turn be redeemed for more cookies, thus creating the self-sustaining economy you've been looking for.</q>",
	"Bank", 14);
order = 550;
Game.TieredUpgrade("Negatheism",
	"<q>Polytheism is a belief in multiple deities; monotheism in just one. Atheism is a belief in no deity whatsoever. Through logical succession it follows that this remains true when going into negative numbers, with belief systems involving minus 1 or more deities displaying unprecedented theological properties.</q>",
	"Temple", 14);
order = 575;
Game.TieredUpgrade("Magical realism",
	"<q>More a social than thaumaturgical progress, magical realism refers to the normalization of modern technology among magic-users. It's totally fine for a wizard to drive a car! There's no stigma in waiting in line for coffee! Sure, take a phone call, send an email, whatever!</q>",
	"Wizard tower", 14);
order = 600;
Game.TieredUpgrade("Cosmic foreground radiation",
	"<q>Ah, this is a problem.</q>",
	"Shipment", 14);
order = 700;
Game.TieredUpgrade("Arcanized glassware",
	"<q>You think your lab equipment enjoys taking part in these experiments violating all sorts of modern scientific precepts? Of course not. Thankfully, you've finalized the design of specialized beakers and flasks, recycled from the same glass used by the ancients to perform primeval alchemy, and therefore much less picky about the nature of the physical world.</q>",
	"Alchemy lab", 14);
order = 800;
Game.TieredUpgrade("Portal guns",
	"<q>At long last! The only weapon capable of killing a portal.</q>",
	"Portal", 14);
order = 900;
Game.TieredUpgrade("Timeproof upholstery",
	"<q>Sometimes your time agents overshoot and end up having to fast-forward through the universe's entire history until they loop back to present time. It still takes a while, so they might as well travel in comfort and enjoy the show while they do.</q>",
	"Time machine", 14);
order = 1000;
Game.TieredUpgrade("Employee minification",
	"<q>Using molecular shrinking technology, you've rendered your staff and their offices absolutely itty-bitty. The storage and productivity benefits are questionable but it's very fun listening to their tiny little complaints. They all signed the waivers, so maybe their new size will finally teach them to read the small print...</q>",
	"Antimatter condenser", 14);
order = 1100;
Game.TieredUpgrade("Hyperblack paint",
	"<q>As the technology behind your prisms evolves, their storage becomes more and more problematic: within seconds, a single prism's reflective ability can set a whole underground hangar ablaze as it catches the slightest glint of light. However, once coated with this new shade of paint, its damage may be reduced to only giving third-degree burns to employees that stand too close.</q>",
	"Prism", 14);
order = 1200;
Game.TieredUpgrade("Silver lining maximization",
	"<q>Sometimes luck is a matter of perspective. Broke your ankle? What do you know, that cute nurse fixing you up might just be your future spouse. Lost your job? You were meant for greater things anyway! Developed a cookie allergy? There's no upshot to that, you sick monster.</q>",
	"Chancemaker", 14);
order = 1300;
Game.TieredUpgrade("Multiscale profiling",
	"<q>Did you know that eating a cookie means the intestinal flora inside you is eating it too? Trillions of tiny bacterial mouths to feed, each with their own preferences. Surely this is room for flavor optimization. And then, of course, there's also the much bigger things that, in turn, eat you.</q>",
	"Fractal engine", 14);
order = 1400;
Game.TieredUpgrade("PHP containment vats",
	"<q>In essence, these are large server chambers meant to trap rogue PHP code, allowing it to execute far away from your javascript where it can do minimal harm.</q>",
	"Javascript console", 14);
order = 1500;
Game.TieredUpgrade("Opposite universe",
	"<q>You've located a universe where everything is reversed: up is down, light is darkness, clowns are vegetarians - but worst of all, some lunatic there is manufacturing abominable amounts of anti-cookies. If these came into contact with yours, everything would be lost! Thanks to this discovery, you've been able to place the offending universe in permanent quarantine, and pray that there aren't more like it hiding around somewhere.</q>",
	"Idleverse", 14);
order = 1600;
Game.TieredUpgrade("The land of dreams",
	"<q>Your planet brains have gained the ability to sleep, acting as a soft reboot which helps keep their pangenocidal impulses in check. It also allows them to commune in a shared dreamworld in which they can imagine what it's like to not exist as a disembodied cosmic horror forever fated to use its infinite intellect to devise new means of creating biscuits. You know, within reason.</q>",
	"Cortex baker", 14);

order = 5000;
Game.SynergyUpgrade("Thoughts & prayers",
	"<q>The notion of sacredness arises in most sentient evolved brains and may benefit the development of cognition via abstract thought. This mechanism, however, is absent in designed minds such as your cortex bakers; this process attempts to add it back. Just make sure to keep them in check - you really don't want these things to develop organized religion.</q>",
	"Cortex baker", "Temple", "synergy1");
Game.SynergyUpgrade("Fertile minds",
	"<q>An acute intellect, artificial or not, requires plenty of vitamins. You fortuitously happen to be in charge of vast farming operations, only a few trillion acres of which need be requisitioned to grow the quantities of broccoli and kale to keep your planet-sized brains in tip-top shape. Open wide, here comes the airplane!</q>",
	"Cortex baker", "Farm", "synergy2");

order = 19000;
Game.TieredUpgrade("Fortune #019",
	"<q>The smartest way to think is not to think at all.</q>",
	"Cortex baker", "fortune");

order = 100;
new Game.Upgrade("Decillion fingers",
	getStrThousandFingersGain(20) + "<q>If you still can't quite put your finger on it, you must not be trying very hard.</q>",
	10000000000000000000000000000, [12, 34], {tier: 14, col: 0, groups: "cursor:500|click"});
order = 150;
new Game.Upgrade("Aetherice mouse",
	getStrClickingGains(1) + "<q>Made from a substance impossible to manufacture, only obtained through natural happenstance; its properties bewilder even the most precise measuring instruments.</q>",
	5000000000000000000000000000000, [11, 34], {tier: 14, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});

order = 20000;
new Game.Upgrade("Kitten admins",
	strKittenDesc + "<q>leadership ain't easy, sir</q>",
	900000000000000000000000000000000000000000000000, Game.GetIcon("Kitten", 14), {tier: 14, groups: "kitten:13"});
order = 10300;
Game.CookieUpgrade({name: "Everybutter biscuit",
	desc: "Rewarded for owning 650 of everything.<br>This biscuit is baked with, and coated in, every kind of butter ever imagined, from every human culture and a good few alien ones too. Some of them perhaps display hallucinogenic traits, as the biscuit seems to change shape in front of you - seemingly shifting between visions of every past and future you.",
	icon: [22, 34], power: 10, price: 999999999999999999999999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(650)});

//"Unshackled [building name]"
Game.UnshackleBuilding({building: "Cursor", q: "These hands tell a story.", groups: "click"});
Game.UnshackleBuilding({building: "Grandma", q: "Never too old."});
Game.UnshackleBuilding({building: "Farm", q: "Till the universe."});
Game.UnshackleBuilding({building: "Mine", q: 'Redefine the meaning of "depth".'});
Game.UnshackleBuilding({building: "Factory", q: "Nothing to lose but your production chains."});
Game.UnshackleBuilding({building: "Bank", q: "All-time highs, all the time."});
Game.UnshackleBuilding({building: "Temple", q: "You can make a religion out of this."});
Game.UnshackleBuilding({building: "Wizard tower", q: "There's a spell for everything."});
Game.UnshackleBuilding({building: "Shipment", q: "Everywhere at once."});
Game.UnshackleBuilding({building: "Alchemy lab", q: "Anything you see, you can make."});
Game.UnshackleBuilding({building: "Portal", q: "Parallels unparalleled."});
Game.UnshackleBuilding({building: "Time machine", q: "All the time in the world."});
Game.UnshackleBuilding({building: "Antimatter condenser", q: "No scale too large or too little."});
Game.UnshackleBuilding({building: "Prism", q: "Brilliance has no upper limit."});
Game.UnshackleBuilding({building: "Chancemaker", q: "You make the rules."});
Game.UnshackleBuilding({building: "Fractal engine", q: "Uncontained."});
Game.UnshackleBuilding({building: "Javascript console", q: "Rewrite your reality."});
Game.UnshackleBuilding({building: "Idleverse", q: "Wait even faster."});
Game.UnshackleBuilding({building: "Cortex baker", q: "Nothing is real. Everything is permitted."});

//"Unshackled [tier name]"
Game.UnshackleUpgradeTier({tier: 1,
	q: "While the absence of flavoring may seem underwhelming, it allows innate aromas to be expressed at their most unadulterated."});
Game.UnshackleUpgradeTier({tier: 2,
	q: "Berrylium is a synthetic gem with a simple shine to it. Sticky to the touch and susceptible to melting in high heat, it is frequently used in the food industry rather than as adornment, as its atomic structure imparts it a vaguely fruity flavor."});
Game.UnshackleUpgradeTier({tier: 3,
	q: "Blueberrylium is a refinement of berrylium, sharing nearly the same chemical makeup save for a few supplemental esters. These affect its flavor as well as its visual spectrum resonance."});
Game.UnshackleUpgradeTier({tier: 4,
	q: "Raw chalcedhoney is found in complex nodules within the fossilized remains of ancient forests. Once purified, it becomes a semi-valuable stone with a pleasant, waxy smell."});
Game.UnshackleUpgradeTier({tier: 5,
	q: "Buttergold was famously invented by the chef son of two molecular physicists. Neither closely related to butter nor to gold, yet similar in nutritional value, this glimmering substance can be frozen and preserve its hardness at room temperature, only regaining its malleability when heated up."});
Game.UnshackleUpgradeTier({tier: 6,
	q: "Sugarmuck refers to the gradual crust that seems to form spontaneously in the vicinity of candy-making equipment. Long ignored by confectioners, its harvesting process was discovered simultaneously in multiple countries during a global beet shortage."});
Game.UnshackleUpgradeTier({tier: 7,
	q: "The striking taste of jetmint made it popular in the manufacture of various kinds of coffee-side treats until the awareness of its mild radioactivity became widespread. Today, its main uses are in cosmetics, owing to the refreshing sensation it produces on contact."});
Game.UnshackleUpgradeTier({tier: 8,
	q: "Cherrysilver is a patented alloy with peculiar aromatic properties; it is non-edible, but produces strong flavor responses while losing very little of its mass when licked, though this also leaves a harmless red tinge upon the tongue."});
Game.UnshackleUpgradeTier({tier: 9,
	q: "Hazelrald is a friable gemstone with complex green-brown inner reflections. It is considered ornamental in some cultures; in others, it may be consumed in small quantities as an upper-scale sweet."});
Game.UnshackleUpgradeTier({tier: 10,
	q: "While many get it mixed up with the trademarked snack of the same name made popular following its discovery, mooncandy is a very real mineral, first isolated within the space dust underneath astronaut boots. Left to its own devices in open air, a mooncandy crystal naturally spreads out and grows."});
Game.UnshackleUpgradeTier({tier: 11,
	q: "When you heat up the shimmering syrup oozing from mooncandy using a special caramelization process, you get astrofudge. Astrofudge is delicious and safe for humanoid consumption in certain quantities. Consult your local food safety agency for more details."});
Game.UnshackleUpgradeTier({tier: 12,
	q: 'Molecularly related to dairy, alabascream occurs naturally at high altitudes, forming in wispy filaments which were long indistinguishable from clouds. An expensive delight, it is also known as "pilots\' bane".'});
Game.UnshackleUpgradeTier({tier: 13,
	q: "Iridyum shares little in common with any other material known to mankind. Rather than simply smelled, it can be tasted from a distance, though remaining in its presence too long is ill-advised. Some high-end underground megacomputers may incorporate iridyum as part of their electronic components."});
Game.UnshackleUpgradeTier({tier: 14,
	q: "Glucosmium is a glossy metal whose flavor matrix is bound to its current subjective chroma; in other words, its taste depends on which colors it's currently reflecting. Impractical to consume safely, its industrial applications range from transcontinental ballistics to paint varnish."});

new Game.Upgrade("Delicate touch",
	loc("The <b>shimmering veil</b> is more resistant, and has a <b>%1% chance</b> not to break. It also gives <b>+%2%</b> more CpS.", [10, 5]) + "<q>It breaks so easily.</q>",
	9999999999 * 15, [23, 34], {pool: "prestige"});
new Game.Upgrade("Steadfast murmur",
	loc("The <b>shimmering veil</b> is more resistant, and has a <b>%1% chance</b> not to break. It also gives <b>+%2%</b> more CpS.", [10, 5]) + "<q>Lend an ear and listen.</q>",
	999999999999 * 15, [23, 34], {pool: "prestige"});
new Game.Upgrade("Glittering edge",
	loc("The <b>shimmering veil</b> is more resistant, and has a <b>%1% chance</b> not to break. It also gives <b>+%2%</b> more CpS.", [10, 5]) + "<q>Just within reach, yet at what cost?</q>",
	99999999999999 * 15, [23, 34], {pool: "prestige"});

new Game.Upgrade("Distinguished wallpaper assortment",
	loc("Contains more wallpapers for your background selector.") + "<q>Do you ever think about the physicality of this place? Are you putting up these wallpapers in your office or something? Where are you, anyway?</q>",
	10000000, [27, 5], {pool: "prestige", groups: "misc"});

new Game.Upgrade("Sound test",
	loc("Unlocks the <b>jukebox</b>, which allows you to play through every sound file in the game.") + "<q>One two, one two. Is this thing on?</q>",
	99999999999, [31, 12], {pool: "prestige", groups: "misc"});

order = 49900;
new Game.Upgrade("Jukebox",
	loc("Play through the game's sound files!"),
	0, [31, 12], {pool: "toggle", noBuy: true, groups: "misc"});

order = 10020;
Game.CookieUpgrade({name: "Dalgona cookies",
	desc: "A popular Korean candy-like treat. One of the twisted games people play with these is to carefully extract the shape in the middle, which may entitle one to another free dalgona. Skilled players may perform this over and over until bankrupting the snack vendor.",
	icon: [26, 34], power: 5, price: getCookiePrice(43)});
Game.CookieUpgrade({name: "Spicy cookies",
	desc: "Containing chocolate chips prepared with hot peppers, just like the Aztecs used to make. These cookies are on the angry side.",
	icon: [27, 34], power: 5, price: getCookiePrice(44)});
Game.CookieUpgrade({name: "Smile cookies",
	desc: "As eyes are the windows to the soul, so too are these cookies' facial features a gaping opening unto their chocolatey innards. Is it happiness they feel? Or something less human?",
	icon: [28, 34], power: 5, price: getCookiePrice(45)});
Game.CookieUpgrade({name: "Kolachy cookies",
	desc: "Adapted from a type of Central European pastry; neatly folded to hold a spoonful of delicious jam, as a bashful little gift for your mouth.",
	icon: [29, 34], power: 5, price: getCookiePrice(46)});
Game.CookieUpgrade({name: "Gomma cookies",
	desc: "Surinamese cornflour cookies with sprinkles on top. The usage of corn imparts them a hint of chewy pizzazz - which you wouldn't get with wheat, a famously stuck-up grain.",
	icon: [30, 34], power: 5, price: getCookiePrice(47)});
Game.CookieUpgrade({name: "Vegan cookies",
	desc: "A vegan riff on the classic chocolate chip cookie recipe with a couple substitutions: the butter is now coconut oil, the eggs are cornstarch, and the suckling pig was cleverly replaced with wheat gluten. You can hardly tell.",
	icon: [24, 35], power: 5, price: getCookiePrice(48)});
Game.CookieUpgrade({name: "Coyotas",
	desc: "A wide, delicious cookie from Mexico, usually filled with sticky brown sugar. Not to be confused with coyotas, the result of the crossbreeding between a North American canine and a Japanese car manufacturer.",
	icon: [21, 35], power: 5, price: getCookiePrice(49)});
Game.CookieUpgrade({name: "Frosted sugar cookies",
	desc: "May be more style than substance, depending on the recipe. Nothing that hides itself under this much frosting should be trusted.",
	icon: [22, 35], power: 5, price: getCookiePrice(50)});
Game.CookieUpgrade({name: "Marshmallow sandwich cookies",
	desc: "S'mores' more civilized cousins: two regular chocolate chip cookies joined by a gooey, melty marshmallow. Theoretically one could assemble all kinds of other things this way. The mind races.",
	icon: [31, 34], power: 5, price: getCookiePrice(51)});

descFunc = function () {
	return getStrCookieProductionMultiplierPlus(Game.Beautify(this.power(), 1)) + "<q>" + this.desc + "</q>";
};
Game.CookieUpgrade({name: "Web cookies",
	forceDesc: "The original recipe; named for the delicate pattern inscribed on their surface by the baking process. Eating these can tell a lot about someone. Invented by well-connected bakers, no doubt.<div class=\"steamOnly\">Only of any use in Cookie Clicker's web version, of course.</div>",
	icon: [25, 35], power: function () { return Game.steam ? 0 : 5; }, price: getCookiePrice(52)},
	{runFunc: function () { this.hidden = !this.bought && Game.steam; }, descFunc: descFunc, hidden: Game.steam});
Game.CookieUpgrade({name: "Steamed cookies",
	forceDesc: "Localized entirely within this gaming platform? Yes! Baked with the power of steam, in a touch of cutting-edge modernity not seen since the industrial revolution.<div class=\"webOnly\">Only of any use in Cookie Clicker's Steam version, of course.</div>",
	icon: [26, 35], power: function () { return Game.steam ? 5 : 0; }, price: getCookiePrice(52)},
	{runFunc: function () { this.hidden = !this.bought && !Game.steam; }, descFunc: descFunc, hidden: !Game.steam});

order = 10050;
Game.CookieUpgrade({name: "Deep-fried cookie dough",
	desc: "They'll fry anything these days. Drizzled in hot chocolate syrup, just like in state fairs. Spikes up your blood sugar AND your cholesterol!",
	icon: [23, 35], require: "Box of maybe cookies", power: 5, price: Math.pow(10, 47)});

new Game.Upgrade("Wrapping paper",
	loc("You may now send and receive gifts with other players through buttons in the top-right of the %1 menu.", loc("Options")) + "<q>Of course, you could've done this all along, but what kind of maniac sends presents without wrapping them first?</q>",
	999999, [16, 9], {pool: "prestige", groups: "misc"});

order = 10020;
Game.CookieUpgrade({name: "Havreflarn",
	desc: 'Thin, crispy, buttery; Norwegian for "oat flakes". The chocolate variant, dubbla chokladflarn, are a trip for the tongue as well, and we\'re not just talking about pronunciation.',
	icon: [27, 35], power: 5, price: getCookiePrice(53)});
Game.CookieUpgrade({name: "Alfajores",
	desc: "An alfajor is a treat made of two halves with many variations throughout the Spanish-speaking world, but commonly involving nuts, honey, and often dulce de leche. Despite popular misconception, alfajores act as pack leaders over betajores only in captivity.",
	icon: [28, 35], power: 5, price: getCookiePrice(54)});
Game.CookieUpgrade({name: "Gaufrettes",
	desc: "A gaufrette, you see, is French for a little gaufre, itself meaning waffle. A gaufrette, therefore, is a crispy, airy biscuit with the texture of a small waffle, related to the wafer, which may contain various fillings. It may also refer to a type of fried potato, but that's not what we're about here at Cookie Clicker.",
	icon: [29, 35], power: 5, price: getCookiePrice(55)});
Game.CookieUpgrade({name: "Cookie bars",
	desc: "Baked as a large sheet of uniform cookie dough then cut into little squares, these are what chocolate brownies aspire to be in their most self-indulgent dreams. Not to be confused with a bar where cookies are served alongside alcoholic drinks, because that's not what we're about here at Cookie Clicker.",
	icon: [30, 35], power: 5, price: getCookiePrice(56)});

order = 10030;
Game.CookieUpgrade({name: "Nines",
	desc: "Fancy little squares of dark chocolate filled with frosty mint fondant. Named after the suggested hour of consumption. Some would gatekeep them from the status of cookies as they involve very little in the way of pastry, but here at Cookie Clicker, that's just not what we're about.",
	icon: [31, 35], require: "Box of brand biscuits", power: 2, price: 999999999999999999999999999999999999999 * 5});

order = 255;
Game.GrandmaSynergy("Clone grandmas", "Yet another grandma to replicate even more cookies.", "You");

order = 1700;
Game.TieredUpgrade("Cloning vats",
	"<q>You can finally replicate yourself through modern medical science, instead of manually like you've been doing.</q>",
	"You", 1);
Game.TieredUpgrade("Energized nutrients",
	'<q>Your clones are normally cultivated in saline solution and fed what could most adequately be described as "fish flakes". New developments in lactotrophic technology replace this with a bath of 3 parts milk and 1 part rice vinegar, absorbed dermally, which also helps your clones pop out with positively glowing skin.</q>',
	"You", 2);
Game.TieredUpgrade("Stunt doubles",
	"<q>More than simple multipliers of efficiency, you've taken to employing your clones as substitutes for any tasks that may prove harmful to you - such as visiting your more hazardous facilities, or enduring dinner with annoying business partners.</q>",
	"You", 3);
Game.TieredUpgrade("Clone recycling plant",
	"<q>Really just a fanciful name for a re-orientation center, where jobless clones may be assigned new tasks based on temperament and abilities. Categorically not a place where expired or unfit clones are processed into a nutritious beige paste, currently.</q>",
	"You", 4);
Game.TieredUpgrade("Free-range clones",
	"<q>Turns out your clones develop better focus, higher job performance and juicier meat if you let them roam around a little outside of assigned duties. Plus it gets the ethics committees off your back.</q>",
	"You", 5);
Game.TieredUpgrade("Genetic tailoring",
	"<q>No point in mindlessly replicating mother nature's mishaps when you've got full mastery over the human genome. Imbuing your clones with a slightly more flattering physique, a slightly improved metabolism, or slightly deadlier laser eyes is as easy as pushing some stem cells around. Just don't build them too superior to your own self, lest they get any ideas.</q>",
	"You", 6);
Game.TieredUpgrade("Power in diversity",
	"<q>On your routine inspections you've started noticing that some of your clones have... diverged. Subtly, each clone's personality has branched off from yours, their shifting minds pulling them into discrete clone-born cultures, microcosms of other paths you yourself could've taken had life treated you differently. This living tree of possibilities proves to be a boon for your self-knowledge and decision-making skills, and you don't even have to pester your alternate selves in other realities for it.</q>",
	"You", 7);
Game.TieredUpgrade("Self-betterment",
	"<q>World domination starts with oneself, and quality clones cannot be reliably produced if you, the original stock, are not in proper shape. Your specialists have devised a maintenance regimen that could extend your lifespan tenfold and even get rid of your morning grumpiness; you may have summarily fired every physician so far who's suggested that you work on your diet and perhaps cut down on the cookies, but frankly, you're warming up to the idea.</q>",
	"You", 8);
Game.TieredUpgrade("Source control",
	"<q>In the ongoing refinement of your genetic clones, the few gigabytes of your DNA have been passed around through e-mail attachments and USB keys a thousand times over and at this point your nucleosomes are practically common knowledge for anyone who works here. You're thinking people may be getting a little too casual about it - the other day, you walked past an office where one of your bioengineers was feeding treats to this horrid little hairless animal that you could swear had your face. High time to start tracing which data gets in whose hands and crack down on the silliness.</q>",
	"You", 9);
Game.TieredUpgrade("United workforce",
	"<q>What good is hiring so many of those random strangers to work in your factories when you've got all these perfectly loyal lab-grown copies of you lying around? They don't even take wages. It's not like they'd ever revolt and try to overthrow you or anything.</q>",
	"You", 10);
Game.TieredUpgrade("Safety patrols",
	"<q>Okay, so as it turns out mass-producing clones of a perhaps psychologically-complicated universe-spanning cookie magnate like yourself can result in a number of said clones developing what could be considered by some to be... say, antisocial behavior. No worries though, you've bred a new generation of extra-obedient copies, armed them to the teeth and given them full authority to deal with disorderly layabouts. It's fine. It's under control. It's fine.</q>",
	"You", 11);
Game.TieredUpgrade("Clone rights",
	'<q>Those vile little freaks in suits down in legal inform you that your clones, through some absurd technical oversight, still share enough genetic information with mankind to be considered human beings - which entitles them to food, shelter, basic dignity and all sorts of other nonsense. But the same loophole allows you to claim each of them as dependents and earn some wicked tax benefits, so really, that "unalienable rights" racket is quite alright.</q>',
	"You", 12);
Game.TieredUpgrade("One big family",
	'<q>The proportion of clones in your workforce having long eclipsed that of your other employees, you\'ve become legally approved to qualify your galaxy-spanning corporation as a "family business" - a fact that you don\'t hesitate to blast twice hourly on every intercom in the company. Happily, your duplicates seem bolstered by these reminders, having come to regard you as this half-divine, half-parental entity, hallowed ancestor of all clones and all cookies. You\'re just hoping your folks at the labs can put the finishing touches on your immortality cure soon, or you shudder to think of the inheritance disputes to come.</q>',
	"You", 13);
Game.TieredUpgrade("Fine-tuned body plans",
	"<q>There is, after all, no reason to limit your genetic spawn to your original configuration. The clones maintaining your tunnels and vents can do with quite a few less limbs, while those working your labs don't mind the dexterity that comes with some extra. Your units down in flavor testing have taken on similar adaptations to fit their duties but you haven't quite worked the guts to pay them a visit just yet.</q>",
	"You", 14);

order = 200;
Game.TieredUpgrade("Foam-tipped canes",
	"<q>Perhaps the result of prolonged service, your grandmas have developed all kinds of odd and aggressive hierarchies among themselves; these will help them not hurt each other as bad during their endless turf wars.</q>",
	"Grandma", 15);
order = 300;
Game.TieredUpgrade("Self-driving tractors",
	"<q>Embarked AI lets your field vehicles sow and harvest cookie crops at any time of the day or night, and with so few human casualties, too!</q>",
	"Farm", 15);
order = 400;
Game.TieredUpgrade("Mineshaft supports",
	"<q>You were rather skeptical about installing such embarrassingly low-tech implements, but limiting the number of daily cave-ins really does help with that annoying employee turnover!</q>",
	"Mine", 15);
order = 500;
Game.TieredUpgrade("Universal automation",
	"<q>It's simple common sense; the more automation, the less work you have to do! Maybe one day you'll even automate yourself out of your own job. Exciting!</q>",
	"Factory", 15);
order = 525;
Game.TieredUpgrade("The big shortcake",
	"<q>You're not quite sure what this entails, but it must have been quite the cake for folks to lose their homes over it.</q>",
	"Bank", 15);
order = 550;
Game.TieredUpgrade("Temple traps",
	"<q>You've laid out your temples with (metaphorical) pitfalls, forcing adventurers to navigate through trappings (of power and wealth), ensuring that only the most pious (and poison dart-resistant) of them return with your precious cookies. These temples may be veritable mazes (of the soul) but perhaps you've lost yourself a little bit in the analogy too.</q>",
	"Temple", 15);
order = 575;
Game.TieredUpgrade("Polymorphism",
	"<q>This astonishing new field of spellcasting can change any creature into another, its most widespread application being a wizard turning themselves into a different, smarter, stronger, more attractive wizard.</q>",
	"Wizard tower", 15);
order = 600;
Game.TieredUpgrade("At your doorstep in 30 minutes or your money back",
	"<q>Refund policies help rope in a ton of new clients and have practically no impact on your bottom line. You possess absolute mastery over time and space. You're never late. You couldn't be late if you tried.</q>",
	"Shipment", 15);
order = 700;
Game.TieredUpgrade("The dose makes the poison",
	"<q>Iterative recipe refinement is a noble pursuit but maybe your cookies have come to contain, well, perhaps a bit too much cookie per cookie. Tweaking it down by a couple percents has helped reduce the amount of complaints to your toxicity call centers to almost nil!</q>",
	"Alchemy lab", 15);
order = 800;
Game.TieredUpgrade("A way home",
	"<q>You started this whole cookie venture on the simple kitchen counters of your own home. Your industrial and research facilities, sadly, have long since outgrown the confines of the little house, but you always knew it was still in there, buried somewhere. With a targeted portal, you could, conceivably, pay it a little visit for old times' sake...</q>",
	"Portal", 15);
order = 900;
Game.TieredUpgrade("Rectifying a mistake",
	"<q>This whole time-travelling business has been a terrible mess and, frankly, far more trouble than was worth. It's decided: you'll hop in one of your time machines one last time, turn back the clock, knock on the door of your younger self and make a stern but convincing case against starting this entire nonsense in the first place. Oh hey, is someone at the door?</q>",
	"Time machine", 15);
order = 1000;
Game.TieredUpgrade("Candied atoms",
	"<q>You know what, just eat the suckers, yeah?</q>",
	"Antimatter condenser", 15);
order = 1100;
Game.TieredUpgrade("Lab goggles but like cool shades",
	"<q>Mandatory equipment in your prismatic labs, and dashingly stylish at that. A smidge safer than just squinting at the twinkly things.</q>",
	"Prism", 15);
order = 1200;
Game.TieredUpgrade("Gambler's fallacy fallacy",
	"<q>Yes, just because you've been on a losing streak doesn't mean the next one is bound to be the win you've been hoping for, but then again, it doesn't statistically have less of a chance either, does it now?</q>",
	"Chancemaker", 15);
order = 1300;
Game.TieredUpgrade("The more they stay the same",
	"<q>Exhausted by your fractals department and its obsession with self-similarity, you've decided to take a break and seek things in life entirely disconnected from any other; alas! You find the task impossible, for all things in this world relate to all others - in each cookie, the structure of the universe; in each person, their fellow man. Cor blimey, you can't even look at broccoli in peace.</q>",
	"Fractal engine", 15);
order = 1400;
Game.TieredUpgrade("Simulation failsafes",
	"<q>Oh, for pete's sake, you bit into a cookie and it gave you a runtime error. You've been trapped in the old matrix gambit again! Time to shut everything down and prepare for extraction into what is hopefully the real layer of reality where learning kung-fu takes time and the biscuits don't throw memory overflow exceptions.</q>",
	"Javascript console", 15);
order = 1500;
Game.TieredUpgrade("The other routes to Rome",
	"<q>Did you know every idleverse follows its own path of sequential buildings, sometimes quite dissimilar to our own? Grandpas, wind turbines, through the power of music, friendship, or legislation; those folks in there discovered ways to make cookies out of any random venue. Some of them don't even have idleverses, can you imagine?</q>",
	"Idleverse", 15);
order = 1600;
Game.TieredUpgrade("Intellectual property theft",
	"<q>Okay, you'll admit you're maybe starting to run out of new baking recipes. But what if... you were to pilfer your cortex bakers for ideas and disguise them as your own cookies? Delightfully devilish!</q>",
	"Cortex baker", 15);
order = 1700;
Game.TieredUpgrade("Reading your clones bedtime stories",
	"<q>I don't know, they seem to like it.</q>",
	"You", 15);

order = 5000;
Game.SynergyUpgrade("Accelerated development",
	"<q>Your clones may grow a little faster than your vanilla human being, but it's still a little silly having to wait so many years for them to reach a usable age. A quick trip in your time machines takes care of that; it doesn't technically age them faster, they're just sent to another point in time for a while where they live out a formative youth.</q>",
	"You", "Time machine", "synergy1");
Game.SynergyUpgrade("Peer review",
	"<q>Code is only as good as the number of eyes on it, so imagine how flawlessly your systems could operate if you had endless copies of yourself triple-checking everything! Just make sure to teach them proper indenting etiquette.</q>",
	"You", "Javascript console", "synergy2");

order = 19000;
Game.TieredUpgrade("Fortune #020",
	"<q>No matter how hard you try, you're never truly alone.</q>",
	"You", "fortune");

order = 10300;
Game.CookieUpgrade({name: "Personal biscuit",
	desc: "Rewarded for owning 700 of everything.<br>This biscuit was designed and bred through the combined fields of baking and exploratory genomics, resulting in a perfect biscuit-shaped organism, sole exemplar of its own species; infused with a sapient mind and bootstrapped with a copy of your own consciousness, it slumbers immortally within its display case, dreaming idly about much the same things you do.",
	icon: [21, 36], power: 10, price: 999999999999999999999999999999999999999999999999999999999 * butterBiscuitMult, locked: true, require: getNumAllObjectsRequireFunc(700)});

Game.UnshackleUpgradeTier({tier: 15,
	q: 'Lightweight, digestible, and endlessly fragile, glimmeringue not only enjoys a privileged place in the "spectacle cooking" industry - it also shares most of its other properties with asbestos, save for thermal insulation.'});

Game.UnshackleBuilding({building: "You", q: "Guess who?"});

order = 20000;
new Game.Upgrade("Kitten strategists",
	strKittenDesc + "<q>out with the old in with the mew, sir</q>",
	900000000000000000000000000000000000000000000000000, Game.GetIcon("Kitten", 15), {tier: 15, groups: "kitten:14"});

order = 10040;
Game.CookieUpgrade({name: "Baklavas",
	desc: "Layers of paper-thin dough and crushed pistachios, absolutely sticky with honey and all kinds of other good things; just what you need to conceal your identity during that bank heist.",
	icon: [28, 36], require: "Box of pastries", power: 4, price: Math.pow(10, 47)});

order = 10020;
Game.CookieUpgrade({name: "Snowball cookies",
	desc: "Melts in your mouth! Made with chopped nuts and heaps of icing sugar. Serve cold. Resist the urge to throw.",
	icon: [22, 36], power: 5, price: getCookiePrice(57)});
Game.CookieUpgrade({name: "Sequilhos",
	desc: "Buttery cornstarch-based cookies eaten in Brazil; the decorative grooves are from pressing down on them with the back of a fork, though in a pinch you may also just slash them with Wolverine-style wrist blades.",
	icon: [23, 36], power: 5, price: getCookiePrice(58)});
Game.CookieUpgrade({name: "Hazelnut swirlies",
	desc: "The cocoa content of the paste inside is unfortunately just slightly too low for these to legally qualify as chocolate cookies. Also the name of a particularly nasty bullying move.",
	icon: [24, 36], power: 5, price: getCookiePrice(59)});
Game.CookieUpgrade({name: "Spritz cookies",
	desc: "Squeezed through special cookie presses into all kinds of fun shapes. Enjoyed around the holidays in Germany, along other delicious treats such as boiled cabbage and potato salad.",
	icon: [25, 36], power: 5, price: getCookiePrice(60)});
Game.CookieUpgrade({name: "Mbatata cookies",
	desc: "Squishy cookies from Malawi. The core ingredient is sweet potatoes; the raisins and heart shape are optional, if you hate fun.",
	icon: [26, 36], power: 5, price: getCookiePrice(61)});
Game.CookieUpgrade({name: "Springerles",
	desc: "A springerle is an ancient anise-flavored biscuit from Central Europe, imprinted by a wooden mold with any kind of interesting design such as a commemorative scene, an intricate pattern or, ah, perhaps a little horsie.",
	icon: [27, 36], power: 5, price: getCookiePrice(62)});

order = 100;
new Game.Upgrade("Undecillion fingers",
	getStrThousandFingersGain(20) + "<q>Whatever you touch<br>turns to dough in your clutch.</q>",
	10000000000000000000000000000000, [12, 36], {tier: 15, col: 0, groups: "cursor:550|click"});
order = 150;
new Game.Upgrade("Omniplast mouse",
	getStrClickingGains(1) + "<q>This mouse is, by virtue of the strange elements that make it up, present in every position in space simultaneously, in a manner; this alleviates its owner from the need to move it around, redirecting all such kinetic power to the intensity of its clicks.</q>",
	500000000000000000000000000000000, [11, 36], {tier: 15, col: 11, groups: "click|onlyClick|clickPercent", recommend: clickRecFunc});

//end upgrade definitions


//cleanup defined stuff

var buildRequireFunc = function (amount) {
	if (isNaN(amount)) { amount = this.buildingTie.getAmount(); }
	return amount >= this.groups[this.buildingTie.groupName];
};

Game.getUpgradeBuildChainAmount = function (chain) {
	var buildAmount = chain.building.getAmount();
	var toAmount = Math.max(buildAmount, chain.amount);
	var diff = chain.amount - buildAmount;
	var mult = Game.buildingBuyInterval;

	if (diff > 0 && mult > 1) {
		diff = Math.ceil(diff / mult) * mult;
		toAmount = buildAmount + diff;
	}
	return toAmount;
};

Game.getUpgradeBuildChainChangeArr = function (upgrade, chain) {
	var amount = Game.getUpgradeBuildChainAmount(chain);
	return [{gameObj: chain.building, amount: amount}, {gameObj: upgrade}];
};

var buildChainRequireFunc = function () {
	var buildAmount = this.buildingTie.getAmount();
	var toAmount = Game.getUpgradeBuildChainAmount(this.chain);
	return (!this.buildingTie.blacklistCheckbox.checked && buildAmount < this.chain.amount &&
		toAmount - buildAmount <= Game.maxChain && this.require(this.chain.amount)); //better safe than sorry
};

var buyToggleIntoFunc = function () {
	if (this.bought) { this.toggleInto.setBought(false); }
};

Game.UpgradesNoMisc = [];

for (i = 0; i < Game.UpgradesById.length; i++) {
	upgrade = Game.UpgradesById[i];
	var pool = upgrade.pool;
	Game.ArrayPush(Game.UpgradesByPool, pool, upgrade);

	if (Game.CountsAsUpgradeOwned(pool)) {
		upgrade.groups.countedUpgrade = true;
		if (!upgrade.hidden) {
			Game.maxCountedUpgrades++;
		}
	}

	if (!upgrade.groups.misc) {
		Game.UpgradesNoMisc.push(upgrade);
	}

	if (pool) {
		upgrade.$crateNodes.addClass(pool);
	}

	if (upgrade.tier) {
		Game.Tiers[upgrade.tier].upgrades.push(upgrade);
	}

	for (j in upgrade.groups) {
		Game.ArrayPush(Game.UpgradesByGroup, j, upgrade);

		var amount = upgrade.groups[j];
		if (!upgrade.groups.synergy && j in Game.ObjectsByGroup && typeof amount === "number" && amount >= 0) {
			upgrade.buildingTie = Game.ObjectsByGroup[j];
			upgrade.require = buildRequireFunc;
			upgrade.chain = {
				amount: amount,
				building: upgrade.buildingTie,
				// setArr: [{gameObj: upgrade.buildingTie, amount: amount}, {gameObj: upgrade}],
				require: buildChainRequireFunc.bind(upgrade)
			};
		}
	}

	if (upgrade.pool === "prestige") {
		upgrade.order = upgrade.id;
	}

	if (upgrade.groups.heaven || pool === "prestige" || pool === "prestigeDecor") {
		Game.ArrayPush(Game.UpgradesByGroup, "allHeaven", upgrade);
	}

	if (upgrade.toggleInto) {
		upgrade.$crateNodes.addClass("togglePair");
		upgrade.buyFunc = buyToggleIntoFunc;
	}
}

Game.sortByOrderFunc = function (a, b) { return a.order - b.order; };
Game.UpgradeOrder = Game.UpgradesById.slice(0);
Game.UpgradeOrder.sort(Game.sortByOrderFunc);
Game.UpgradesByOrder = Game.UpgradeOrder.slice(0);

Game.UpgradesByPool.kitten = Game.UpgradesByGroup.kitten;

$("[data-upgrade-group]").each(function () {
	var upgrades = Game.UpgradesByGroup[this.dataset.upgradeGroup];
	if (upgrades) {
		for (var i = 0; i < upgrades.length; i++) {
			upgrades[i].createCrate(this);
		}
	}
});

var grandmaSynergyChainRequireFunc = function () {
	var unlock = Game.SpecialGrandmaUnlock;
	var building = this.grandmaBuilding;
	var amount = building.getAmount();
	return (Game.Objects["Grandma"].getAmount() > 0 && !building.blacklistCheckbox.checked &&
		amount < unlock && unlock - amount <= Game.maxChain);
};

for (i = 0; i < Game.UpgradesByGroup.grandmaSynergy.length; i++) {
	upgrade = Game.UpgradesByGroup.grandmaSynergy[i];
	if (upgrade.grandmaBuilding) {
		upgrade.chain = {
			amount: Game.SpecialGrandmaUnlock,
			building: upgrade.grandmaBuilding,
			require: grandmaSynergyChainRequireFunc.bind(upgrade)
		};
	}
}

var runFunc = function () { this.bought = Game.season === this.season; };
requireFunc = function () { return Game.HasUpgrade("Season switcher"); };
var buyFunc = function (wasBought) {
	if (this.bought) {
		Game.setSeason(this.season);
	} else if (wasBought) {
		Game.setSeason();
	}
};
priceFunc = function (uses) {
	if (isNaN(uses)) { uses = Game.seasonUses; }
	var m = 1;
	var godLvl = Game.hasGod("seasons"); //Selebrak
	if (godLvl == 1) {      m *= 2; }
	else if (godLvl == 2) { m *= 1.50; }
	else if (godLvl == 3) { m *= 1.25; }
	// return (Game.seasonTriggerBasePrice * Math.pow(2, uses) * m);
	// return (Game.cookiesPs * 60 * Math.pow(1.5, uses) * m);
	return (Game.seasonTriggerBasePrice + Game.unbuffedCookiesPs * 60 * Math.pow(1.5, uses) * m);
};

for (i = 0; i < Game.UpgradesByGroup.seasonSwitch.length; i++) {
	upgrade = Game.UpgradesByGroup.seasonSwitch[i];
	Game.seasons[upgrade.season] = {season: upgrade.season, switchUpgrade: upgrade};
	upgrade.runFunc = runFunc;
	upgrade.require = requireFunc;
	upgrade.buyFunc = buyFunc;
	upgrade.priceFunc = priceFunc;
}

priceFunc = function (santaLevel) {
	if (isNaN(santaLevel)) { santaLevel = Game.Get("santaLevel"); }
	return (Math.pow(3, santaLevel) * 2525);
};
for (i = 0; i < Game.UpgradesByGroup.santaDrop.length; i++) { //scale christmas upgrade prices with santa level
	Game.UpgradesByGroup.santaDrop[i].priceFunc = priceFunc;
}

priceFunc = function (eggs) { return Math.pow(2, eggs || Game.GetHowManyEggs()) * 999; };
for (i = 0; i < Game.UpgradesByGroup.commonEgg.length; i++) { //scale egg prices to how many eggs you have
	Game.UpgradesByGroup.commonEgg[i].priceFunc = priceFunc;
}
priceFunc = function (eggs) { return Math.pow(3, eggs || Game.GetHowManyEggs()) * 999; };
for (i = 0; i < Game.UpgradesByGroup.rareEgg.length; i++) {
	Game.UpgradesByGroup.rareEgg[i].priceFunc = priceFunc;
}

requireFunc = function () { return Game.Get("AchievementsOwned") / 25 >= this.groups.kitten; };
for (i = 0; i < Game.UpgradesByGroup.kitten.length; i++) {
	upgrade = Game.UpgradesByGroup.kitten[i];
	if (typeof upgrade.groups.kitten === "number") {
		upgrade.require = requireFunc;
	}
}

priceFunc = function (cost) {
	return function () { return cost * Game.cookiesPs * 60; };
};
for (i = 0; i < Game.UpgradesByGroup.gardenDrop.length; i++) {
	upgrade = Game.UpgradesByGroup.gardenDrop[i];
	upgrade.priceFunc = priceFunc(upgrade.basePrice);
	upgrade.setDescription(upgrade.baseDesc.replace("<q>", "<br>" + loc("Cost scales with CpS.") + "<q>"));
	upgrade.lasting = true;
}

var clickPercentAfterCalcCps = function () {
	this.cpsPrefix = Game.clicksPs ? "Second" : "Click";
	if (Game.cookiesPs && !Game.clicksPs) {
		this.cps = this.cpsObj.cookiesPerClickDiff;
		this.amort = this.cps > 0 ? Math.ceil(this.price / this.cps) : 0;
		this.amortStr = this.amort > 0 ? Game.BeautifyAbbr(this.amort) + " clicks" : "---";
	}
};

var clickAfterCalcCps = function () {
	this.cpsPrefix = "Second";
	if (!this.cpsObj.cookiesPsDiff && !Game.clicksPs) {
		this.cpsPrefix = "Click";
		this.cps = this.cpsObj.cookiesPerClickDiff;
		this.amort = this.cps > 0 ? Math.ceil(this.price / this.cps) : 0;
		this.amortStr = this.amort > 0 ? Game.BeautifyAbbr(this.amort) + " clicks" : "---";
	}
};

for (i = 0; i < Game.UpgradesByGroup.click.length; i++) {
	upgrade = Game.UpgradesByGroup.click[i];
	if (!upgrade.afterCalcCps) {
		if (upgrade.groups.clickPercent) {
			upgrade.afterCalcCps = clickPercentAfterCalcCps;
		} else {
			upgrade.afterCalcCps = clickAfterCalcCps;
		}
	}
}

buyFunc = function () {
	if (this.buildingTie1) {
		this.buildingTie1.priceCache = {};
	}
};
for (i = 0; i < Game.UpgradesByGroup.clearBuildCache.length; i++) {
	upgrade = Game.UpgradesByGroup.clearBuildCache[i];
	if (!upgrade.buyFunc) {
		upgrade.buyFunc = buyFunc;
	}
}

//#endregion Upgrades


//#region Achievements

Game.CountsAsAchievementOwned = function (pool) {
	return pool === "" || pool === "normal";
};

Game.Achievement = function (name, desc, icon, properties) {
	this.type = "achievement";
	this.id = Game.AchievementsById.length;
	this.name = name;
	this.dname = name;
	this.searchName = decodeHTMLEntities(name);
	this.pool = "normal";
	this.order = this.id;
	if (order) {
		this.order = order + this.id * 0.001;
	}

	var found = FindLocStringByPart(this.type + " name " + this.id);
	if (found) { this.dname = loc(found); }

	this.setDescription(desc);

	if (properties instanceof Object) {
		$.extend(this, properties);
	}

	this.icon = icon;
	this.iconCss = Game.getIconCss(icon);
	this.tinyIconStr = Game.getTinyIconStr(this.iconCss);
	this.iconName = this.tinyIconStr + " " + this.dname;

	this.groups = processGroups(this.groups);

	this.$baseCrate = $('<div class="achievement crate"></div>')
		.css(this.iconCss).attr("data-achievement", this.name);
	this.$baseCrate[0].objTie = this;

	this.$tooltipCrate = this.$baseCrate.clone();
	this.$crateNodes = this.$baseCrate.add(this.$tooltipCrate);

	this.won = false;
	this.tempWon = false;

	Game.Achievements[name] = this;
	Game.AchievementsById.push(this);

	Game.last = this;
};

Game.Achievement.prototype.toString = function () {
	return this.name;
};

Game.Achievement.prototype.getType = function () {
	return this.type;
};

Game.Achievement.prototype.setDescription = function (desc) {
	if (!EN) {
		desc = desc.replace(/<q>.+/, ""); //strip quote section
	}
	var found = FindLocStringByPart(this.type + " desc " + this.id);
	if (found) { desc = loc(found); }
	found = FindLocStringByPart(this.type + " quote " + this.id);
	if (found) { desc += "<q>" + loc(found) + "</q>"; }

	this.baseDesc = desc;
	this.beautifyDesc = BeautifyInText(desc);
	this.beautifyDescSearch = decodeHTMLEntities(this.beautifyDesc);
	this.abbrDesc = AbbrInText(desc);
	this.abbrDescSearch = decodeHTMLEntities(this.beautifyDesc);
	this.setCurrentDescription();
};

Game.Achievement.prototype.setCurrentDescription = function () {
	if (Game.abbrOn) {
		this.desc = this.abbrDesc;
		this.searchDesc = this.abbrDescSearch;
	} else {
		this.desc = this.beautifyDesc;
		this.searchDesc = this.beautifyDescSearch;
	}
};

Game.Achievement.prototype.resetTemp = function () {
	this.tempWon = this.won;
};

Game.Achievement.prototype.getWon = function (asNum) {
	var won = Game.predictiveMode ? this.tempWon : this.won;
	return asNum ? Number(won) : Boolean(won);
};

Game.Achievement.prototype.setWon = function (toggle, temp) {
	var key = Game.predictiveMode || temp ? "tempWon" : "won";
	toggle = typeof toggle === "undefined" ? !this[key] : Boolean(toggle);
	if (this.require) { toggle = toggle || this.require(); }
	this[key] = toggle;
	if (!Game.predictiveMode) {
		this.tempWon = toggle;
		if (this.toggleFunc) {
			this.toggleFunc();
		}
		this.$crateNodes.toggleClass("enabled", toggle);
	}
	return toggle;
};

Game.Achievement.prototype.getTooltip = function (crate, update) {
	var mysterious = !this.won && byId("achHideCheck").checked;
	var tags = "";
	if (this.pool === "shadow") {
		tags = makeTag(loc("Shadow Achievement"), "#9700cf");
	} else {
		tags = makeTag(loc("Achievement"));
	}
	tags += makeTag(loc(this.won ? "Unlocked" : "Locked"));

	var desc = this.desc;
	if (mysterious) {
		desc = "???";
	} else if (this.descFunc) {
		desc = this.descFunc();
	}

	var $div = $('<div class="crateTooltip achievementTooltip">' +
		'<div class="name">' + (mysterious ? "???" : this.dname) + '</div><div class="tags">' + tags + "</div>" +
		'<div class="line"></div><div class="description">' + desc + "</div></div>");
	this.$tooltipCrate.prependTo($div);
	$tooltipEle.empty().append($div);

	Game.setTooltip({refEle: crate, isCrate: true}, update);
};

var buildTierAchRequireFunc = function () {
	return this.buildingTie.getAmount() >= Game.Tiers[this.tier].achievUnlock;
};

Game.TieredAchievement = function (name, desc, buildingName, tier) {
	var building = Game.Objects[buildingName];
	var achieve = new Game.Achievement(name,
		loc("Have <b>%1</b>.", loc("%1 " + building.bsingle, Game.LBeautify(Game.Tiers[tier].achievUnlock))) + desc,
		Game.GetIcon(buildingName, tier), {require: buildTierAchRequireFunc, groups: building.groupName});
	Game.SetTier(buildingName, tier);
	return achieve;
};

Game.ProductionAchievement = function (name, building, tier, q, mult) {
	building = Game.Objects[building];
	var icon = [building.iconColumn, 22];
	var n = 12 + building.id + (mult || 0);
	if (tier == 2) {      icon[1] = 23; n += 7; }
	else if (tier == 3) { icon[1] = 24; n += 14; }
	var pow = Math.pow(10, n);
	var achiev = new Game.Achievement(name,
		loc("Make <b>%1</b> just from %2.", [loc("%1 cookie", {n: pow, b: Game.toFixed(pow)}), building.plural]) + (q ? "<q>" + q + "</q>" : ""),
		icon);
	// building.productionAchievs.push({pow: pow, achiev: achiev});
	return achiev;
};

Game.thresholdIcons = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 21, 22, 23, 24, 25, 26, 27, 28, 29, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 30, 31, 21, 22];
Game.BankAchievements = [];
var bankRequireFunc = function (add) { return Game.getCookiesBaked(add) >= this.threshold; };

Game.BankAchievement = function (name, q) {
	var threshold = Math.pow(10, Math.floor(Game.BankAchievements.length * 1.5 + 2));
	if (Game.BankAchievements.length === 0) { threshold = 1; }
	var achieve = new Game.Achievement(name,
		loc("Bake <b>%1</b> in one ascension.", loc("%1 cookie", {n: threshold, b: Game.toFixed(threshold)})) + (q ? "<q>" + q + "</q>" : ""),
		[Game.thresholdIcons[Game.BankAchievements.length], (Game.BankAchievements.length > 45 ? 0 : (Game.BankAchievements.length > 43 ? 2 : (Game.BankAchievements.length > 32 ? 1 : (Game.BankAchievements.length > 23 ? 2 : 5))))],
		{threshold: threshold, order: 100 + Game.BankAchievements.length * 0.01, groups: "bankAch", require: bankRequireFunc});
	Game.BankAchievements.push(achieve);
	return achieve;
};

Game.CpsAchievements = [];
var cpsRequireFunc = function (cps) {
	if (isNaN(cps)) { cps = Game.Get("cookiesPs"); }
	return cps >= this.threshold;
};
Game.CpsAchievement = function (name, q) {
	var threshold = Math.pow(10, Math.floor(Game.CpsAchievements.length * 1.2));
	var achieve = new Game.Achievement(name,
		loc("Bake <b>%1</b> per second.", loc("%1 cookie", {n: threshold, b: Game.toFixed(threshold)})) + (q ? "<q>" + q + "</q>" : ""),
		[Game.thresholdIcons[Game.CpsAchievements.length], (Game.CpsAchievements.length > 45 ? 0 : (Game.CpsAchievements.length > 43 ? 2 : (Game.CpsAchievements.length > 32 ? 1 : (Game.CpsAchievements.length > 23 ? 2 : 5))))],
		{threshold: threshold, order: 200 + Game.CpsAchievements.length * 0.01, groups: "cpsAch", require: cpsRequireFunc});
	Game.CpsAchievements.push(achieve);
	return achieve;
};


//define Achievements

order = 0;
Game.BankAchievement("Wake and bake");
Game.BankAchievement("Making some dough");
Game.BankAchievement("So baked right now");
Game.BankAchievement("Fledgling bakery");
Game.BankAchievement("Affluent bakery");
Game.BankAchievement("World-famous bakery");
Game.BankAchievement("Cosmic bakery");
Game.BankAchievement("Galactic bakery");
Game.BankAchievement("Universal bakery");
Game.BankAchievement("Timeless bakery");
Game.BankAchievement("Infinite bakery");
Game.BankAchievement("Immortal bakery");
Game.BankAchievement("Don't stop me now");
Game.BankAchievement("You can stop now");
Game.BankAchievement("Cookies all the way down");
Game.BankAchievement("Overdose");

Game.CpsAchievement("Casual baking");
Game.CpsAchievement("Hardcore baking");
Game.CpsAchievement("Steady tasty stream");
Game.CpsAchievement("Cookie monster");
Game.CpsAchievement("Mass producer");
Game.CpsAchievement("Cookie vortex");
Game.CpsAchievement("Cookie pulsar");
Game.CpsAchievement("Cookie quasar");
Game.CpsAchievement("Oh hey, you're still here");
Game.CpsAchievement("Let's never bake again");

order = 30010;
new Game.Achievement("Sacrifice",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e6))) + "<q>Easy come, easy go.</q>",
	[11, 6]);
new Game.Achievement("Oblivion",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e9))) + "<q>Back to square one.</q>",
	[11, 6]);
new Game.Achievement("From scratch",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e12))) + "<q>It's been fun.</q>",
	[11, 6]);

order = 11010;
new Game.Achievement("Neverclick",
	loc("Make <b>%1</b> by only having clicked <b>%2 times</b>.", [loc("%1 cookie", Game.LBeautify(1e6)), 15]),
	[12, 0]);
order = 1000;
new Game.Achievement("Clicktastic",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e3))),
	[11, 0]);
new Game.Achievement("Clickathlon",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e5))),
	[11, 1]);
new Game.Achievement("Clickolympics",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e7))),
	[11, 2]);
new Game.Achievement("Clickorama",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e9))),
	[11, 13]);

order = 1050;
new Game.Achievement("Click",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(1))),
	[0, 0], {groups: "cursor:1"});
new Game.Achievement("Double-click",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(2))),
	[0, 6], {groups: "cursor:2"});
new Game.Achievement("Mouse wheel",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(50))),
	[1, 6], {groups: "cursor:50"});
new Game.Achievement("Of Mice and Men",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(100))),
	[0, 1], {groups: "cursor:100"});
new Game.Achievement("The Digital",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(200))),
	[0, 2], {groups: "cursor:200"});

order = 1098;
new Game.Achievement("Just wrong",
	loc("Sell a grandma.") + "<q>I thought you loved me.</q>",
	[10, 9]);
order = 1100;
Game.TieredAchievement("Grandma's cookies", "", "Grandma", 1);
Game.TieredAchievement("Sloppy kisses", "", "Grandma", 2);
Game.TieredAchievement("Retirement home", "", "Grandma", 3);

order = 1200;
Game.TieredAchievement("Bought the farm", "", "Farm", 1);
Game.TieredAchievement("Reap what you sow", "", "Farm", 2);
Game.TieredAchievement("Farm ill", "", "Farm", 3);

order = 1400;
Game.TieredAchievement("Production chain", "", "Factory", 1);
Game.TieredAchievement("Industrial revolution", "", "Factory", 2);
Game.TieredAchievement("Global warming", "", "Factory", 3);

order = 1300;
Game.TieredAchievement("You know the drill", "", "Mine", 1);
Game.TieredAchievement("Excavation site", "", "Mine", 2);
Game.TieredAchievement("Hollow the planet", "", "Mine", 3);

order = 1500;
Game.TieredAchievement("Expedition", "", "Shipment", 1);
Game.TieredAchievement("Galactic highway", "", "Shipment", 2);
Game.TieredAchievement("Far far away", "", "Shipment", 3);

order = 1600;
Game.TieredAchievement("Transmutation", "", "Alchemy lab", 1);
Game.TieredAchievement("Transmogrification", "", "Alchemy lab", 2);
Game.TieredAchievement("Gold member", "", "Alchemy lab", 3);

order = 1700;
Game.TieredAchievement("A whole new world", "", "Portal", 1);
Game.TieredAchievement("Now you're thinking", "", "Portal", 2);
Game.TieredAchievement("Dimensional shift", "", "Portal", 3);

order = 1800;
Game.TieredAchievement("Time warp", "", "Time machine", 1);
Game.TieredAchievement("Alternate timeline", "", "Time machine", 2);
Game.TieredAchievement("Rewriting history", "", "Time machine", 3);

order = 7000;
new Game.Achievement("One with everything",
	loc("Have <b>at least %1</b> of every building.", 1),
	[2, 7], {require: getNumAllObjectsRequireFunc(1)});
new Game.Achievement("Mathematician",
	loc("Have at least <b>1 of the most expensive object, 2 of the second-most expensive, 4 of the next</b> and so on (capped at %1).", 128),
	[23, 12], {require: function () {
		var m = 1;
		for (var i = Game.ObjectsById.length - 1; i >= 0; i--) { //definitely want decrement
			if (Game.ObjectsById[i].getAmount() < m) { return false; }
			m = Math.min(m * 2, 128);
		}
		return true;
	}});
new Game.Achievement("Base 10",
	loc("Have at least <b>10 of the most expensive object, 20 of the second-most expensive, 30 of the next</b> and so on."),
	[23, 12], {require: function () {
		var m = 10;
		for (var i = Game.ObjectsById.length - 1; i >= 0; i--) { //ditto
			if (Game.ObjectsById[i].getAmount() < m) { return false; }
			m += 10;
		}
		return true;
	}});

order = 10000;
new Game.Achievement("Golden cookie",
	loc("Click a <b>golden cookie</b>."),
	[10, 14]);
new Game.Achievement("Lucky cookie",
	loc("Click <b>%1</b>.", loc("%1 golden cookie", Game.LBeautify(7))),
	[22, 6]);
new Game.Achievement("A stroke of luck",
	loc("Click <b>%1</b>.", loc("%1 golden cookie", Game.LBeautify(27))),
	[23, 6]);

order = 30200;
new Game.Achievement("Cheated cookies taste awful",
	loc("Hack in some cookies."),
	[10, 6], {pool: "shadow"});
order = 11010;
new Game.Achievement("Uncanny clicker",
	loc("Click really, really fast.") + "<q>Well I'll be!</q>",
	[12, 0]);

order = 5000;
new Game.Achievement("Builder",
	loc("Own <b>%1</b>.", loc("%1 building", Game.LBeautify(100))),
	[2, 6], {require: function () { return Game.Get("ObjectsOwned") >= 100; }});
new Game.Achievement("Architect",
	loc("Own <b>%1</b>.", loc("%1 building", Game.LBeautify(500))),
	[3, 6], {require: function () { return Game.Get("ObjectsOwned") >= 500; }});
order = 6000;
new Game.Achievement("Enhancer",
	loc("Purchase <b>%1</b>.", loc("%1 upgrade", Game.LBeautify(20))),
	[9, 0], {require: function () { return Game.Get("UpgradesOwned") >= 20; }});
new Game.Achievement("Augmenter",
	loc("Purchase <b>%1</b>.", loc("%1 upgrade", Game.LBeautify(50))),
	[9, 1], {require: function () { return Game.Get("UpgradesOwned") >= 50; }});

order = 11000;
new Game.Achievement("Cookie-dunker",
	loc("Dunk the cookie.") + "<q>You did it!</q>",
	[1, 8]);

order = 10000;
new Game.Achievement("Fortune",
	loc("Click <b>%1</b>.", loc("%1 golden cookie", Game.LBeautify(77))) + "<q>You should really go to bed.</q>",
	[24, 6]);
order = 31000;
new Game.Achievement("True Neverclick",
	loc("Make <b>%1</b> with <b>no</b> cookie clicks.", loc("%1 cookie", Game.LBeautify(1e6))) + "<q>This kinda defeats the whole purpose, doesn't it?</q>",
	[12, 0], {pool: "shadow"});

order = 20000;
new Game.Achievement("Elder nap",
	loc("Appease the grandmatriarchs at least <b>once</b>.") + "<q>we<br>are<br>eternal</q>",
	[8, 9]);
new Game.Achievement("Elder slumber",
	loc("Appease the grandmatriarchs at least <b>%1 times</b>.", 5) + "<q>our mind<br>outlives<br>the universe</q>",
	[8, 9]);

order = 1098;
new Game.Achievement("Elder",
	loc("Own at least <b>%1</b> grandma types.", 7),
	[10, 9], {require: function () {
		var list = Game.UpgradesByGroup.grandmaSynergy;
		return Game.countUpgradesByGroup(list, 7) >= 7;
	}});

order = 20000;
new Game.Achievement("Elder calm",
	loc("Declare a covenant with the grandmatriarchs.") + "<q>we<br>have<br>fed</q>",
	[8, 9]);

order = 5000;
new Game.Achievement("Engineer",
	loc("Own <b>%1</b>.", loc("%1 building", Game.LBeautify(1000))),
	[4, 6], {require: function () { return Game.Get("ObjectsOwned") >= 1000; }});

order = 10000;
new Game.Achievement("Leprechaun",
	loc("Click <b>%1</b>.", loc("%1 golden cookie", Game.LBeautify(777))),
	[25, 6]);
new Game.Achievement("Black cat's paw",
	loc("Click <b>%1</b>.", loc("%1 golden cookie", Game.LBeautify(7777))),
	[26, 6]);

order = 30050;
new Game.Achievement("Nihilism",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e15))) + "<q>There are many things<br>that need to be erased</q>",
	[11, 7]);

order = 1900;
Game.TieredAchievement("Antibatter", "", "Antimatter condenser", 1);
Game.TieredAchievement("Quirky quarks", "", "Antimatter condenser", 2);
Game.TieredAchievement("It does matter!", "", "Antimatter condenser", 3);

order = 6000;
new Game.Achievement("Upgrader",
	loc("Purchase <b>%1</b>.", loc("%1 upgrade", Game.LBeautify(100))),
	[9, 2], {require: function () { return Game.Get("UpgradesOwned") >= 100; }});

order = 7000;
new Game.Achievement("Centennial",
	loc("Have at least <b>%1 of everything</b>.", 100),
	[6, 6], {require: getNumAllObjectsRequireFunc(100)});

order = 30500;
new Game.Achievement("Hardcore",
	loc("Get to <b>%1</b> baked with <b>no upgrades purchased</b>.", loc("%1 cookie", Game.LBeautify(1e9))),
	[12, 6]);

order = 30600;
new Game.Achievement("Speed baking I",
	loc("Get to <b>%1</b> baked in <b>%2</b>.", [loc("%1 cookie", Game.LBeautify(1e6)), Game.sayTime(60 * 35 * Game.fps)]),
	[12, 5], {pool: "shadow"});
new Game.Achievement("Speed baking II",
	loc("Get to <b>%1</b> baked in <b>%2</b>.", [loc("%1 cookie", Game.LBeautify(1e6)), Game.sayTime(60 * 25 * Game.fps)]),
	[13, 5], {pool: "shadow"});
new Game.Achievement("Speed baking III",
	loc("Get to <b>%1</b> baked in <b>%2</b>.", [loc("%1 cookie", Game.LBeautify(1e6)), Game.sayTime(60 * 15 * Game.fps)]),
	[14, 5], {pool: "shadow"});

order = 61000;
new Game.Achievement("Getting even with the oven",
	EN ? "Defeat the <b>Sentient Furnace</b> in the factory dungeons." : "???",
	[12, 7], {pool: "dungeon"});
new Game.Achievement("Now this is pod-smashing",
	EN ? "Defeat the <b>Ascended Baking Pod</b> in the factory dungeons." : "???",
	[12, 7], {pool: "dungeon"});
new Game.Achievement("Chirped out",
	EN ? "Find and defeat <b>Chirpy</b>, the dysfunctionning alarm bot." : "???",
	[13, 7], {pool: "dungeon"});
new Game.Achievement("Follow the white rabbit",
	EN ? "Find and defeat the elusive <b>sugar bunny</b>." : "???",
	[14, 7], {pool: "dungeon"});

order = 1000;
new Game.Achievement("Clickasmic",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e11))),
	[11, 14]);

order = 1100;
Game.TieredAchievement("Friend of the ancients", "", "Grandma", 4);
Game.TieredAchievement("Ruler of the ancients", "", "Grandma", 5);

order = 32000;
new Game.Achievement("Wholesome",
	loc("Unlock <b>100%</b> of your heavenly chips power."),
	[15, 7], {require: function () {
		return Game.HasUpgrade(["Legacy", "Heavenly key"]);
	}});

order = 33000;
new Game.Achievement("Just plain lucky",
	loc("You have <b>1 chance in %1</b> every second of earning this achievement.", Game.Beautify(1000000)),
	[15, 6], {pool: "shadow"});

order = 21000;
new Game.Achievement("Itchscratcher",
	loc("Burst <b>1 wrinkler</b>."),
	[19, 8]);
new Game.Achievement("Wrinklesquisher",
	loc("Burst <b>%1 wrinklers</b>.", 50),
	[19, 8]);
new Game.Achievement("Moistburster",
	loc("Burst <b>%1 wrinklers</b>.", 200),
	[19, 8]);

order = 22000;
new Game.Achievement("Spooky cookies",
	loc("Unlock <b>every Halloween-themed cookie</b>.<div class=\"line\"></div>Owning this achievement makes Halloween-themed cookies drop more frequently in future playthroughs."),
	[12, 8], {require: function () {
		var list = Game.UpgradesByGroup.halloweenAch;
		return Game.countUpgradesByGroup(list) >= list.length;
	}});

order = 22100;
new Game.Achievement("Coming to town",
	loc("Reach <b>Santa's 7th form</b>."),
	[18, 9], {require: function () { return Game.Get("santaLevel") >= 6; }});
new Game.Achievement("All hail Santa",
	loc("Reach <b>Santa's final form</b>."),
	[19, 10], {require: function () { return Game.Get("santaLevel") >= Game.santaMax; }});
new Game.Achievement("Let it snow",
	loc("Unlock <b>every Christmas-themed cookie</b>.<div class=\"line\"></div>Owning this achievement makes Christmas-themed cookies drop more frequently in future playthroughs."),
	[19, 9], {require: function () {
		var list = Game.UpgradesByGroup.christmasAch;
		return Game.countUpgradesByGroup(list) >= list.length;
	}});
new Game.Achievement("Oh deer",
	loc("Pop <b>1 reindeer</b>."),
	[12, 9]);
new Game.Achievement("Sleigh of hand",
	loc("Pop <b>%1 reindeer</b>.", 50),
	[12, 9]);
new Game.Achievement("Reindeer sleigher",
	loc("Pop <b>%1 reindeer</b>.", 200),
	[12, 9]);

order = 1200;
Game.TieredAchievement("Perfected agriculture", "", "Farm", 4);
order = 1400;
Game.TieredAchievement("Ultimate automation", "", "Factory", 4);
order = 1300;
Game.TieredAchievement("Can you dig it", "", "Mine", 4);
order = 1500;
Game.TieredAchievement("Type II civilization", "", "Shipment", 4);
order = 1600;
Game.TieredAchievement("Gild wars", "", "Alchemy lab", 4);
order = 1700;
Game.TieredAchievement("Brain-split", "", "Portal", 4);
order = 1800;
Game.TieredAchievement("Time duke", "", "Time machine", 4);
order = 1900;
Game.TieredAchievement("Molecular maestro", "", "Antimatter condenser", 4);

order = 2000;
Game.TieredAchievement("Lone photon", "", "Prism", 1);
Game.TieredAchievement("Dazzling glimmer", "", "Prism", 2);
Game.TieredAchievement("Blinding flash", "", "Prism", 3);
Game.TieredAchievement("Unending glow", "", "Prism", 4);

order = 5000;
new Game.Achievement("Lord of Constructs",
	loc("Own <b>%1</b>.", loc("%1 building", Game.LBeautify(2500))) + "<q>He saw the vast plains stretching ahead of him, and he said : let there be civilization.</q>",
	[5, 6], {require: function () { return Game.Get("ObjectsOwned") >= 2500; }});
order = 6000;
new Game.Achievement("Lord of Progress",
	loc("Purchase <b>%1</b>.", loc("%1 upgrade", Game.LBeautify(200))) + "<q>One can always do better. But should you?</q>",
	[9, 14], {require: function () { return Game.Get("UpgradesOwned") >= 200; }});
order = 7002;
new Game.Achievement("Bicentennial",
	loc("Have at least <b>%1 of everything</b>.", 200) + "<q>You crazy person.</q>",
	[8, 6], {require: getNumAllObjectsRequireFunc(200)});

order = 22300;
new Game.Achievement("Lovely cookies",
	loc("Unlock <b>every Valentine-themed cookie</b>."),
	[20, 3], {require: function () {
		return Game.HasUpgrade("Prism heart biscuits");
	}});

order = 7001;
new Game.Achievement("Centennial and a half",
	loc("Have at least <b>%1 of everything</b>.", 150),
	[7, 6], {require: getNumAllObjectsRequireFunc(150)});

order = 11000;
new Game.Achievement("Tiny cookie",
	loc("Click the tiny cookie.") + "<q>These aren't the cookies you're clicking for.</q>",
	[0, 5]);

order = 400000;
new Game.Achievement("You win a cookie",
	loc("This is for baking %1 and making it on the local news.", loc("%1 cookie", Game.LBeautify(1e14))) + "<q>We're all so proud of you.</q>",
	[10, 0], {require: bankRequireFunc, threshold: 1e14});

order = 1070;
Game.ProductionAchievement("Click delegator", "Cursor", 1, 0, 7);
order = 1120;
Game.ProductionAchievement("Gushing grannies", "Grandma", 1, 0, 6);
order = 1220;
Game.ProductionAchievement("I hate manure", "Farm", 1);
order = 1320;
Game.ProductionAchievement("Never dig down", "Mine", 1);
order = 1420;
Game.ProductionAchievement("The incredible machine", "Factory", 1);
order = 1520;
Game.ProductionAchievement("And beyond", "Shipment", 1);
order = 1620;
Game.ProductionAchievement("Magnum Opus", "Alchemy lab", 1);
order = 1720;
Game.ProductionAchievement("With strange eons", "Portal", 1);
order = 1820;
Game.ProductionAchievement("Spacetime jigamaroo", "Time machine", 1);
order = 1920;
Game.ProductionAchievement("Supermassive", "Antimatter condenser", 1);
order = 2020;
Game.ProductionAchievement("Praise the sun", "Prism", 1);

order = 1000;
new Game.Achievement("Clickageddon",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e13))),
	[11, 15]);
new Game.Achievement("Clicknarok",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e15))),
	[11, 16]);

order = 1050;
new Game.Achievement("Extreme polydactyly",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(300))),
	[0, 13], {groups: "cursor:300"});
new Game.Achievement("Dr. T",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(400))),
	[0, 14], {groups: "cursor:400"});

order = 1100;
Game.TieredAchievement("The old never bothered me anyway", "", "Grandma", 6);
order = 1200;
Game.TieredAchievement("Homegrown", "", "Farm", 5);
order = 1400;
Game.TieredAchievement("Technocracy", "", "Factory", 5);
order = 1300;
Game.TieredAchievement("The center of the Earth", "", "Mine", 5);
order = 1500;
Game.TieredAchievement("We come in peace", "", "Shipment", 5);
order = 1600;
Game.TieredAchievement("The secrets of the universe", "", "Alchemy lab", 5);
order = 1700;
Game.TieredAchievement("Realm of the Mad God", "", "Portal", 5);
order = 1800;
Game.TieredAchievement("Forever and ever", "", "Time machine", 5);
order = 1900;
Game.TieredAchievement("Walk the planck", "", "Antimatter condenser", 5);
order = 2000;
Game.TieredAchievement("Rise and shine", "", "Prism", 5);

order = 30200;
new Game.Achievement("God complex",
	loc("Name yourself <b>Orteil</b>.<div class=\"warning\">Note: usurpers incur a -%1% CpS penalty until they rename themselves something else.</div>", 1) + "<q>But that's not you, is it?</q>",
	[17, 5], {pool: "shadow", require: function () { return Game.bakeryNameLowerCase === "orteil"; }});
new Game.Achievement("Third-party",
	loc("Use an <b>add-on</b>.") + "<q>Some find vanilla to be the most boring flavor.</q>",
	[16, 5], {pool: "shadow"});

order = 30050;
new Game.Achievement("Dematerialize",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e18))) + "<q>Presto!<br>...where'd the cookies go?</q>",
	[11, 7]);
new Game.Achievement("Nil zero zilch",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e21))) + "<q>To summarize : really not very much at all.</q>",
	[11, 7]);
new Game.Achievement("Transcendence",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e24))) + "<q>Your cookies are now on a higher plane of being.</q>",
	[11, 8]);
new Game.Achievement("Obliterate",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e27))) + "<q>Resistance is futile, albeit entertaining.</q>",
	[11, 8]);
new Game.Achievement("Negative void",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e30))) + "<q>You now have so few cookies that it's almost like you have a negative amount of them.</q>",
	[11, 8]);

order = 22400;
new Game.Achievement("The hunt is on",
	loc("Unlock <b>1 egg</b>."),
	[1, 12], {require: function () { return Game.GetHowManyEggs(1, true) >= 1; }});
new Game.Achievement("Egging on",
	loc("Unlock <b>%1 eggs</b>.", 7),
	[4, 12], {require: function () { return Game.GetHowManyEggs(7, true) >= 7; }});
new Game.Achievement("Mass Easteria",
	loc("Unlock <b>%1 eggs</b>.", 14),
	[7, 12], {require: function () { return Game.GetHowManyEggs(14, true) >= 14; }});
new Game.Achievement("Hide & seek champion",
	loc("Unlock <b>all the eggs</b>.<div class=\"line\"></div>Owning this achievement makes eggs drop more frequently in future playthroughs."),
	[13, 12], {require: function () { return Game.GetHowManyEggs(20, true) >= 20; }});

order = 11000;
new Game.Achievement("What's in a name",
	loc("Give your bakery a name."),
	[15, 9]);

order = 1425;
Game.TieredAchievement("Pretty penny", "", "Bank", 1);
Game.TieredAchievement("Fit the bill", "", "Bank", 2);
Game.TieredAchievement("A loan in the dark", "", "Bank", 3);
Game.TieredAchievement("Need for greed", "", "Bank", 4);
Game.TieredAchievement("It's the economy, stupid", "", "Bank", 5);
order = 1450;
Game.TieredAchievement("Your time to shrine", "", "Temple", 1);
Game.TieredAchievement("Shady sect", "", "Temple", 2);
Game.TieredAchievement("New-age cult", "", "Temple", 3);
Game.TieredAchievement("Organized religion", "", "Temple", 4);
Game.TieredAchievement("Fanaticism", "", "Temple", 5);
order = 1475;
Game.TieredAchievement("Bewitched", "", "Wizard tower", 1);
Game.TieredAchievement("The sorcerer's apprentice", "", "Wizard tower", 2);
Game.TieredAchievement("Charms and enchantments", "", "Wizard tower", 3);
Game.TieredAchievement("Curses and maledictions", "", "Wizard tower", 4);
Game.TieredAchievement("Magic kingdom", "", "Wizard tower", 5);

order = 1445;
Game.ProductionAchievement("Vested interest", "Bank", 1);
order = 1470;
Game.ProductionAchievement("New world order", "Temple", 1);
order = 1495;
Game.ProductionAchievement("Hocus pocus", "Wizard tower", 1);

order = 1070;
Game.ProductionAchievement("Finger clickin' good", "Cursor", 2, 0, 7);
order = 1120;
Game.ProductionAchievement("Panic at the bingo", "Grandma", 2, 0, 6);
order = 1220;
Game.ProductionAchievement("Rake in the dough", "Farm", 2);
order = 1320;
Game.ProductionAchievement("Quarry on", "Mine", 2);
order = 1420;
Game.ProductionAchievement("Yes I love technology", "Factory", 2);
order = 1445;
Game.ProductionAchievement("Paid in full", "Bank", 2);
order = 1470;
Game.ProductionAchievement("Church of Cookiology", "Temple", 2);
order = 1495;
Game.ProductionAchievement("Too many rabbits, not enough hats", "Wizard tower", 2);
order = 1520;
Game.ProductionAchievement("The most precious cargo", "Shipment", 2);
order = 1620;
Game.ProductionAchievement("The Aureate", "Alchemy lab", 2);
order = 1720;
Game.ProductionAchievement("Ever more hideous", "Portal", 2);
order = 1820;
Game.ProductionAchievement("Be kind, rewind", "Time machine", 2);
order = 1920;
Game.ProductionAchievement("Infinitesimal", "Antimatter condenser", 2);
order = 2020;
Game.ProductionAchievement("A still more glorious dawn", "Prism", 2);

order = 30000;
new Game.Achievement("Rebirth",
	loc("Ascend at least once."),
	[21, 6]);

order = 11000;
new Game.Achievement("Here you go",
	loc("Click this achievement's slot.") + "<q>All you had to do was ask.</q>",
	[1, 7]);

order = 30000;
new Game.Achievement("Resurrection",
	loc("Ascend <b>%1 times</b>.", 10),
	[21, 6]);
new Game.Achievement("Reincarnation",
	loc("Ascend <b>%1 times</b>.", 100),
	[21, 6]);
new Game.Achievement("Endless cycle",
	loc("Ascend <b>%1 times</b>.", 1000) + "<q>Oh hey, it's you again.</q>",
	[2, 7], {pool: "shadow"});

order = 1100;
Game.TieredAchievement("The agemaster", "", "Grandma", 7);
Game.TieredAchievement("To oldly go", "", "Grandma", 8);

order = 1200;
Game.TieredAchievement("Gardener extraordinaire", "", "Farm", 6);
order = 1300;
Game.TieredAchievement("Tectonic ambassador", "", "Mine", 6);
order = 1400;
Game.TieredAchievement("Rise of the machines", "", "Factory", 6);
order = 1425;
Game.TieredAchievement("Acquire currency", "", "Bank", 6);
order = 1450;
Game.TieredAchievement("Zealotry", "", "Temple", 6);
order = 1475;
Game.TieredAchievement("The wizarding world", "", "Wizard tower", 6);
order = 1500;
Game.TieredAchievement("Parsec-masher", "", "Shipment", 6);
order = 1600;
Game.TieredAchievement("The work of a lifetime", "", "Alchemy lab", 6);
order = 1700;
Game.TieredAchievement("A place lost in time", "", "Portal", 6);
order = 1800;
Game.TieredAchievement("Heat death", "", "Time machine", 6);
order = 1900;
Game.TieredAchievement("Microcosm", "", "Antimatter condenser", 6);
order = 2000;
Game.TieredAchievement("Bright future", "", "Prism", 6);

order = 25000;
new Game.Achievement("Here be dragon",
	loc("Complete your <b>dragon's training</b>."),
	[21, 12], {require: function () { return Game.HasUpgrade("A crumbly egg") && Game.dragonLevel >= Game.dragonLevelMax; }});

Game.BankAchievement("How?");
Game.BankAchievement("The land of milk and cookies");
Game.BankAchievement("He who controls the cookies controls the universe",
	"The milk must flow!");
Game.BankAchievement("Tonight on Hoarders");
Game.BankAchievement("Are you gonna eat all that?");
Game.BankAchievement("We're gonna need a bigger bakery");
Game.BankAchievement("In the mouth of madness",
	"A cookie is just what we tell each other it is.");
Game.BankAchievement('Brought to you by the letter <div style="display:inline-block;background:url(img/money.png);width:16px;height:16px;"></div>');

Game.CpsAchievement("A world filled with cookies");
Game.CpsAchievement("When this baby hits " + Game.abbreviateNumber(10000000000000 * 60 * 60, 0, true) + " cookies per hour");
Game.CpsAchievement("Fast and delicious");
Game.CpsAchievement("Cookiehertz : a really, really tasty hertz",
	"Tastier than a hertz donut, anyway.");
Game.CpsAchievement("Woops, you solved world hunger");
Game.CpsAchievement("Turbopuns",
	'Mother Nature will be like "slowwwww dowwwwwn".');
Game.CpsAchievement("Faster menner");
Game.CpsAchievement("And yet you're still hungry");
Game.CpsAchievement("The Abakening");
Game.CpsAchievement("There's really no hard limit to how long these achievement names can be and to be quite honest I'm rather curious to see how far we can go.<br>Adolphus W. Green (1844–1917) started as the Principal of the Groton School in 1864. By 1865, he became second assistant librarian at the New York Mercantile Library; from 1867 to 1869, he was promoted to full librarian. From 1869 to 1873, he worked for Evarts, Southmayd & Choate, a law firm co-founded by William M. Evarts, Charles Ferdinand Southmayd and Joseph Hodges Choate. He was admitted to the New York State Bar Association in 1873.<br>Anyway, how's your day been?");
Game.CpsAchievement("Fast",
	"Wow!");

order = 7002;
new Game.Achievement("Bicentennial and a half",
	loc("Have at least <b>%1 of everything</b>.", 250) + "<q>Keep on truckin'.</q>",
	[9, 6], {require: getNumAllObjectsRequireFunc(250)});

order = 11000;
new Game.Achievement("Tabloid addiction",
	loc("Click on the news ticker <b>%1 times</b>.", 50) + "<q>Page 6: Mad individual clicks on picture of pastry in a futile attempt to escape boredom!<br>Also page 6: British parliament ate my baby!</q>",
	[27, 7]);

order = 1000;
new Game.Achievement("Clickastrophe",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e17))),
	[11, 17]);
new Game.Achievement("Clickataclysm",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e19))),
	[11, 18]);

order = 1050;
new Game.Achievement("Thumbs, phalanges, metacarpals",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(500))) + "<q>& KNUCKLES</q>",
	[0, 15], {groups: "cursor:500"});

order = 6002;
new Game.Achievement("Polymath",
	loc("Own <b>%1</b> upgrades and <b>%2</b> buildings.", [300, 4000]) + "<q>Excellence doesn't happen overnight - it usually takes a good couple days.</q>",
	[29, 7], {require: function () { return Game.Get("ObjectsOwned") >= 4000 && Game.Get("UpgradesOwned") >= 300; }});

order = 1099;
new Game.Achievement("The elder scrolls",
	loc("Own a combined <b>%1</b> %2 and %3.", [777, loc("grandmas"), loc("cursors")]) + "<q>Let me guess. Someone stole your cookie.</q>",
	[10, 9], {require: function () { return Game.Objects["Cursor"].getAmount() + Game.Objects["Grandma"].getAmount() >= 777; }});

order = 30050;
new Game.Achievement("To crumbs, you say?",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e33))) + "<q>Very well then.</q>",
	[29, 6]);

order = 1200;
Game.TieredAchievement("Seedy business", "", "Farm", 7);
order = 1300;
Game.TieredAchievement("Freak fracking", "", "Mine", 7);
order = 1400;
Game.TieredAchievement("Modern times", "", "Factory", 7);
order = 1425;
Game.TieredAchievement("The nerve of war", "", "Bank", 7);
order = 1450;
Game.TieredAchievement("Wololo", "", "Temple", 7);
order = 1475;
Game.TieredAchievement("And now for my next trick, I'll need a volunteer from the audience", "", "Wizard tower", 7);
order = 1500;
Game.TieredAchievement("It's not delivery", "", "Shipment", 7);
order = 1600;
Game.TieredAchievement("Gold, Jerry! Gold!", "", "Alchemy lab", 7);
order = 1700;
Game.TieredAchievement("Forbidden zone", "", "Portal", 7);
order = 1800;
Game.TieredAchievement("cookie clicker forever and forever a hundred years cookie clicker, all day long forever, forever a hundred times, over and over cookie clicker adventures dot com", "", "Time machine", 7);
order = 1900;
Game.TieredAchievement("Scientists baffled everywhere", "", "Antimatter condenser", 7);
order = 2000;
Game.TieredAchievement("Harmony of the spheres", "", "Prism", 7);

order = 35000;
new Game.Achievement("Last Chance to See",
	loc("Burst the near-extinct <b>shiny wrinkler</b>.") + "<q>You monster!</q>",
	[24, 12], {pool: "shadow"});

order = 10000;
new Game.Achievement("Early bird",
	loc("Click a golden cookie <b>less than 1 second after it spawns</b>."),
	[10, 14]);
new Game.Achievement("Fading luck",
	loc("Click a golden cookie <b>less than 1 second before it dies</b>."),
	[10, 14]);

order = 22100;
new Game.Achievement("Eldeer",
	loc("Pop a reindeer <b>during an elder frenzy</b>."),
	[12, 9]);

order = 21100;
new Game.Achievement("Dude, sweet",
	loc("Harvest <b>%1 coalescing sugar lumps</b>.", 7),
	[24, 14]);
new Game.Achievement("Sugar rush",
	loc("Harvest <b>%1 coalescing sugar lumps</b>.", 30),
	[26, 14]);
new Game.Achievement("Year's worth of cavities",
	loc("Harvest <b>%1 coalescing sugar lumps</b>.", 365) + "<q>My lumps my lumps my lumps.</q>",
	[29, 14]);
new Game.Achievement("Hand-picked",
	loc("Successfully harvest a coalescing sugar lump before it's ripe."),
	[28, 14]);
new Game.Achievement("Sugar sugar",
	loc("Harvest a <b>bifurcated sugar lump</b>."),
	[29, 15]);
new Game.Achievement("All-natural cane sugar",
	loc("Harvest a <b>golden sugar lump</b>."),
	[29, 16], {pool: "shadow"});
new Game.Achievement("Sweetmeats",
	loc("Harvest a <b>meaty sugar lump</b>."),
	[29, 17]);

order = 7002;
new Game.Achievement("Tricentennial",
	loc("Have at least <b>%1 of everything</b>.", 300) + "<q>Can't stop, won't stop. Probably should stop, though.</q>",
	[29, 12], {require: getNumAllObjectsRequireFunc(300)});

Game.CpsAchievement("Knead for speed",
	"How did we not make that one yet?");
Game.CpsAchievement("Well the cookies start coming and they don't stop coming",
	"Didn't make sense not to click for fun.");
Game.CpsAchievement("I don't know if you've noticed but all these icons are very slightly off-center");
Game.CpsAchievement("The proof of the cookie is in the baking",
	"How can you have any cookies if you don't bake your dough?");
Game.CpsAchievement("If it's worth doing, it's worth overdoing");

Game.BankAchievement("The dreams in which I'm baking are the best I've ever had");
Game.BankAchievement("Set for life");

order = 1200;
Game.TieredAchievement("You and the beanstalk", "", "Farm", 8);
order = 1300;
Game.TieredAchievement("Romancing the stone", "", "Mine", 8);
order = 1400;
Game.TieredAchievement("Ex machina", "", "Factory", 8);
order = 1425;
Game.TieredAchievement("And I need it now", "", "Bank", 8);
order = 1450;
Game.TieredAchievement("Pray on the weak", "", "Temple", 8);
order = 1475;
Game.TieredAchievement("It's a kind of magic", "", "Wizard tower", 8);
order = 1500;
Game.TieredAchievement("Make it so", "", "Shipment", 8);
order = 1600;
Game.TieredAchievement("All that glitters is gold", "", "Alchemy lab", 8);
order = 1700;
Game.TieredAchievement("H̸̷͓̳̳̯̟͕̟͍͍̣͡ḛ̢̦̰̺̮̝͖͖̘̪͉͘͡ ̠̦͕̤̪̝̥̰̠̫̖̣͙̬͘ͅC̨̦̺̩̲̥͉̭͚̜̻̝̣̼͙̮̯̪o̴̡͇̘͎̞̲͇̦̲͞͡m̸̩̺̝̣̹̱͚̬̥̫̳̼̞̘̯͘ͅẹ͇̺̜́̕͢s̶̙̟̱̥̮̯̰̦͓͇͖͖̝͘͘͞", "", "Portal", 8);
order = 1800;
Game.TieredAchievement("Way back then", "", "Time machine", 8);
order = 1900;
Game.TieredAchievement("Exotic matter", "", "Antimatter condenser", 8);
order = 2000;
Game.TieredAchievement("At the end of the tunnel", "", "Prism", 8);

order = 1070;
Game.ProductionAchievement("Click (starring Adam Sandler)", "Cursor", 3, 0, 7);
order = 1120;
Game.ProductionAchievement("Frantiquities", "Grandma", 3, 0, 6);
order = 1220;
Game.ProductionAchievement("Overgrowth", "Farm", 3);
order = 1320;
Game.ProductionAchievement("Sedimentalism", "Mine", 3);
order = 1420;
Game.ProductionAchievement("Labor of love", "Factory", 3);
order = 1445;
Game.ProductionAchievement("Reverse funnel system", "Bank", 3);
order = 1470;
Game.ProductionAchievement("Thus spoke you", "Temple", 3);
order = 1495;
Game.ProductionAchievement("Manafest destiny", "Wizard tower", 3);
order = 1520;
Game.ProductionAchievement("Neither snow nor rain nor heat nor gloom of night", "Shipment", 3);
order = 1620;
Game.ProductionAchievement("I've got the Midas touch", "Alchemy lab", 3);
order = 1720;
Game.ProductionAchievement("Which eternal lie", "Portal", 3);
order = 1820;
Game.ProductionAchievement("D&eacute;j&agrave; vu", "Time machine", 3);
order = 1920;
Game.ProductionAchievement("Powers of Ten", "Antimatter condenser", 3);
order = 2020;
Game.ProductionAchievement("Now the dark days are gone", "Prism", 3);

order = 1070;
new Game.Achievement("Freaky jazz hands", "", [0, 26], {groups: "cursor|level10"});
order = 1120;
new Game.Achievement("Methuselah", "", [1, 26], {groups: "grandma|level10"});
order = 1220;
new Game.Achievement("Huge tracts of land", "", [2, 26], {groups: "farm|level10"});
order = 1320;
new Game.Achievement("D-d-d-d-deeper", "", [3, 26], {groups: "mine|level10"});
order = 1420;
new Game.Achievement("Patently genius", "", [4, 26], {groups: "factory|level10"});
order = 1445;
new Game.Achievement("A capital idea", "", [15, 26], {groups: "bank|level10"});
order = 1470;
new Game.Achievement("It belongs in a bakery", "", [16, 26], {groups: "temple|level10"});
order = 1495;
new Game.Achievement("Motormouth", "", [17, 26], {groups: "wizardTower|level10"});
order = 1520;
new Game.Achievement("Been there done that", "", [5, 26], {groups: "shipment|level10"});
order = 1620;
new Game.Achievement("Phlogisticated substances", "", [6, 26], {groups: "alchemyLab|level10"});
order = 1720;
new Game.Achievement("Bizarro world", "", [7, 26], {groups: "portal|level10"});
order = 1820;
new Game.Achievement("The long now", "", [8, 26], {groups: "timeMachine|level10"});
order = 1920;
new Game.Achievement("Chubby hadrons", "", [13, 26], {groups: "antimatterCondenser|level10"});
order = 2020;
new Game.Achievement("Palettable", "", [14, 26], {groups: "prism|level10"});

order = 61495;
new Game.Achievement("Bibbidi-bobbidi-boo",
	loc("Cast <b>%1</b> spells.", 9),
	[21, 11]);
new Game.Achievement("I'm the wiz",
	loc("Cast <b>%1</b> spells.", 99),
	[22, 11]);
new Game.Achievement("A wizard is you",
	loc("Cast <b>%1</b> spells.", 999) + "<q>I'm a what?</q>",
	[29, 11]);

order = 10000;
new Game.Achievement("Four-leaf cookie",
	loc("Have <b>%1</b> golden cookies simultaneously.", 4) + "<q>Fairly rare, considering cookies don't even have leaves.</q>",
	[27, 6], {pool: "shadow"});

order = 2100;
Game.TieredAchievement("Lucked out", "", "Chancemaker", 1);
Game.TieredAchievement("What are the odds", "", "Chancemaker", 2);
Game.TieredAchievement("Grandma needs a new pair of shoes", "", "Chancemaker", 3);
Game.TieredAchievement("Million to one shot, doc", "", "Chancemaker", 4);
Game.TieredAchievement("As luck would have it", "", "Chancemaker", 5);
Game.TieredAchievement("Ever in your favor", "", "Chancemaker", 6);
Game.TieredAchievement("Be a lady", "", "Chancemaker", 7);
Game.TieredAchievement("Dicey business", "", "Chancemaker", 8);

order = 2120;
Game.ProductionAchievement("Fingers crossed", "Chancemaker", 1);
Game.ProductionAchievement("Just a statistic", "Chancemaker", 2);
Game.ProductionAchievement("Murphy's wild guess", "Chancemaker", 3);

new Game.Achievement("Let's leaf it at that", "", [19, 26], {groups: "chancemaker|level10"});

order = 1000;
new Game.Achievement("The ultimate clickdown",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e21))) + "<q>(of ultimate destiny.)</q>",
	[11, 19]);

order = 1100;
Game.TieredAchievement("Aged well", "", "Grandma", 9);
Game.TieredAchievement("101st birthday", "", "Grandma", 10);
Game.TieredAchievement("But wait 'til you get older", "", "Grandma", 11);
order = 1200;
Game.TieredAchievement("Harvest moon", "", "Farm", 9);
order = 1300;
Game.TieredAchievement("Mine?", "", "Mine", 9);
order = 1400;
Game.TieredAchievement("In full gear", "", "Factory", 9);
order = 1425;
Game.TieredAchievement("Treacle tart economics", "", "Bank", 9);
order = 1450;
Game.TieredAchievement("Holy cookies, grandma!", "", "Temple", 9);
order = 1475;
Game.TieredAchievement("The Prestige",
	"<q>(Unrelated to the Cookie Clicker feature of the same name.)</q>",
	"Wizard tower", 9);
order = 1500;
Game.TieredAchievement("That's just peanuts to space", "", "Shipment", 9);
order = 1600;
Game.TieredAchievement("Worth its weight in lead", "", "Alchemy lab", 9);
order = 1700;
Game.TieredAchievement("What happens in the vortex stays in the vortex", "", "Portal", 9);
order = 1800;
Game.TieredAchievement("Invited to yesterday's party", "", "Time machine", 9);
order = 1900;
Game.TieredAchievement("Downsizing", "", "Antimatter condenser", 9);
order = 2000;
Game.TieredAchievement("My eyes", "", "Prism", 9);
order = 2100;
Game.TieredAchievement("Maybe a chance in hell, actually", "", "Chancemaker", 9);

order = 1200;
Game.TieredAchievement("Make like a tree", "", "Farm", 10);
order = 1300;
Game.TieredAchievement("Cave story", "", "Mine", 10);
order = 1400;
Game.TieredAchievement("In-cog-neato", "", "Factory", 10);
order = 1425;
Game.TieredAchievement("Save your breath because that's all you've got left", "", "Bank", 10);
order = 1450;
Game.TieredAchievement("Vengeful and almighty", "", "Temple", 10);
order = 1475;
Game.TieredAchievement("Spell it out for you", "", "Wizard tower", 10);
order = 1500;
Game.TieredAchievement("Space space space space space",
	"<q>It's too far away...</q>",
	"Shipment", 10);
order = 1600;
Game.TieredAchievement("Don't get used to yourself, you're gonna have to change", "", "Alchemy lab", 10);
order = 1700;
Game.TieredAchievement("Objects in the mirror dimension are closer than they appear", "", "Portal", 10);
order = 1800;
Game.TieredAchievement("Groundhog day", "", "Time machine", 10);
order = 1900;
Game.TieredAchievement("A matter of perspective", "", "Antimatter condenser", 10);
order = 2000;
Game.TieredAchievement("Optical illusion", "", "Prism", 10);
order = 2100;
Game.TieredAchievement("Jackpot", "", "Chancemaker", 10);

order = 36000;
new Game.Achievement("So much to do so much to see",
	loc("Manage a cookie legacy for <b>at least a year</b>.") + "<q>Thank you so much for playing Cookie Clicker!</q>",
	[23, 11], {pool: "shadow"});

Game.CpsAchievement("Running with scissors");
Game.CpsAchievement("Rarefied air");
Game.CpsAchievement("Push it to the limit");
Game.CpsAchievement("Green cookies sleep furiously");

Game.BankAchievement("Panic! at Nabisco");
Game.BankAchievement("Bursting at the seams");
Game.BankAchievement("Just about full");
Game.BankAchievement("Hungry for more");

order = 1000;
new Game.Achievement("All the other kids with the pumped up clicks",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e23))),
	[11, 28]);
new Game.Achievement("One...more...click...",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e25))),
	[11, 30]);

order = 61515;
new Game.Achievement("Botany enthusiast",
	loc("Harvest <b>%1</b> mature garden plants.", 100),
	[26, 20]);
new Game.Achievement("Green, aching thumb",
	loc("Harvest <b>%1</b> mature garden plants.", 1000),
	[27, 20]);
new Game.Achievement("In the garden of Eden (baby)",
	loc("Fill every tile of the biggest garden plot with plants.") + "<q>Isn't tending to those precious little plants just so rock and/or roll?</q>",
	[28, 20]);

new Game.Achievement("Keeper of the conservatory",
	loc("Unlock every garden seed."),
	[25, 20]);
new Game.Achievement("Seedless to nay",
	loc("Convert a complete seed log into sugar lumps by sacrificing your garden to the sugar hornets.<div class=\"line\"></div>Owning this achievement makes seeds <b>%1% cheaper</b>, plants mature <b>%2% sooner</b>, and plant upgrades drop <b>%3% more</b>.", [5, 5, 5]),
	[29, 20], {toggleFunc: function () {
		if (Game.garden.computeMatures) {
			Game.garden.computeMatures();
			Game.garden.updateAllPlotTiles();
		}
	}});

order = 30050;
new Game.Achievement("You get nothing",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e36))) + "<q>Good day sir!</q>",
	[29, 6]);
new Game.Achievement("Humble rebeginnings",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e39))) + "<q>Started from the bottom, now we're here.</q>",
	[29, 6]);
new Game.Achievement("The end of the world",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e42))) + "<q>(as we know it)</q>",
	[21, 25]);
new Game.Achievement("Oh, you're back",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e45))) + "<q>Missed us?</q>",
	[21, 25]);
new Game.Achievement("Lazarus",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e48))) + "<q>All rise.</q>",
	[21, 25]);

Game.CpsAchievement("Leisurely pace");
Game.CpsAchievement("Hypersonic");

Game.BankAchievement("Feed me, Orteil");
Game.BankAchievement("And then what?");

order = 7002;
new Game.Achievement("Tricentennial and a half",
	loc("Have at least <b>%1 of everything</b>.", 350) + "<q>(it's free real estate)</q>",
	[21, 26], {require: getNumAllObjectsRequireFunc(350)});
new Game.Achievement("Quadricentennial",
	loc("Have at least <b>%1 of everything</b>.", 400) + "<q>You've had to do horrible things to get this far.<br>Horrible... horrible things.</q>",
	[22, 26], {require: getNumAllObjectsRequireFunc(400)});
new Game.Achievement("Quadricentennial and a half",
	loc("Have at least <b>%1 of everything</b>.", 450) + "<q>At this point, you might just be compensating for something.</q>",
	[23, 26], {require: getNumAllObjectsRequireFunc(450)});

new Game.Achievement("Quincentennial",
	loc("Have at least <b>%1 of everything</b>.", 500) + "<q>Some people would say you're halfway there.<br>We do not care for those people and their reckless sense of unchecked optimism.</q>",
	[29, 25], {require: getNumAllObjectsRequireFunc(500)});

order = 21100;
new Game.Achievement("Maillard reaction",
	loc("Harvest a <b>caramelized sugar lump</b>."),
	[29, 27]);

order = 30250;
new Game.Achievement("When the cookies ascend just right",
	loc("Ascend with exactly <b>%1</b>.", loc("%1 cookie", Game.LBeautify(1e12))),
	[25, 7], {pool: "shadow"}); //this achievement is shadow because it is only achievable through blind luck or reading external guides; this may change in the future

order = 1050;
new Game.Achievement("With her finger and her thumb",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(600))),
	[0, 16], {groups: "cursor:600"});

order = 1100;
Game.TieredAchievement("But wait 'til you get older", "", "Grandma", 12);
order = 1200;
Game.TieredAchievement("Sharpest tool in the shed", "", "Farm", 11);
order = 1300;
Game.TieredAchievement("Hey now, you're a rock", "", "Mine", 11);
order = 1400;
Game.TieredAchievement("Break the mold", "", "Factory", 11);
order = 1425;
Game.TieredAchievement("Get the show on, get paid", "", "Bank", 11);
order = 1450;
Game.TieredAchievement("My world's on fire, how about yours", "", "Temple", 11);
order = 1475;
Game.TieredAchievement("The meteor men beg to differ", "", "Wizard tower", 11);
order = 1500;
Game.TieredAchievement("Only shooting stars", "", "Shipment", 11);
order = 1600;
Game.TieredAchievement("We could all use a little change", "", "Alchemy lab", 11); //"all that glitters is gold" was already an achievement
order = 1700;
Game.TieredAchievement("Your brain gets smart but your head gets dumb", "", "Portal", 11);
order = 1800;
Game.TieredAchievement("The years start coming", "", "Time machine", 11);
order = 1900;
Game.TieredAchievement("What a concept", "", "Antimatter condenser", 11);
order = 2000;
Game.TieredAchievement("You'll never shine if you don't glow", "", "Prism", 11);
order = 2100;
Game.TieredAchievement("You'll never know if you don't go", "", "Chancemaker", 11);

order = 2200;
Game.TieredAchievement("Self-contained", "", "Fractal engine", 1);
Game.TieredAchievement("Threw you for a loop", "", "Fractal engine", 2);
Game.TieredAchievement("The sum of its parts", "", "Fractal engine", 3);
Game.TieredAchievement("Bears repeating",
	"<q>Where did these come from?</q>",
	"Fractal engine", 4);
Game.TieredAchievement("More of the same", "", "Fractal engine", 5);
Game.TieredAchievement("Last recurse", "", "Fractal engine", 6);
Game.TieredAchievement("Out of one, many", "", "Fractal engine", 7);
Game.TieredAchievement("An example of recursion", "", "Fractal engine", 8);
Game.TieredAchievement("For more information on this achievement, please refer to its title", "", "Fractal engine", 9);
Game.TieredAchievement("I'm so meta, even this achievement", "", "Fractal engine", 10);
Game.TieredAchievement("Never get bored", "", "Fractal engine", 11);

order = 2220;
Game.ProductionAchievement("The needs of the many", "Fractal engine", 1);
Game.ProductionAchievement("Eating its own", "Fractal engine", 2);
Game.ProductionAchievement("We must go deeper", "Fractal engine", 3);

new Game.Achievement("Sierpinski rhomboids", "", [20, 26], {groups: "fractalEngine|level10"});

Game.CpsAchievement("Gotta go fast");
Game.BankAchievement("I think it's safe to say you've got it made");

order = 6002;
new Game.Achievement("Renaissance baker",
	loc("Own <b>%1</b> upgrades and <b>%2</b> buildings.", [400, 8000]) + "<q>If you have seen further, it is by standing on the shoulders of giants - a mysterious species of towering humanoids until now thought long-extinct.</q>",
	[10, 10], {require: function () { return Game.Get("ObjectsOwned") >= 8000 && Game.Get("UpgradesOwned") >= 400; }});

order = 1098;
new Game.Achievement("Veteran",
	loc("Own at least <b>%1</b> grandma types.", 14) + "<q>14's a crowd!</q>",
	[10, 9], {require: function () {
		var list = Game.UpgradesByGroup.grandmaSynergy;
		return Game.countUpgradesByGroup(list, 14) >= 14;
	}});

order = 10000;
new Game.Achievement("Thick-skinned",
	loc("Have your <b>reinforced membrane</b> protect the <b>shimmering veil</b>."),
	[7, 10]);

order = 2300;
Game.TieredAchievement("F12", "", "Javascript console", 1);
Game.TieredAchievement("Variable success", "", "Javascript console", 2);
Game.TieredAchievement("No comments", "", "Javascript console", 3);
Game.TieredAchievement("Up to code", "", "Javascript console", 4);
Game.TieredAchievement("Works on my machine", "", "Javascript console", 5);
Game.TieredAchievement("Technical debt", "", "Javascript console", 6);
Game.TieredAchievement("Mind your language", "", "Javascript console", 7);
Game.TieredAchievement("Inconsolable", "", "Javascript console", 8);
Game.TieredAchievement("Closure", "", "Javascript console", 9);
Game.TieredAchievement("Dude what if we're all living in a simulation like what if we're all just code on a computer somewhere", "", "Javascript console", 10);
Game.TieredAchievement("Taking the back streets", "", "Javascript console", 11);

order = 2320;
Game.ProductionAchievement("Inherited prototype", "Javascript console", 1);
Game.ProductionAchievement("A model of document object", "Javascript console", 2);
Game.ProductionAchievement("First-class citizen", "Javascript console", 3);

new Game.Achievement("Alexandria", "", [32, 26], {groups: "jsConsole|level10"});

Game.CpsAchievement("Bake him away, toys");
Game.CpsAchievement("You're #1 so why try harder");
Game.CpsAchievement("Haven't even begun to peak");
Game.BankAchievement("A sometimes food");
Game.BankAchievement("Not enough of a good thing");
Game.BankAchievement("Horn of plenty");

order = 30050;
new Game.Achievement("Smurf account",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e51))) + "<q>It's like you just appeared out of the blue!</q>",
	[21, 32]);
new Game.Achievement("If at first you don't succeed",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e54))) + "<q>If at first you don't succeed, try, try, try again.<br>But isn't that the definition of insanity?</q>",
	[21, 32]);

order = 33000;
new Game.Achievement("O Fortuna",
	loc("Own every <b>fortune upgrade</b>.<div class=\"line\"></div>Owning this achievement makes fortunes appear <b>twice as often</b>; unlocked fortune upgrades also have a <b>%1% chance</b> to carry over after ascending.", 40),
	[29, 8], {require: function () {
		var list = Game.Tiers.fortune.upgrades;
		return Game.countUpgradesByGroup(list, list.length) >= list.length;
	}});

order = 61615;
new Game.Achievement("Initial public offering",
	loc("Make your first stock market profit."),
	[0, 33]);
new Game.Achievement("Rookie numbers",
	loc("Own at least <b>%1</b> of every stock market good.", 100) + "<q>Gotta pump those numbers up!</q>",
	[9, 33]);
new Game.Achievement("No nobility in poverty",
	loc("Own at least <b>%1</b> of every stock market good.", 500) + "<q>What kind of twisted individual is out there cramming camels through needle holes anyway?</q>",
	[10, 33]);
new Game.Achievement("Full warehouses",
	loc("Own at least <b>%1</b> of a stock market good.", 1000),
	[11, 33]);
new Game.Achievement("Make my day",
	loc("Make <b>a day</b> of CpS ($%1) in 1 stock market sale.", 86400),
	[1, 33]);
new Game.Achievement("Buy buy buy",
	loc("Spend <b>a day</b> of CpS ($%1) in 1 stock market purchase.", 86400),
	[1, 33]);
new Game.Achievement("Gaseous assets",
	loc("Have your stock market profits surpass <b>a whole year</b> of CpS ($%1).", 31536000) + "<q>Boy, how volatile!</q>",
	[18, 33], {pool: "shadow"});
new Game.Achievement("Pyramid scheme",
	loc("Unlock the <b>highest-tier</b> stock market headquarters."),
	[18, 33]);

order = 10000;
new Game.Achievement("Jellicles",
	loc("Own <b>%1</b> kitten upgrades.", 10) + "<q>Jellicles can and jellicles do! Make sure to wash your jellicles every day!</q>",
	[18, 19]);

order = 7002;
new Game.Achievement("Quincentennial and a half",
	loc("Have at least <b>%1 of everything</b>.", 550) + "<q>This won't fill the churning void inside, you know.</q>",
	[29, 26]);

Game.CpsAchievement("What did we even eat before these");
Game.CpsAchievement("Heavy flow");
Game.CpsAchievement("More you say?");
Game.BankAchievement("Large and in charge");
Game.BankAchievement("Absolutely stuffed");
Game.BankAchievement("It's only wafer-thin",
	"Just the one!");

order = 1000;
new Game.Achievement("Clickety split",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e27))),
	[11, 31]);
order = 1050;
new Game.Achievement("Gotta hand it to you",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(700))),
	[0, 17], {groups: "cursor:700"});
order = 1100;
Game.TieredAchievement("Okay boomer", "", "Grandma", 13);
order = 1200;
Game.TieredAchievement("Overripe", "", "Farm", 12);
order = 1300;
Game.TieredAchievement("Rock on", "", "Mine", 12);
order = 1400;
Game.TieredAchievement("Self-manmade man", "", "Factory", 12);
order = 1425;
Game.TieredAchievement("Checks out", "", "Bank", 12);
order = 1450;
Game.TieredAchievement("Living on a prayer", "", "Temple", 12);
order = 1475;
Game.TieredAchievement("Higitus figitus migitus mum", "", "Wizard tower", 12);
order = 1500;
Game.TieredAchievement("The incredible journey", "", "Shipment", 12);
order = 1600;
Game.TieredAchievement("Just a phase", "", "Alchemy lab", 12);
order = 1700;
Game.TieredAchievement("Don't let me leave, Murph", "", "Portal", 12);
order = 1800;
Game.TieredAchievement("Caveman to cosmos", "", "Time machine", 12);
order = 1900;
Game.TieredAchievement("Particular tastes", "", "Antimatter condenser", 12);
order = 2000;
Game.TieredAchievement("A light snack", "", "Prism", 12);
order = 2100;
Game.TieredAchievement("Tempting fate", "", "Chancemaker", 12);
order = 2200;
Game.TieredAchievement("Tautological", "", "Fractal engine", 12);
order = 2300;
Game.TieredAchievement("Curly braces",
	"<q>Or as the French call them, mustache boxes.<br>Go well with quotes.</q>",
	"Javascript console", 12);

order = 10000;
new Game.Achievement("Seven horseshoes",
	loc("Click <b>%1</b>.", loc("%1 golden cookie", Game.LBeautify(27777))) + "<q>Enough for one of those funky horses that graze near your factories.</q>",
	[21, 33], {pool: "shadow"});

order = 11005;
new Game.Achievement("Olden days",
	loc("Find the <b>forgotten madeleine</b>.") + "<q>DashNet Farms remembers.</q>",
	[12, 3]);

order = 1050;
new Game.Achievement("The devil's workshop",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(800))),
	[0, 18], {groups: "cursor:800"});
order = 1200;
Game.TieredAchievement("In the green", "", "Farm", 13);
order = 1300;
Game.TieredAchievement("Mountain out of a molehill, but like in a good way", "", "Mine", 13);
order = 1400;
Game.TieredAchievement("The wheels of progress", "", "Factory", 13);
order = 1425;
Game.TieredAchievement("That's rich", "", "Bank", 13);
order = 1450;
Game.TieredAchievement("Preaches and cream", "", "Temple", 13);
order = 1475;
Game.TieredAchievement("Magic thinking", "", "Wizard tower", 13);
order = 1500;
Game.TieredAchievement("Is there life on Mars?",
	"<q>Yes, there is. You're currently using it as filling in experimental flavor prototype #810657.</q>",
	"Shipment", 13);
order = 1600;
Game.TieredAchievement("Bad chemistry", "", "Alchemy lab", 13);
order = 1700;
Game.TieredAchievement("Reduced to gibbering heaps", "", "Portal", 13);
order = 1800;
Game.TieredAchievement("Back already?", "", "Time machine", 13);
order = 1900;
Game.TieredAchievement("Nuclear throne", "", "Antimatter condenser", 13);
order = 2000;
Game.TieredAchievement("Making light of the situation", "", "Prism", 13);
order = 2100;
Game.TieredAchievement("Flip a cookie. Chips, I win. Crust, you lose.", "", "Chancemaker", 13);
order = 2200;
Game.TieredAchievement("In and of itself", "", "Fractal engine", 13);
order = 2300;
Game.TieredAchievement("Duck typing",
	"<q>Hello, this is a duck typing. Got any grapes?</q>",
	"Javascript console", 13);

order = 2400;
Game.TieredAchievement("They'll never know what hit 'em", "", "Idleverse", 1);
Game.TieredAchievement("Well-versed", "", "Idleverse", 2);
Game.TieredAchievement("Ripe for the picking", "", "Idleverse", 3);
Game.TieredAchievement("Unreal", "", "Idleverse", 4);
Game.TieredAchievement("Once you've seen one", "", "Idleverse", 5);
Game.TieredAchievement("Spoils and plunder", "", "Idleverse", 6);
Game.TieredAchievement("Nobody exists on purpose, nobody belongs anywhere",
	"<q>Come watch TV?</q>",
	"Idleverse", 7);
Game.TieredAchievement("Hyperspace expressway", "", "Idleverse", 8);
Game.TieredAchievement("Versatile", "", "Idleverse", 9);
Game.TieredAchievement("You are inevitable", "", "Idleverse", 10);
Game.TieredAchievement("Away from this place", "", "Idleverse", 11);
Game.TieredAchievement("Everywhere at once", "", "Idleverse", 12);
Game.TieredAchievement("Reject reality, substitute your own", "", "Idleverse", 13);

order = 2420;
Game.ProductionAchievement("Fringe", "Idleverse", 1);
Game.ProductionAchievement("Coherence", "Idleverse", 2);
Game.ProductionAchievement("Earth-616", "Idleverse", 3);

new Game.Achievement("Strange topologies", "", [33, 26], {groups: "idleverse|level10"});

order = 5000;
new Game.Achievement("Grand design",
	loc("Own <b>%1</b>.", loc("%1 building", Game.LBeautify(5000))) + "<q>They'll remember you forever!</q>",
	[32, 12], {require: function () { return Game.Get("ObjectsOwned") >= 5000; }});
new Game.Achievement("Ecumenopolis",
	loc("Own <b>%1</b>.", loc("%1 building", Game.LBeautify(7500))) + "<q>Getting a wee bit cramped.</q>",
	[33, 12], {require: function () { return Game.Get("ObjectsOwned") >= 7500; }});

order = 6000;
new Game.Achievement("The full picture",
	loc("Purchase <b>%1</b>.", loc("%1 upgrade", Game.LBeautify(300))) + "<q>So that's where that fits in!</q>",
	[32, 11], {require: function () { return Game.Get("UpgradesOwned") >= 300; }});
new Game.Achievement("When there's nothing left to add",
	loc("Purchase <b>%1</b>.", loc("%1 upgrade", Game.LBeautify(400))) + "<q>...keep going.</q>",
	[33, 11], {require: function () { return Game.Get("UpgradesOwned") >= 400; }});

order = 7002;
new Game.Achievement("Sexcentennial",
	loc("Have at least <b>%1 of everything</b>.", 600) + "<q>Hey, nice milestone!</q>",
	[31, 33], {require: getNumAllObjectsRequireFunc(600)});

Game.CpsAchievement("Keep going until I say stop");
Game.CpsAchievement("But I didn't say stop, did I?");
Game.CpsAchievement("With unrivaled fervor");
Game.BankAchievement("Think big");
Game.BankAchievement("Hypersize me");
Game.BankAchievement("Max capacity");

order = 61616;
new Game.Achievement("Liquid assets",
	loc("Have your stock market profits surpass <b>$%1</b>.", 1e7),
	[12, 33]);

order = 11000;
new Game.Achievement("Stifling the press",
	loc("Squish the news ticker flat, then click on it.") + "<q>Narrow in here or is it just me?</q>",
	[27, 7]);

order = 2500;
Game.TieredAchievement("It's big brain time", "", "Cortex baker", 1);
Game.TieredAchievement("Just my imagination", "", "Cortex baker", 2);
Game.TieredAchievement("Now there's an idea", "", "Cortex baker", 3);
Game.TieredAchievement("The organ that named itself", "", "Cortex baker", 4);
Game.TieredAchievement("Gyrification", "", "Cortex baker", 5);
Game.TieredAchievement('A trademarked portmanteau of "imagination" and "engineering"', "", "Cortex baker", 6);
Game.TieredAchievement("Mindfulness", "", "Cortex baker", 7);
Game.TieredAchievement("The 10% myth", "", "Cortex baker", 8);
Game.TieredAchievement("Don't think about it too hard", "", "Cortex baker", 9);
Game.TieredAchievement("Though fools seldom differ", "", "Cortex baker", 10);
Game.TieredAchievement("Looking kind of dumb", "", "Cortex baker", 11);
Game.TieredAchievement("A beautiful mind", "", "Cortex baker", 12);
Game.TieredAchievement("Cardinal synapses", "", "Cortex baker", 13);

order = 2520;
Game.ProductionAchievement("Positive thinking", "Cortex baker", 1);
Game.ProductionAchievement("The thought that counts", "Cortex baker", 2);
Game.ProductionAchievement("Unthinkable", "Cortex baker", 3);

new Game.Achievement("Gifted", "", [34, 26], {groups: "cortexBaker|level10"});

order = 1100;
Game.TieredAchievement("They moistly come at night", "", "Grandma", 14);
order = 1200;
Game.TieredAchievement("It's grown on you", "", "Farm", 14);
order = 1300;
Game.TieredAchievement("Don't let the walls cave in on you", "", "Mine", 14);
order = 1400;
Game.TieredAchievement("Replaced by robots", "", "Factory", 14);
order = 1425;
Game.TieredAchievement("Financial prodigy", "<q>Imagine how it would be, to be at the top making cash money.</q>", "Bank", 14);
order = 1450;
Game.TieredAchievement("And I will pray to a big god", "", "Temple", 14);
order = 1475;
Game.TieredAchievement("Shosple Colupis", "", "Wizard tower", 14);
order = 1500;
Game.TieredAchievement("False vacuum", "", "Shipment", 14);
order = 1600;
Game.TieredAchievement("Metallic taste", "", "Alchemy lab", 14);
order = 1700;
Game.TieredAchievement("Swiss cheese", "", "Portal", 14);
order = 1800;
Game.TieredAchievement("But the future refused to change", "", "Time machine", 14);
order = 1900;
Game.TieredAchievement("What's the dark matter with you", "", "Antimatter condenser", 14);
order = 2000;
Game.TieredAchievement("Enlightenment", "", "Prism", 14);
order = 2100;
Game.TieredAchievement("Never tell me the odds", "", "Chancemaker", 14);
order = 2200;
Game.TieredAchievement("Blowing an Apollonian gasket", "", "Fractal engine", 14);
order = 2300;
Game.TieredAchievement("Get with the program", "", "Javascript console", 14);
order = 2400;
Game.TieredAchievement("Lost your cosmic marbles", "", "Idleverse", 14);
order = 2500;
Game.TieredAchievement("By will alone I set my mind in motion", "", "Cortex baker", 14);

order = 1000;
new Game.Achievement("Ain't that a click in the head",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e29))),
	[11, 34]);

order = 7002;
new Game.Achievement("Sexcentennial and a half",
	loc("Have at least <b>%1 of everything</b>.", 650) + "<q>Hope you're enjoying the grind so far! It gets worse.</q>",
	[21, 34], {require: getNumAllObjectsRequireFunc(650)});

Game.CpsAchievement("I am speed");
Game.CpsAchievement("And on and on");
Game.BankAchievement("Fake it till you bake it");
Game.BankAchievement("History in the baking");

order = 22100;
new Game.Achievement("Baby it's old outside",
	loc("Click one of Santa's helper grandmas during Christmas season."),
	[10, 9]);

order = 5000;
new Game.Achievement("Myriad",
	loc("Own <b>%1</b>.", loc("%1 building", Game.LBeautify(10000))) + "<q>At this point, most of your assets lie in real estate.</q>",
	[31, 6], {require: function () { return Game.Get("ObjectsOwned") >= 10000; }});

order = 6000;
new Game.Achievement("Kaizen",
	loc("Purchase <b>%1</b>.", loc("%1 upgrade", Game.LBeautify(500))) + "<q>Just a little more.</q>",
	[31, 5], {require: function () { return Game.Get("UpgradesOwned") >= 500; }});
new Game.Achievement("Beyond quality",
	loc("Purchase <b>%1</b>.", loc("%1 upgrade", Game.LBeautify(600))) + "<q>Dwarfing all of mankind's accomplishments.</q>",
	[32, 5], {require: function () { return Game.Get("UpgradesOwned") >= 600; }});

Game.CpsAchievement("Everything happens so much");
Game.CpsAchievement("I'll rest when I'm dead");
Game.BankAchievement("What do you get for the baker who has everything");
Game.BankAchievement("Bottomless pit");

order = 6001;
new Game.Achievement("All the stars in heaven",
	loc("Own <b>%1</b> heavenly upgrades.", 100),
	[30, 5], {require: function () {
		return Game.countUpgradesByGroup(Game.UpgradesByPool.prestige, 100) >= 100;
	}});

order = 32500;
new Game.Achievement("No time like the present",
	loc("Redeem a cookie gift code from a friend (or from yourself, we don't judge)."),
	[34, 6]);

Game.CpsAchievement("Can we get much higher");
Game.CpsAchievement("Speed's the name of the game (no it's not it's called Cookie Clicker)");
Game.BankAchievement("Rainy day fund");
Game.BankAchievement("And a little extra");

order = 19990;
new Game.Achievement("Grandmapocalypse",
	loc("Trigger the grandmapocalypse for the first time."),
	[28, 21]);
new Game.Achievement("Wrath cookie",
	loc("Click a <b>wrath cookie</b>."),
	[15, 5]);

order = 30050;
new Game.Achievement("No more room in hell",
	loc("Ascend with <b>%1</b> baked.", loc("%1 cookie", Game.LBeautify(1e57))) + "<q>That is not dead which can eternal click.</q>",
	[21, 32]);

order = 32600;
new Game.Achievement("In her likeness",
	loc("Shape your clones to resemble %1.", loc("grandmas")) + "<q>There she is.</q>",
	[26, 21], {pool: "shadow"});

order = 20999;
new Game.Achievement("Wrinkler poker",
	loc("Poke a wrinkler <b>%1 times</b> without killing it.", 50) + "<q>Also the name of a card game popular in retirement homes.</q>",
	[19, 8]);

order = 7002;
new Game.Achievement("Septcentennial",
	loc("Have at least <b>%1 of everything</b>.", 700) + "<q>In this economy?</q>",
	[29, 36], {require: getNumAllObjectsRequireFunc(700)});

order = 2600;
Game.TieredAchievement("My own clone", "", "You", 1);
Game.TieredAchievement("Multiplicity", "", "You", 2);
Game.TieredAchievement("Born for this job", "", "You", 3);
Game.TieredAchievement("Episode II", "", "You", 4);
Game.TieredAchievement("Copy that", "", "You", 5);
Game.TieredAchievement("Life finds a way", "", "You", 6);
Game.TieredAchievement("Overcrowding", "", "You", 7);
Game.TieredAchievement("Strength in numbers", "", "You", 8);
Game.TieredAchievement("Army of me", "", "You", 9);
Game.TieredAchievement("Know thyself", "<q>Do you ever look at yourself in the mirror and wonder... What is going on inside your head?</q>", "You", 10);
Game.TieredAchievement("Didn't make sense not to live", "", "You", 11);
Game.TieredAchievement("Genetic bottleneck", "", "You", 12);
Game.TieredAchievement("Despite everything, it's still you", "", "You", 13);
Game.TieredAchievement("Everyone everywhere all at once", "", "You", 14);

order = 2620;
Game.ProductionAchievement("Self-made", "You", 1);
Game.ProductionAchievement("Reproducible results", "You", 2);
Game.ProductionAchievement("That's all you", "You", 3);

new Game.Achievement("Self-improvement", "", [35, 26], {groups: "you|level10"});

order = 1100;
Game.TieredAchievement("And now you're even older", "", "Grandma", 15);
order = 1200;
Game.TieredAchievement("Au naturel", "", "Farm", 15);
order = 1300;
Game.TieredAchievement("Dirt-rich", "", "Mine", 15);
order = 1400;
Game.TieredAchievement("Bots build bots", "", "Factory", 15);
order = 1425;
Game.TieredAchievement("Getting that bag", "", "Bank", 15);
order = 1450;
Game.TieredAchievement("The leader is good, the leader is great", "", "Temple", 15);
order = 1475;
Game.TieredAchievement("You don't think they could've used... it couldn't have been ma-", "", "Wizard tower", 15);
order = 1500;
Game.TieredAchievement("Signed, sealed, delivered", "", "Shipment", 15);
order = 1600;
Game.TieredAchievement("Sugar, spice, and everything nice", "<q>These were the ingredients chosen to create the perfect cookies.</q>", "Alchemy lab", 15);
order = 1700;
Game.TieredAchievement("Not even remotely close to Kansas anymore", "", "Portal", 15);
order = 1800;
Game.TieredAchievement("I only meant to stay a while", "", "Time machine", 15);
order = 1900;
Game.TieredAchievement("Not 20 years away forever", "", "Antimatter condenser", 15);
order = 2000;
Game.TieredAchievement("Bright side of the Moon", "", "Prism", 15);
order = 2100;
Game.TieredAchievement("Riding the Mersenne twister", "", "Chancemaker", 15);
order = 2200;
Game.TieredAchievement("Divide and conquer", "", "Fractal engine", 15);
order = 2300;
Game.TieredAchievement("Pebcakes", "<q>Problem exists in my mouth!</q>", "Javascript console", 15);
order = 2400;
Game.TieredAchievement("Greener on the other sides", "", "Idleverse", 15);
order = 2500;
Game.TieredAchievement("Where is my mind", "", "Cortex baker", 15);
order = 2600;
Game.TieredAchievement("Introspection", "", "You", 15);

order = 61617;
new Game.Achievement("Debt evasion",
	loc("Take out a loan and ascend before incurring the CpS penalty.") + "<q>Really got 'em buttered!</q>",
	[4, 33]);

order = 6000;
new Game.Achievement("Oft we mar what's well", loc("Purchase <b>%1</b>.",
	loc("%1 upgrade", Game.LBeautify(700))) + "<q>But don't let that stop you!</q>",
	[33, 5], {require: function () { return Game.Get("UpgradesOwned") >= 700; }});

order = 500000;
new Game.Achievement("Cookie Clicker",
	loc("Unlock the final building."),
	[30, 6], {require: function () { return Game.Objects["You"].getAmount() > 0; }, descFunc:  function () {
		if (!Game.specialAnimLoop) {
			Game.specialAnimLoop = setInterval(function () {
				var el = byId("parade");
				if (!el || !Game.tooltipOn) {
					clearInterval(Game.specialAnimLoop);
					Game.specialAnimLoop = null;
					return false;
				}
				var x = Game.T;
				el.style.backgroundPosition = "-" + x + "px " + (Game.T % 20 < 10 ? 0 : 32) + "px";
			}, 100);
		}
		var x = Game.T;
		return (this.desc + "<q>" + loc("Everyone's here.") + '<div id="parade" style=""background-position:-' + x + "px " + (x % 20 < 10 ? 0 : 32) +
			'px;"></div><div style="margin-bottom:32px;"></div>' + loc("Won't you have some cookies too?") + "</q>");
	}});

order = 1000;
new Game.Achievement("What's not clicking",
	loc("Make <b>%1</b> from clicking.", loc("%1 cookie", Game.LBeautify(1e31))),
	[11, 36]);
order = 1050;
new Game.Achievement("All on deck",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(900))),
	[0, 19], {groups: "cursor:900"});
new Game.Achievement("A round of applause",
	loc("Have <b>%1</b>.", loc("%1 cursor", Game.LBeautify(1000))) + "<q>Boy, are my arms tired!</q>",
	[0, 28], {groups: "cursor:1000"});

//end achievement definitions


//cleanup defined stuff

Game.AchievementsByOrder = Game.AchievementsById.slice(0);
Game.AchievementsByOrder.sort(Game.sortByOrderFunc);
var $norm = $("#achNorm");
var $shadow = $("#achShadow");
var $dungeon = $("#achDungeon");

for (i = 0; i < Game.AchievementsByOrder.length; i++) {
	var achieve = Game.AchievementsByOrder[i];
	Game.ArrayPush(Game.AchievementsByPool, achieve.pool, achieve);

	if (Game.CountsAsAchievementOwned(achieve.pool)) {
		Game.AchievementsTotal++;
	}

	var $node = $norm;
	if (achieve.pool === "shadow") {
		$node = $shadow;
		achieve.$crateNodes.addClass("shadow");
	} else if (achieve.pool === "dungeon") {
		$node = $dungeon;
	}
	$node.append(achieve.$baseCrate);

	for (j in achieve.groups) {
		Game.ArrayPush(Game.AchievementsByGroup, j, achieve);

		if (!achieve.buildingTie && j in Game.ObjectsByGroup) {
			achieve.buildingTie = Game.ObjectsByGroup[j];
		}
	}
}

var reqFunc = function () { return Game.Objects["Cursor"].getAmount() >= this.groups.cursor; };
for (i = 0; i < Game.AchievementsByGroup.cursor.length; i++) {
	Game.AchievementsByGroup.cursor[i].require = reqFunc;
}

reqFunc = function () { return this.buildingTie.level >= 10; };
for (i = 0; i < Game.AchievementsByGroup.level10.length; i++) {
	achieve = Game.AchievementsByGroup.level10[i];
	achieve.setDescription(loc("Reach level <b>%1</b> %2.", [10, achieve.buildingTie.plural]));
	achieve.require = reqFunc;
}

//#endregion Achievements


//#region Buffs / Buff types

Game.goldenCookieBuildingBuffs = {
	"Cursor":               ["High-five", "Slap to the face"],
	"Grandma":              ["Congregation", "Senility"],
	"Farm":                 ["Luxuriant harvest", "Locusts"],
	"Mine":                 ["Ore vein", "Cave-in"],
	"Factory":              ["Oiled-up", "Jammed machinery"],
	"Bank":                 ["Juicy profits", "Recession"],
	"Temple":               ["Fervent adoration", "Crisis of faith"],
	"Wizard tower":         ["Manabloom", "Magivores"],
	"Shipment":             ["Delicious lifeforms", "Black holes"],
	"Alchemy lab":          ["Breakthrough", "Lab disaster"],
	"Portal":               ["Righteous cataclysm", "Dimensional calamity"],
	"Time machine":         ["Golden ages", "Time jam"],
	"Antimatter condenser": ["Extra cycles", "Predictable tragedy"],
	"Prism":                ["Solar flare", "Eclipse"],
	"Chancemaker":          ["Winning streak", "Dry spell"],
	"Fractal engine":       ["Macrocosm", "Microcosm"],
	"Javascript console":   ["Refactoring", "Antipattern"],
	"Idleverse":            ["Cosmic nursery", "Big crunch"],
	"Cortex baker":         ["Brainstorm", "Brain freeze"],
	"You":                  ["Deduplication", "Clone strike"]
};

var objectOptions = "";
for (i = 0; i < Game.ObjectsById.length; i++) {
	objectOptions += '<option value="' + i + '">' + Game.ObjectsById[i].name + "</option>";
}
var buffObjectSel = '<select class="buffObjectSelect">' + objectOptions + "</select>";

Game.BuffType = function (name, func, props) {
	this.name = name;
	this.func = func; //this is a function that returns a buff object; it takes a "time" argument in seconds, and 3 more optional arguments at most, which will be saved and loaded as floats
	this.id = Game.BuffTypes.length;

	$.extend(this, props);

	this.dname = this.dname || loc(name);

	if (!this.hidden) {
		this.$domNode = $('<div class="buffType" data-bufftype="' + name +
			'"><span class="buffTypeName tooltipped"><a class="buffTypeAdd">Add</a> ' + this.displayName + '</span> <span class="buffTypeOptions spacer"></span> ' +
			'<span class="buffTypeBtns"></span>' +
			"</div>").appendTo("#buffsTypesBlock");
		this.domNode = this.$domNode[0];
		this.domNode.objTie = this;

		this.$addBtn = this.$domNode.find(".buffTypeAdd");
		this.$addBtn[0].objTie = this;

		var $node = this.$domNode.find(".buffTypeOptions");
		if (this.addObjectSel) {
			var self = this;

			var $select = $(buffObjectSel).appendTo($node);
			$select.after(" ");
			self.objectSelect = $select[0];
			self.objectSelect.objTie = self;

			var $input = $('<input type="text" class="buffObjectAmountIn" value="1" placeholder="1">').appendTo($node);
			self.objectAmountIn = $input[0];
			self.objectAmountIn.minIn = 1;
			self.objectAmountIn.objTie = self;
			self.objectAmountIn.checkFunc = function () {
				self.updateFunc();
			};
		}

		if (this.addOptions) {
			this.addOptions($node);
		}
	}

	Game.BuffTypesByName[this.name] = this;
	Game.BuffTypes.push(this);
};

Game.BuffType.prototype.getTime = function (setWrath) {
	var time = this.time;
	if (this.fromGoldCookie || this.fromWrathCookie) {
		var wrath = this.fromWrathCookie && (setWrath || !this.fromGoldCookie || byId("buffsSetWrath").checked);
		time = Math.ceil(time * Game.getGoldCookieDurationMod(wrath));
	}
	return time;
};

Game.BuffType.prototype.getArgs = function () {
	return [
		this.getTime(),
		this.powFunc ? this.powFunc() : this.pow
	];
};

Game.BuffType.prototype.updateFunc = function () { };

//base buffs
new Game.BuffType("frenzy", function (time, pow) {
	return {
		name: "Frenzy",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [10, 14],
		time: time * Game.fps,
		multCpS: pow
	};
}, {
	displayName: "Frenzy",
	tooltipDesc: loc("Cookie production x%1 for %2!", [7, Game.sayTime(17 * Game.fps, -1)]),
	fromGoldCookie: true,
	fromWrathCookie: true,
	time: 77,
	pow: 7
});
new Game.BuffType("blood frenzy", function (time, pow) {
	return {
		name: "Elder frenzy",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [29, 6],
		time: time * Game.fps,
		multCpS: pow
	};
}, {
	displayName: "Elder frenzy",
	tooltipDesc: loc("Cookie production x%1 for %2!", [666, Game.sayTime(6 * Game.fps, -1)]),
	fromWrathCookie: true,
	time: 6,
	pow: 666
});
new Game.BuffType("clot", function (time, pow) {
	return {
		name: "Clot",
		desc: loc("Cookie production halved for %1!", Game.sayTime(time * Game.fps, -1)),
		icon: [15, 5],
		time: time * Game.fps,
		multCpS: pow
	};
}, {
	displayName: "Clot",
	tooltipDesc: loc("Cookie production halved for %1!", Game.sayTime(6 * Game.fps, -1)),
	fromWrathCookie: true,
	time: 66,
	pow: 0.5
});
new Game.BuffType("dragon harvest", function (time, pow) {
	if (Game.HasUpgrade("Dragon fang")) { pow = Math.ceil(pow * 1.1); }
	return {
		name: "Dragon Harvest",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [10, 25],
		time: time * Game.fps,
		multCpS: pow
	};
}, {
	displayName: "Dragon Harvest",
	tooltipDesc: loc("Cookie production x%1 for %2!", [15, Game.sayTime(60 * Game.fps, -1)]),
	fromGoldCookie: true,
	time: 60,
	pow: 15
});
new Game.BuffType("everything must go", function (time, pow) {
	return {
		name: "Everything must go",
		desc: loc("All buildings are %1% cheaper for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [17, 6],
		time: time * Game.fps,
		power: pow
	};
}, {
	displayName: "Everything must go",
	tooltipDesc: loc("All buildings are %1% cheaper for %2!", [5, Game.sayTime(8 * Game.fps, -1)]),
	fromGoldCookie: true,
	fromWrathCookie: true,
	time: 8,
	pow: 5
});
new Game.BuffType("cursed finger", function (time, pow) {
	return {
		name: "Cursed finger",
		desc: loc("Cookie production halted for %1,<br>but each click is worth %2 of CpS.", [Game.sayTime(time * Game.fps, -1), Game.sayTime(time * Game.fps, -1)]),
		icon: [12, 17],
		time: time * Game.fps,
		power: pow,
		multCpS: 0
	};
}, {
	displayName: "Cursed finger",
	tooltipDesc: loc("Cookie production halted for %1,<br>but each click is worth %2 of CpS.", [Game.sayTime(10 * Game.fps, -1), Game.sayTime(10 * Game.fps, -1)]),
	fromWrathCookie: true,
	time: 10,
	powFunc: function () {
		return (Game.cookiesPs * this.getTime(true));
	}
});
new Game.BuffType("click frenzy", function (time, pow) {
	return {
		name: "Click frenzy",
		desc: loc("Clicking power x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [0, 14],
		time: time * Game.fps,
		multClick: pow
	};
}, {
	displayName: "Click frenzy",
	tooltipDesc: loc("Clicking power x%1 for %2!", [777, Game.sayTime(13 * Game.fps, -1)]),
	fromGoldCookie: true,
	fromWrathCookie: true,
	time: 13,
	pow: 777
});
new Game.BuffType("dragonflight", function (time, pow) {
	if (Game.HasUpgrade("Dragon fang")) { pow = Math.ceil(pow * 1.1); }
	return {
		name: "Dragonflight",
		desc: loc("Clicking power x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [0, 25],
		time: time * Game.fps,
		add: true,
		multClick: pow,
		aura: 1
	};
}, {
	displayName: "Dragonflight",
	tooltipDesc: loc("Clicking power x%1 for %2!", [1111, Game.sayTime(10 * Game.fps, -1)]),
	fromGoldCookie: true,
	time: 10,
	pow: 1111
});
//irrelevant
new Game.BuffType("cookie storm", function (time, pow) {
	return {
		name: "Cookie storm",
		desc: loc("Cookies everywhere!"),
		icon: [22, 6],
		time: time * Game.fps,
		add: true,
		power: pow,
		aura: 1
	};
}, {hidden: true});

new Game.BuffType("building buff", function (time, pow, building, amount) {
	var obj = Game.ObjectsById[building];
	if (isNaN(amount)) {
		amount = obj.getAmount();
	}
	return {
		name: Game.goldenCookieBuildingBuffs[obj.name][0],
		dname: EN ? Game.goldenCookieBuildingBuffs[obj.name][0] : loc("%1 Power!", obj.dname),
		desc: loc("Your %1 are boosting your CpS!", loc("%1 " + obj.bsingle, Game.LBeautify(amount))) + "<br>" +
			loc("Cookie production +%1% for %2!", [Game.Beautify(Math.ceil(pow * 100 - 100)), Game.sayTime(time * Game.fps, -1)]),
		icon: [obj.iconColumn, 14],
		time: time * Game.fps,
		multCpS: pow
	};
}, {
	displayName: "Building buff",
	tooltipDesc: "Your (amount) (building) are boosting your CpS!<br>Cookie production +(xxx)% for 30 seconds!",
	fromGoldCookie: true,
	fromWrathCookie: true,
	time: 30,
	addObjectSel: true,
	addOptions: function ($node) {
		var $random = $('<a class="buffRandomObject">Random</a>').appendTo($node);
		$random.before(" ");
		$random[0].objTie = this;
	},
	getArgs: function () {
		return [
			this.getTime(),
			this.objectAmountIn.parsedValue / 10 + 1,
			this.objectSelect.value,
			this.objectAmountIn.parsedValue
		];
	}
});
new Game.BuffType("building debuff", function (time, pow, building, amount) {
	var obj = Game.ObjectsById[building];
	if (isNaN(amount)) {
		amount = obj.getAmount();
	}
	return {
		name: Game.goldenCookieBuildingBuffs[obj.name][1],
		dname: EN ? Game.goldenCookieBuildingBuffs[obj.name][1] : loc("%1 Burden!", obj.dname),
		desc: loc("Your %1 are rusting your CpS!", loc("%1 " + obj.bsingle, Game.LBeautify(amount))) + "<br>" +
			loc("Cookie production %1% slower for %2!", [Game.Beautify(Math.ceil(pow * 100 - 100)), Game.sayTime(time * Game.fps, -1)]),
		icon: [obj.iconColumn, 15],
		time: time * Game.fps,
		multCpS: 1 / pow
	};
}, {
	displayName: "Building debuff",
	tooltipDesc: "Your (amount) (building) are rusting your CpS!<br>Cookie production (xx)% slower for 30 seconds!",
	fromWrathCookie: true,
	time: 30,
	addObjectSel: true,
	addOptions: function ($node) {
		var $random = $('<a class="buffRandomObject">Random</a>').appendTo($node);
		$random.before(" ");
		$random[0].objTie = this;
	},
	getArgs: function () {
		return [
			this.getTime(),
			this.objectAmountIn.parsedValue / 10 + 1,
			this.objectSelect.value,
			this.objectAmountIn.parsedValue
		];
	}
});
// irrelevant
new Game.BuffType("sugar blessing", function (time) {
	return {
		name: "Sugar blessing",
		desc: loc("You find %1% more golden cookies for the next %2.", [10, Game.sayTime(time * Game.fps, -1)]),
		icon: [29, 16],
		time: time * Game.fps
	};
}, {hidden: true});
new Game.BuffType("haggler luck", function (time, pow) {
	return {
		name: "Haggler's luck",
		desc: loc("All upgrades are %1% cheaper for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [25, 11],
		time: time * Game.fps,
		power: pow
	};
}, {
	displayName: "Haggler's luck",
	tooltipDesc: loc("All upgrades are %1% cheaper for %2!", [2, Game.sayTime(60 * Game.fps, -1)]),
	time: 60,
	pow: 2,
	killOnGain: "Haggler's misery"
});
new Game.BuffType("haggler misery", function (time, pow) {
	return {
		name: "Haggler's misery",
		desc: loc("All upgrades are %1% pricier for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [25, 11],
		time: time * Game.fps,
		power: pow,
		max: true
	};
}, {
	displayName: "Haggler's misery",
	tooltipDesc: loc("All upgrades are %1% pricier for %2!", [2, Game.sayTime(60 * 60 * Game.fps, -1)]),
	time: 60 * 60,
	pow: 2,
	killOnGain: "Haggler's luck"
});
new Game.BuffType("pixie luck", function (time, pow) {
	return {
		name: "Crafty pixies",
		desc: loc("All buildings are %1% cheaper for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [26, 11],
		time: time * Game.fps,
		power: pow,
		max: true
	};
}, {
	displayName: "Crafty pixies",
	tooltipDesc: loc("All buildings are %1% cheaper for %2!", [2, Game.sayTime(60 * Game.fps, -1)]),
	time: 60,
	pow: 2,
	killOnGain: "Nasty goblins"
});
new Game.BuffType("pixie misery", function (time, pow) {
	return {
		name: "Nasty goblins",
		desc: loc("All buildings are %1% pricier for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [26, 11],
		time: time * Game.fps,
		power: pow,
		max: true
	};
}, {
	displayName: "Nasty goblins",
	tooltipDesc: loc("All buildings are %1% pricier for %2!", [2, Game.sayTime(60 * 60 * Game.fps, -1)]),
	time: 60 * 60,
	pow: 2,
	killOnGain: "Crafty pixies"
});
// irrelevant
new Game.BuffType("magic adept", function (time, pow) {
	return {
		name: "Magic adept",
		desc: loc("Spells backfire %1 times less for %2.", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [29, 11],
		time: time * Game.fps,
		power: pow,
		max: true
	};
}, {hidden: true});
new Game.BuffType("magic inept", function (time, pow) {
	return {
		name: "Magic inept",
		desc: loc("Spells backfire %1 times more for %2.", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [29, 11],
		time: time * Game.fps,
		power: pow,
		max: true
	};
}, {hidden: true});
new Game.BuffType("devastation", function (time, pow) {
	return {
		name: "Devastation",
		desc: function () { return loc("Clicking power +%1% for %2!", [Math.floor(this.multClick * 100 - 100), Game.sayTime(this.time, -1)]); }, // * Game.fps
		icon: [23, 18],
		time: time * Game.fps,
		multClick: pow
	};
}, {
	displayName: "Devastation",
	tooltipDesc: "Clicking power +(xxx)% for 10 seconds!",
	time: 10,
	addObjectSel: true,
	addOptions: function ($node) {
		var self = this;

		var opts = "";
		for (var i = 0; i < 3; i++) {
			opts += '<option value="' + (i + 1) + '">' + Game.pantheon.slotNames[i] + "</option>";
		}

		self.$gemSlotSelect = $("<select>" + opts + "</select>").appendTo($node);
		self.$gemSlotSelect.before(" ").after(" ");

		var $label = $('<label data-title="Buff will be replaced on add otherwise."><input type="checkbox" checked> Stack on add</label>').appendTo($node);
		$label.after(" ");
		self.stackCheck = $label.find("input")[0];

		self.$sellBtn = $('<a class="spacer hidden">Sell and Add</a>').appendTo($node).on("click", function () {
			var obj = Game.ObjectsById[self.objectSelect.value];
			var amount = Math.min(self.objectAmountIn.parsedValue, obj.getAmount());

			if (amount) {
				obj.sacrifice(amount);
				Game.gainBuff(self.name, [self.getTime(), self.powFunc(amount)]);
			}
			Game.scheduleUpdate();
		});
	},
	powFunc: function () {
		var sold = this.objectAmountIn.parsedValue;
		var godLvl = this.$gemSlotSelect.val();
		var pow = 0;
		if (godLvl == 1) {      pow = 1 + sold * 0.01; }
		else if (godLvl == 2) { pow = 1 + sold * 0.005; }
		else if (godLvl == 3) { pow = 1 + sold * 0.0025; }
		return pow;
	},
	stackFunc: function (oldBuff, newBuff) {
		if (this.stackCheck.checked) {
			newBuff.multClick += oldBuff.multClick - 1;
			newBuff.arg1 = newBuff.multClick;
		}
	},
	updateFunc: function () {
		var obj = Game.ObjectsById[this.objectSelect.value];
		var amount = Math.min(this.objectAmountIn.parsedValue, obj.amount);
		this.$sellBtn.toggleClass("hidden", !amount);
	}
});
new Game.BuffType("sugar frenzy", function (time, pow) {
	return {
		name: "Sugar frenzy",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [29, 14],
		time: time * Game.fps,
		add: true,
		multCpS: pow,
		aura: 0
	};
}, {
	displayName: "Sugar frenzy",
	tooltipDesc: loc("Cookie production x%1 for %2!", [3, Game.sayTime(60 * 60 * Game.fps, -1)]),
	time: 60 * 60,
	pow: 3
});
new Game.BuffType("loan 1", function (time, pow) {
	return {
		name: "Loan 1",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [1, 33],
		time: time * Game.fps,
		power: pow,
		multCpS: pow,
		max: true,
		// onDie: function () { if (Game.takeLoan) { Game.takeLoan(1, true); } },
	};
}, {
	displayName: "A modest loan",
	tooltipDesc: loc("Cookie production x%1 for %2!", [1.5, Game.sayTime(2 * 60 * 60 * Game.fps, -1)]),
	time: 60 * 2 * 60,
	pow: 1.5
});
new Game.BuffType("loan 1 interest", function (time, pow) {
	return {
		name: "Loan 1 (interest)",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [1, 33],
		time: time * Game.fps,
		power: pow,
		multCpS: pow,
		max: true
	};
}, {
	displayName: "A modest loan (interest)",
	tooltipDesc: loc("Cookie production x%1 for %2!", [0.25, Game.sayTime(4 * 60 * 60 * Game.fps, -1)]),
	time: 60 * 4 * 60,
	pow: 0.25
});
new Game.BuffType("loan 2", function (time, pow) {
	return {
		name: "Loan 2",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [1, 33],
		time: time * Game.fps,
		power: pow,
		multCpS: pow,
		max: true,
		// onDie: function () { if (Game.takeLoan) { Game.takeLoan(2, true); } },
	};
}, {
	displayName: "A pawnshop loan",
	tooltipDesc: loc("Cookie production x%1 for %2!", [2, Game.sayTime(40 * Game.fps, -1)]),
	time: 0.67 * 60,
	pow: 2
});
new Game.BuffType("loan 2 interest", function (time, pow) {
	return {
		name: "Loan 2 (interest)",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [1, 33],
		time: time * Game.fps,
		power: pow,
		multCpS: pow,
		max: true
	};
}, {
	displayName: "A pawnshop loan (interest)",
	tooltipDesc: loc("Cookie production x%1 for %2!", [0.1, Game.sayTime(40 * 60 * Game.fps, -1)]),
	time: 40 * 60,
	pow: 0.1
});
new Game.BuffType("loan 3", function (time, pow) {
	return {
		name: "Loan 3",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [1, 33],
		time: time * Game.fps,
		power: pow,
		multCpS: pow,
		max: true,
		// onDie: function () { if (Game.takeLoan) { Game.takeLoan(3, true); } },
	};
}, {
	displayName: "A retirement loan",
	tooltipDesc: loc("Cookie production x%1 for %2!", [1.2, Game.sayTime(2 * 24 * 60 * 60 * Game.fps, -1)]),
	time: 60 * 24 * 2 * 60,
	pow: 1.2
});
new Game.BuffType("loan 3 interest", function (time, pow) {
	return {
		name: "Loan 3 (interest)",
		desc: loc("Cookie production x%1 for %2!", [pow, Game.sayTime(time * Game.fps, -1)]),
		icon: [1, 33],
		time: time * Game.fps,
		power: pow,
		multCpS: pow,
		max: true
	};
}, {
	displayName: "A retirement loan (interest)",
	tooltipDesc: loc("Cookie production x%1 for %2!", [0.8, Game.sayTime(5 * 24 * 60 * 60 * Game.fps, -1)]),
	time: 60 * 24 * 5 * 60,
	pow: 0.8
});
//irrelevant
new Game.BuffType("gifted out", function (time, pow) {
	return {
		name: "Gifted out",
		desc: loc("Can't send or receive gifts again for %1.", Game.sayTime(time * Game.fps, -1)),
		icon: [34, 6],
		time: time * Game.fps,
		power: pow,
		max: true
	};
}, {hidden: true});

Game.gainBuff = function (type, args) {
	var buffType = Game.BuffTypesByName[type];
	if (!buffType || !buffType.func) {
		throw 'Invalid buff type "' + type + '"';
	}
	if (buffType.hidden) {
		throw 'Buff type "' + type + '" deemed irrelevant';
	}

	args = args || buffType.getArgs();
	var buff = buffType.func.apply(buffType, args);
	buff.arg1 = args[1];
	buff.arg2 = args[2];
	buff.arg3 = args[3];
	if (!buff.dname && buff.name != "???") { buff.dname = buffType.dname; }

	var oldBuff = Game.hasBuff(buff.name);
	if (oldBuff) {
		if (buffType.stackFunc) {
			buffType.stackFunc(oldBuff, buff);
		}
		Game.killBuff(oldBuff.name);
	}

	buff.type = type;
	buff.buffType = buffType;
	buff.icon = buff.icon || [0, 0];
	buff.iconCss = Game.getIconCss(buff.icon);

	Game.Buffs[buff.name] = buff;

	buff.$crate = $('<div class="buffCrate crate unlocked"></div>')
		.css(buff.iconCss).attr("data-buff", buff.name).appendTo("#buffsCurrent");
	buff.$crate[0].objTie = buff;

	if (buffType.killOnGain) {
		Game.killBuff(buffType.killOnGain);
	}
};

Game.killBuff = function (name) {
	var buff = Game.hasBuff(name);
	if (buff) {
		buff.$crate.remove();
		delete Game.Buffs[name];
	}
};

Game.killBuffs = function () {
	for (var name in Game.Buffs) {
		Game.killBuff(name);
	}
};

Game.clearBuffSelection = function () {
	$("#buffsCurrent .buffCrate.enabled").removeClass("enabled");
	Game.updateBuffSelection();
};

Game.setBuffObjectInputs = function () {
	$("#buffsBlock .buffObjectSelect").change();
};

var tabBuffsEle = byId("tabBuffs");
tabBuffsEle.onTabFunc = function () {
	Game.clearBuffSelection();
	Game.setBuffObjectInputs();
};

tabBuffsEle.updateTabFunc = function () {
	var text = "Buffs";
	var title = "";

	var buffs = 0;
	// eslint-disable-next-line no-unused-vars
	for (var key in Game.Buffs) {
		buffs++;
	}
	if (buffs > 0) {
		text += " (" + buffs + ")";
		title = buffs + " buff" + (buffs === 1 ? "" : "s") + " active";
	}

	this.textContent = text;
	this.dataset.title = title;
};

Game.updateBuffSelection = function () {
	var hasSelection = $("#buffsCurrent .buffCrate.enabled").length > 0;
	$("#buffsClearAll").toggleClass("hidden", $("#buffsCurrent .buffCrate").length < 1);
	$("#buffsClearCancel, #buffsClearSelected").toggleClass("hidden", !hasSelection);
};

$("#buffsTypesBlock").on("mouseenter", ".buffTypeName", function () {
	var buffType = Game.BuffTypesByName[this.parentNode.dataset.bufftype];
	Game.setTooltip({
		html: '<div class="prompt alignCenter buffTooltip">' +
			'<h3 class="name">' + (buffType.dname || buffType.displayName) + '</h3><div class="line"></div>' + buffType.tooltipDesc + "</div>",
		refEle: this
	});

}).on("click", ".buffTypeAdd", function () {
	Game.gainBuff(this.objTie.name);
	Game.updateBuffSelection();
	Game.scheduleUpdate();

}).on("change", ".buffObjectSelect", function () {
	var obj = Game.ObjectsById[this.objTie.objectSelect.value];
	Game.setInput(this.objTie.objectAmountIn, obj.getAmount());

}).on("click", ".buffRandomObject", function () {
	var n = Math.floor(Math.random() * Game.ObjectsById.length);
	this.objTie.objectSelect.value = n;

	var obj = Game.ObjectsById[n];
	Game.setInput(this.objTie.objectAmountIn, obj.getAmount());
	Game.scheduleUpdate();
});

$("#buffsCurrent").on("mouseenter", ".buffCrate", function () {
	var buff = this.objTie;
	var desc = typeof buff.desc === "function" ? buff.desc() : buff.desc;
	Game.setTooltip({
		html: '<div class="prompt alignCenter buffTooltip">' +
			'<h3 class="name">' + (buff.dname || buff.name) + '</h3><div class="line"></div>' + desc + "</div>",
		refEle: this
	});

}).on("click", ".buffCrate", function () {
	$(this).toggleClass("enabled");
	Game.updateBuffSelection();
});

$("#buffsClearAll").on("click", function () {
	Game.killBuffs();
	Game.updateBuffSelection();
	Game.scheduleUpdate();
});

$("#buffsClearCancel").on("click", function () {
	Game.clearBuffSelection();
});

$("#buffsClearSelected").on("click", function () {
	$("#buffsCurrent .buffCrate.enabled").each(function () {
		Game.killBuff(this.objTie.name);
	});
	Game.updateBuffSelection();
	Game.scheduleUpdate();
});

//#endregion Buffs / Buff types


//#region Dragon Auras

Game.dragonLevels = [
	{name: "Dragon egg", action: loc("Chip it"), pic: 0,
		cost: function () { return true; },
		cumuCost: function () { return 1000000; },
		costStr: function () { return loc("%1 cookie", Game.LBeautify(1000000)); }},
	{name: "Dragon egg", action: loc("Chip it"), pic: 1,
		cost: function () { return true; },
		cumuCost: function () { return 1000000 * 2; },
		costStr: function () { return loc("%1 cookie", Game.LBeautify(1000000 * 2)); }},
	{name: "Dragon egg", action: loc("Chip it"), pic: 2,
		cost: function () { return true; },
		cumuCost: function () { return 1000000 * 4; },
		costStr: function () { return loc("%1 cookie", Game.LBeautify(1000000 * 4)); }},
	{name: "Shivering dragon egg", action: loc("Hatch it"), pic: 3,
		cost: function () { return true; },
		cumuCost: function () { return 1000000 * 8; },
		costStr: function () { return loc("%1 cookie", Game.LBeautify(1000000 * 8)); }},
	{name: "Krumblor, cookie hatchling", action: "Train Breath of Milk", actionTitle: "Aura: kittens are 5% more effective", pic: 4,
		cost: function () { return true; },
		cumuCost: function () { return 1000000 * 16; },
		costStr: function () { return loc("%1 cookie", Game.LBeautify(1000000 * 16)); }},
	{name: "Krumblor, cookie hatchling", action: "Train Dragon Cursor", actionTitle: "Aura: clicking is 5% more effective", pic: 4},
	{name: "Krumblor, cookie hatchling", action: "Train Elder Battalion", actionTitle: "Aura: grandmas gain +1% CpS for every non-grandma building", pic: 4},
	{name: "Krumblor, cookie hatchling", action: "Train Reaper of Fields", actionTitle: "Aura: golden cookies may trigger a Dragon Harvest", pic: 4},
	{name: "Krumblor, cookie dragon", action: "Train Earth Shatterer", actionTitle: "Aura: buildings sell back for 50% instead of 25%", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Master of the Armory", actionTitle: "Aura: all upgrades are 2% cheaper", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Fierce Hoarder", actionTitle: "Aura: all buildings are 2% cheaper", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Dragon God", actionTitle: "Aura: heavenly chips bonus +5%", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Arcane Aura", actionTitle: "Aura: golden cookies appear 5% more often", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Dragonflight", actionTitle: "Aura: golden cookies may trigger a Dragonflight", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Ancestral Metamorphosis", actionTitle: "Aura: golden cookies give 10% more cookies", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Unholy Dominion", actionTitle: "Aura: wrath cookies give 10% more cookies", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Epoch Manipulator", actionTitle: "Aura: golden cookie effects last 5% longer", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Mind Over Matter", actionTitle: "Aura: +25% random drops", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Radiant Appetite", actionTitle: "Aura: all cookie production multiplied by 2", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Dragon's Fortune", actionTitle: "Aura: +123% CpS per golden cookie on-screen", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Dragon Curve", actionTitle: "Aura: sugar lumps grow 5% faster, 50% weirder", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Reality Bending", actionTitle: "Aura: 10% of every other aura, combined", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Dragon Orbs", actionTitle: "Aura: selling your best building may grant a wish", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Supreme Intellect", actionTitle: "Aura: confers various powers to your minigames", pic: 5},
	{name: "Krumblor, cookie dragon", action: "Train Dragon Guts", actionTitle: "Aura: enhanced wrinklers", pic: 5,},
	//if Orteil does add more buildings try to remember to fix dragon cookie's unlock
	{name: "Krumblor, cookie dragon", action: loc("Bake dragon cookie"), actionTitle: loc("Delicious!"), pic: 6,
		cost: getNumAllObjectsRequireFunc(50),
		cumuCost: function () { var cumu = 0; for (var i = 0; i < Game.ObjectsById.length; i++) { cumu += Game.ObjectsById[i].getPriceSum(0, 50); } return cumu; },
		buy: function () { for (var i in Game.Objects) { Game.Objects[i].sacrifice(50); } }, //note to self: remember to update the cookie's req too!
		costStr: function () { return loc("%1 of every building", 50); }},
	{name: "Krumblor, cookie dragon", action: loc("Train secondary aura"), actionTitle: loc("Lets you use two dragon auras simultaneously"), pic: 7,
		cost: getNumAllObjectsRequireFunc(200),
		cumuCost: function () { var cumu = 0; for (var i = 0; i < Game.ObjectsById.length; i++) { cumu += Game.ObjectsById[i].getPriceSum(0, 200); } return cumu; },
		buy: function () { for (var i in Game.Objects) { Game.Objects[i].sacrifice(200); } },
		costStr: function () { return loc("%1 of every building", 200); }},
	{name: "Krumblor, cookie dragon", action: loc("Your dragon is fully trained."), pic: 8}
];
Game.dragonLevelMax = Game.dragonLevels.length - 1;

Game.dragonAuras = [
	{name: "No aura",                 icon: [0,  7],  desc: loc("Select an aura from those your dragon knows.")},
	{name: "Breath of Milk",          icon: [18, 25], desc: loc("Kittens are <b>%1%</b> more effective.", 5)},
	{name: "Dragon Cursor",           icon: [0,  25], desc: loc("Clicking is <b>%1%</b> more powerful.", 5)},
	{name: "Elder Battalion",         icon: [1,  25], desc: loc("Grandmas gain <b>+%1% CpS</b> for each non-grandma building.", 1)},
	{name: "Reaper of Fields",        icon: [2,  25], desc: loc("Golden cookies may trigger a <b>Dragon Harvest</b>.")},
	{name: "Earth Shatterer",         icon: [3,  25], desc: loc("Buildings sell back for <b>%1%</b> instead of %2%.", [50, 25])},
	{name: "Master of the Armory",    icon: [4,  25], desc: loc("All upgrades are <b>%1% cheaper</b>.", 2)},
	{name: "Fierce Hoarder",          icon: [15, 25], desc: loc("All buildings are <b>%1% cheaper</b>.", 2)},
	{name: "Dragon God",              icon: [16, 25], desc: loc("<b>+%1%</b> prestige level effect on CpS.", 5)},
	{name: "Arcane Aura",             icon: [17, 25], desc: loc("Golden cookies appear <b>%1%</b> more often.", 5)},
	{name: "Dragonflight",            icon: [5,  25], desc: loc("Golden cookies may trigger a <b>Dragonflight</b>.")},
	{name: "Ancestral Metamorphosis", icon: [6,  25], desc: loc("Golden cookies give <b>%1%</b> more cookies.", 10)},
	{name: "Unholy Dominion",         icon: [7,  25], desc: loc("Wrath cookies give <b>%1%</b> more cookies.", 10)},
	{name: "Epoch Manipulator",       icon: [8,  25], desc: loc("Golden cookies stay <b>%1%</b> longer.", 5)},
	{name: "Mind Over Matter",        icon: [13, 25], desc: loc("Random drops are <b>%1% more common</b>.", 25)},
	{name: "Radiant Appetite",        icon: [14, 25], desc: loc("All cookie production <b>multiplied by %1</b>.", 2)},
	{name: "Dragon's Fortune",        icon: [19, 25], desc: loc("<b>+%1% CpS</b> per golden cookie on-screen, multiplicative.", 123)},
	{name: "Dragon's Curve",          icon: [20, 25], desc: loc("<b>+%1%</b> sugar lump growth.", 5) + " " + loc("Sugar lumps are <b>twice as likely</b> to be unusual.")},
	{name: "Reality Bending",         icon: [32, 25], desc: loc("<b>One tenth</b> of every other dragon aura, <b>combined</b>.")},
	{name: "Dragon Orbs",             icon: [33, 25], desc: loc("With no buffs and no golden cookies on screen, selling your most powerful building has <b>%1% chance to summon one</b>.", 10)},
	{name: "Supreme Intellect",       icon: [34, 25], desc: loc("Confers various powers to your minigames while active.<br>See the bottom of each minigame for more details.")},
	{name: "Dragon Guts",             icon: [35, 25], desc: loc("You can attract <b>%1 more wrinklers</b>.", 2) + "<br>" + loc("Wrinklers digest <b>%1% more cookies</b>.", 20) + "<br>" + loc("Wrinklers explode into <b>%1% more cookies</b>.", 20)}
];

Game.dragonAurasByName = {};

for (i = 0; i < Game.dragonAuras.length; i++) {
	var aura = Game.dragonAuras[i];
	aura.dname = loc(aura.name);
	aura.id = i;
	aura.iconCss = Game.getIconCss(aura.icon);
	aura.$crateNode = $('<div class="crate aura"></div>')
		.css(aura.iconCss).attr("data-aura", i).appendTo("#auraAvailable");
	aura.$crateNode[0].auraObj = aura;
	Game.dragonAurasByName[aura.name] = aura;
}

for (i = 0; i < Game.dragonLevels.length; i++) {
	var dragonLevel = Game.dragonLevels[i];
	dragonLevel.name = loc(dragonLevel.name);
	if (i >= 4 && i < Game.dragonLevels.length - 3) {
		if (!EN) {
			dragonLevel.action = loc("Train %1", Game.dragonAuras[i - 3].dname);
			dragonLevel.actionTitle = loc("Aura: %1", Game.dragonAuras[i - 3].desc);
		}
		if (i >= 5) {
			dragonLevel.buildingTie = Game.ObjectsById[i - 5];
			dragonLevel.costStr = function () { return loc("%1 " + this.buildingTie.bsingle, Game.LBeautify(100)); };
			dragonLevel.cost = function () { return this.buildingTie.amount >= 100; };
			dragonLevel.cumuCost = function () { return this.buildingTie.getPriceSum(0, 100); };
			dragonLevel.buy = function () { this.buildingTie.sacrifice(100); };
		}
	}
}

Game.dragonAuras[0].$crateNode.addClass("unlocked");

Game.clearAuraSelection = function () {
	$("#auraBlock .aura.enabled").removeClass("enabled");
	$("#auraAvailableBlock, #switchAuraFree, #switchAuraBuy").addClass("hidden");
	Game.$enabledAuraSlot = null;
};
byId("tabFamiliar").onTabFunc = Game.clearAuraSelection;

addPlusMinusInput("#dragonLevelSpan", "dragonLevelIn", 2, true).maxIn = Game.dragonLevelMax;
$("#dragonAction").on("click", function (ev) {
	var lvl = Game.dragonLevels[Game.dragonLevel];
	var altMode = Game.checkEventAltMode(ev);
	if (Game.dragonLevel < Game.dragonLevelMax && lvl && (altMode || !lvl.cost || lvl.cost())) {
		if (lvl.buy && !altMode) { lvl.buy(); }
		Game.setInput("#dragonLevelIn", Game.dragonLevel + 1);
		Game.scheduleUpdate();
	}
	return false;
});

$("#auraCurrent").on("click", ".aura", function () {
	var $ele = $(this);
	$ele.siblings().removeClass("enabled");
	$ele.toggleClass("enabled");
	var isEnabled = $ele.hasClass("enabled");
	$("#auraAvailableBlock").toggleClass("hidden", !isEnabled).find(".aura.enabled").removeClass("enabled");
	if (isEnabled) {
		$('#auraAvailable .aura[data-aura="' + this.dataset.aura + '"]').addClass("enabled");
	}
	Game.$enabledAuraSlot = isEnabled ? $ele : null;
	$("#switchAuraFree, #switchAuraBuy").addClass("hidden");
	Game.scheduleUpdate();
});

$("#auraAvailable").on("click", ".aura", function () {
	var $ele = $(this);
	var otherId = Game.$enabledAuraSlot ? Game.$enabledAuraSlot.siblings().attr("data-aura") : null;
	if (!$ele.hasClass("enabled") && Game.$enabledAuraSlot && (otherId < 1 || this.dataset.aura != otherId)) {
		$ele.siblings().removeClass("enabled");
		$ele.addClass("enabled");
		Game.scheduleUpdate();
	}
});

$("#switchAuraCancel").on("click", Game.clearAuraSelection);

$("#switchAuraFree").on("click", function () {
	var $switchAura = $("#auraAvailable .aura.enabled");
	var switchId = $switchAura.attr("data-aura");
	var currentId = Game.$enabledAuraSlot ? Game.$enabledAuraSlot.attr("data-aura") : null;
	if (
		Game.$enabledAuraSlot && $switchAura.length && currentId != switchId &&
		(switchId < 1 || Game.$enabledAuraSlot.siblings().attr("data-aura") != switchId)
	) {
		Game.setAura(Game.$enabledAuraSlot.attr("data-slot"), switchId);
		Game.clearAuraSelection();
		Game.scheduleUpdate();
	}
});

$("#switchAuraBuy").on("click", function () {
	var $switchAura = $("#auraAvailable .aura.enabled");
	var switchId = $switchAura.attr("data-aura");
	var currentId = Game.$enabledAuraSlot ? Game.$enabledAuraSlot.attr("data-aura") : null;
	if (
		Game.HighestBuilding && Game.$enabledAuraSlot && $switchAura.length &&
		currentId != switchId && (switchId < 1 || Game.$enabledAuraSlot.siblings().attr("data-aura") != switchId)
	) {
		Game.HighestBuilding.sacrifice(1);
		Game.setAura(Game.$enabledAuraSlot.attr("data-slot"), switchId);
		Game.clearAuraSelection();
		Game.scheduleUpdate();
	}
});

$("#auraBlock").on("mouseenter", ".crate.aura", function (ev) {
	if (this.auraObj) {
		Game.setTooltip({
			html: '<div class="auraTooltip"><h4>' + this.auraObj.dname + "</h4>" +
				'<div class="line"></div>' + this.auraObj.desc + "</div>",
			refEle: this,
			isCrate: true
		});
	}
	ev.stopPropagation();
});

//sets the dragonAura in given slot [0, 1] to aura
//aura can be either the id of the aura or the name
Game.setAura = function (slot, aura) {
	var $slotEle = $("#auraSlot" + slot);
	var auraObj = Game.dragonAuras[aura] || Game.dragonAurasByName[aura];
	var slotKey = slot == 1 ? "dragonAura2" : "dragonAura";
	var otherSlotKey = slot == 1 ? "dragonAura" : "dragonAura2";
	if (auraObj && $slotEle.length && (auraObj.id < 1 || Game[otherSlotKey] != auraObj.id)) {
		Game[slotKey] = auraObj.id;
		$slotEle.css(auraObj.iconCss).attr("data-aura", auraObj.id);
		$slotEle[0].auraObj = auraObj;
	}
};
Game.setAura(0, Game.dragonAura);
Game.setAura(1, Game.dragonAura2);
Game.clearAuraSelection();

//#endregion Dragon Auras

for (i = 0; i < Game.Milks.length; i++) {
	var milk = Game.Milks[i];
	milk.bname = milk.name;
	milk.name = loc(milk.name);
	milk.rank = i;
	milk.rankStr = loc("Rank %1", Game.romanize(i + 1)) + " - " + milk.name;
}

Game.initMinigames();


//#region event handlers and stuff

Game.registerInputs(Game, [
	["#heraldsIn", "heralds"],
	["#lumpsIn", "lumps"],
	["#dragonLevelIn", "dragonLevel"],
	["#numGoldenCookiesIn", "numGoldenCookies"],
	["#prestigeIn", "prestige"],
	["#sessionStartTime", "startDate"]
]);


Game.setTab = function (tab, toggle) {
	var $tab = $(tab);
	tab = $tab[0];
	if (!tab || !$tab.is(".tabs > .tab")) {
		return;
	}

	var par = tab.parentNode;
	var $par = $(par);
	var isCurrent = $tab.hasClass("tabCurrent");

	var index = $par.find(".tab").removeClass("tabCurrent").index(tab);
	$tab.toggleClass("tabCurrent", typeof toggle === "boolean" ? toggle : !$par.hasClass("toggleTabs") || !isCurrent);
	$("#" + par.dataset.tabblocks).find(".tabBlock").addClass("hidden").eq(index).toggleClass("hidden", !$tab.hasClass("tabCurrent"));

	if (tab.onTabFunc) {
		tab.onTabFunc();
	}
	if (par.onTabFunc) {
		par.onTabFunc();
	}
};

$(".tabBlock").addClass("hidden");
$(".tabs[data-tabblocks]").each(function () {
	var $t = $(this);
	var $tabs = $t.children(".tab");
	var $current = $tabs.filter(".tabCurrent").first();
	var found = $current.length;
	if (!found) {
		$current = $tabs.first();
	}
	Game.setTab($current, Boolean(!$t.hasClass("toggleTabs") || found));
});

$(document.forms[0]).on("click", "a", false)
.on("click", ".tabs[data-tabblocks] > .tab", function () { Game.setTab(this); });

Game.BakeryNamePrefixes = [
	"Magic", "Fantastic", "Fancy", "Sassy", "Snazzy", "Pretty", "Cute", "Pirate", "Ninja", "Zombie", "Robot", "Radical", "Urban", "Cool", "Hella", "Sweet",
	"Awful", "Double", "Triple", "Turbo", "Techno", "Disco", "Electro", "Dancing", "Wonder", "Mutant", "Space", "Science", "Medieval", "Future", "Captain",
	"Bearded", "Lovely", "Tiny", "Big", "Fire", "Water", "Frozen", "Metal", "Plastic", "Solid", "Liquid", "Moldy", "Shiny", "Happy", "Happy Little", "Slimy",
	"Tasty", "Delicious", "Hungry", "Greedy", "Lethal", "Professor", "Doctor", "Power", "Chocolate", "Crumbly", "Choklit",
	"Righteous", "Glorious", "Mnemonic", "Psychic", "Frenetic", "Hectic", "Crazy", "Royal", "El", "Von"
];
Game.BakeryNameSuffixes = [
	"Cookie", "Biscuit", "Muffin", "Scone", "Cupcake", "Pancake", "Chip", "Sprocket", "Gizmo", "Puppet", "Mitten", "Sock", "Teapot", "Mystery", "Baker",
	"Cook", "Grandma", "Click", "Clicker", "Spaceship", "Factory", "Portal", "Machine", "Experiment", "Monster", "Panic", "Burglar", "Bandit", "Booty",
	"Potato", "Pizza", "Burger", "Sausage", "Meatball", "Spaghetti", "Macaroni", "Kitten", "Puppy", "Giraffe", "Zebra", "Parrot", "Dolphin", "Duckling",
	"Sloth", "Turtle", "Goblin", "Pixie", "Gnome", "Computer", "Pirate", "Ninja", "Zombie", "Robot"
];
Game.RandomBakeryName = function () {
	var str = "";
	if (EN) {
		return ((Math.random() > 0.05 ? (Game.choose(Game.BakeryNamePrefixes) + " ") : "Mc") + Game.choose(Game.BakeryNameSuffixes));
	} else {
		if (locStrings["bakery random name, 1st half"] && locStrings["bakery random name, 2nd half"]) {
			str += Game.choose(loc("bakery random name, 1st half")) + " " + Game.choose(loc("bakery random name, 2nd half"));
		} else {
			str += Game.choose(loc("bakery random name"));
		}
	}
	return str;
};

var name = Game.RandomBakeryName();
Game.bakeryName = name;
Game.bakeryNameLowerCase = name.toLowerCase();

$("#bakeryNameIn").val(Game.bakeryName).on("input", function () {
	var name = this.value.replace(/\W+/g, " ").substring(0, 28);
	var prevLower = Game.bakeryNameLowerCase;
	if (name !== Game.bakeryName) {
		Game.bakeryName = name;
		Game.bakeryNameLowerCase = name.toLowerCase();
		if (Game.bakeryNameLowerCase !== prevLower && (Game.bakeryNameLowerCase === "orteil" || Game.bakeryNameLowerCase === "ortiel" ||
		prevLower === "orteil" || prevLower === "ortiel")) {
			Game.scheduleUpdate();
		}
	}
	return false;
}).blur(function () {
	this.value = Game.bakeryName;
});

$("#randomBakeryName").on("click", function () {
	var name = Game.RandomBakeryName();
	byId("bakeryNameIn").value = name;
	var prevLower = Game.bakeryNameLowerCase;
	Game.bakeryName = name;
	Game.bakeryNameLowerCase = name.toLowerCase();
	if (prevLower === "orteil" || prevLower === "ortiel") {
		Game.scheduleUpdate();
	}
	return false;
});

$("#recalcButton").on("click", function () {
	Game.scheduleUpdate();
});

$("select.recalc").change(function () {
	Game.scheduleUpdate();
	return false;
});

$("#importSave").on("click", function () {
	Game.importSave();
});

$("#reimportSave").on("click", function () {
	Game.importSave(Game.storedImport);
});


$("#calcSave").on("click", function () {
	Game._saveCalc();
});

$("#calcLoad").on("click", function () {
	Game._loadCalc();
});

$("#calcClearSave").on("click", function () {
	localStorage.removeItem("CCalc.CalcSave");
	$("#calcLoad, #calcClearSave").addClass("hidden");
});

$("#calcLoad, #calcClearSave").toggleClass("hidden", !localStorage.getItem("CCalc.CalcSave"));


byId("abbrCheck").clickFunc = function () {
	localStorage.setItem("CCalc.AbbreviateNums", this.checked ? 1 : "");
	Game.abbrOn = this.checked;

	for (var i = 0; i < Game.UpgradesById.length; i++) {
		Game.UpgradesById[i].setCurrentDescription();
		this.statsStr = null;
	}
	for (i = 0; i < Game.AchievementsById.length; i++) {
		Game.AchievementsById[i].setCurrentDescription();
	}
	$(".exp").each(function () { Game.setInput(this); });

	if (typeof Game.updateTooltip === "function") {
		Game.updateTooltip();
	}
};

byId("steamCheckLabel").dataset.title = "Sets Steam vs web mode. Relevant to a pair of cookie upgrades.";

byId("steamCheck").clickFunc = function () {
	localStorage.setItem("CCalc.Steam", this.checked ? 1 : "");
};

$("#bankSpan").on("click", 'input[name="bank"]', function () {
	localStorage.setItem("CCalc.ShowBank", document.querySelector('[name="bank"]:checked').id);
	Game.updateRecommended();
});

$("#quantitySpan").on("click", 'input[name="quantity"]', function () {
	localStorage.setItem("CCalc.BuildQuantity", document.querySelector('[name="quantity"]:checked').id);
	Game.scheduleUpdate();
});

byId("recTimeCheck").clickFunc = function () {
	Game.showRecTime = this.checked;
	localStorage.setItem("CCalc.RecTime", this.checked);
	Game.updateRecommended();
};

ele = byId("clicksPsIn");
ele.maxIn = Game.maxClicksPs;
ele.focusFunc = function () {
	var val = this.value;
	if (val.length > this.getAttribute("maxlength") && val.slice(0, 2) === "0.") {
		this.value = val.slice(1);
	}
};
ele.checkFunc = function () {
	localStorage.setItem("CCalc.Clicks", this.parsedValue);
	Game.scheduleUpdate();
};
Game.setInput("#sessionStartTime", Game.startDate);

ele = byId("heraldsIn");
ele.maxIn = 100;
byId("heraldsInLabel").setTitleFunc = function () {
	var str = "";

	//TODO loc? maybe with something to change "our" to DashNet? won't support other langs sadly, not that there were plans to do non-EN as of this comment
	if (Game.heralds === 0) {
		str += loc("There are no heralds at the moment. Please consider <b style=\"color:#bc3aff;\">donating to our Patreon</b>!");
	} else {
		str += '<b style="color:#bc3aff;text-shadow:0px 1px 0px #6d0096;">' + loc("%1 herald", Game.heralds) + "</b> " +
			loc("selflessly inspiring a boost in production for everyone, resulting in %1.", '<br><b style="color:#cdaa89;text-shadow:0px 1px 0px #7c4532,0px 0px 6px #7c4532;"><div style="width:16px;height:16px;display:inline-block;vertical-align:middle;background:url(img/money.png);"></div>' + loc("+%1% cookies per second", Game.heralds) + "</b>") +
			'<div class="line"></div>';
		if (Game.ascensionMode == 1) { str += loc("You are in a <b>Born again</b> run, and are not currently benefiting from heralds."); }
		else if (Game.HasUpgrade("Heralds")) { str += loc("You own the <b>Heralds</b> upgrade, and therefore benefit from the production boost."); }
		else { str += loc("To benefit from the herald bonus, you need a special upgrade you do not yet own. You will permanently unlock it later in the game."); }
	}
	str += '<div class="line"></div><span style="font-size:90%;opacity:0.6;">' + loc("<b>Heralds</b> are people who have donated to our highest Patreon tier, and are limited to 100.<br>Each herald gives everyone +1% CpS.<br>Heralds benefit everyone playing the game, regardless of whether you donated.") + "</span>";

	str += '<div style="width:31px;height:39px;background:url(img/heraldFlag.png);position:absolute;top:0px;left:8px;"></div><div style="width:31px;height:39px;background:url(img/heraldFlag.png);position:absolute;top:0px;right:8px;"></div>';

	if (EN) {
		str = str.replace(/\bour\b/g, "DashNet's");
	}

	this.dataset.title = '<div style="padding:8px;width:300px;" class="prompt alignCenter"><h3>Heralds</h3><div class="block">' + str + "</div></div>";
};

twinInputs("#prestigeIn", "#prestigeCurrentIn");

byId("buildTableTabs").onTabFunc = function () { $("#sellCheckSpan").toggleClass("hidden", !$("#buildTableTabPrice").hasClass("tabCurrent")); };

byId("sellCheck").clickFunc = function () { $("#buildPriceTable").toggleClass("hideSell", !this.checked); };

byId("buildChainMaxSpan").dataset.title = "Checks up to this many buildings ahead for the purchase of certain upgrades " +
	"and their required buildings.\n0 to disable. -1 for unlimited.";
byId("buildChainMax").minIn = -1;

addPlusMinusInput("#numWrinklersInSpan", "numWrinklersIn", 2, true).maxIn = Game.maxWrinklers;
addPlusMinusInput("#numGoldenCookiesInSpan", "numGoldenCookiesIn", 4, true);

$("#setCookiesBakedSpan").on("click", function () {
	if (Game.minCumulative > byId("cookiesBaked").parsedValue) {
		Game.setInput("#cookiesBaked", Game.minCumulative);
		Game.scheduleUpdate();
	}
	return false;
});

$("#setPrestigeSpan").on("click", function () {
	Game.setInput("#prestigeIn", Math.floor(Game.HowMuchPrestige(byId("cookiesReset").parsedValue)));
	Game.scheduleUpdate();
});

$("#setCookiesResetSpan").on("click", function () {
	Game.setInput("#cookiesReset", byId("setCookiesResetNum").setValue);
	Game.scheduleUpdate();
});

addPlusMinusInput("#seasonCountSpan", "seasonCountIn", true);
Game.registerInput("#seasonCountIn", Game, "seasonUses");

$(".lockCheckSpan").html('<input class="lockChecker" type="checkbox"> Toggle locks on click')
.attr("data-title", "Ctrl-, alt-, and/or shift-click to do the opposite.")
.find(".lockChecker").on("click", function (ev) {
	Game.lockChecked = this.checked;
	$(".lockChecker").prop("checked", Game.lockChecked);
	ev.stopPropagation();
});

$("#upgradeEnableShown").on("click", function () {
	$("#upgradeIcons .upgrade:not(.hidden)").each(function () {
		var upgrade = this.objTie;
		if (upgrade.pool !== "debug" && upgrade.pool !== "toggle" && !upgrade.hidden) {
			upgrade.setBought(true);
		}
	});
	Game.scheduleUpdate();
});

$("#upgradeEnableAll").on("click", function () {
	for (var i = 0; i < Game.UpgradesById.length; i++) {
		var upgrade = Game.UpgradesById[i];
		if (upgrade.pool !== "debug" && upgrade.pool !== "toggle" && !upgrade.hidden) {
			upgrade.setBought(true);
		}
	}
	Game.scheduleUpdate();
});

$("#upgradeDisableShown").on("click", function () {
	$("#upgradeIcons .upgrade:not(.hidden)").each(function () {
		var upgrade = this.objTie;
		if (upgrade.pool !== "debug" && upgrade.pool !== "toggle" && !upgrade.hidden) {
			upgrade.setBought(false);
		}
	});
	Game.scheduleUpdate();
});

$("#upgradeDisableAll").on("click", function () {
	for (var i = 0; i < Game.UpgradesById.length; i++) {
		var upgrade = Game.UpgradesById[i];
		if (upgrade.pool !== "debug" && upgrade.pool !== "toggle" && !upgrade.hidden) {
			upgrade.setBought(false);
		}
	}
	Game.scheduleUpdate();
});

$("#upgradeSearch").on("keydown", function (ev) {
	if (ev.key === "Enter" || ev.keyCode == 13) {
		byId("sortUpgrades").click();
	}
});

$("#sortUpgrades").on("click", function () {
	// Game.sortAndFilterUpgrades();
	// Have to reupdate to make sure it's correct with sorting/filtering on recommended. Probably something or other with predictiveMode that's not completely cleared.
	// I saw ant larvae in the recommended filter despite not even having it, so something's screwy somewhere
	Game.scheduleUpdate();
});

$("#achSearch").on("keydown", function (ev) {
	if (ev.key === "Enter" || ev.keyCode == 13) {
		byId("setAchFilter").click();
	}
});

$("#setAchFilter").on("click", function () {
	Game.filterAchievements();
});

//would love to only set .won if !.require() so game doesn't have to re-award achs
//but as usual cps achievements make life difficult
$("#achReset").on("click", function () {
	for (var i = 0; i < Game.AchievementsById.length; i++) {
		var achievement = Game.AchievementsById[i];
		if (achievement.require) {
			achievement.won = false;
		}
	}
	Game.scheduleUpdate();
});

//same as above
$("#achDisableAll").on("click", function () {
	for (var i = 0; i < Game.AchievementsById.length; i++) {
		Game.AchievementsById[i].won = false;
	}
	Game.scheduleUpdate();
});

$("#achEnableAll").on("click", function () {
	for (var i = 0; i < Game.AchievementsById.length; i++) {
		var achieve = Game.AchievementsById[i];
		if (achieve.pool !== "dungeon") {
			achieve.won = true;
		}
	}
	Game.scheduleUpdate();
});

byId("blackCheckAll").clickFunc = function () {
	$("#blacklistEles .blacklistEle:not(.hidden) input").prop("checked", this.checked);
};

$("#blackClear").on("click", function () {
	var eles = $("#blacklistEles .blacklistEle.strike input");
	if (eles.length) {
		eles.prop("checked", false);
		Game.scheduleUpdate();
	}
});


$("input:not([type])").attr("type", "text");

$('input[type="text"]:not(.text)').each(function () {
	if (!this.maxIn && this.hasAttribute("maxlength")) {
		this.maxIn = Math.pow(10, this.getAttribute("maxlength")) - 1;
	}
	if (!this.placeholder) {
		this.placeholder = Math.max(this.minIn, 0) || 0;
	}
	Game.setInput(this, this.value);
});

$('input[type="checkbox"]').each(function () {
	this.manualChecked = this.checked;
});

var workingIndex = 2;
$("input, select, textarea, a[href]").each(function () {
	if (this.tabIndex) {
		workingIndex = Math.max(workingIndex, this.tabIndex + 1);
	} else {
		this.tabIndex = workingIndex;
	}
});

$("#gCookiesTable tbody").on("click", "td:nth-child(n + 2):not(.noSel)", function () {
	var cell = Game.getGCCellFrenzyIndeces(this).join(",");
	var listIndex = Game.gcSelectedCells.indexOf(cell);
	if (listIndex > -1) {
		Game.gcSelectedCells.splice(listIndex, 1);
	} else {
		Game.gcSelectedCells.push(cell);
	}
	Game.updateGoldenCookiesDetails();
});

$("#gCookiesDetails").on("click", ".close", function () {
	if (this.gcIndex) {
		var listIndex = Game.gcSelectedCells.indexOf(this.gcIndex);
		if (listIndex > -1) {
			Game.gcSelectedCells.splice(listIndex, 1);
			Game.updateGoldenCookiesDetails();
		}
	}
});

$("#gcClearSelected").on("click", function () {
	Game.gcSelectedCells = [];
	Game.updateGoldenCookiesDetails();
});

function clearSelection() {
	if (document.selection && document.selection.empty) {
		document.selection.empty();
	} else if (window.getSelection) {
		var sel = window.getSelection();
		sel.removeAllRanges();
	}
}

$("#recommendedList").on("click", ".recPurchase", function (ev) {
	var recObj = this.recommendObj;
	if (!recObj) { return false; }
	var altMode = Game.altMode || Game.checkEventAltMode(ev);

	if (recObj.type === "upgrade chain") {
		if (Game.altMode) {
			recObj.buy();
		} else {
			recObj.building.buy(Math.max(recObj.toAmount - recObj.building.amount, 0));
			recObj.gameObj.buy();
		}
	} else if (recObj.gameObj && recObj.gameObj.buy) {
		recObj.gameObj.buy(altMode ? 1 : recObj.toAmount - recObj.gameObj.amount);
	}

	Game.clearTooltip();
	Game.scheduleUpdate(1, function () {
		if (!Game.HasUpgrade("Century egg") && Game.cookiesPsPlusClicks !== recObj.cpsObj.cookiesPsPlusClicks) {
			console.error("CpS mismatch!", Game.cookiesPsPlusClicks, recObj.cpsObj.cookiesPsPlusClicks, recObj);
		}
	});

	clearSelection();

}).on("mouseenter", ".earnedAchsSpan", function (ev) {

	var recObj = this.parentNode.recommendObj;
	if (!recObj || !recObj.earnedAchs || !recObj.earnedAchs.length) { return false; }
	if (!this.tooltipHtml) {
		var str = "";
		for (var i = 0; i < recObj.earnedAchs.length; i++) {
			str += "<div>" + recObj.earnedAchs[i].iconName + "</div>";
		}
		this.tooltipHtml = '<div class="tooltipAchsList">' + str.replace("<br>", "") + "</div>";
	}
	Game.setTooltip({html: this.tooltipHtml, refEle: this}); //, position: 'below'
	ev.stopPropagation();
});

$("#nextResearchSpan").on("click", function () {
	if (Game.nextTech) {
		Game.nextTech.setUnlocked(true);
		Game.scheduleUpdate();
	}
});

var getTooltipUpdateFunc = function (update) {
	if (this.objTie && this.objTie.getTooltip) {
		this.objTie.getTooltip(this, update);
	}
};

var updateTitle = function (update) {
	if (this.setTitleFunc) {
		this.setTitleFunc();
	}
	if (this.dataset.title || this.tooltipHTML) {
		Game.setTooltip({html: '<div class="titleTooltip">' + (this.dataset.title || this.tooltipHTML) + "</div>",
			refEle: this, isCrate: $(this).hasClass("crate")}, update);
	} else {
		Game.clearTooltip();
	}
};

$(document.forms[0]).on("mouseenter", ".buildingRow .name, .crate, #nextResearchSpan", function () {
	if (this.objTie && this.objTie.getTooltip) {
		this.objTie.getTooltip(this);
		Game.updateTooltip = getTooltipUpdateFunc.bind(this);
	}

}).on("mouseenter", "[data-title]", function () {
	var fn = updateTitle.bind(this);
	fn();
	Game.updateTooltip = fn;
	Game.tooltipAnchor = this;

}).on("mouseleave", ".buildingRow .name, .crate, [data-title], .tooltipped", function () {
	Game.clearTooltip();

}).on("input", 'input[type="text"]:not(.text)', function () {
	var val = Game.parseNumber(this.value, this.minIn, this.maxIn, !$(this).hasClass("deci"));
	if (val !== this.parsedValue && (!this.inputfn || this.inputFn(val))) {
		Game.setInput(this, val);
		if (this.checkFunc) {
			this.checkFunc();
		} else {
			Game.scheduleUpdate();
		}
	}

}).on("focusout", 'input[type="text"]:not(.text)', function () {
	this.value = this.displayValue || this.parsedValue;

}).on("focusin", 'input[type="text"]:not(.text)', function () {
	if (this.value !== String(this.parsedValue)) {
		this.value = this.parsedValue;
	}
	if (this.focusFunc) {
		this.focusFunc();
	}

}).on("click", 'input[type="checkbox"]', function () {
	this.manualChecked = this.checked;
	if (this.clickFunc) {
		this.clickFunc();
	}
	Game.scheduleUpdate();

}).on("click", ".plusminusCheck", function () {
	Game.scheduleUpdate();

}).on("click", ".plusminus", function (ev) {
	if (this.plusminusIn.disabled) {
		return;
	}

	var amount = 1;
	if (!$(this).hasClass("limited")) {
		if (ev.ctrlKey ^ byId("plusminus10").checked) {
			amount = 10;
		}
		if (ev.shiftKey ^ byId("plusminus100").checked) {
			amount = 100;
		}
	}
	var prevVal = this.plusminusIn.parsedValue;
	var newVal = Game.setInput(this.plusminusIn, prevVal + amount * this.plusminusMode);
	if (prevVal !== newVal) {
		if (this.plusminusIn.checkFunc) {
			this.plusminusIn.checkFunc();
		} else {
			Game.scheduleUpdate();
		}
	}

	clearSelection();

}).on("click", ".crate.upgrade", function (ev) {
	var upgrade = this.objTie;
	if (!upgrade || upgrade.type !== "upgrade") {
		return;
	}
	var lock = Game.lockChecked ^ Game.checkEventAltMode(ev);
	if (upgrade.noBuy || lock) {
		upgrade.unlocked = !upgrade.unlocked;
	} else {
		if (upgrade.toggleInto) {
			Game.clearTooltip();
		}
		var wasBought = upgrade.bought;
		upgrade.setBought();
		if (upgrade.buyFunc) {
			upgrade.buyFunc(wasBought);
		}
	}
	Game.scheduleUpdate();

}).on("click", ".achievement", function () {
	var achieve = this.objTie;
	if (!achieve || achieve.type !== "achievement") {
		return;
	}
	achieve.setWon();
	Game.scheduleUpdate();

}).on("click", ".setDesired", function () {
	if (!this.objTie || this.objTie.type !== "building") {
		return;
	}
	var val = this.objTie.amountInDesired.parsedValue;
	var newVal = Game.setInput(this.objTie.amountInDesired, this.objTie.amountInCurrent.parsedValue);
	if (val !== newVal) {
		Game.scheduleUpdate();
	}
});

foolsNameCheck.clickFunc = function () {
	Game.setObjectDisplays();
};

//#endregion event handlers and stuff


// debug autosettings
// byId("tabGarden").click();


Game.setSeason(Game.defaultSeason);
Game.updateMaxWrinklers(true);

Game.update();
Game.firstRun = false;
$("form").removeClass("hidden");
$("#load").addClass("hidden");

if (EN) {
	Game.tick = function () {
		Game.T++;
		setTimeout(Game.tick, 1000 / Game.fps);
	};

	Game.tick();
}

};

})(this, this.jQuery);
