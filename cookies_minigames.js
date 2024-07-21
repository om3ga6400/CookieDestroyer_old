(function (window, $) {
"use strict";

var Game = window.Game;
var byId = window.byId;
var asBoolNum = window.asBoolNum;

var EN = window.EN;
var loc = window.loc;
var FindLocStringByPart = window.FindLocStringByPart;

Game.initMinigames = function () {

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

byId("productDragonBoostPantheon").tooltipHTML = ('<div class="productDragonBoostTooltip"><b>' + loc("Supreme Intellect") + '</b><div class="line"></div>' +
	loc("The jade slot behaves as a ruby slot and the ruby slot behaves as a diamond slot.") + "</div>");

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

	$("#pantheonClearSelection").toggleClass("hidden", slotId == -1 && godId == -1);
	$("#pantheonSetGod").toggleClass("hidden", slotId == -1 || godId == -1 || (slottedGod != -1 && slottedGod == godId));
	$("#pantheonClearSlot").toggleClass("hidden", slotId == -1 || slottedGod == -1);
};

Game.clearPantheonSelection = function () {
	$("#pantheonBlock .templeGod.selected").removeClass("selected");
	Game.updatePantheonSelection();
};
byId("tabMinigames").onTabFunc = Game.clearPantheonSelection;

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

$("#pantheonBlock").on("click", ".templeGod", function () {
	var $ele = $(this);
	$ele.siblings().removeClass("selected");
	$ele.toggleClass("selected");
	Game.updatePantheonSelection();
	return false;

}).on("mouseenter", ".templeGod", function (event) {
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
	event.stopPropagation();
});

$("#pantheonClearSelection").click(Game.clearPantheonSelection);

$("#pantheonClearSlot").on("click", function () {
	Game.clearGodSlot($("#pantheonSlots .templeGod.selected").attr("data-slot"));
	Game.clearPantheonSelection();
	Game.scheduleUpdate();
});

$("#pantheonSetGod").on("click", function () {
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
		Game.scheduleUpdate();
	} else {
		Game.updatePantheonSelection();
	}
});

M.reset = function () {
	for (var i = 0; i < 3; i++) {
		Game.clearGodSlot(i);
	}
};

M.save = function () {
	return Game.pantheon.slot.join("/");
};

M.load = function (str) {
	if (!str) { return false; }

	var pantheonSlots = [-1, -1, -1];

	var ids = (str.split(" ")[0] || "").split("/");
	for (var j = 0; j < 3; j++) {
		pantheonSlots[j] = ids[j] || -1;
	}

	for (var i = 0; i < 3; i++) {
		Game.slotGodById(pantheonSlots[i], i);
	}
};

})();
//#endregion Pantheon


//#region Garden
(function () {

var M = Game.garden;
M.parent = Game.Objects["Farm"];
M.parent.minigame = M;

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
		harvestBonus: [30 * 60, 0.03],
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
		harvestBonus: [3 * 60, 0.03],
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
		harvestBonus: [3 * 60, 0.03],
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
		harvestBonus: [60 * 60, 0.04],
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
		harvestBonus: [2 * 60 * 60, 0.08],
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
		harvestBonus: [1 * 60, 0.03, true, true],
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
		harvestBonus: [5 * 60, 0.03, true, true],
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
M.harvestBonusPlants = [];
var n = 0;

for (var i in M.plants) {
	var plant = M.plants[i];
	// plant.unlocked = Boolean(plant.defaultUnlocked);
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
	"</div>").appendTo("#gardenSeeds");

	if (plant.harvestBonus) {
		var row = $('<tr id="gardenHarvest-' + n + '" class="gardenHarvestBonus"><td class="gardenHarvestBonusPlant tooltipped" data-plant-id="' + n + '">' +
			plant.name + "</td><td></td></tr>").appendTo("#gardenHarvestBonusTable")[0];
		plant.harvestBonusCell = row.children[1];
		M.harvestBonusPlants.push(plant);
	}

	n++;
}
M.numPlants = M.plantsById.length;

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
				children += '<div class="gardenSeedTiny" style="' + it.iconCssStr[0] + '"></div>';
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
	if (soil) {
		this.soil = soil.id;
		soil.$soilBlock.addClass("on").siblings(".gardenSoil").removeClass("on");
	}
};

M.computeStepT = function () {
	if (Game.HasUpgrade("Turbo-charged soil")) {
		this.stepT = 1;
	} else {
		this.stepT = this.soilsById[this.soil].tick * 60;
	}
};

