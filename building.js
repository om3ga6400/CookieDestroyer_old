/* global decodeSave UncompressLargeBin unpack unpack2 splitSave */

function byId(id) {
	return document.getElementById(id);
}

(function () {
"use strict";

document.forms[0].reset();

var Game = {
	version: 2.0045,
	mainJS: "2.0045",
	beta: window.location.href.indexOf("/beta") > -1,
	abbrOn: false,

	ObjectPriceIncrease: 1.15, //price increase factor for buildings
	sellMultiplier: 0.5,
	Objects: {},
	ObjectsById: [],

	Upgrades: {}
};
window.CCalc = window.Game = Game;

byId("pVersion").textContent = Game.version + (Game.beta ? " beta" : "");
byId("pVersion").title = "main.js?v=" + Game.mainJS;
if (Game.beta) { document.title += " Beta"; }

var localAbbr = Boolean(localStorage.getItem("CCalc.AbbreviateNums"));
byId("abbrCheck").checked = localAbbr;
Game.abbrOn = localAbbr;

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
for (var i = 0; i < longSuffixes.length; i++) {
	for (var j = 0; j < longPrefixes.length; j++) {
		Abbreviations.push({
			short: shortPrefixes[j] + shortSuffixes[i],
			long: longPrefixes[j] + longSuffixes[i]
		});
	}
}
Abbreviations[11].short = "Dc";
var AbbreviationsMax = Abbreviations.length - 1;

var commaRgx = /\B(?=(\d{3})+(?!\d))/g;
function addCommas(what) {
	var x = what.toString().split(".");
	x[0] = x[0].replace(commaRgx, ",");
	return x.join(".");
}

function Beautify(what) { //turns 9999999 into 9,999,999
	if (!isFinite(what)) { return "Infinity"; }
	if (Math.abs(what) > 1 && what.toString().indexOf("e") > -1) { return what.toString(); }
	return addCommas(Math.round(what));
}

function abbreviateNumber(num, abbrlong) {
	if (num === "---") { return num; }
	if (!isFinite(num)) { return "Infinity"; }
	if (Math.abs(num) < 1000) { return Beautify(num); }
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
		num[0] = addCommas(num[0]);
	}
	num[1] = Abbreviations[Math.min(pow, AbbreviationsMax)][abbrlong ? "long" : "short"];
	return num.join(" ");
}

function formatNumber(num) {
	var beaut = Beautify(num);
	var abbr = abbreviateNumber(num);
	var aLong = abbr === beaut ? abbr : abbreviateNumber(num, true);
	return '<span title="' + (Game.abbrOn ? beaut : aLong) + '">' +
		(Game.abbrOn ? abbr : beaut) + "</span>";
}

var cleanNumRgx = /[^\deE\+\.\-]/g;
function cleanNum(str) { return str.replace(cleanNumRgx, ""); }

var ObjectPriceMultArray = [];

function writeChildren($parent, obj) {
	for (var c in obj) {
		var val = obj[c];
		if (typeof val === "number") {
			val = formatNumber(val);
		}
		$parent.find("." + c).html(val);
	}
}

function addObj(fromObj, toObj) {
	for (var i in fromObj) {
		toObj[i] = (+toObj[i] || 0) + fromObj[i];
	}
}

var aura5, aura7;

function update() {
	Game.abbrOn = byId("abbrCheck").checked;

	Game.sellMultiplier = $("#aura5").hasClass("enabled") ? 0.85 : 0.5; //Earth Shatterer
	Game.Objects["Cursor"].free = Game.Upgrades[288].hasClass("enabled") ? 10 : 0; //Starter kit
	Game.Objects["Grandma"].free = Game.Upgrades[289].hasClass("enabled") ? 5 : 0; //Starter kitchen

	//[Season savings, Santa's dominion, Faberge egg, Divine discount, Fierce Hoarder]
	ObjectPriceMultArray = [
		Game.Upgrades[160].hasClass("enabled"), //Season savings
		Game.Upgrades[168].hasClass("enabled"), //Santa's dominion
		Game.Upgrades[223].hasClass("enabled"), //Faberge egg
		Game.Upgrades[285].hasClass("enabled"), //Divine discount
		$("#aura7").hasClass("enabled"), //Fierce Hoarder
		$("#buff4").hasClass("enabled"), //Everything must go
		$("#buff14").hasClass("enabled"), //Crafty pixies
		$("#buff15").hasClass("enabled"), //Nasty goblins
		Number(byId("god5").dataset.slot) //creation
	];

	var sum = {current: 0, desired: 0};

	for (var i = Game.ObjectsById.length - 1; i >= 0; i--) {
		var building = Game.ObjectsById[i];
		var amount = building.currentIn.parsedValue;
		building.amount = amount;
		var desired = building.desiredIn.parsedValue;
		building.desired = desired;

		building.priceCache = {};

		var prices = {
			price1: building.getPrice(),
			price10: building.getPriceSum(amount, amount + 10),
			price100: building.getPriceSum(amount, amount + 100),
			priceDesired: building.getPriceSum(amount, desired),
			cumu: building.getPriceSum(building.free || 0, amount),
			sell: building.getSellSum(amount, desired)
		};
		writeChildren(building.$row, prices);

		addObj(prices, sum);
		sum.current += amount;
		sum.desired += desired;
	}

	writeChildren($("#buildPriceTotal"), sum);

	var showStar = $(".crate.enabled:not(#aura5)").length > 0;
	$("#cumuHead").toggleClass("star", showStar)[0].title = showStar ? "(minimum)" : "";
}


//adds input with -/+ buttons that subtract/add when clicked
function addPlusMinusInput(par, id, maxlen) {
	var $eles = $('<a class="minus plusminus">-</a> <input id="' +
		id + '" type="text"' + (maxlen ? ' maxlength="' + maxlen + '"' : "") +
		'> <a class="plus plusminus">+</a>').appendTo(par);
	var ele = $eles[2];
	var pm = $eles[0];
	pm.plusminusIn = ele;
	pm.plusminusMode = -1;
	pm = $eles[4];
	pm.plusminusIn = ele;
	pm.plusminusMode = 1;
	return ele;
}

Game.Object = function (name, price) {
	var id = Game.ObjectsById.length;

	this.name = name;
	this.id = id;
	this.baseName = name;
	this.basePrice = price;

	this.amount = 0;
	this.free = 0;

	if (id > 0) {
		//new automated price and CpS curves
		this.basePrice = (id * 1 + 9 + (id < 5 ? 0 : Math.pow(id - 5, 1.75) * 5)) * Math.pow(10, id);
		var digits = Math.pow(10, (Math.ceil(Math.log(Math.ceil(this.basePrice)) / Math.LN10))) / 100;

		this.basePrice = Math.round(this.basePrice / digits) * digits;
	}

	this.$row = $('<tr data-object="' + name + '"><td class="name">' + name + "</td><td></td>" +
		'<td></td><td class="price1">0</td><td class="price10">0</td><td class="price100">0</td>' +
		'<td class="priceDesired">0</td><td class="cumu">0</td><td class="sell">0</td>')
		.insertBefore("#buildPriceTotal");
	this.currentIn = addPlusMinusInput(this.$row.children(":eq(1)"), "buildCurrentIn" + id, 4);
	this.desiredIn = addPlusMinusInput(this.$row.children(":eq(2)"), "buildDesiredIn" + id, 4);

	Game.Objects[name] = this;
	Game.ObjectsById.push(this);
};

Game.Object.prototype.getPrice = function (amount) {
	if (isNaN(amount)) { amount = this.amount; }
	amount = Math.max(0, amount - this.free);

	if (!this.priceCache[amount]) {
		var arr = ObjectPriceMultArray;
		var price = this.basePrice * Math.pow(Game.ObjectPriceIncrease, amount);
		if (arr[0]) { price *= 0.99; } //Season savings
		if (arr[1]) { price *= 0.99; } //Santa's dominion
		if (arr[2]) { price *= 0.99; } //Faberge egg
		if (arr[3]) { price *= 0.99; } //Divine discount
		if (arr[4]) { price *= 0.98; } //Fierce Hoarder (aura)
		if (arr[5]) { price *= 0.95; } //Everything must go (buff)
		if (arr[6]) { price *= 0.98; } //Crafty pixies (buff)
		if (arr[7]) { price *= 1.02; } //Nasty goblins (buff)
		var godLvl = arr[8];           //creation
		if (godLvl == 1) {      price *= 0.93; }
		else if (godLvl == 2) { price *= 0.95; }
		else if (godLvl == 3) { price *= 0.98; }
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


new Game.Object("Cursor", 15);
new Game.Object("Grandma");
new Game.Object("Farm");
new Game.Object("Mine");
new Game.Object("Factory");
new Game.Object("Bank");
new Game.Object("Temple");
new Game.Object("Wizard tower");
new Game.Object("Shipment");
new Game.Object("Alchemy lab");
new Game.Object("Portal");
new Game.Object("Time machine");
new Game.Object("Antimatter condenser");
new Game.Object("Prism");
new Game.Object("Chancemaker");


var str = "";
var type = "upgrade";

function addCrate(name, icon, id, desc) {
	var title = name + "<br>" + desc;
	title = title.replace('"', "&quot;").replace("<", "&lt;");
	str += '<div id="' + type + id + '" class="crate" data-title="' + title +
		'" style="background-position:' + (-icon[0] * 48) + "px " + (-icon[1] * 48) + 'px;"></div>';

	if (type === "upgrade") {
		Game.Upgrades[id] = "#" + type + id;
	}
}

addCrate("Faberge egg", [14, 12], 223,
	"All buildings are 1% cheaper.<br>&ldquo;This outrageous egg is definitely fab.&rdquo;");
addCrate("Season savings", [16, 9], 160,
	"All buildings are 1% cheaper.<br>&ldquo;By Santa's beard, what savings!<br>But who will save us?&rdquo;");
addCrate("Santa's dominion", [19, 10], 168,
	"All buildings are 1% cheaper.<br>&ldquo;My name is Claus, king of kings;<br>Look on my toys, ye Mighty, and despair!&rdquo;");

str += " &nbsp;";
addCrate("Divine discount", [21, 7], 285,
	"Buildings are 1% cheaper.<br>&ldquo;Someone special deserves a special price.&rdquo;");
addCrate("Starter kit", [0, 14], 288,
	"You start with 10 cursors.<br>&ldquo;This can come in handy.&rdquo;");
addCrate("Starter kitchen", [1, 14], 289,
	"You start with 5 grandmas.<br>&ldquo;Where did these come from?&rdquo;");

str += " &nbsp;";
type = "aura";
addCrate("Earth Shatterer [Dragon aura]", [3, 25], 5,
	"Buildings sell back for 85% instead of 50%.");
addCrate("Fierce Hoarder [Dragon aura]", [15, 25], 7,
	"All buildings are 2% cheaper.");

str += "&nbsp;";
type = "buff";
addCrate("Everything must go [Buff]", [17, 6], 4,
	"All buildings are 5% cheaper for 8 seconds!");
addCrate("Crafty pixies [Buff]", [26, 11], 14,
	"All buildings are 2% cheaper for 1 minute!");
addCrate("Nasty goblins [Buff]", [26, 11], 15,
	"All buildings are 2% pricier for 1 hour!");

byId("upgradeIcons").innerHTML = str;

byId("god5").dataset.title = "Dotjeiess, Spirit of Creation<br>Effects :<br>" +
	"[Diamond] Buildings are 7% cheaper.<br>" +
	"[Ruby] Buildings are 5% cheaper.<br>" +
	"[Jade] Buildings are 2% cheaper.<br>" +
	"&ldquo;All things that be and ever will be were scripted long ago by this spirit's inscrutable tendrils.&rdquo;";

for (i in Game.Upgrades) {
	Game.Upgrades[i] = $(Game.Upgrades[i]);
}
aura5 = $("#aura5");
aura7 = $("#aura7");


var $tooltipContainer = $("#tooltip");
var tooltipEle = byId("tooltipBlock");
Game.updateTooltip = null;

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
	if (left + tooltipWidth + 5 > windowWidth) { //stop tooltip from going off right edge of screen
		left = windowWidth - 5 - tooltipWidth;
	}

	//position tooltip, stopping it from going off left edge of screen (higher priority than off right)
	$tooltipContainer.css({top: top, left: Math.max(left, 5)});
};

var updateTitle = function (update) {
	if (this.dataset.title || this.tooltipHTML) {
		Game.setTooltip({html: '<div class="titleTooltip">' + (this.dataset.title || this.tooltipHTML) + "</div>",
			refEle: this, isCrate: $(this).hasClass("crate")}, update);
	} else {
		Game.clearTooltip();
	}
};

Game.clearTooltip = function () {
	$tooltipContainer.addClass("hidden").removeAttr("style");
};


$('input[type="text"]').each(function () {
	this.value = 0;
	this.parsedValue = 0;
	this.placeholder = 0;
});

$("#abbrCheck").click(function () {
	localStorage.setItem("CCalc.AbbreviateNums", this.checked ? 1 : "");
	update();
});
$("#sellCheck").click(function () {
	$("#buildPriceTable").toggleClass("collapse", !this.checked);
});

$(document.body).on("input", 'input[type="text"]', function () {
	var val = parseInt(cleanNum(this.value), 10) || 0;
	if (val !== this.parsedValue) {
		this.parsedValue = val;
		update();
	}
}).on("focusout", 'input[type="text"]', function () {
	this.value = this.parsedValue;
}).on("click", ".plusminus", function (event) {
	var amount = 1;
	if (!$(this.plusminusIn).hasClass("limited")) {
		if (event.ctrlKey ^ byId("plusminus10").checked) {
			amount = 10;
		}
		if (event.shiftKey ^ byId("plusminus100").checked) {
			amount = 100;
		}
	}

	var ele = this.plusminusIn;
	var prevVal = ele.parsedValue;
	ele.parsedValue = Math.max(ele.parsedValue + amount * this.plusminusMode, 0);
	ele.value = ele.parsedValue;

	if (prevVal !== ele.parsedValue) {
		update();
	}
}).on("click", ".crate", function () {
	var $this = $(this);
	$this.toggleClass("enabled");

	if (this.id === "buff14" && $this.hasClass("enabled")) {
		$("#buff15").removeClass("enabled");
	} else if (this.id === "buff15" && $this.hasClass("enabled")) {
		$("#buff14").removeClass("enabled");
	}
	update();
}).on("click", ".templeGod", function () {
	var slot = Number(this.dataset.slot) + 1;
	if (!slot || slot > 3) {
		slot = 0;
	}

	this.dataset.slot = slot;
	update();
}).on("mouseenter", "[data-title]", function () {
	var fn = updateTitle.bind(this);
	fn();
	Game.updateTooltip = fn;
	Game.tooltipAnchor = this;
}).on("mouseleave", "[data-title]", function () {
	Game.clearTooltip();
});


function parseBoolean(n) {
	return Boolean(parseInt(n, 10) || 0);
}

var clearSpaceRgx = /\s/g;

$("#importSave").click(function () {
	var save = prompt("Please paste in the code that was given to you on save export.", "");
	if (!save) { return false; }

	save = save.replace(clearSpaceRgx, "");
	save = decodeSave(save);
	if (!save) { return false; }

	// save = save.split("|");
	save = splitSave(save);

	var version = parseFloat(save[0]);
	if (isNaN(version) || save.length < 5 || version < 1) {
		alert("Oops, looks like the import string is all wrong!");
		return false;
	}
	if (version > Game.version) {
		alert("Error : you are attempting to load a save from a future version (v." + version + "; you are using v." + Game.version + ").");
	}

	$(".crate.enabled").removeClass("enabled");

	var spl = save[4].split(";");
	var aura1 = parseInt(spl[36], 10) || 0;
	var aura2 = parseInt(spl[37], 10) || 0;
	aura5.toggleClass("enabled", aura1 === 5 || aura2 === 5); //Earth Shatterer
	aura7.toggleClass("enabled", aura1 === 7 || aura2 === 7); //Fierce Hoarder

	var i;

	var creationSlot = 0;

	spl = save[5].split(";"); //buildings
	for (i = 0; i < Game.ObjectsById.length; i++) {
		var building = Game.ObjectsById[i];
		var amount = 0;
		if (spl[i]) {
			var mestr = spl[i].toString().split(",");
			amount = parseInt(mestr[0], 10) || 0;

			if (building.name === "Temple" && mestr[4]) { //fluh
				var ids = (mestr[4].split(" ")[0] || "").split("/");
				for (var j = 0; j < 3 && !creationSlot; j++) {
					if (ids[j] == 5) {
						creationSlot = j + 1;
					}
				}
			}
		}
		building.currentIn.value = amount;
		building.currentIn.parsedValue = amount;
	}

	byId("god5").dataset.slot = creationSlot;

	if (version < 1.035) { //old non-binary algorithm
		spl = save[6].split(";"); //upgrades
		for (i in Game.Upgrades) {
			Game.Upgrades[i].toggleClass("enabled", spl[i] ? parseBoolean(spl[i].split(",")[1]) : false);
		}
	} else if (version < 1.0502) { //old awful packing system
		spl = save[6] || []; //upgrades
		spl = version < 1.05 ? UncompressLargeBin(spl) : unpack(spl);
		for (i in Game.Upgrades) {
			Game.Upgrades[i].toggleClass("enabled", spl[i * 2] ? parseBoolean(spl[i * 2 + 1]) : false);
		}
	} else {
		spl = save[6] || []; //upgrades
		spl = unpack2(spl).split("");
		for (i in Game.Upgrades) {
			Game.Upgrades[i].toggleClass("enabled", spl[i * 2] ? parseBoolean(spl[i * 2 + 1]) : false);
		}
	}

	if (version === 1.9) { //are we importing from the 1.9 beta? remove all heavenly upgrades
		Game.Upgrades[285].removeClass("enabled");
		Game.Upgrades[288].removeClass("enabled");
		Game.Upgrades[289].removeClass("enabled");
	}

	spl = (save[8] || "").split(";"); //buffs
	for (i = 0; i < spl.length; i++) {
		if (spl[i]) {
			var id = spl[i].toString().split(",")[0];
			$("#buff" + id).addClass("enabled");
		}
	}

	update();
});


update();
$("#load").remove();
$("form").removeClass("hidden");

})();
