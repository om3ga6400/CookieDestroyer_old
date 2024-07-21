(function () {
"use strict";

var Game = window.Game;
var byId = window.byId;

var EN = window.EN;
var loc = window.loc;
var FindLocStringByPart = window.FindLocStringByPart;

var asBoolNum = window.asBoolNum;
var parseBoolean = window.parseBoolean;

Game.initMinigames = function () {

if (!Game.firstRun) { return; }

var iconCssReset = {
	backgroundPosition: "",
	backgroundImage: ""
};

//IIFEs for variable isolation, since some of these functions are written assuming `M` will only refer to their minigame and I CBA rewriting them

//#region Pantheon
(function () {

var M = Game.pantheon;
M.parent = Game.Objects["Temple"];
M.parent.minigame = M;
M.gods = {
	"asceticism": {
		name: "Holobore, Spirit of Asceticism",
		icon: [21, 18],
		desc1: '<span class="green">' + loc("+%1% base CpS.", 15) + "</span>",
		desc2: '<span class="green">' + loc("+%1% base CpS.", 10) + "</span>",
		desc3: '<span class="green">' + loc("+%1% base CpS.", 5) + "</span>",
		descAfter: '<span class="red">' + loc("If a golden cookie is clicked, this spirit is unslotted and all worship swaps will be used up.") + "</span>",
		quote: "An immortal life spent focusing on the inner self, away from the distractions of material wealth."
	},
	"decadence": {
		name: "Vomitrax, Spirit of Decadence",
		icon: [22, 18],
		desc1: '<span class="green">' + loc("Golden and wrath cookie effect duration +%1%.", 7) + '</span> <span class="red">' + loc("Buildings grant -%1% CpS.", 7) + "</span>",
		desc2: '<span class="green">' + loc("Golden and wrath cookie effect duration +%1%.", 5) + '</span> <span class="red">' + loc("Buildings grant -%1% CpS.", 5) + "</span>",
		desc3: '<span class="green">' + loc("Golden and wrath cookie effect duration +%1%.", 2) + '</span> <span class="red">' + loc("Buildings grant -%1% CpS.", 2) + "</span>",
		quote: "This sleazy spirit revels in the lust for quick easy gain and contempt for the value of steady work."
	},
	"ruin": {
		name: "Godzamok, Spirit of Ruin",
		icon: [23, 18],
		descBefore: '<span class="green">' + loc("Selling buildings triggers a buff boosted by how many buildings were sold.") + "</span>",
		desc1: '<span class="green">' + loc("Buff boosts clicks by +%1% for every building sold for %2 seconds.", [1, 10]) + "</span>",
		desc2: '<span class="green">' + loc("Buff boosts clicks by +%1% for every building sold for %2 seconds.", [0.5, 10]) + "</span>",
		desc3: '<span class="green">' + loc("Buff boosts clicks by +%1% for every building sold for %2 seconds.", [0.25, 10]) + "</span>",
		quote: "The embodiment of natural disasters. An impenetrable motive drives the devastation caused by this spirit."
	},
	"ages": {
		name: "Cyclius, Spirit of Ages",
		icon: [24, 18],
		activeDescFunc: function () {
			var now = Date.now();
			var godLvl = Game.hasGod("ages");
			var mult = 1;
			if (godLvl == 1) {      mult *= 0.15 * Math.sin((now / 1000 / (60 * 60 * 3)) * Math.PI * 2); }
			else if (godLvl == 2) { mult *= 0.15 * Math.sin((now / 1000 / (60 * 60 * 12)) * Math.PI * 2); }
			else if (godLvl == 3) { mult *= 0.15 * Math.sin((now / 1000 / (60 * 60 * 24)) * Math.PI * 2); }
			return loc("Current bonus:") + " " + (mult < 0 ? "-" : "+") + Game.Beautify(Math.abs(mult) * 100, 2) + "%";
		},
		descBefore: loc("CpS bonus fluctuating between %1 and %2 over time.", ['<span class="green">+15%</span>', '<span class="red">-15%</span>']),
		desc1: loc("Effect cycles over %1 hours.", 3),
		desc2: loc("Effect cycles over %1 hours.", 12),
		desc3: loc("Effect cycles over %1 hours.", 24),
		quote: "This spirit knows about everything you'll ever do, and enjoys dispensing a harsh judgment."
	},
	"seasons": {
		name: "Selebrak, Spirit of Festivities",
		icon: [25, 18],
		descBefore: '<span class="green">' + loc("Some seasonal effects are boosted.") + "</span>",
		desc1: '<span class="green">' + loc("Large boost.") + '</span> <span class="red">' + loc("Switching seasons is %1% pricier.", 100) + "</span>",
		desc2: '<span class="green">' + loc("Medium boost.") + '</span> <span class="red">' + loc("Switching seasons is %1% pricier.", 50) + "</span>",
		desc3: '<span class="green">' + loc("Small boost.") + '</span> <span class="red">' + loc("Switching seasons is %1% pricier.", 25) + "</span>",
		quote: "This is the spirit of merry getaways and regretful Monday mornings."
	},
	"creation": {
		name: "Dotjeiess, Spirit of Creation",
		icon: [26, 18],
		desc1: '<span class="green">' + loc("All buildings are <b>%1% cheaper</b>.", 7) + '</span> <span class="red">' + loc("Heavenly chips have %1% less effect.", 30) + "</span>",
		desc2: '<span class="green">' + loc("All buildings are <b>%1% cheaper</b>.", 5) + '</span> <span class="red">' + loc("Heavenly chips have %1% less effect.", 20) + "</span>",
		desc3: '<span class="green">' + loc("All buildings are <b>%1% cheaper</b>.", 2) + '</span> <span class="red">' + loc("Heavenly chips have %1% less effect.", 10) + "</span>",
		quote: "All things that be and ever will be were scripted long ago by this spirit's inscrutable tendrils."
	},
	"labor": {
		name: "Muridal, Spirit of Labor",
		icon: [27, 18],
		desc1: '<span class="green">' + loc("Clicking is <b>%1%</b> more powerful.", 15) + '</span> <span class="red">' + loc("Buildings produce %1% less.", 3) + "</span>",
		desc2: '<span class="green">' + loc("Clicking is <b>%1%</b> more powerful.", 10) + '</span> <span class="red">' + loc("Buildings produce %1% less.", 2) + "</span>",
		desc3: '<span class="green">' + loc("Clicking is <b>%1%</b> more powerful.", 5) + '</span> <span class="red">' + loc("Buildings produce %1% less.", 1) + "</span>",
		quote: "This spirit enjoys a good cheese after a day of hard work."
	},
	"industry": {
		name: "Jeremy, Spirit of Industry",
		icon: [28, 18],
		desc1: '<span class="green">' + loc("Buildings produce %1% more.", 10) + '</span> <span class="red">' + loc("Golden and wrath cookies appear %1% less.", 10) + "</span>",
		desc2: '<span class="green">' + loc("Buildings produce %1% more.", 6) + '</span> <span class="red">' + loc("Golden and wrath cookies appear %1% less.", 6) + "</span>",
		desc3: '<span class="green">' + loc("Buildings produce %1% more.", 3) + '</span> <span class="red">' + loc("Golden and wrath cookies appear %1% less.", 3) + "</span>",
		quote: "While this spirit has many regrets, helping you rule the world through constant industrialization is not one of them."
	},
	"mother": {
		name: "Mokalsium, Mother Spirit",
		icon: [29, 18],
		desc1: '<span class="green">' + loc("Milk is <b>%1% more powerful</b>.", 10) + '</span> <span class="red">' + loc("Golden and wrath cookies appear %1% less.", 15) + "</span>",
		desc2: '<span class="green">' + loc("Milk is <b>%1% more powerful</b>.", 5) + '</span> <span class="red">' + loc("Golden and wrath cookies appear %1% less.", 10) + "</span>",
		desc3: '<span class="green">' + loc("Milk is <b>%1% more powerful</b>.", 3) + '</span> <span class="red">' + loc("Golden and wrath cookies appear %1% less.", 5) + "</span>",
		quote: "A caring spirit said to contain itself, inwards infinitely."
	},
	"scorn": {
		name: "Skruuia, Spirit of Scorn",
		icon: [21, 19],
		descBefore: '<span class="red">' + loc("All golden cookies are wrath cookies with a greater chance of a negative effect.") + "</span>",
		desc1: '<span class="green">' + loc("Wrinklers appear %1% faster and digest %2% more cookies.", [150, 15]) + "</span>",
		desc2: '<span class="green">' + loc("Wrinklers appear %1% faster and digest %2% more cookies.", [100, 10]) + "</span>",
		desc3: '<span class="green">' + loc("Wrinklers appear %1% faster and digest %2% more cookies.", [50, 5]) + "</span>",
		quote: "This spirit enjoys poking foul beasts and watching them squirm, but has no love for its own family."
	},
	"order": {
		name: "Rigidel, Spirit of Order",
		icon: [22, 19],
		activeDescFunc: function () {
			if (Game.ObjectsOwned % 10 == 0) { return loc("Buildings owned:") + " " + Game.Beautify(Game.ObjectsOwned) + "<br>" + loc("Effect is active."); }
			else { return loc("Buildings owned:") + " " + Game.Beautify(Game.ObjectsOwned) + "<br>" + loc("Effect is inactive."); }
		},
		desc1: '<span class="green">' + loc("Sugar lumps ripen <b>%1</b> sooner.", Game.sayTime(60 * 60 * Game.fps)) + "</span>",
		desc2: '<span class="green">' + loc("Sugar lumps ripen <b>%1</b> sooner.", Game.sayTime(60 * 40 * Game.fps)) + "</span>",
		desc3: '<span class="green">' + loc("Sugar lumps ripen <b>%1</b> sooner.", Game.sayTime(60 * 20 * Game.fps)) + "</span>",
		descAfter: '<span class="red">' + loc("Effect is only active when your total amount of buildings ends with 0.") + "</span>",
		quote: "You will find that life gets just a little bit sweeter if you can motivate this spirit with tidy numbers and properly-filled tax returns."
	}
};
M.$disabledBlock = $("#pantheonDisabledBlock");

$("#pantheonSwapsMaxSpan").text(M.swapsMax);

M.swapsIn = byId("pantheonSwapsRemaining");
M.swapsIn.maxIn = M.swapsMax;
M.swapsIn.checkFunc = function () {
	Game.updatePantheonSelection();
	Game.scheduleUpdate();
};
M.swapTimeIn = byId("pantheonSwapTime");
M.swapTimeIn.tooltipFunc = function () {
	var swaps = this.swaps;
	var title = "";
	if (swaps < this.swapsMax) {
		var t = 1000 * 60 * 60;
		if (swaps === 0) {
			t = 1000 * 60 * 60 * 16;
		} else if (swaps === 1) {
			t = 1000 * 60 * 60 * 4;
		}
		var t2 = this.swapTime + t - Date.now();

		var tStr = Game.sayTime((t2 / 1000 + 1) * Game.fps, -1);
		if (tStr) {
			title = "(next in " + tStr + ")";
		}
	}
	return title;
}.bind(M);

byId("productDragonBoostPantheon").tooltipHTML = ('<div class="productDragonBoostTooltip"><b>' + loc("Supreme Intellect") + '</b><div class="line"></div>' +
	loc("The jade slot behaves as a ruby slot and the ruby slot behaves as a diamond slot.") + "</div>");

Game.registerInputs(M, [
	[M.swapsIn, "swaps"],
	[M.swapTimeIn, "swapTime"]
]);

M.swaps = Game.setInput(M.swapsIn, M.swapsMax);
M.swapTime = Game.startDate;

var n = 0;
for (var key in M.gods) {
	var godObj = M.gods[key];
	godObj.id = n;
	godObj.key = key;
	godObj.name = loc(FindLocStringByPart("GOD " + (godObj.id + 1) + " NAME"));
	godObj.quote = loc(FindLocStringByPart("GOD " + (godObj.id + 1) + " QUOTE"));
	godObj.slot = -1;
	godObj.iconCss = Game.getIconCss(godObj.icon);
	godObj.iconCssStr = Game.getIconCssStr(godObj.iconCss);
	M.godsById[n] = godObj;
	n++;
}

//programmatic because space between elements *sigh*
for (var i = 0; i < 3; i++) {
	$('<div id="pantheonSlot' + i + '" class="templeGod templeGod' + i + ' templeSlot tooltipped" data-slot="' + i + '" data-god="-1">' +
		'<div id="pantheonSlot' + i + 'Icon" class="usesIcon templeIcon hidden"></div>' +
		'<div class="usesIcon templeGem templeGem' + (i + 1) + '"></div></div>').appendTo("#pantheonSlots");
}

for (var name in M.gods) {
	godObj = M.gods[name];
	godObj.$ele = $('<div id="pantheonGod' + godObj.id + '" class="templeGod tooltipped" data-god="' + godObj.id + '"></div>').appendTo("#pantheonAvailable");
	godObj.$iconEle = $('<div id="pantheonGod' + godObj.id + 'Icon" class="usesIcon templeIcon"></div>')
		.css(godObj.iconCss).appendTo(godObj.$ele);
}

Game.updatePantheonSelection = function () {
	var $godSlotSel = $("#pantheonSlots .templeGod.selected");
	var $godSel = $("#pantheonAvailable .templeGod.selected");
	var slotId = -1;
	var slottedGod = -1;
	var godId = -1;

	if ($godSlotSel.length === 1) {
		slotId = $godSlotSel.attr("data-slot");
		slottedGod = $godSlotSel.attr("data-god");
	}
	if ($godSel.length === 1) {
		godId = $godSel.attr("data-id");
	}

	var cannotSet = slotId == -1 || godId == -1 || (slottedGod != -1 && slottedGod == godId);

	$("#pantheonClearSelection").toggleClass("hidden", slotId == -1 && godId == -1);
	$("#pantheonSetGodFree").toggleClass("hidden", cannotSet);
	$("#pantheonSetGodSwap").toggleClass("hidden", cannotSet || Game.pantheon.swapsIn.parsedValue < 1);
	$("#pantheonClearSlot").toggleClass("hidden", slotId == -1 || slottedGod == -1);
};

Game.clearPantheonSelection = function () {
	$("#pantheonBlock .templeGod.selected").removeClass("selected");
	Game.updatePantheonSelection();
};
byId("tabMinigames").onTabFunc = function () { Game.clearPantheonSelection(); };

Game.slotGodById = function (godId, slotId) {
	var godObj = Game.pantheon.godsById[godId];
	return Game.slotGod(godObj, slotId);
};

Game.slotGod = function (godObj, slotId) {
	if (godObj && godObj.key in Game.pantheon.gods && slotId in Game.pantheon.slot) {
		Game.clearGodSlot(slotId);

		Game.pantheon.slot[slotId] = godObj.id;
		godObj.slot = Number(slotId);

		godObj.$ele.addClass("hidden");

		$("#pantheonSlot" + slotId).attr("data-god", godObj.id);
		$("#pantheonSlot" + slotId + "Icon").css(godObj.iconCss).removeClass("hidden");
	}
};

Game.forceUnslotGod = function (godKey) {
	var godObj = M.gods[godKey];
	if (godObj && godObj.key in Game.pantheon.gods) {
		godObj.slot = -1;
		godObj.$ele.removeClass("hidden");
		Game.clearGodSlot(godObj.slot);
	}
};

Game.clearGodSlot = function (slotId) {
	if (slotId in Game.pantheon.slot) {
		var godObj = Game.pantheon.godsById[Game.pantheon.slot[slotId]];
		if (godObj) {
			godObj.slot = -1;
			godObj.$ele.removeClass("hidden");
		}

		Game.pantheon.slot[slotId] = -1;
		$("#pantheonSlot" + slotId).attr("data-god", -1);
		$("#pantheonSlot" + slotId + "Icon").css(iconCssReset).addClass("hidden");
	}
};

M.reset = function () {
	Game.setInput(this.swapsIn, this.swapsMax);
	Game.setInput(this.swapTimeIn, Game.saveImportTime);

	for (i = 0; i < 3; i++) {
		Game.clearGodSlot(i);
	}

	byId("pantheonOpenCheck").checked = false;
	Game.clearPantheonSelection();
};

M.save = function () {
	var str = this.slot.join("/");
	str += " " + this.swaps + " " +
		this.swapTime + " " +
		asBoolNum(byId("pantheonOpenCheck").checked);
	return str;
};

M.load = function (str) {
	if (!str) { return false; }

	var i = 0;
	var spl = str.split(" ");
	var bit = spl[i++].split("/") || [];
	for (var j = 0; j < 3; j++) {
		if (parseFloat(bit[j]) != -1) {
			Game.slotGodById(parseFloat(bit[j]), j);
		}
	}

	Game.setInput(this.swapsIn, parseFloat(spl[i++] || this.swapsMax));
	Game.setInput(this.swapTimeIn, parseFloat(spl[i++] || Game.saveImportTime));
	byId("pantheonOpenCheck").checked = spl[i++] == 1;
};

$("#pantheonBlock").on("click", ".templeGod", function () {
	var $ele = $(this);
	$ele.siblings().removeClass("selected");
	$ele.toggleClass("selected");
	Game.updatePantheonSelection();
	return false;

}).on("mouseenter", ".templeGod", function (ev) {
	var godObj = Game.pantheon.godsById[this.dataset.god];
	if (godObj) {
		var slot = godObj.slot;
		if (Game.hasAura("Supreme Intellect")) { slot = Math.max(0, slot - 1); }

		Game.setTooltip({
			html: '<div class="templeGodTooltip">' +
				'<div class="icon templeGodIcon" style="' + godObj.iconCssStr + '"></div>' +
				'<div class="name">' + godObj.name + "</div>" +
				'<div class="line"></div><div class="description"><div class="templeEffectHeader">' + loc("Effects:") + "</div>" +
					(godObj.slot > -1 && godObj.activeDescFunc ? ('<div class="templeEffect templeEffectOn templeEffectActive">' + godObj.activeDescFunc() + "</div>") : "") +
					(godObj.descBefore ? ('<div class="templeEffect">' + godObj.descBefore + "</div>") : "") +
					(godObj.desc1 ? ('<div class="templeEffect templeEffect1' + (slot == 0 ? " templeEffectOn" : "") +
						'"><div class="usesIcon shadowFilter templeGem templeGem1"></div>' + godObj.desc1 + "</div>") : "") +
					(godObj.desc2 ? ('<div class="templeEffect templeEffect2' + (slot == 1 ? " templeEffectOn" : "") +
						'"><div class="usesIcon shadowFilter templeGem templeGem2"></div>' + godObj.desc2 + "</div>") : "") +
					(godObj.desc3 ? ('<div class="templeEffect templeEffect3' + (slot == 2 ? " templeEffectOn" : "") +
						'"><div class="usesIcon shadowFilter templeGem templeGem3"></div>' + godObj.desc3 + "</div>") : "") +
					(godObj.descAfter ? ('<div class="templeEffect">' + godObj.descAfter + "</div>") : "") +
					(godObj.quote ? ("<q>" + godObj.quote + "</q>") : "") +
				"</div></div>",
			refEle: this
		});
	}
	ev.stopPropagation();
});

$("#pantheonClearSelection").click(Game.clearPantheonSelection);

$("#pantheonClearSlot").on("click", function () {
	Game.clearGodSlot($("#pantheonSlots .templeGod.selected").attr("data-slot"));
	Game.clearPantheonSelection();
	Game.scheduleUpdate();
});

$("#pantheonSetGodFree").on("click", function () {
	var $godSlotSel = $("#pantheonSlots .templeGod.selected");
	var $godSel = $("#pantheonAvailable .templeGod.selected");
	var slotId = -1;
	var slottedGod = -1;
	var godId = -1;

	if ($godSlotSel.length === 1) {
		slotId = $godSlotSel.attr("data-slot");
		slottedGod = $godSlotSel.attr("data-god");
	}
	if ($godSel.length === 1) {
		godId = $godSel.attr("data-god");
	}

	if (slotId != -1 && godId != -1 && slottedGod !== godId) {
		Game.slotGodById(godId, slotId);
		Game.clearPantheonSelection();
	} else {
		Game.updatePantheonSelection();
	}
	Game.scheduleUpdate();
});

$("#pantheonSetGodSwap").on("click", function () {
	var swapsIn = Game.pantheon.swapsIn;
	var swaps = swapsIn.parsedValue;
	if (swaps > 0) {
		Game.setInput(swapsIn, swaps - 1);
		byId("pantheonSetGodFree").click();
	} else {
		Game.updatePantheonSelection();
	}
});

})();
//#endregion Pantheon


//#region Grimoire
(function () {

var M = Game.grimoire;
M.parent = Game.Objects["Wizard tower"];
M.parent.minigame = M;
M.$disabledBlock = $("#grimoireDisabledBlock");

M.magicIn = byId("grimoireCurrentMagicIn");
M.spellsCastIn = byId("grimoireSpellsCastIn");
M.spellsCastTotalIn = byId("grimoireSpellsCastTotalIn");

byId("productDragonBoostGrimoire").tooltipHTML = ('<div class="productDragonBoostTooltip"><b>' + loc("Supreme Intellect") + '</b><div class="line"></div>' +
	loc("Grimoire spells are %1% cheaper but fail %1% more.", 10 * Game.auraMult("Supreme Intellect")) + "</div>");

Game.registerInputs(M, [
	[M.magicIn, "magic"],
	[M.spellsCastIn, "spellsCast"],
	[M.spellsCastTotalIn, "spellsCastTotal"]
]);

M.maxMagicSpan = byId("grimoireMaxMagicSpan");
M.$magicPSSpan = $("#grimoireMagicPSSpan");

M.computeMagicMax = function () {
	var towers = Math.max(this.parent.amount, 1);
	var lvl = Math.max(this.parent.level, 1);
	this.magicMax = Math.floor(4 + Math.pow(towers, 0.6) + Math.log((towers + (lvl - 1) * 10) / 15 + 1) * 15);
	this.magicIn.maxIn = this.magicMax;
};

M.reset = function () {
	this.computeMagicMax();
	Game.setInput(this.magicIn, this.magicMax);
	Game.setInput(this.spellsCastIn, 0);
	Game.setInput(this.spellsCastTotalIn, 0);
	byId("grimoireOpenCheck").false;
};

M.save = function () {
	//output cannot use ",", ";" or "|"
	var str = "" +
		parseFloat(Math.min(this.magic, this.magicMax)) + " " +
		Math.floor(this.spellsCast) + " " +
		Math.floor(this.spellsCastTotal) + " " +
		asBoolNum(byId("grimoireOpenCheck").checked);
	return str;
};

M.load = function (str) {
	if (!str) { return false; }

	var i = 0;
	var spl = str.split(" ");
	this.computeMagicMax();
	Game.setInput(this.magicIn, parseFloat(spl[i++] || this.magicMax));
	Game.setInput(this.spellsCastIn, parseInt(spl[i++] || 0, 10));
	Game.setInput(this.spellsCastTotalIn, parseInt(spl[i++] || 0, 10));
	byId("grimoireOpenCheck").checked = spl[i++] == 1;
};

M.updateFunc = function () {
	this.spellsCastTotal = Math.max(this.spellsCastTotal, this.spellsCast);

	this.computeMagicMax();
	Game.setInput(this.magicIn); //refresh

	this.magicPS = Math.max(0.002, Math.pow(this.magic / Math.max(this.magicMax, 100), 0.5)) * 0.002;

	this.maxMagicSpan.innerHTML = Game.Beautify(Math.floor(this.magicMax));
	this.$magicPSSpan.html(" (+" + Game.Beautify((this.magicPS || 0) * Game.fps, 2) + "/s)")
		.toggleClass("hidden", this.magic >= this.magicMax);
};

M.computeMagicMax();
Game.setInput(M.magicIn, M.magicMax);

})();
//#endregion Grimoire


//#region Garden
(function () {

var M = Game.garden;
M.parent = Game.Objects["Farm"];
M.parent.minigame = M;
M.$disabledBlock = $("#gardenDisabledBlock");

M.nextStep = Game.startDate;
M.nextSoil = Game.startDate;

M.nextStepIn = byId("gardenNextStepIn");
M.nextStepIn.tooltipFunc = function () {
	var title = "";
	if (this.freeze) {
		title = "Garden is frozen. Unfreeze to resume.";
	} else {
		title = "Next tick in " + Game.sayTime((this.nextStep - Date.now()) / 1000 * 30 + 30, -1);
	}
	return title;
}.bind(M);

M.nextSoilIn = byId("gardenNextSoilIn");
M.nextSoilIn.tooltipFunc = function () {
	return this.getNextSoilText();
}.bind(M);

M.harvestsIn = byId("gardenHarvestsIn");
M.harvestsTotalIn = byId("gardenHarvestsTotalIn");
M.convertTimesIn = byId("gardenConvertTimesIn");

byId("productDragonBoostGarden").tooltipHTML = ('<div class="productDragonBoostTooltip"><b>' + loc("Supreme Intellect") + '</b><div class="line"></div>' +
	loc("Garden plants age and mutate %1% faster.", 5 * Game.auraMult("Supreme Intellect")) + "</div>");

Game.registerInputs(M, [
	[M.nextStepIn, "nextStep"],
	[M.nextSoilIn, "nextSoil"],
	[M.harvestsIn, "harvests"],
	[M.harvestsTotalIn, "harvestsTotal"],
	[M.convertTimesIn, "convertTimes"]
]);

byId("gardenSeedAgeCustomIn").maxIn = 100;
byId("gardenSelPlotSetAge").maxIn = 100;

M.toggleFreeze = function (toggle) {
	if (typeof toggle === "undefined") { toggle = !this.freeze; }
	this.freeze = Boolean(toggle);
	$("#gardenFreezeTool").toggleClass("on", this.freeze);
	return this.freeze;
};

M.plants = {
	"bakerWheat": {
		name: "Baker's wheat",
		icon: 0,
		cost: 1,
		costM: 30,
		ageTick: 7,
		ageTickR: 2,
		mature: 35,
		children: ["bakerWheat", "thumbcorn", "cronerice", "bakeberry", "clover", "goldenClover", "chocoroot", "tidygrass"],
		effsStr: '<div class="green">&bull; ' + loc("CpS") + " +1%</div>",
		defaultUnlocked: true,
		q: "A plentiful crop whose hardy grain is used to make flour for pastries."
	},
	"thumbcorn": {
		name: "Thumbcorn",
		icon: 1,
		cost: 5,
		costM: 100,
		ageTick: 6,
		ageTickR: 2,
		mature: 20,
		children: ["bakerWheat", "thumbcorn", "cronerice", "gildmillet", "glovemorel"],
		effsStr: '<div class="green">&bull; ' + loc("cookies/click") + " +2%</div>",
		q: "A strangely-shaped variant of corn. The amount of strands that can sprout from one seed is usually in the single digits."
	},
	"cronerice": {
		name: "Cronerice",
		icon: 2,
		cost: 15,
		costM: 250,
		ageTick: 0.4,
		ageTickR: 0.7,
		mature: 55,
		children: ["thumbcorn", "gildmillet", "elderwort", "wardlichen"],
		effsStr: '<div class="green">&bull; ' + loc("%1 CpS", Game.Objects["Grandma"].single) + " +3%</div>",
		q: "Not only does this wrinkly bulb look nothing like rice, it's not even related to it either; its closest extant relative is the weeping willow."
	},
	"gildmillet": {
		name: "Gildmillet",
		icon: 3,
		cost: 15,
		costM: 1500,
		ageTick: 2,
		ageTickR: 1.5,
		mature: 40,
		children: ["clover", "goldenClover", "shimmerlily"],
		effsStr: '<div class="green">&bull; ' + loc("golden cookie gains") + ' +1%</div><div class="green">&bull; ' + loc("golden cookie effect duration") + " +0.1%</div>",
		q: "An ancient staple crop, famed for its golden sheen. Was once used to bake birthday cakes for kings and queens of old."
	},
	"clover": {
		name: "Ordinary clover",
		icon: 4,
		cost: 25,
		costM: 77777,
		ageTick: 1,
		ageTickR: 1.5,
		mature: 35,
		children: ["goldenClover", "greenRot", "shimmerlily"],
		effsStr: '<div class="green">&bull; ' + loc("golden cookie frequency") + " +1%</div>",
		q: "<i>Trifolium repens</i>, a fairly mundane variety of clover with a tendency to produce four leaves. Such instances are considered lucky by some."
	},
	"goldenClover": {
		name: "Golden clover",
		icon: 5,
		cost: 125,
		costM: 777777777777,
		ageTick: 4,
		ageTickR: 12,
		mature: 50,
		children: [],
		effsStr: '<div class="green">&bull; ' + loc("golden cookie frequency") + " +3%</div>",
		q: "A variant of the ordinary clover that traded its chlorophyll for pure organic gold. Tragically short-lived, this herb is an evolutionary dead-end - but at least it looks pretty."
	},
	"shimmerlily": {
		name: "Shimmerlily",
		icon: 6,
		cost: 60,
		costM: 777777,
		ageTick: 5,
		ageTickR: 6,
		mature: 70,
		children: ["elderwort", "whiskerbloom", "chimerose", "cheapcap"],
		effsStr: '<div class="green">&bull; ' + loc("golden cookie gains") + ' +1%</div><div class="green">&bull; ' + loc("golden cookie frequency") + ' +1%</div><div class="green">&bull; ' + loc("random drops") + " +1%</div>",
		q: "These little flowers are easiest to find at dawn, as the sunlight refracting in dew drops draws attention to their pure-white petals."
	},
	"elderwort": {
		name: "Elderwort",
		icon: 7,
		cost: 60 * 3,
		costM: 100000000,
		ageTick: 0.3,
		ageTickR: 0.5,
		mature: 90,
		immortal: 1,
		noContam: true,
		detailsStr: Game.cap(loc("immortal")),
		children: ["everdaisy", "ichorpuff", "shriekbulb"],
		effsStr: '<div class="green">&bull; ' + loc("wrath cookie gains") + ' +1%</div><div class="green">&bull; ' + loc("wrath cookie frequency") + ' +1%</div><div class="green">&bull; ' + loc("%1 CpS", Game.Objects["Grandma"].single) + ' +1%</div><div class="green">&bull; ' + loc("immortal") + '</div><div class="gray">&bull; ' + loc("surrounding plants (%1x%1) age %2% faster", [3, 3]) + "</div>",
		q: "A very old, long-forgotten subspecies of edelweiss that emits a strange, heady scent. There is some anecdotal evidence that these do not undergo molecular aging."
	},
	"bakeberry": {
		name: "Bakeberry",
		icon: 8,
		cost: 45,
		costM: 100000000,
		ageTick: 1,
		ageTickR: 1,
		mature: 50,
		children: ["queenbeet"],
		effsStr: '<div class="green">&bull; ' + loc("CpS") + ' +1%</div><div class="green">&bull; ' + loc("harvest when mature for +%1 of CpS (max. %2% of bank)", [Game.sayTime(30 * 60 * Game.fps), 3]) + "</div>",
		q: "A favorite among cooks, this large berry has a crunchy brown exterior and a creamy red center. Excellent in pies or chicken stews."
	},
	"chocoroot": {
		name: "Chocoroot",
		icon: 9,
		cost: 15,
		costM: 100000,
		ageTick: 4,
		ageTickR: 0,
		mature: 25,
		detailsStr: Game.cap(loc("predictable growth")),
		children: ["whiteChocoroot", "drowsyfern", "queenbeet"],
		effsStr: '<div class="green">&bull; ' + loc("CpS") + ' +1%</div><div class="green">&bull; ' + loc("harvest when mature for +%1 of CpS (max. %2% of bank)", [Game.sayTime(3 * 60 * Game.fps), 3]) + '</div><div class="green">&bull; ' + loc("predictable growth") + "</div>",
		q: "A tangly bramble coated in a sticky, sweet substance. Unknown genetic ancestry. Children often pick these from fields as-is as a snack."
	},
	"whiteChocoroot": {
		name: "White chocoroot",
		icon: 10,
		cost: 15,
		costM: 100000,
		ageTick: 4,
		ageTickR: 0,
		mature: 25,
		detailsStr: Game.cap(loc("predictable growth")),
		children: ["whiskerbloom", "tidygrass"],
		effsStr: '<div class="green">&bull; ' + loc("golden cookie gains") + ' +1%</div><div class="green">&bull; ' + loc("harvest when mature for +%1 of CpS (max. %2% of bank)", [Game.sayTime(3 * 60 * Game.fps), 3]) + '</div><div class="green">&bull; ' + loc("predictable growth") + "</div>",
		q: "A pale, even sweeter variant of the chocoroot. Often impedes travelers with its twisty branches."
	},
	"whiteMildew": {
		name: "White mildew",
		fungus: true,
		icon: 26,
		cost: 20,
		costM: 9999,
		ageTick: 8,
		ageTickR: 12,
		mature: 70,
		detailsStr: Game.cap(loc("spreads easily")),
		children: ["brownMold", "whiteChocoroot", "wardlichen", "greenRot"],
		effsStr: '<div class="green">&bull; ' + loc("CpS") + ' +1%</div><div class="gray">&bull; ' + loc("may spread as %1", loc("Brown mold")) + "</div>",
		q: "A common rot that infests shady plots of earth. Grows in little creamy capsules. Smells sweet, but sadly wilts quickly."
	},
	"brownMold": {
		name: "Brown mold",
		fungus: true,
		icon: 27,
		cost: 20,
		costM: 9999,
		ageTick: 8,
		ageTickR: 12,
		mature: 70,
		detailsStr: Game.cap(loc("spreads easily")),
		children: ["whiteMildew", "chocoroot", "keenmoss", "wrinklegill"],
		effsStr: '<div class="red">&bull; ' + loc("CpS") + ' -1%</div><div class="gray">&bull; ' + loc("may spread as %1", loc("White mildew")) + "</div>",
		q: "A common rot that infests shady plots of earth. Grows in odd reddish clumps. Smells bitter, but thankfully wilts quickly."
	},
	"meddleweed": {
		name: "Meddleweed",
		weed: true,
		icon: 29,
		cost: 1,
		costM: 10,
		ageTick: 10,
		ageTickR: 6,
		mature: 50,
		contam: 0.05,
		detailsStr: EN ? "Grows in empty tiles, spreads easily" : (Game.cap(loc("grows in empty tiles")) + " / " + Game.cap(loc("spreads easily"))),
		children: ["meddleweed", "brownMold", "crumbspore"],
		effsStr: '<div class="red">&bull; ' + loc("useless") + '</div><div class="red">&bull; ' + loc("may overtake nearby plants") + '</div><div class="gray">&bull; ' + loc("may sometimes drop spores when uprooted") + "</div>",
		q: "The sign of a neglected farmland, this annoying weed spawns from unused dirt and may sometimes spread to other plants, killing them in the process."
	},
	"whiskerbloom": {
		name: "Whiskerbloom",
		icon: 11,
		cost: 20,
		costM: 1000000,
		ageTick: 2,
		ageTickR: 2,
		mature: 60,
		children: ["chimerose", "nursetulip"],
		effsStr: '<div class="green">&bull; ' + loc("milk effects") + " +0.2%</div>",
		q: "Squeezing the translucent pods makes them excrete a milky liquid, while producing a faint squeak akin to a cat's meow."
	},
	"chimerose": {
		name: "Chimerose",
		icon: 12,
		cost: 15,
		costM: 242424,
		ageTick: 1,
		ageTickR: 1.5,
		mature: 30,
		children: ["chimerose"],
		effsStr: '<div class="green">&bull; ' + loc("reindeer gains") + ' +1%</div><div class="green">&bull; ' + loc("reindeer frequency") + " +1%</div>",
		q: "Originating in the greener flanks of polar mountains, this beautiful flower with golden accents is fragrant enough to make any room feel a little bit more festive."
	},
	"nursetulip": {
		name: "Nursetulip",
		icon: 13,
		cost: 40,
		costM: 1000000000,
		ageTick: 0.5,
		ageTickR: 2,
		mature: 60,
		children: [],
		effsStr: '<div class="green">&bull; ' + loc("surrounding plants (%1x%1) are %2% more efficient", [3, 20]) + '</div><div class="red">&bull; ' + loc("CpS") + " -2%</div>",
		q: "This flower grows an intricate root network that distributes nutrients throughout the surrounding soil. The reason for this seemingly altruistic behavior is still unknown."
	},
	"drowsyfern": {
		name: "Drowsyfern",
		icon: 14,
		cost: 90,
		costM: 100000,
		ageTick: 0.05,
		ageTickR: 0.1,
		mature: 30,
		children: [],
		effsStr: '<div class="green">&bull; ' + loc("CpS") + ' +3%</div><div class="red">&bull; ' + loc("cookies/click") + ' -5%</div><div class="red">&bull; ' + loc("golden cookie frequency") + " -10%</div>",
		q: "Traditionally used to brew a tea that guarantees a good night of sleep."
	},
	"wardlichen": {
		name: "Wardlichen",
		icon: 15,
		cost: 10,
		costM: 10000,
		ageTick: 5,
		ageTickR: 4,
		mature: 65,
		children: ["wardlichen"],
		effsStr: '<div class="gray">&bull; ' + loc("wrath cookie frequency") + ' -2%</div><div class="gray">&bull; ' + loc("wrinkler spawn rate") + " -15%</div>",
		q: "The metallic stench that emanates from this organism has been known to keep insects and slugs away."
	},
	"keenmoss": {
		name: "Keenmoss",
		icon: 16,
		cost: 50,
		costM: 1000000,
		ageTick: 4,
		ageTickR: 5,
		mature: 65,
		children: ["drowsyfern", "wardlichen", "keenmoss"],
		effsStr: '<div class="green">&bull; ' + loc("random drops") + " +3%</div>",
		q: "Fuzzy to the touch and of a vibrant green. In plant symbolism, keenmoss is associated with good luck for finding lost objects."
	},
	"queenbeet": {
		name: "Queenbeet",
		icon: 17,
		cost: 60 * 1.5,
		costM: 1000000000,
		ageTick: 1,
		ageTickR: 0.4,
		mature: 80,
		noContam: true,
		children: ["duketater", "queenbeetLump", "shriekbulb"],
		effsStr: '<div class="green">&bull; ' + loc("golden cookie effect duration") + ' +0.3%</div><div class="red">&bull; ' + loc("CpS") + ' -2%</div><div class="green">&bull; ' + loc("harvest when mature for +%1 of CpS (max. %2% of bank)", [Game.sayTime(60 * 60 * Game.fps), 4]) + "</div>",
		q: "A delicious taproot used to prepare high-grade white sugar. Entire countries once went to war over these."
	},
	"queenbeetLump": {
		name: "Juicy queenbeet",
		icon: 18,
		plantable: false,
		cost: 60 * 2,
		costM: 1000000000000,
		ageTick: 0.04,
		ageTickR: 0.08,
		mature: 85,
		noContam: true,
		children: [],
		effsStr: '<div class="red">&bull; ' + loc("CpS") + ' -10%</div><div class="red">&bull; ' + loc("surrounding plants (%1x%1) are %2% less efficient", [3, 20]) + '</div><div class="green">&bull; ' + loc("harvest when mature for a sugar lump") + "</div>",
		q: "A delicious taproot used to prepare high-grade white sugar. Entire countries once went to war over these.<br>It looks like this one has grown especially sweeter and juicier from growing in close proximity to other queenbeets."
	},
	"duketater": {
		name: "Duketater",
		icon: 19,
		cost: 60 * 8,
		costM: 1000000000000,
		ageTick: 0.4,
		ageTickR: 0.1,
		mature: 95,
		noContam: true,
		children: ["shriekbulb"],
		effsStr: '<div class="green">&bull; ' + loc("harvest when mature for +%1 of CpS (max. %2% of bank)", [Game.sayTime(2 * 60 * 60 * Game.fps), 8]) + "</div>",
		q: "A rare, rich-tasting tuber fit for a whole meal, as long as its strict harvesting schedule is respected. Its starch has fascinating baking properties."
	},
	"crumbspore": {
		name: "Crumbspore",
		fungus: true,
		icon: 20,
		cost: 10,
		costM: 999,
		ageTick: 3,
		ageTickR: 3,
		mature: 65,
		contam: 0.03,
		noContam: true,
		detailsStr: Game.cap(loc("spreads easily")),
		children: ["crumbspore", "glovemorel", "cheapcap", "doughshroom", "wrinklegill", "ichorpuff"],
		effsStr: '<div class="green">&bull; ' + loc("explodes into up to %1 of CpS at the end of its lifecycle (max. %2% of bank)", [Game.sayTime(60 * Game.fps), 1]) + '</div><div class="red">&bull; ' + loc("may overtake nearby plants") + "</div>",
		q: "An archaic mold that spreads its spores to the surrounding dirt through simple pod explosion."
	},
	"doughshroom": {
		name: "Doughshroom",
		fungus: true,
		icon: 24,
		cost: 100,
		costM: 100000000,
		ageTick: 1,
		ageTickR: 2,
		mature: 85,
		contam: 0.03,
		noContam: true,
		detailsStr: Game.cap(loc("spreads easily")),
		children: ["crumbspore", "doughshroom", "foolBolete", "shriekbulb"],
		effsStr: '<div class="green">&bull; ' + loc("explodes into up to %1 of CpS at the end of its lifecycle (max. %2% of bank)", [Game.sayTime(5 * 60 * Game.fps), 3]) + '</div><div class="red">&bull; ' + loc("may overtake nearby plants") + "</div>",
		q: "Jammed full of warm spores; some forest walkers often describe the smell as similar to passing by a bakery."
	},
	"glovemorel": {
		name: "Glovemorel",
		fungus: true,
		icon: 21,
		cost: 30,
		costM: 10000,
		ageTick: 3,
		ageTickR: 18,
		mature: 80,
		children: [],
		effsStr: '<div class="green">&bull; ' + loc("cookies/click") + ' +4%</div><div class="green">&bull; ' + loc("%1 CpS", Game.Objects["Cursor"].single) + ' +1%</div><div class="red">&bull; ' + loc("CpS") + " -1%</div>",
		q: "Touching its waxy skin reveals that the interior is hollow and uncomfortably squishy."
	},
	"cheapcap": {
		name: "Cheapcap",
		fungus: true,
		icon: 22,
		cost: 40,
		costM: 100000,
		ageTick: 6,
		ageTickR: 16,
		mature: 40,
		children: [],
		effsStr: '<div class="green">&bull; ' + (EN ? "buildings and upgrades are 0.2% cheaper" : (loc("building costs") + " -0.2% / " + loc("upgrade costs") + " -0.2%")) + '</div><div class="red">&bull; ' + loc("cannot handle cold climates; %1% chance to die when frozen", 15) + "</div>",
		q: "Small, tough, and good in omelettes. Some historians propose that the heads of dried cheapcaps were once used as currency in some bronze age societies."
	},
	"foolBolete": {
		name: "Fool's bolete",
		fungus: true,
		icon: 23,
		cost: 15,
		costM: 10000,
		ageTick: 5,
		ageTickR: 25,
		mature: 50,
		children: [],
		effsStr: '<div class="green">&bull; ' + loc("golden cookie frequency") + ' +2%</div><div class="red">&bull; ' + loc("golden cookie gains") + ' -5%</div><div class="red">&bull; ' + loc("golden cookie duration") + ' -2%</div><div class="red">&bull; ' + loc("golden cookie effect duration") + " -2%</div>",
		q: "Named for its ability to fool mushroom pickers. The fool's bolete is not actually poisonous, it's just extremely bland."
	},
	"wrinklegill": {
		name: "Wrinklegill",
		fungus: true,
		icon: 25,
		cost: 20,
		costM: 1000000,
		ageTick: 1,
		ageTickR: 3,
		mature: 65,
		children: ["elderwort", "shriekbulb"],
		effsStr: '<div class="gray">&bull; ' + loc("wrinkler spawn rate") + ' +2%</div><div class="gray">&bull; ' + loc("wrinkler appetite") + " +1%</div>",
		q: "This mushroom's odor resembles that of a well-done steak, and is said to whet the appetite - making one's stomach start gurgling within seconds."
	},
	"greenRot": {
		name: "Green rot",
		fungus: true,
		icon: 28,
		cost: 60,
		costM: 1000000,
		ageTick: 12,
		ageTickR: 13,
		mature: 65,
		children: ["keenmoss", "foolBolete"],
		effsStr: '<div class="green">&bull; ' + loc("golden cookie duration") + ' +0.5%</div><div class="green">&bull; ' + loc("golden cookie frequency") + ' +1%</div><div class="green">&bull; ' + loc("random drops") + " +1%</div>",
		q: 'This short-lived mold is also known as "emerald pebbles", and is considered by some as a pseudo-gem that symbolizes good fortune.'
	},
	"shriekbulb": {
		name: "Shriekbulb",
		icon: 30,
		cost: 60,
		costM: 4444444444444,
		ageTick: 3,
		ageTickR: 1,
		mature: 60,
		noContam: true,
		detailsStr: Game.cap(loc("the unfortunate result of some plant combinations")),
		children: ["shriekbulb"],
		effsStr: '<div class="red">&bull; ' + loc("CpS") + ' -2%</div><div class="red">&bull; ' + loc("surrounding plants (%1x%1) are %2% less efficient", [3, 5]) + "</div>",
		q: "A nasty vegetable with a dreadful quirk : its flesh resonates with a high-pitched howl whenever it is hit at the right angle by sunlight, moonlight, or even a slight breeze."
	},
	"tidygrass": {
		name: "Tidygrass",
		icon: 31,
		cost: 90,
		costM: 100000000000000,
		ageTick: 0.5,
		ageTickR: 0,
		mature: 40,
		children: ["everdaisy"],
		effsStr: '<div class="green">&bull; ' + loc("surrounding tiles (%1x%1) develop no weeds or fungus", 5) + "</div>",
		q: "The molecules this grass emits are a natural weedkiller. Its stems grow following a predictable pattern, making it an interesting -if expensive- choice for a lawn grass."
	},
	"everdaisy": {
		name: "Everdaisy",
		icon: 32,
		cost: 180,
		costM: 100000000000000000000,
		ageTick: 0.3,
		ageTickR: 0,
		mature: 75,
		noContam: true,
		immortal: 1,
		detailsStr: Game.cap(loc("immortal")),
		children: [],
		effsStr: '<div class="green">&bull; ' + loc("surrounding tiles (%1x%1) develop no weeds or fungus", 3) + '</div><div class="green">&bull; ' + loc("immortal") + "</div>",
		q: "While promoted by some as a superfood owing to its association with longevity and intriguing geometry, this elusive flower is actually mildly toxic."
	},
	"ichorpuff": {
		name: "Ichorpuff",
		fungus: true,
		icon: 33,
		cost: 120,
		costM: 987654321,
		ageTick: 1,
		ageTickR: 1.5,
		mature: 35,
		children: [],
		effsStr: '<div class="green">&bull; ' + loc("surrounding plants (%1x%1) age %2% slower", [3, 50]) + '</div><div class="red">&bull; ' + loc("surrounding plants (%1x%1) are %2% less efficient", [3, 50]) + "</div>",
		q: "This puffball mushroom contains sugary spores, but it never seems to mature to bursting on its own. Surrounding plants under its influence have a very slow metabolism, reducing their effects but lengthening their lifespan."
	}
};
M.plantsById = [];
var n = 0;

for (var i in M.plants) {
	var plant = M.plants[i];
	plant.unlocked = Boolean(plant.defaultUnlocked);
	plant.id = n;
	plant.key = i;
	plant.matureBase = plant.mature;
	M.plantsById[n] = plant;
	if (typeof plant.plantable === "undefined") { plant.plantable = true; }
	plant.q = loc(FindLocStringByPart(plant.name + " quote"));
	plant.name = loc(plant.name);

	plant.iconCss = [];
	plant.iconCssStr = [];
	for (var j = 0; j < 5; j++) {
		plant.iconCss[j] = Game.getIconCss([j, plant.icon]);
		plant.iconCssStr[j] = Game.getIconCssStr(plant.iconCss[j]);
	}

	plant.$seedBlock = $('<div id="gardenSeed-' + n + '" class="gardenSeed gardenSelectable tooltipped" data-plant-id="' + n + '">' +
		'<div id="gardenSeedIcon-' + n + '" class="gardenSeedIcon" style="' + plant.iconCssStr[0] + '">' +
	"</div>").toggleClass("locked", !plant.unlocked).appendTo("#gardenSeeds");
	n++;
}
M.numPlants = M.plantsById.length;
M.numPlantsUnlocked = 0;

M.computeMatures = function () {
	var mult = 1;
	if (Game.HasAchieve("Seedless to nay")) { mult = 0.95; }
	for (var i = 0; i < this.numPlants; i++) {
		this.plantsById[i].mature = this.plantsById[i].matureBase * mult;
	}
};

M.toggleGardenFillBtn = function () {
	$("#gardenFillAllPlots").toggleClass("hidden", this.getNewSeedAge(this.plantsById[this.seedSelected]) < 0);
};

M.selectSeed = function (plant, force) {
	var id = -1;
	$("#gardenSeedBlock .gardenSeed.on").removeClass("on");
	if (plant && (force || this.seedSelected !== plant.id)) {
		id = plant.id;
		plant.$seedBlock.addClass("on");
	}
	this.seedSelected = id;
	$("#gardenDeselectSeed").toggleClass("invisible", id === -1);
	this.toggleGardenFillBtn();
};

M.toggleSeed = function (plant, toggle) {
	toggle = typeof toggle === "undefined" ? !plant.unlocked : Boolean(toggle);
	plant.unlocked = Boolean(toggle || plant.defaultUnlocked);
	this.updateSeedBlock(plant);
	return plant.unlocked;
};

M.updateSeedBlock = function (plant) {
	if (plant && plant.$seedBlock) {
		plant.$seedBlock.toggleClass("locked", !plant.unlocked);
	}
};

M.canPlant = function (plant) {
	return Game.cookies >= this.getCost(plant);
};

M.getCost = function (plant) {
	if (Game.HasUpgrade("Turbo-charged soil")) { return 0; }
	return Math.max(plant.costM, Game.cookiesPs * plant.cost * 60) * (Game.HasAchieve("Seedless to nay") ? 0.95 : 1);
};

M.getPlantDesc = function (plant) {
	var children = "";
	if (plant.children.length > 0) {
		children += '<div class="shadowFilter inline-block">';
		for (var i = 0; i < plant.children.length; i++) {
			var it = this.plants[plant.children[i]];
			if (!it) { console.log("No plant named " + plant.children[i]); }
			if (it) {
				children += '<div class="gardenSeedTiny' + (it.unlocked ? '" style="' + it.iconCssStr[0] : " locked") + '"></div>';
			}
		}
		children += "</div>";
	}

	var dragonBoost = 1 / (1 + 0.05 * Game.auraMult("Supreme Intellect"));
	return ('<div class="description">' +
		(!plant.immortal ? ('<div class="gardenDescMargin gardenDescFont"><b>' + loc("Average lifespan:") + "</b> " + Game.sayTime(((100 / (plant.ageTick + plant.ageTickR / 2)) * dragonBoost * M.stepT) * 30, -1) +
			" <small>(" + loc("%1 tick", Game.LBeautify(Math.ceil((100 / ((plant.ageTick + plant.ageTickR / 2))) * (1)))) + ")</small></div>") : "") +
		'<div class="gardenDescMargin gardenDescFont"><b>' + loc("Average maturation:") + "</b> " + Game.sayTime(((100 / ((plant.ageTick + plant.ageTickR / 2))) * (plant.mature / 100) * dragonBoost * M.stepT) * 30, -1) +
			" <small>(" + loc("%1 tick", Game.LBeautify(Math.ceil((100 / ((plant.ageTick + plant.ageTickR / 2))) * (plant.mature / 100)))) + ")</small></div>" +
		(plant.weed ? '<div class="gardenDescMargin gardenDescFont"><b>' + (EN ? "Is a weed" : loc("Weed")) + "</b></div>" : "") +
		(plant.fungus ? '<div class="gardenDescMargin gardenDescFont"><b>' + (EN ? "Is a fungus" : loc("Fungus")) + "</b></div>" : "") +
		(plant.detailsStr ? ('<div class="gardenDescMargin gardenDescFont"><b>' + loc("Details:") + "</b> " + plant.detailsStr + "</div>") : "") +
		(children != "" ? ('<div class="gardenDescMargin gardenDescFont"><b>' + loc("Possible mutations:") + "</b> " + children + "</div>") : "") +
		'<div class="line"></div>' +
		'<div class="gardenDescMargin"><b>' + loc("Effects:") + '</b> <span class="gardenDescFont">(' + loc("while plant is alive; scales with plant growth") + + "</b></div>" +
		'<div class="gardenDescFont bold">' + plant.effsStr + "</div>" +
		(plant.q ? ("<q>" + plant.q + "</q>") : "") +
	"</div>");
};

M.soils = {
	"dirt": {
		name: loc("Dirt"),
		icon: 0,
		tick: 5,
		effMult: 1,
		weedMult: 1,
		req: 0,
		effsStr: '<div class="gray">&bull; ' + loc("tick every %1", "<b>" + Game.sayTime(5 * 60 * Game.fps) + "</b>") + "</div>",
		q: loc("Simple, regular old dirt that you'd find in nature.")
	},
	"fertilizer": {
		name: loc("Fertilizer"),
		icon: 1,
		tick: 3,
		effMult: 0.75,
		weedMult: 1.2,
		req: 50,
		effsStr: '<div class="gray">&bull; ' + loc("tick every %1", "<b>" + Game.sayTime(3 * 60 * Game.fps) + "</b>") + '</div><div class="red">&bull; ' + loc("passive plant effects") + ' <b>-25%</b></div><div class="red">&bull; ' + loc("weed growth") + " <b>+20%</b></div>",
		q: loc("Soil with a healthy helping of fresh manure. Plants grow faster but are less efficient.")
	},
	"clay": {
		name: loc("Clay"),
		icon: 2,
		tick: 15,
		effMult: 1.25,
		weedMult: 1,
		req: 100,
		effsStr: '<div class="gray">&bull; ' + loc("tick every %1", "<b>" + Game.sayTime(15 * 60 * Game.fps) + "</b>") + '</div><div class="green">&bull; ' + loc("passive plant effects") + " <b>+25%</b></div>",
		q: loc("Rich soil with very good water retention. Plants grow slower but are more efficient.")
	},
	"pebbles": {
		name: loc("Pebbles"),
		icon: 3,
		tick: 5,
		effMult: 0.25,
		weedMult: 0.1,
		req: 200,
		effsStr: '<div class="gray">&bull; ' + loc("tick every %1", "<b>" + Game.sayTime(5 * 60 * Game.fps) + "</b>") + '</div><div class="red">&bull; ' + loc("passive plant effects") + ' <b>-75%</b></div><div class="green">&bull; ' + loc("<b>%1% chance</b> of collecting seeds automatically when plants expire", 35) + '</div><div class="green">&bull; ' + loc("weed growth") + " <b>-90%</b></div>",
		q: loc("Dry soil made of small rocks tightly packed together. Not very conducive to plant health, but whatever falls off your crops will be easy to retrieve.<br>Useful if you're one of those farmers who just want to find new seeds without having to tend their garden too much.")
	},
	"woodchips": {
		name: loc("Wood chips"),
		icon: 4,
		tick: 5,
		effMult: 0.25,
		weedMult: 0.1,
		req: 300,
		effsStr: '<div class="gray">&bull; ' + loc("tick every %1", "<b>" + Game.sayTime(5 * 60 * Game.fps) + "</b>") + '</div><div class="red">&bull; ' + loc("passive plant effects") + ' <b>-75%</b></div><div class="green">&bull; ' + loc("plants spread and mutate <b>%1 times more</b>", 3) + '</div><div class="green">&bull; ' + loc("weed growth") + " <b>-90%</b></div>",
		q: loc("Soil made of bits and pieces of bark and sawdust. Helpful for young sprouts to develop, not so much for mature plants.")
	}
};

M.soilsById = [];
n = 0;
for (i in M.soils) {
	var soil = M.soils[i];
	soil.id = n;
	soil.key = i;
	soil.iconCss = Game.getIconCss([soil.icon, 34]);
	soil.iconCssStr = Game.getIconCssStr(soil.iconCss);
	M.soilsById[n] = soil;
	soil.$soilBlock = $('<div id="gardenSoil-' + n + '" class="gardenSeed gardenSoil gardenSelectable tooltipped" data-soil-id="' + n + '">' +
		'<div id="gardenSoilIcon-' + n + '" class="gardenSeedIcon" style="' + soil.iconCssStr + '">' +
	"</div>").toggleClass("on", n === 0).appendTo("#gardenSoils");
	n++;
}
M.soil = 0;

M.resetLockedSoil = true;

M.toggleSoil = function (id) {
	var soil = this.soilsById[id];
	if (this.resetLockedSoil && soil && id > 0 && this.parent.amount < soil.req) {
		soil = this.soilsById[0];
	}
	if (soil) {
		this.soil = soil.id;
		soil.$soilBlock.addClass("on").siblings(".gardenSoil").removeClass("on");
	}
};

M.getNextSoilText = function (now) {
	if (typeof now === "undefined") { now = Date.now(); }
	var str = "";
	if (this.nextSoil > now) {
		str = "You will be able to change your soil again in " + Game.sayTime((this.nextSoil - now) / 1000 * 30 + 30, -1) + ".";
	}
	return str;
};

M.computeStepT = function () {
	if (Game.HasUpgrade("Turbo-charged soil")) {
		this.stepT = 1;
	} else {
		this.stepT = this.soilsById[this.soil].tick * 60;
	}
};

M.plot = [];
M.tiles = [];
for (var y = 0; y < 6; y++) {
	M.plot[y] = [];
	M.tiles[y] = [];
	for (var x = 0; x < 6; x++) {
		M.plot[y][x] = [0, 0];
		M.tiles[y][x] = [0, 0];
		$('<div id="gardenTile-' + x + "-" + y + '" class="gardenTile tooltipped hidden" style="left:' + (16 + x * M.tileSize) + "px;top:" + (16 + y * M.tileSize) + 'px;">' +
			'<div id="gardenTileIcon-' + x + "-" + y + '" class="gardenTileIcon gardenSelectable hidden"></div>' +
		"</div>").appendTo("#gardenPlot");
	}
}

M.plotBoost = [];
for (y = 0; y < 6; y++) {
	M.plotBoost[y] = [];
	for (x = 0; x < 6; x++) {
		//age mult, power mult, weed mult
		M.plotBoost[y][x] = [1, 1, 1];
	}
}

M.plotLimits = [
	[2, 2, 4, 4],
	[2, 2, 5, 4],
	[2, 2, 5, 5],
	[1, 2, 5, 5],
	[1, 1, 5, 5],
	[1, 1, 6, 5],
	[1, 1, 6, 6],
	[0, 1, 6, 6],
	[0, 0, 6, 6]
];
M.isTileUnlocked = function (x, y) {
	var level = this.parent.level;
	level = Math.max(1, Math.min(this.plotLimits.length, level)) - 1;
	var limits = this.plotLimits[level];
	return (x >= limits[0] && x < limits[2] && y >= limits[1] && y < limits[3]);
};

M.getNewSeedAge = function (plant) {
	var age = -1;
	if (plant) {
		switch ($('[name="gardenSeedAge"]:checked').val()) {
			case "custom":
				age = byId("gardenSeedAgeCustomIn").parsedValue;
				break;
			case "mature":
				age = plant.mature + 1;
				break;
			case "bloom":
				age = Math.ceil(plant.mature * 0.666);
				break;
			case "sprout":
				age = Math.ceil(plant.mature * 0.333);
				break;
			case "bud":
				age = 0;
		}
	}
	return age;
};

M.setPlotTile = function (x, y, id, age, keepSelection) {
	if (typeof id === "undefined") { id = this.seedSelected; }
	var plant = this.plantsById[id];
	if (plant) {
		id = plant.id;
		if (typeof age === "undefined") {
			age = this.getNewSeedAge(plant);
		}
	} else {
		id = -1;
		age = 0;
	}
	age = Math.max(age, 0);
	if (plant && plant.immortal) {
		age = Math.min(plant.mature + 1, age);
	}

	var changed = false;

	if (this.plot[y] && this.plot[y][x]) {
		changed = this.plot[y][x][0] !== id + 1 || this.plot[y][x][1] !== age;

		this.plot[y][x] = [id + 1, age];
		this.updatePlotTile(x, y);
		if (!keepSelection && this.plotTileSelected && this.plotTileSelected[0] == x && this.plotTileSelected[1] == y) {
			this.selectPlotTile(null);
		}
	}

	return changed;
};

M.updatePlotTile = function (x, y) {
	if (this.plot[y] && this.plot[y][x]) {
		var plot = this.plot[y][x];
		var id = plot[0] - 1;
		var plant = this.plantsById[id];
		var age = plot[1];
		var css = iconCssReset;
		var dying = false;
		if (plant) {
			var stage = 0;
			if (age >= plant.mature) { stage = 4; }
			else if (age >= plant.mature * 0.666) { stage = 3; }
			else if (age >= plant.mature * 0.333) { stage = 2; }
			else { stage = 1; }
			dying = age + Math.ceil(plant.ageTick + plant.ageTickR) >= 100;
			css = plant.iconCss[stage];
		}

		$("#gardenTileIcon-" + x + "-" + y).toggleClass("hidden", id < 0).toggleClass("dying", dying).css(css);
	}
};

//TODO maybe I should give up the ghost and update all the tiles in updateFunc?
M.updateAllPlotTiles = function () {
	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			this.updatePlotTile(x, y);
		}
	}
};

M.plotTileSelected = null;

M.selectPlotTile = function (x, y, toggle) {
	this.plotTileSelected = null;
	var visible = false;

	var tile = this.plot[y] ? this.plot[y][x] : null;

	if (tile && tile[0] > 0) {
		var $icon = $("#gardenTileIcon-" + x + "-" + y).toggleClass("on", toggle);
		$("#gardenPlot .gardenTileIcon.on").not($icon).removeClass("on");

		if ($icon.hasClass("on")) {
			this.plotTileSelected = [x, y];
			visible = true;
			byId("gardenSelPlotName").textContent = this.plantsById[tile[0] - 1].name;
			Game.setInput("#gardenSelPlotAgeIn", tile[1]);
		}
	} else {
		$("#gardenPlot .gardenTileIcon.on").removeClass("on");
	}

	$("#gardenDeselectPlot, #gardenSelPlotBlock").toggleClass("invisible", !visible);
};

M.tileTooltip = function (x, y) {
	var str = "";
	var boostStr = ((M.plotBoost[y][x][0] != 1 ? "<br><small>" + loc("Aging multiplier:") + " " + Game.Beautify(M.plotBoost[y][x][0] * 100) + "%</small>" : "") +
		(M.plotBoost[y][x][1] != 1 ? "<br><small>" + loc("Effect multiplier:") + " " + Game.Beautify(M.plotBoost[y][x][1] * 100) + "%</small>" : "") +
		(M.plotBoost[y][x][2] != 1 ? "<br><small>" + loc("Weeds/fungus repellent:") + " " + Game.Beautify(100 - M.plotBoost[y][x][2] * 100) + "%</small>" : ""));

	var tile = M.plot[y][x];
	if (tile[0] == 0) {
		// var plant = M.plantsById[M.seedSelected];
		str = '<div class="alignCenter" style="padding:8px 4px;min-width:350px;">' +
			'<div class="name">' + loc("Empty tile") + "</div>" + '<div class="line"></div><div class="description">' +
				loc("This tile of soil is empty.<br>Pick a seed and plant something!") +
				// (plant ? '<div class="line"></div>Click to plant <b>' + plant.name + '</b> for <span class="price' + (M.canPlant(plant) ? "" : " disabled") + '">' + Game.BeautifyAbbr(Math.round(M.getCost(plant))) + "</span>.<br><small>(Shift-click to plant multiple.)</small>" : "") +
				boostStr +
			"</div>" +
		"</div>";

	} else {
		var plant = M.plantsById[tile[0] - 1];
		var stage = 0;
		if (tile[1] >= plant.mature) { stage = 4; }
		else if (tile[1] >= plant.mature * 0.666) { stage = 3; }
		else if (tile[1] >= plant.mature * 0.333) { stage = 2; }
		else { stage = 1; }

		var dragonBoost = 1 / (1 + 0.05 * Game.auraMult("Supreme Intellect"));
		str = '<div class="minigameTooltip">' +
			'<div class="icon" style="background:url(img/gardenPlants.png);float:left;margin-left:-8px;margin-top:-8px;' + plant.iconCssStr[stage] + '"></div>' +
			'<div class="name">' + plant.name + "</div><div><small>" + loc("This plant is growing here.") + "</small></div>" +
			'<div class="line"></div>' +
			'<div class="alignCenter">' +
				'<div class="gardenGrowthLine" style="background:linear-gradient(to right, #ffffff 0%, #00ff99 ' + plant.mature + "%, #33cc00 " + (plant.mature + 0.1) + '%, #996600 100%)">' +
					'<div class="gardenGrowthIndicator" style="left:' + Math.floor((tile[1] / 100) * 256) + 'px;"></div>' +
					'<div class="gardenGrowthIcon" style="' + plant.iconCssStr[1] + "left:" + (0 - 24) + 'px;"></div>' +
					'<div class="gardenGrowthIcon" style="' + plant.iconCssStr[2] + "left:" + ((((plant.mature * 0.333) / 100) * 256) - 24) + 'px;"></div>' +
					'<div class="gardenGrowthIcon" style="' + plant.iconCssStr[3] + "left:" + ((((plant.mature * 0.666) / 100) * 256) - 24) + 'px;"></div>' +
					'<div class="gardenGrowthIcon" style="' + plant.iconCssStr[4] + "left:" + ((((plant.mature) / 100) * 256) - 24) + 'px;"></div>' +
				"</div><br>" +
				"<b>" + loc("Stage:") + "</b> " + loc(["bud", "sprout", "bloom", "mature"][stage - 1]) + "<br>" +
				"<small>" + (stage == 1 ? loc("Plant effects:") + " 10%" : stage == 2 ? loc("Plant effects:") + " 25%" : stage == 3 ? loc("Plant effects:") + " 50%" : loc("Plant effects:") + " 100%; " + loc("may reproduce, will drop seed when harvested")) + "</small>" +
				"<br><small>";

		if (stage < 4) {
			str += (loc("Mature in about %1", Game.sayTime(((100 / (M.plotBoost[y][x][0] * (plant.ageTick + plant.ageTickR / 2))) * ((plant.mature - tile[1]) / 100) * dragonBoost * M.stepT) * 30, -1)) +
				" (" + loc("%1 tick", Game.LBeautify(Math.ceil((100 / (M.plotBoost[y][x][0] * (plant.ageTick + plant.ageTickR / 2) / dragonBoost)) * ((plant.mature - tile[1]) / 100)))) + ")");
		} else if (plant.immortal) {
			str += loc("Does not decay");
		} else {
			str += (loc("Decays in about %1", Game.sayTime(((100 / (M.plotBoost[y][x][0] * (plant.ageTick + plant.ageTickR / 2))) * ((100 - tile[1]) / 100) * dragonBoost * M.stepT) * 30, -1)) +
				" (" + loc("%1 tick", Game.LBeautify(Math.ceil((100 / (M.plotBoost[y][x][0] * (plant.ageTick + plant.ageTickR / 2) / dragonBoost)) * ((100 - tile[1]) / 100)))) + ")");
		}
		str += "</small>" +
				boostStr +
			"</div>" +
			// '<div class="line"></div>' +
			// '<div class="alignCenter">' + (stage == 4 ? loc("Click to harvest.") : loc("Click to unearth.")) + ".</div>" +
			'<div class="line"></div>' +
			M.getPlantDesc(plant) +
		"</div>";
	}

	return str;
};

M.computeBoostPlot = function () {
	//some plants apply effects to surrounding tiles
	//this function computes those effects by creating a grid in which those effects stack
	for (var y = 0; y < 6; y++) {
		for (var x = 0; x < 6; x++) {
			//age mult, power mult, weed mult
			M.plotBoost[y][x] = [1, 1, 1];
		}
	}

	var effectOn = function (X, Y, s, mult) {
		for (var y = Math.max(0, Y - s); y < Math.min(6, Y + s + 1); y++) {
			for (var x = Math.max(0, X - s); x < Math.min(6, X + s + 1); x++) {
				if (X != x || Y != y) {
					for (var i = 0; i < mult.length; i++) {
						M.plotBoost[y][x][i] *= mult[i];
					}
				}
			}
		}
	};

	for (y = 0; y < 6; y++) {
		for (x = 0; x < 6; x++) {
			var tile = M.tiles[y][x];
			if (tile[0] > 0) {
				var plant = M.plantsById[tile[0] - 1];
				var name = plant.key;
				var stage = 0;
				if (tile[1] >= plant.mature) { stage = 4; }
				else if (tile[1] >= plant.mature * 0.666) { stage = 3; }
				else if (tile[1] >= plant.mature * 0.333) { stage = 2; }
				else { stage = 1; }

				var soilMult = M.soilsById[M.soil].effMult;
				var mult = soilMult;

				if (stage == 1) { mult *= 0.1; }
				else if (stage == 2) { mult *= 0.25; }
				else if (stage == 3) { mult *= 0.5; }
				else { mult *= 1; }

				var ageMult = 1;
				var powerMult = 1;
				var weedMult = 1;
				var range = 0;

				if (name == "elderwort") { ageMult = 1.03; range = 1; }
				else if (name == "queenbeetLump") { powerMult = 0.8; range = 1; }
				else if (name == "nursetulip") { powerMult = 1.2; range = 1; }
				else if (name == "shriekbulb") { powerMult = 0.95; range = 1; }
				else if (name == "tidygrass") { weedMult = 0; range = 2; }
				else if (name == "everdaisy") { weedMult = 0; range = 1; }
				else if (name == "ichorpuff") { ageMult = 0.5; powerMult = 0.5; range = 1; }

				//by god i hope these are right
				if (ageMult >= 1) { ageMult = (ageMult - 1) * mult + 1; }
				else if (mult >= 1) { ageMult = 1 / ((1 / ageMult) * mult); }
				else { ageMult = 1 - (1 - ageMult) * mult; }

				if (powerMult >= 1) { powerMult = (powerMult - 1) * mult + 1; }
				else if (mult >= 1) { powerMult = 1 / ((1 / powerMult) * mult); }
				else { powerMult = 1 - (1 - powerMult) * mult; }

				if (range > 0) { effectOn(x, y, range, [ageMult, powerMult, weedMult]); }
			}
		}
	}
};

M.effsData = {
	cps: {n: "CpS"},
	click: {n: "cookies/click"},
	cursorCps: {n: "cursor CpS"},
	grandmaCps: {n: "grandma CpS"},
	goldenCookieGain: {n: "golden cookie gains"},
	goldenCookieFreq: {n: "golden cookie frequency"},
	goldenCookieDur: {n: "golden cookie duration"},
	goldenCookieEffDur: {n: "golden cookie effect duration"},
	wrathCookieGain: {n: "wrath cookie gains"},
	wrathCookieFreq: {n: "wrath cookie frequency"},
	wrathCookieDur: {n: "wrath cookie duration"},
	wrathCookieEffDur: {n: "wrath cookie effect duration"},
	reindeerGain: {n: "reindeer gains"},
	reindeerFreq: {n: "reindeer frequency"},
	reindeerDur: {n: "reindeer duration"},
	itemDrops: {n: "random drops"},
	milk: {n: "milk effects"},
	wrinklerSpawn: {n: "wrinkler spawn rate"},
	wrinklerEat: {n: "wrinkler appetite"},
	upgradeCost: {n: "upgrade costs", rev: true},
	buildingCost: {n: "building costs", rev: true}
};

for (i in M.effsData) {
	M.effsData[i].n = loc(M.effsData[i].n);
}

M.computeEffs = function () {
	var effs = {};
	for (var n in this.effsData) {
		effs[n] = 1;
	}

	if (!this.freeze) {
		var soilMult = this.soilsById[this.soil].effMult;

		for (var y = 0; y < 6; y++) {
			for (var x = 0; x < 6; x++) {
				var tile = this.tiles[y][x];
				if (tile[0] > 0) {
					var me = this.plantsById[tile[0] - 1];
					var name = me.key;
					var stage = 0;
					if (tile[1] >= me.mature) { stage = 4; }
					else if (tile[1] >= me.mature * 0.666) { stage = 3; }
					else if (tile[1] >= me.mature * 0.333) { stage = 2; }
					else { stage = 1; }

					var mult = soilMult;

					if (stage == 1) { mult *= 0.1; }
					else if (stage == 2) { mult *= 0.25; }
					else if (stage == 3) { mult *= 0.5; }
					else { mult *= 1; }

					mult *= this.plotBoost[y][x][1];

					if (name == "bakerWheat") { effs.cps += 0.01 * mult; }
					else if (name == "thumbcorn") { effs.click += 0.02 * mult; }
					else if (name == "cronerice") { effs.grandmaCps += 0.03 * mult; }
					else if (name == "gildmillet") { effs.goldenCookieGain += 0.01 * mult; effs.goldenCookieEffDur += 0.001 * mult; }
					else if (name == "clover") { effs.goldenCookieFreq += 0.01 * mult; }
					else if (name == "goldenClover") { effs.goldenCookieFreq += 0.03 * mult; }
					else if (name == "shimmerlily") { effs.goldenCookieGain += 0.01 * mult; effs.goldenCookieFreq += 0.01 * mult; effs.itemDrops += 0.01 * mult; }
					else if (name == "elderwort") { effs.wrathCookieGain += 0.01 * mult; effs.wrathCookieFreq += 0.01 * mult; effs.grandmaCps += 0.01 * mult; }
					else if (name == "bakeberry") { effs.cps += 0.01 * mult; }
					else if (name == "chocoroot") { effs.cps += 0.01 * mult; }
					else if (name == "whiteChocoroot") { effs.goldenCookieGain += 0.01 * mult; }

					else if (name == "whiteMildew") { effs.cps += 0.01 * mult; }
					else if (name == "brownMold") { effs.cps *= 1 - 0.01 * mult; }

					// else if (name == "meddleweed") {}

					else if (name == "whiskerbloom") { effs.milk += 0.002 * mult; }
					else if (name == "chimerose") { effs.reindeerGain += 0.01 * mult; effs.reindeerFreq += 0.01 * mult; }

					else if (name == "nursetulip") { effs.cps *= 1 - 0.02 * mult; }
					else if (name == "drowsyfern") { effs.cps += 0.03 * mult; effs.click *= 1 - 0.05 * mult; effs.goldenCookieFreq *= 1 - 0.1 * mult; }
					else if (name == "wardlichen") { effs.wrinklerSpawn *= 1 - 0.15 * mult; effs.wrathCookieFreq *= 1 - 0.02 * mult; }
					else if (name == "keenmoss") { effs.itemDrops += 0.03 * mult; }
					else if (name == "queenbeet") { effs.goldenCookieEffDur += 0.003 * mult; effs.cps *= 1 - 0.02 * mult; }
					else if (name == "queenbeetLump") { effs.cps *= 1 - 0.1 * mult; }
					else if (name == "glovemorel") { effs.click += 0.04 * mult; effs.cursorCps += 0.01 * mult; effs.cps *= 1 - 0.01 * mult; }
					else if (name == "cheapcap") { effs.upgradeCost *= 1 - 0.002 * mult; effs.buildingCost *= 1 - 0.002 * mult; }
					else if (name == "foolBolete") { effs.goldenCookieFreq += 0.02 * mult; effs.goldenCookieGain *= 1 - 0.05 * mult; effs.goldenCookieDur *= 1 - 0.02 * mult; effs.goldenCookieEffDur *= 1 - 0.02 * mult; }
					else if (name == "wrinklegill") { effs.wrinklerSpawn += 0.02 * mult; effs.wrinklerEat += 0.01 * mult; }
					else if (name == "greenRot") { effs.goldenCookieDur += 0.005 * mult; effs.goldenCookieFreq += 0.01 * mult; effs.itemDrops += 0.01 * mult; }
					else if (name == "shriekbulb") { effs.cps *= 1 - 0.02 * mult; }
				}
			}
		}
	}

	this.effs = effs;
};

$("#gardenInfoToolIcon").css(Game.getIconCss([3, 35]));
$("#gardenFreezeToolIcon").css(Game.getIconCss([1, 35]));
byId("gardenFreezeTool").setTitleFunc = function () {
	this.dataset.title = ('<div class="alignCenter">' +
		loc("Cryogenically preserve your garden.<br>Plants no longer grow, spread or die; they provide no benefits.<br>" +
			"Soil cannot be changed.<div class=\"line\"></div>Using this will effectively pause your garden.") + "</div>");
};

byId("gardenInfoTool").setTitleFunc = function () {
	var M = Game.garden;
	var str = "";

	if (M.freeze) {
		str = loc("Your garden is frozen, providing no effects.");
	} else {
		var effStr = "";
		for (var i in M.effsData) {
			if (M.effs[i] != 1 && M.effsData[i]) {
				var amount = (M.effs[i] - 1) * 100;
				effStr += '<div style="font-size:10px"><b>&bull; ' + M.effsData[i].n + '</b> <span class="' + ((amount * (M.effsData[i].rev ? -1 : 1)) > 0 ? "green" : "red") +
					'">' + (amount > 0 ? "+" : "-") + Game.Beautify(Math.abs(M.effs[i] - 1) * 100, 2) + "%</span></div>";
			}
		}
		if (effStr == "") { effStr = '<div style="font-size:10px;"><b>' + loc("None.") + "</b></div>"; }
		str += "<div>" + loc("Combined effects of all your plants:") + "</div>" + effStr;
	}

	// str += '<div class="line"></div>' +
	// 	'<small style="line-height:100%;">' + (EN ?
	// 		"&bull; You can cross-breed plants by planting them close to each other; new plants will grow in the empty tiles next to them.<br>&bull; Unlock new seeds by harvesting mature plants.<br>&bull; When you ascend, your garden plants are reset, but you keep all the seeds you\'ve unlocked.<br>&bull; Your garden has no effect and does not grow while the game is closed." :
	// 		loc("-You can cross-breed plants by planting them close to each other; new plants will grow in the empty tiles next to them.<br>-Unlock new seeds by harvesting mature plants.<br>-When you ascend, your garden plants are reset, but you keep all the seeds you've unlocked.<br>-Your garden has no effect and does not grow while the game is closed.")) + "</small>";

	// this.dataset.title = '<div class="alignCenter">' + str + "</div>";
	this.dataset.title = str;
};

M.resetPlot = function (force) {
	this.selectPlotTile(null);

	for (var y = 0; y < 6; y++) {
		for (var x = 0; x < 6; x++) {
			if (force || this.isTileUnlocked(x, y)) {
				this.setPlotTile(x, y, -1, 0);
			}
		}
	}
};

M.randomizePlot = function () {
	for (var y = 0; y < 6; y++) {
		for (var x = 0; x < 6; x++) {
			var id = Math.floor(Math.random() * (this.numPlants + 1));
			var age = 0;
			if (id > 0) {
				age = Math.floor(Math.random() * 100);
			}
			this.setPlotTile(x, y, id, age);
		}
	}

	Game.scheduleUpdate();
};

M.reset = function () {
	for (var name in this.plants) {
		this.plants[name].unlocked = Boolean(plant.defaultUnlocked);
	}

	this.toggleSoil(0);

	Game.setInput(this.nextStepIn, Game.lastUpdateTime);
	Game.setInput(this.nextSoilIn, Game.lastUpdateTime);
	this.nextFreeze = Game.lastUpdateTime;

	Game.setInput(this.harvestsIn, 0);
	Game.setInput(this.harvestsTotalIn, 0);
	Game.setInput(this.convertTimesIn, 0);

	this.toggleFreeze(false);
	byId("gardenOpenCheck").checked = false;

	this.resetPlot(true);
};

M.save = function () {
	var str = "" +
		parseFloat(this.nextStep) + ":" +
		Math.floor(this.soil) + ":" +
		parseFloat(this.nextSoil) + ":" +
		asBoolNum(this.freeze) + ":" +
		Math.floor(this.harvests) + ":" +
		Math.floor(this.harvestsTotal) + ":" +
		asBoolNum(byId("gardenOpenCheck").checked) + ":" +
		parseFloat(this.convertTimes) + ":" +
		parseFloat(this.nextFreeze) + ":" +
		" ";

	for (var i = 0; i < this.numPlants; i++) {
		str += "" + asBoolNum(this.plantsById[i].unlocked);
	}
	str += " ";
	for (var y = 0; y < 6; y++) {
		for (var x = 0; x < 6; x++) {
			var tile = this.tiles[y][x];
			str += Math.floor(tile[0]) + ":" + Math.floor(tile[1]) + ":";
		}
	}

	return str;
};

M.load = function (str) {
	if (!str) { return false; }

	var i = 0;
	var spl = str.split(" ");
	var i2 = 0;
	var spl2 = spl[i++].split(":");
	Game.setInput(this.nextStepIn, parseFloat(spl2[i2++] || this.nextStep));
	this.toggleSoil(parseInt(spl2[i2++], 10));
	Game.setInput(this.nextSoilIn, parseFloat(spl2[i2++] || this.nextSoil));
	this.toggleFreeze(parseInt(spl2[i2++], 10));
	Game.setInput(this.harvestsIn, parseInt(spl2[i2++] || 0, 10));
	Game.setInput(this.harvestsTotalIn, parseInt(spl2[i2++] || 0, 10));
	byId("gardenOpenCheck").checked = parseInt(spl2[i2++], 10);
	Game.setInput(this.convertTimesIn, parseInt(spl2[i2++] || 0, 10));
	this.nextFreeze = parseFloat(spl2[i2++] || this.nextFreeze);

	var seeds = spl[i++] || "";
	if (seeds) {
		for (var n = 0; n < this.numPlants; n++) {
			var plant = this.plantsById[n];
			plant.unlocked = plant.defaultUnlocked || parseBoolean(seeds[n]);
		}
	}

	var plot = spl[i++] || 0;
	if (plot) {
		plot = plot.split(":");
		n = 0;
		for (var y = 0; y < 6; y++) {
			for (var x = 0; x < 6; x++) {
				this.setPlotTile(x, y, parseInt(plot[n], 10) - 1, parseInt(plot[n + 1], 10));
				n += 2;
			}
		}
	}
};

M.updateFunc = function () {
	var plants = 0;
	for (var y = 0; y < 6; y++) {
		for (var x = 0; x < 6; x++) {
			var unlocked = this.isTileUnlocked(x, y);
			$("#gardenTile-" + x + "-" + y).toggleClass("hidden", !unlocked);

			var tile = [0, 0];
			if (unlocked) {
				var plot = this.plot[y][x];
				tile = [plot[0], plot[1]];
			}
			this.tiles[y][x] = tile;
			if (tile[0] > 0) {
				plants++;
			}
		}
	}
	this.numPlanted = plants;

	this.computeMatures();
	this.computeBoostPlot();
	this.computeEffs();

	var n = 0;
	for (var i = 0; i < this.numPlants; i++) {
		var plant = this.plantsById[i];
		if (plant.defaultUnlocked) {
			this.toggleSeed(plant, true);
		}
		if (plant.unlocked) {
			n++;
		}
	}
	this.numPlantsUnlocked = n;

	this.harvestsTotal = Math.max(this.harvests, this.harvestsTotal);

	$("#gardenNumSeeds").text("(" + this.numPlantsUnlocked + " / " + this.numPlants + ")");
	$("#gardenLockAllSeeds").toggleClass("hidden", this.numPlantsUnlocked <= 1);
	$("#gardenUnlockAllSeeds").toggleClass("hidden", this.numPlantsUnlocked >= this.numPlants);

	var resetSoil = this.soil;

	var farms = this.parent.amount;
	for (i = 0; i < this.soilsById.length; i++) {
		var soil = this.soilsById[i];
		var locked = farms < soil.req;
		if (this.resetLockedSoil && i > 0 && this.soil == soil.id && locked) {
			resetSoil = 0;
		}
		soil.$soilBlock.toggleClass("locked", locked);
	}

	if (resetSoil !== this.soil) {
		this.toggleSoil(0);
	}

	this.computeStepT();

	if (this.plotTileSelected && !this.isTileUnlocked(this.plotTileSelected[0], this.plotTileSelected[1])) {
		this.selectPlotTile(null);
	}
};

$("#gardenFreezeTool").on("click", function () {
	Game.garden.toggleFreeze();
	Game.scheduleUpdate();
});

$("#gardenSeedBlock").on("click", ".gardenSeed", function (ev) {
	var lock = Game.lockChecked ^ Game.checkEventAltMode(ev);
	var plant = Game.garden.plantsById[this.dataset.plantId];
	if (plant) {
		if (lock) {
			Game.garden.toggleSeed(plant);
		} else {
			Game.garden.selectSeed(plant);
		}

		Game.scheduleUpdate();
	}

}).on("mouseenter", ".gardenSeed", function (ev) {
	var M = Game.garden;
	var plant = M.plantsById[this.dataset.plantId];
	if (plant) {
		Game.setTooltip({
			html: '<div class="gardenSeedTooltip">' +
				'<div class="icon gardenLineIcon" style="margin-left:-24px;margin-top:-4px;' + plant.iconCssStr[0] + '"></div>' +
				'<div class="icon gardenLineIcon" style="margin-left:-24px;margin-top:-28px;' + plant.iconCssStr[4] + '"></div>' +
				'<div class="turnInto"></div>' +
				(plant.plantable ? ('<div class="gardenSeedTooltipCost"><small>' + loc("Planting cost:") + "</small><br>" +
					'<span class="priceIcon">' + Game.BeautifyAbbr(Math.round(Game.shortenNumber(M.getCost(plant)))) + "</span><br>" +
					"<small>" + loc("%1 of CpS,<br>minimum %2", [Game.sayTime(plant.cost * 60 * 30, -1), loc("%1 cookie", Game.LBeautify(plant.costM))]) + "</small></div>") : "") +
					'<div style="width:300px;"><div class="name">' + plant.name + " seed</div><div><small>" +
						(plant.plantable ? loc("Click to select this seed for planting.") : '<span class="red">' + loc("This seed cannot be planted.") + "</span>") +
						"<!--<br>" + loc("%1 to harvest all mature plants of this type.", loc("Shift") + "+" + loc("Ctrl") + "+" + loc("Click")) + "--></small></div></div>" +
					'<div class="line"></div>' +
					M.getPlantDesc(plant) +
				"</div>",
			refEle: this
		});
	}

	ev.stopPropagation();
});

$("#gardenLockAllSeeds").on("click", function () {
	var M = Game.garden;
	for (var i = 0; i < M.numPlants; i++) {
		M.toggleSeed(M.plantsById[i], false);
	}
	Game.scheduleUpdate();
});

$("#gardenUnlockAllSeeds").on("click", function () {
	var M = Game.garden;
	for (var i = 0; i < M.numPlants; i++) {
		M.toggleSeed(M.plantsById[i], true);
	}
	Game.scheduleUpdate();
});

$("#gardenDeselectSeed").on("click", function () {
	Game.garden.selectSeed(null);
});

$("#gardenSoilBlock").on("mouseenter", ".gardenSoil", function (ev) {
	var M = Game.garden;

	var soil = M.soilsById[this.dataset.soilId];
	if (soil) {
		var now = Date.now();
		var str = '<div class="minigameTooltip">' +
			'<div class="icon gardenLineIcon" style="margin-left:-8px;margin-top:-8px;' + soil.iconCssStr + '"></div>' +
			'<div><div class="name">' + soil.name + "</div><div>";
		if (M.parent.amount < soil.req) {
			str += "<div>Soil unlocked at " + soil.req + " farms.</div>";
		}
		str += "<small>" +
				((M.soil == soil.id) ? "Your field is currently using this soil." : M.getNextSoilText(now) || "Click to use this type of soil for your whole field.") +
			"</small></div></div>" +
			'<div class="line"></div>' +
			'<div class="description">' +
				'<div class="gardenDescMargin"><b>Effects :</b></div>' +
				'<div class="gardenDescFont bold">' + soil.effsStr + "</div>" +
				(soil.q ? ("<q>" + soil.q + "</q>") : "") +
			"</div>";

		Game.setTooltip({
			html: str,
			refEle: this
		});

	}

	ev.stopPropagation();

}).on("click", ".gardenSoil", function () {
	var soil = Game.garden.soilsById[this.dataset.soilId];
	if (soil && Game.garden.soil !== soil.id && (!Game.garden.resetLockedSoil || Game.garden.parent.amount >= soil.req)) {
		Game.garden.toggleSoil(soil.id);
		Game.scheduleUpdate();
	}
});

var gardenPlantMousedown = false;

$("#gardenBlock").on("click", '[name="gardenSeedAge"]', function () {
	Game.garden.toggleGardenFillBtn();
	if (this.id !== "gardenSeedAgeSelect") {
		Game.garden.selectPlotTile(null);
	}

}).on("mousedown", ".gardenTile", function (ev) {
	var M = Game.garden;

	var spl = this.id.split("-");
	var x = spl[1];
	var y = spl[2];
	gardenPlantMousedown = false;

	var changed = false;
	var age = M.getNewSeedAge(M.plantsById[M.seedSelected]);
	if (age > -1) {
		changed = M.setPlotTile(x, y, M.seedSelected, age);
		gardenPlantMousedown = true;
	} else if (byId("gardenSeedAgeRemove").checked) {
		changed = M.setPlotTile(x, y, -1, 0);
		gardenPlantMousedown = true;
	}

	if (changed) {
		Game.setTooltip({
			html: M.tileTooltip(x, y),
			refEle: this
		});
		Game.scheduleUpdate(200);
	}

	ev.preventDefault();

}).on("mouseenter", ".gardenTile", function (ev) {
	var M = Game.garden;

	var spl = this.id.split("-");
	var x = spl[1];
	var y = spl[2];

	var changed = false;

	if (gardenPlantMousedown) {
		var age = M.getNewSeedAge(M.plantsById[M.seedSelected]);
		if (age > -1) {
			changed = M.setPlotTile(x, y, M.seedSelected, age);
		} else if (byId("gardenSeedAgeRemove").checked) {
			changed = M.setPlotTile(x, y, -1, 0);
		}
	}

	if (changed) {
		Game.scheduleUpdate(200);
	}

	Game.setTooltip({
		html: M.tileTooltip(x, y),
		refEle: this
	});

	ev.preventDefault();

}).on("click", ".gardenTile", function (ev) {
	if (byId("gardenSeedAgeSelect").checked) {
		var spl = this.id.split("-");
		var x = spl[1];
		var y = spl[2];
		Game.garden.selectPlotTile(x, y);
		Game.scheduleUpdate();
	}

	ev.preventDefault();
});

$(window).on("focusout mouseup focusin", function () {
	gardenPlantMousedown = false;
});

$("#gardenNextStepSet").on("click", function () {
	Game.setInput(Game.garden.nextStepIn, Date.now() + Game.garden.stepT * 1000);
	Game.scheduleUpdate();
});

$("#gardenNextSoilSet").on("click", function () {
	Game.setInput(Game.garden.nextSoilIn, Date.now() + (Game.HasUpgrade("Turbo-charged soil") ? 1 : (1000 * 60 * 10)));
	Game.scheduleUpdate();
});

$("#gardenClearAllPlots").on("click", function () {
	Game.garden.resetPlot();
	Game.scheduleUpdate();
});

$("#gardenFillAllPlots").on("click", function () {
	var M = Game.garden;
	var age = M.getNewSeedAge(M.plantsById[M.seedSelected]);
	if (age > -1) {
		for (var y = 0; y < 6; y++) {
			for (var x = 0; x < 6; x++) {
				if (M.isTileUnlocked(x, y)) {
					M.setPlotTile(x, y, Game.seedSelected, age);
				}
			}
		}
	}

	Game.scheduleUpdate();
});

$("#gardenDeselectPlot").on("click", function () {
	Game.garden.selectPlotTile(null);
});

$("#gardenSelPlotSetAge").on("click", function () {
	var M = Game.garden;
	var selPlot = M.plotTileSelected;
	if (selPlot) {
		var x = selPlot[0];
		var y = selPlot[1];
		var tile = M.plot[y] ? M.plot[y][x] : null;
		if (tile) {
			M.setPlotTile(x, y, tile[0] - 1, byId("gardenSelPlotAgeIn").parsedValue, true);
		}
	}
});

Game.clearGardenSelection = function () {
	Game.garden.selectSeed(null);
	Game.garden.selectPlotTile(null);
};
byId("tabGarden").onTabFunc = Game.clearGardenSelection;

M.selectSeed(null);

})();
//#endregion Garden


//#region Stonks
(function () {

var M = Game.market;
M.parent = Game.Objects["Bank"];
M.parent.minigame = M;
M.$disabledBlock = $("#marketDisabledBlock");

M.profit = 0;
M.profitIn = byId("marketProfit");
M.profitIn.minIn = -Number.MAX_VALUE;

var modeSelHTML = "";
for (var i = 0; i < 6; i++) {
	modeSelHTML += "<option>" + i + "</option>";
}

M.goods = {
	"Farm": {
		name: "Cereals",
		symbol: "CRL",
		company: "Old Mills",
		desc: "<b>Old Mills</b> is a trusted staple of the grain industry. Finding their roots in humble pioneer farms centuries ago and honing their know-how ever since, the Old Mills organic crops have reached a standard of quality that even yours struggle to equal."
	},
	"Mine": {
		name: "Chocolate",
		symbol: "CHC",
		company: "Cocoa Excavations",
		desc: "<b>Cocoa Excavations</b> is an international chocolate mining venture whose extraction sites always seem, somehow, to pop up in war-torn countries. Their high-grade chocolate is renowned the world over and has even been marketed, to some success, as suitable gems for engagement rings."
	},
	"Factory": {
		name: "Butter",
		symbol: "BTR",
		company: "Bovine Industries",
		desc: '<b>Bovine Industries</b> is a formerly-agricultural conglomerate that now deals in mechanized dairy mass production. Whistleblowers have drawn attention to the way the milk cows employed by this company are treated, describing it as "not quite cruel or anything, but definitely unusual".'
	},
	"Bank": {
		name: "Sugar",
		symbol: "SUG",
		company: "Candy Trust",
		desc: "The <b>Candy Trust</b> is a corporate banking group backed by, and specialized in, the trade of high-grade sugar. The origin of said sugar is legally protected by an armada of lawyers, though some suspect they secretly scrape it off of the bank bills coming in before processing it."
	},
	"Temple": {
		name: "Nuts",
		symbol: "NUT",
		company: "Hazel Monastery",
		desc: "Hidden between hills and fog somewhere, the secretive <b>Hazel Monastery</b> has, for centuries, maintained nut crops of the highest quality. The monastery nuts are carefully tended to, harvested and shelled by its monks, who are all required to take a vow of nut allergy as a lifelong test of piety."
	},
	"Wizard tower": {
		name: "Salt",
		symbol: "SLT",
		company: "Wacky Reagants",
		desc: "Salt is a versatile substance, with properties both mundane and mystical. This is why the bearded crackpots at <b>Wacky Reagants</b> have perfected the art of turning magic powder into salt, which is then sold to anyone promising to put it to good use - whether it be warding off banshees and ghouls or seasoning a Sunday roast."
	},
	"Shipment": {
		name: "Vanilla",
		symbol: "VNL",
		company: "Cosmic Exports",
		desc: "After the news broke of vanilla not being native to Earth, <b>Cosmic Exports</b> was the first company to discover its true origin planet - and has struck an exclusive deal with its tentacled inhabitants to ship its valuable, unadulterated beans all over the local quadrant."
	},
	"Alchemy lab": {
		name: "Eggs",
		symbol: "EGG",
		company: "Organic Gnostics",
		desc: "At <b>Organic Gnostics</b>, an egg is seen as a promise. A promise of life and nourishment, of infinite potential, of calcium and protein. An egg can become many things... especially when you're properly funded and don't believe there's room in science for rules or ethics."
	},
	"Portal": {
		name: "Cinnamon",
		symbol: "CNM",
		company: "Dimensional Exchange",
		desc: "The <b>Dimensional Exchange</b> employs a vast team of ragtag daredevils to dive into dangerous underworlds in search of strange native spices. Chief among those is cinnamon, a powder so delicious its true nature can only be unspeakably abominable."
	},
	"Time machine": {
		name: "Cream",
		symbol: "CRM",
		company: "Precision Aging",
		desc: "Once specialized in cosmetics for the elderly, the eggheads at <b>Precision Aging</b> have repurposed their timeshift technology and developed a process allowing them to accelerate, slow down, and even reverse the various phase changes of milk. Their flagship offering, whole cream, is said to be within 0.002% of theoretical ripening optimums."
	},
	"Antimatter condenser": {
		name: "Jam",
		symbol: "JAM",
		company: "Pectin Research",
		desc: "<b>Pectin Research</b> is a military-backed laboratory initially created with the aim of enhancing and miniaturizing army rations, but now open for public bulk trading. It has recently made forays in the field of highly-concentrated fruit jams, available in a variety of flavors."
	},
	"Prism": {
		name: "White chocolate",
		symbol: "WCH",
		company: "Dazzle Corp Ltd.",
		desc: "What was once two college kids messing around with mirrors in their dad's garage is now a world-famous megacorporation. <b>Dazzle Corp</b>'s groundbreaking experiments in photonic annealing have led to the creation years ago of a new kind of matter, once derided as impossible by physicists and cooks alike: white chocolate."
	},
	"Chancemaker": {
		name: "Honey",
		symbol: "HNY",
		company: "Prosperity Hive",
		desc: "The folks at <b>Prosperity Hive</b> deal in honey, and it's always worked for them. With a work culture so relaxed you're almost tempted to ditch the cookie business and join them, these people have little in common with the proverbial busy bee - though their rates do sting quite a bit."
	},
	"Fractal engine": {
		name: "Cookies",
		symbol: "CKI",
		company: "Selfmade Bakeries",
		desc: "Interesting. It appears there's still a company out there trying to sell cookies even with your stranglehold on the market. No matter - you figure <b>Selfmade Bakeries</b>' largely inferior product will make decent fodder for the mouse traps in your factories."
	},
	"Javascript console": {
		name: "Recipes",
		symbol: "RCP",
		company: "Figments Associated",
		desc: "In a post-material world, the market of ideas is where value is created. <b>Figments Associated</b> understands that, and is the prime designer (and patenter) of baking recipes, ingredient nomenclature, custom cooking procedures, and other kitchen processes."
	},
	"Idleverse": {
		name: "Subsidiaries",
		symbol: "SBD",
		company: "Polyvalent Acquisitions",
		desc: "Avoid the uncouth nastiness of mass layoffs and hostile takeovers by delegating the purchase, management, and eventual dissolution of other companies to the boys at Polyvalent Acquisitions</b>. Let 'em deal with it!"
	},
	"Cortex baker": {
		name: "Publicists",
		symbol: "PBL",
		company: "Great Minds",
		desc: "Get those juices flowing: from market research to advertising, the think tanks at <b>Great Minds</b> will lend their talents to the highest bidder. It's intellectual property on tap."
	},
	"You": {
		name: "%1",
		symbol: "YOU",
		company: "%1's Bakery",
		desc: "That's right! Your transcendental business skills are so influential, so universally resounding, that you've become a publicly traded good yourself - you're the best <b>%1's Bakery</b> has to offer. Don't disappoint your shareholders, there's a price on your head! Invest in yourself NOW!",
	}
};
M.goodsById = [];

M.randomizeGood = function (good) {
	good.dur = Math.floor(10 + Math.random() * 690);
	good.d = Math.random() * 0.2 - 0.1;
	good.modeSel.selectedIndex = Game.choose([0, 1, 1, 2, 2, 3, 4, 5]);
	Game.setInput(good.dIn, good.d);
	Game.setInput(good.durIn, good.dur);
};

M.goodDelta = function (id, back) { //if back is 0 we get the current step; else get current step -back
	back = back || 0;
	var good = M.goodsById[id];
	var val = 0;
	var vals = [good.val, good.val - good.d];
	if (vals.length >= (2 + back)) {
		val = vals[0 + back] / vals[1 + back] - 1;
	}
	val = Math.floor(val * 10000) / 100;
	return val;
};

M.getGoodMaxStock = function (good) {
	var bonus = 0;
	if (M.officeLevel > 0) { bonus += 25; }
	if (M.officeLevel > 1) { bonus += 50; }
	if (M.officeLevel > 2) { bonus += 75; }
	if (M.officeLevel > 3) { bonus += 100; }
	return Math.ceil(good.building.highest * (M.officeLevel > 4 ? 1.5 : 1) + bonus + good.building.level * 10);
};

M.getRestingVal = function (id) {
	return 10 + 10 * id + (Game.Objects["Bank"].level - 1);
};

var goodTooltip = function () {
	var id = this.dataset.good;
	var good = M.goodsById[id];
	if (!good) {
		return;
	}
	var delta = M.goodDelta(id);
	var name = good.name.replace("%1", Game.bakeryName);
	this.tooltipHTML  = ('<div class="minigameTooltip">' +
		'<div class="icon tooltipIcon" style="' + good.iconCssStr + '"></div>' +
		'<div class="name">' + name + ' <span class="bankFromName">(' + loc("from %1", '<span class="smallcaps">' + good.company.replace("%1", Game.bakeryName) +
		"</span>") + ')</span> <span class="bankSymbol">' + good.symbol + ' <span class="bankSymbolNum' +
			(delta >= 0 ? " bankSymbolUp" : delta < 0 ? " bankSymbolDown" : "") + '">' +
			(delta + "" + (delta == Math.floor(delta) ? ".00" : (delta * 10) == Math.floor(delta * 10) ? "0" : "") + "%") + "</span></span></div>" +
		'<div class="line"></div><div class="description">' +
			(EN ? "<q>" + good.desc.replace("%1", Game.bakeryName) + "</q>" + '<div class="line"></div>' : "") +
			'<div class="line"></div><div class="bankSmallText">&bull; <div class="icon tinyIcon" style="' + good.iconCssStr + '"></div> ' +
				loc("%1: currently worth <b>$%2</b> per unit.", [name, Game.Beautify(good.val, 2)]) +
				"</b> per unit.<br>&bull; " + loc("You currently own %1 (worth <b>$%2</b>).", ['<div class="icon tinyIcon" style="' + good.iconCssStr + '"></div> <b>' +
					Game.BeautifyAbbr(good.stock) + "</b>x " + name, Game.BeautifyAbbr(good.val * good.stock, 2)]) +
				"</b>).<br>&bull; " + loc("Your warehouses can store up to %1.", '<div class="icon tinyIcon" style="' + good.iconCssStr + '"></div> <b>' +
				Game.BeautifyAbbr(M.getGoodMaxStock(good)) + "</b>x " + name) +
				".<br>&bull; " + loc("You may increase your storage space by upgrading your offices and by buying more %1. You also get %2 extra storage space per %3 level (currently: <b>+%4</b>).",
					['<div class="icon tinyIcon" style="' + Game.getIconCssStr([good.building.iconColumn, 0]) + '"></div> ' + good.building.plural, 10, good.building.single, (good.building.level * 10)]) +
				"</b>).<br>&bull; " + loc("The average worth of this stock and how high it can peak depends on the building it is tied to, along with the level of your %1.",
					'<div class="icon tinyIcon" style="' + Game.getIconCssStr([15, 0]) + '"></div> ' + Game.Objects["Bank"].plural) +
		"</div>" +
	"</div>");
};

var n = 0;
for (i in M.goods) {
	var good = M.goods[i];
	good.id = n;
	good.name = loc(FindLocStringByPart("STOCK " + (good.id + 1) + " TYPE"));
	good.company = loc(FindLocStringByPart("STOCK " + (good.id + 1) + " NAME"));
	good.symbol = loc(FindLocStringByPart("STOCK " + (good.id + 1) + " LOGO"));
	good.active = false;
	good.building = Game.Objects[i];
	good.stock = 0;
	good.prev = 0;
	good.val = M.getRestingVal(good.id);
	good.d = 0;
	good.dur = 1;
	// good.vals = [good.val, good.val - good.d];
	M.goodsById[n] = good;
	good.icon = [good.building.iconColumn, 33];
	good.iconCssStr = Game.getIconCssStr(good.icon);
	n++;

	good.$row = $('<tr class="marketGoodRow" data-title>' +
		'<td class="marketGoodName"><div class="icon tinyIcon" style="' + good.iconCssStr + '"></div> <span class="marketGoodNameSpan">' + good.name + "</span> (" + good.symbol + ")</td>" +
		'<td>Value $<input class="marketGoodValue deci bankS" type="text"></td>' +
		'<td>Last bought at $<input class="marketGoodPrev deci bankS" type="text"></td>' +
		'<td>Stock <input class="marketGoodStock"> / <span class="marketGoodStockLimit">0</span>&nbsp;</td>' +
		'<td>Delta <input class="marketGoodD deci bankS" type="text"></td>' +
		'<td>"Mode" <select class="marketGoodMode">' + modeSelHTML + "</select></td>" +
		'<td>"Dur" <input class="marketGoodDur skinnyInput" type="text" maxlength="3"></td>' +
		'<td><label><input class="marketGoodHidden" type="checkbox"> Hidden</label></td>' +
		'<td>Last tick <select class="marketGoodLast"><option selected>---</option><option>Bought</option><option>Sold</option></select></td>' +
		'<td><a class="marketGoodReroll">Randomize</a></td>' +
	"</tr>").appendTo("#marketGoodsList");
	good.$row.find("input, select, .marketGoodReroll").add(good.$row).attr("data-good", good.id);
	good.$nameSpan = good.$row.find(".marketGoodNameSpan");
	good.$row[0].setTitleFunc = goodTooltip.bind(good.$row[0]);

	good.valIn = good.$row.find(".marketGoodValue")[0];
	good.valIn.minIn = 1;
	Game.setInput(good.valIn, good.val);
	good.stockIn = good.$row.find(".marketGoodStock")[0];
	good.prevIn = good.$row.find(".marketGoodPrev")[0];
	good.$maxStockEle = good.$row.find(".marketGoodStockLimit");
	good.modeSel = good.$row.find(".marketGoodMode")[0];
	good.dIn = good.$row.find(".marketGoodD")[0];
	good.dIn.minIn = -Number.MAX_VALUE;
	good.durIn = good.$row.find(".marketGoodDur")[0];
	good.durIn.minIn = 1;
	good.hiddenChk = good.$row.find(".marketGoodHidden")[0];
	good.lastSel = good.$row.find(".marketGoodLast")[0];

	Game.registerInputs(good, [
		[good.valIn, "val"],
		[good.stockIn, "stock"],
		[good.prevIn, "prev"],
		[good.dIn, "d"],
		[good.durIn, "dur"]
	]);

	M.randomizeGood(good);
}

M.offices = [
	{
		name: loc("Credit garage"), icon: [0, 33], cost: [100, 2],
		desc: EN ? "This is your starting office." : loc("This is your office.") + "<br>" + loc("Upgrading will grant you:") + "<br><b><!--&bull; " + loc("+1 opportunity slot") + "<br>-->&bull; " + loc("+%1 warehouse space for all goods", 25) + "</b>"
	}, {
		name: loc("Tiny bank"), icon: [9, 33], cost: [200, 4],
		desc: loc("This is your office.") + "<br>" + loc("Upgrading will grant you:") + "<br><b>&bull; " + loc("+1 loan slot") + "<br>&bull; " + loc("+%1 warehouse space for all goods", 50) + "</b>"
	}, {
		name: loc("Loaning company"), icon: [10, 33], cost: [350, 8],
		desc: loc("This is your office.") + "<br>" + loc("Upgrading will grant you:") + "<br><!--<b>&bull; " + loc("+1 opportunity slot") + "<br>-->&bull; " + loc("+%1 warehouse space for all goods", 75) + "</b>"
	}, {
		name: loc("Finance headquarters"), icon: [11, 33], cost: [500, 10],
		desc: loc("This is your office.") + "<br>" + loc("Upgrading will grant you:") + "<br><b>&bull; " + loc("+1 loan slot") + "<br>&bull; " + loc("+%1 warehouse space for all goods", 100) + "</b>"
	}, {
		name: loc("International exchange"), icon: [12, 33], cost: [700, 12],
		desc: loc("This is your office.") + "<br>" + loc("Upgrading will grant you:") + "<br><b>&bull; " + loc("+1 loan slot") + "<br><!--&bull; " + loc("+1 opportunity slot") + "<br>-->&bull; " + loc("+%1% base warehouse space for all goods", 50) + "</b>"
	}, {
		name: loc("Palace of Greed"), icon: [18, 33], cost: 0,
		desc: loc("This is your office.") + "<br>" + loc("It is fully upgraded. Its lavish interiors, spanning across innumerable floors, are host to many a decadent party, owing to your nigh-unfathomable wealth.")
	}
];
M.officeLevel = 0;
M.officeLevelSel = byId("marketOfficeLevel");
var officeOptions = "";
for (i = 0; i < M.offices.length; i++) {
	var office = M.offices[i];
	office.iconCss = Game.getIconCss(office.icon);
	office.iconCssStr = Game.getIconCssStr(office.iconCss);
	officeOptions += "<option>" + office.name + "</office>";
}
M.officeLevelSel.innerHTML = officeOptions;

M.brokers = 0;
M.brokersIn = byId("marketBrokers");
$("#marketBrokersIcon").css(Game.getIconCss([1, 33]));

M.getMaxBrokers = function () { return Math.ceil(Game.Objects["Grandma"].highest / 10 + Game.Objects["Grandma"].level); };
M.getBrokerPrice = function () { return Game.rawCookiesPsHighest * 60 * 20; };

M.graphLinesChk = byId("marketGraphLines");
M.graphColorChk = byId("marketGraphColor");

byId("productDragonBoostMarket").tooltipHTML = ('<div class="productDragonBoostTooltip"><b>' + loc("Supreme Intellect") + '</b><div class="line"></div>' +
	loc("The stock market is more chaotic.") + "</div>");

Game.registerInputs(M, [
	[M.profitIn, "profit"],
	[M.brokersIn, "brokers"]
]);


M.updateFunc = function () {
	M.officeLevel = Game.getSelectedIndex(M.officeLevelSel, M.offices.length - 1);
	$("#marketOfficeIcon").css(M.offices[M.officeLevel].iconCss);

	byId("marketBrokersLimit").innerHTML = Game.BeautifyAbbr(M.getMaxBrokers());

	for (var i = 0; i < M.goodsById.length; i++) {
		var good = M.goodsById[i];
		good.active = good.building.highest > 0;
		good.$row.toggleClass("bankGoodInactive", !good.active || good.hiddenChk.checked);
		good.$maxStockEle.html(Game.BeautifyAbbr(M.getGoodMaxStock(good)));
	}
};

M.reset = function () {
	Game.setInput(M.profitIn, 0);
	M.officeLevelSel.selectedIndex = 0;
	M.officeLevel = 0;
	M.graphLinesChk.checked = true;
	M.graphColorChk.checked = false;
	Game.setInput(M.brokersIn, 0);

	for (var i = 0; i < M.goodsById.length; i++) {
		var good = M.goodsById[i];
		M.randomizeGood(good);
		Game.setInput(good.stockIn, 0);
		Game.setInput(good.valIn, M.getRestingVal(good.id));
		Game.setInput(good.prevIn, 0);
		// good.vals = [good.val, good.val - good.d];
		good.hiddenChk.checked = false;
		good.lastSel.selectedIndex = 0;
	}
};

M.save = function () {
	var str = "" +
	M.officeLevel + ":" +
	M.brokers + ":" +
	asBoolNum(M.graphLinesChk.checked) + ":" +
	parseFloat(M.profit, 10) + ":" +
	asBoolNum(M.graphColorChk.checked) + ":" +
	" ";
	for (var iG = 0; iG < M.goodsById.length; iG++) {
		var good = M.goodsById[iG];
		str += (Math.floor(good.val * 100) + ":" +
			Game.getSelectedIndex(good.modeSel, 5) + ":" +
			Math.floor(good.d * 100) + ":" +
			Math.floor(good.dur) + ":" +
			good.stock + ":" +
			asBoolNum(good.hiddenChk.checked) + ":" +
			good.lastSel.selectedIndex + ":" +
			Math.floor(good.prev * 100) + "!");
	}
	str += " " + asBoolNum(byId("marketOpenCheck").checked);
	return str;
};

M.load = function (str) {
	if (!str) { return false; }

	var i = 0;
	var spl = str.split(" ");
	var spl2 = spl[i++].split(":");
	var i2 = 0;
	Game.setSelectedIndex(M.officeLevelSel, parseInt(spl2[i2++] || 0, 10), M.offices.length - 1);
	Game.setInput(M.brokersIn, parseInt(spl2[i2++] || M.brokers, 10));
	M.graphLinesChk.checked = parseBoolean(spl2[i2++]);
	Game.setInput(M.profitIn, parseFloat(spl2[i2++] || 0));
	M.graphColorChk.checked = parseBoolean(spl2[i2++]);

	var goods = spl[i++].split("!");
	for (var iG = 0; iG < M.goodsById.length; iG++) {
		var good = M.goodsById[iG];
		if (!good) { continue; }
		var goodData = goods[iG].split(":");
		Game.setInput(good.valIn, parseInt(goodData[0], 10) / 100);
		Game.setSelectedIndex(good.modeSel, parseInt(goodData[1], 10), 5);
		Game.setInput(good.dIn, parseInt(goodData[2], 10) / 100);
		// good.vals = [good.val, good.val - good.d];
		Game.setInput(good.durIn, parseInt(goodData[3], 10));
		Game.setInput(good.stockIn, parseInt(goodData[4], 10));
		good.hiddenChk.checked = parseBoolean(goodData[5], 10);
		Game.setSelectedIndex(good.lastSel, parseInt(goodData[6], 10));
		Game.setInput(good.prevIn, parseInt(goodData[7], 10) / 100);
	}

	byId("marketOpenCheck").checked = spl[i++] == 1;
};

byId("marketOfficeBlock").setTitleFunc = function () {
	var office = M.offices[M.officeLevel];
	this.tooltipHTML = ('<div class="minigameTooltip">' +
		'<div class="icon tooltipIcon" style="' + office.iconCssStr + '"></div>' +
		'<div class="name">' + office.name + ' <span class="bankSmallText" style="opacity:0.6;">[' + loc("Level %1 offices", M.officeLevel + 1) + "]</span></div>" +
		'<div class="line"></div><div class="description bankSmallText">' +
			office.desc +
		"</div>" +
		(office.cost ? ('<div class="line"></div><div class="bankSmallText" style="padding-left: 24px; position: relative;">' +
			'<div id="bankOfficeIcon" class="icon tinyIcon" style="position: absolute; left: 0; top: 6px;' + Game.getIconCssStr([11, 0]) + '"></div>' +
			loc("Upgrading will cost you %1.", '<b class="' + (Game.Objects["Cursor"].amount >= office.cost[0] ? "green" : "red") + '">' + office.cost[0] + " " + Game.Objects["Cursor"].plural + "</b>") + "<br>" +
			loc("Upgrading requires %1.", '<b class="' + (Game.Objects["Cursor"].level >= office.cost[1] ? "green" : "red") + '">' + loc("Level %1 %2", [office.cost[1], Game.Objects["Cursor"].plural]) + "</b>") +
		"</div>") : "") +
	"</div>");
};

byId("marketBrokersBlock").setTitleFunc = function () {
	this.tooltipHTML = ('<div class="minigameTooltip">' +
		'<div class="icon tooltipIcon" style="' + Game.getIconCssStr([1, 33]) + '"></div>' +
		'<div class="name">' + (EN ? ('Stockbrokers <span class="bankSmallText" style="opacity:0.6;">(you have ' + Game.BeautifyAbbr(M.brokers) + ")</span>") :
			(loc("Brokers:") + " " + Game.Beautify(M.brokers))) + "</div>" +
		'<div class="line"></div><div class="description bankSmallText">' +
			loc("A nice broker to trade more cookies.") + "<br>" +
			"&bull; " + loc("Buying goods normally incurs overhead costs of <b>%1% extra</b>. Each broker you hire reduces that cost by <b>%2%</b>.", [20, 5]) + "<br>" +
			"&bull; " + loc("Current overhead costs thanks to your brokers: <b>+%1%</b>", Game.Beautify(20 * Math.pow(0.95, M.brokers), 2)) + "<br>" +
			"&bull; " + loc("Buying a broker costs %1 of CpS (that's $%2).", ['<b class="hasTinyCookie ' + (Game.cookies >= M.getBrokerPrice() ? "green" : "red") + '">' + loc("%1 minute", Game.LBeautify(20)) + "</b>", 1200]) + "<br>" +
			"&bull; " + loc("Maximum number of brokers you can own: %1 (the highest amount of grandmas you've owned this run, divided by 10, plus your grandma level)", '<b class="' + (M.brokers < M.getMaxBrokers() ? "green" : "red") + '">' + Game.Beautify(M.getMaxBrokers()) + "</b>") + "<br>" +
			"<q>" + loc("Brokers are Wall Street-class grandmas versed in the ways of finance. Stockbroker grandmas work hard and play hard, and will fight telephone in hand to get your clients the best possible deals - with a sizeable profit margin for you, of course.") + "</q>" +
			'<div class="line"></div><div class="bankSmallText alignCenter">' +
				loc("Hiring a new broker will cost you %1.", '<b class="hasTinyCookie ' + (Game.cookies >= M.getBrokerPrice() ? "green" : "red") + '">' + loc("%1 cookie", Game.LBeautify(M.getBrokerPrice())) + "</b>") +
			"</div>" +
		"</div>" +
	"</div>");
};

$("#marketBlock").on("click", ".marketGoodReroll", function () {
	var good = M.goodsById[this.dataset.good];
	if (good) {
		M.randomizeGood(good);
		Game.scheduleUpdate();
	}
});

byId("marketGoodsHelp").dataset.title = '"Mode" and "Dur" affect the randomness of stock value changes in ways that frankly I don\'t really want to figure out or explain. The game shouldn\'t break from editing them at least.';

})();
//#endregion Stonks

};

})();