M.plot = [];
for (var y = 0; y < 6; y++) {
	M.plot[y] = [];
	for (var x = 0; x < 6; x++) {
		M.plot[y][x] = [0, 0];
		$('<div id="gardenTile-' + x + "-" + y + '" class="gardenTile tooltipped" style="left:' + (16 + x * M.tileSize) + "px;top:" + (16 + y * M.tileSize) + 'px;">' +
			'<div id="gardenTileIcon-' + x + "-" + y + '" class="gardenTileIcon hidden"></div>' +
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

// M.plotLimits = [
// 	[2, 2, 4, 4],
// 	[2, 2, 5, 4],
// 	[2, 2, 5, 5],
// 	[1, 2, 5, 5],
// 	[1, 1, 5, 5],
// 	[1, 1, 6, 5],
// 	[1, 1, 6, 6],
// 	[0, 1, 6, 6],
// 	[0, 0, 6, 6],
// ];
// M.isTileUnlocked = function (x, y) {
// 	var level = this.parent.level;
// 	level = Math.max(1, Math.min(this.plotLimits.length, level)) - 1;
// 	var limits = this.plotLimits[level];
// 	return (x >= limits[0] && x < limits[2] && y >= limits[1] && y < limits[3]);
// };

M.getNewSeedAge = function (plant) {
	var age = -1;
	if (plant) {
		switch ($('[name="gardenSeedAge"]:checked').val()) {
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

M.setPlotTile = function (x, y, id, age) {
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
		if (plant) {
			var stage = 0;
			if (age >= plant.mature) { stage = 4; }
			else if (age >= plant.mature * 0.666) { stage = 3; }
			else if (age >= plant.mature * 0.333) { stage = 2; }
			else { stage = 1; }
			css = plant.iconCss[stage];
		}

		$("#gardenTileIcon-" + x + "-" + y).toggleClass("hidden", id < 0).css(css);
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
		str = '<div class="gardenTileTooltip">' +
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
			var tile = M.plot[y][x];
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
				var tile = this.plot[y][x];
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

M.resetPlot = function () {
	for (var y = 0; y < 6; y++) {
		for (var x = 0; x < 6; x++) {
			this.setPlotTile(x, y, -1, 0);
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
	this.toggleSoil(0);
	this.toggleFreeze(false);
	this.resetPlot();
};

M.save = function () {
	var str = (":" +
		Math.floor(this.soil) + "::" +
		asBoolNum(this.freeze) +
		"  "); // skipping seeds

	for (var y = 0; y < 6; y++) {
		for (var x = 0; x < 6; x++) {
			var plot = this.plot[y][x];
			str += Math.floor(plot[0]) + ":" + Math.floor(plot[1]) + ":";
		}
	}
	return str;
};

M.load = function (str) {
	if (!str) { return false; }

	var spl = str.split(" ");
	var spl2 = spl[0].split(":");
	this.toggleSoil(parseInt(spl2[1], 10));
	this.toggleFreeze(parseInt(spl2[3], 10));

	var plot = spl[2] || 0;
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
	this.computeMatures();
	this.computeBoostPlot();
	this.computeEffs();

	this.computeStepT();
};

M.updateHarvestBonus = function () {
	for (var i = 0; i < this.harvestBonusPlants.length; i++) {
		var plant = this.harvestBonusPlants[i];

		var cookies = plant.harvestBonus[0] * Game.cookiesPs;
		var bank = cookies / plant.harvestBonus[1];

		var html = Game.formatNumber(cookies) + " cookies " + (plant.harvestBonus[3] ? "max " : "") + (plant.harvestBonus[2] ?  "on death" : "on harvest") +
			(plant.harvestBonus[3] ? " (average " + Game.formatNumber(cookies * 0.5) + ")" : "") +
			", Bank " + Game.formatNumber(bank);

		plant.harvestBonusCell.innerHTML = html;
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

$("#gardenDeselectSeed").on("click", function () {
	Game.garden.selectSeed(null);
});

$("#gardenSoilBlock").on("mouseenter", ".gardenSoil", function (ev) {
	var M = Game.garden;

	var soil = M.soilsById[this.dataset.soilId];
	if (soil) {
		var str = '<div class="gardenSoilTooltip">' +
			'<div class="icon gardenLineIcon" style="margin-left:-8px;margin-top:-8px;' + soil.iconCssStr + '"></div>' +
			'<div><div class="name">' + soil.name + "</div><div>" +
			"<small>" +
				((M.soil == soil.id) ? loc("Your field is currently using this soil.") : loc("Click to use this type of soil for your whole field.")) +
			"</small></div></div>" +
			'<div class="line"></div>' +
			'<div class="description">' +
				'<div class="gardenDescMargin"><b>' + loc("Effects:") + "</b></div>" +
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
	if (soil && Game.garden.soil !== soil.id) {
		Game.garden.toggleSoil(soil.id);
		Game.scheduleUpdate();
	}
});

var gardenPlantMousedown = false;

$("#gardenBlock").on("click", '[name="gardenSeedAge"]', function () {
	Game.garden.toggleGardenFillBtn();

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

}).on("mouseenter", "#gardenHarvestBonusBlock .gardenHarvestBonusPlant", function (ev) {
	var M = Game.garden;
	var plant = M.plantsById[this.dataset.plantId];
	if (plant) {
		Game.setTooltip({
			html: '<div class="gardenSeedTooltip">' +
				'<div class="icon gardenLineIcon" style="margin-left:-24px;margin-top:-4px;' + plant.iconCssStr[0] + '"></div>' +
				'<div class="icon gardenLineIcon" style="margin-left:-24px;margin-top:-28px;' + plant.iconCssStr[4] + '"></div>' +
				'<div class="turnInto"></div>' +
					'<div style="width:300px;"><div class="name">' + plant.name + "</div><div></div></div>" +
					'<div class="line"></div>' +
					M.getPlantDesc(plant) +
				"</div>",
			refEle: this
		});
	}

	ev.stopPropagation();
});

$(window).on("focusout mouseup focusin", function () {
	gardenPlantMousedown = false;
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
				M.setPlotTile(x, y, Game.seedSelected, age);
			}
		}
	}

	Game.scheduleUpdate();
});

Game.clearGardenSelection = function () {
	Game.garden.selectSeed(null);
};
byId("tabGarden").onTabFunc = Game.clearGardenSelection;

M.selectSeed(null);

})();
//#endregion Garden

};

})(window, jQuery);
