(function () {
	"use strict";
	/* global Game l b64_to_utf8 unpack2 utf8_to_b64 */

	if (!localStorage || !localStorage.CookieClickerGame) {
		throw "Save not found";
	}

	var originalSave = localStorage.CookieClickerGame;

	var errorL = l("javascriptError");
	var z = getComputedStyle(errorL).zIndex;

	function doPrompt() {
		if (arguments[0]) {
			Game.Prompt.apply(Game, arguments);

			if (!Game.promptAnchorL.style.zIndex && errorL.style.display !== "none") {
				Game.promptAnchorL.style.zIndex = z;
			}
		}
	}

	//like str.split("|") but works around game's pack2() potentially outputting a "|",
	//  by skipping over first pipe character of a pair in fields where pack2 is used
	//  (the second field is intentionally empty as of this writing so still have to split that)
	function splitSave(str) {
		var arr = [];
		do {
			var index = str.indexOf("|");
			if (index > -1 && arr.length > 2 && str.charAt(index + 1) === "|") {
				index++;
			}
			arr.push(str.slice(0, index > -1 ? index : undefined));
			str = str.slice(index + 1);
		} while (index > -1);
		return arr;
	}

	function pack2Fixed(/* string */ values) {
		var chunks = values.match(/.{1,14}/g);
		var packed = "";
		for (var i = 0; i < chunks.length; i++) {
			var chunk = chunks[i];
			//add dummy data to prevent packing to "|"
			if (chunk === "111100") { chunk += "00"; }
			packed += String.fromCharCode(parseInt("1" + chunk, 2));
		}
		return packed;
	}

	var repacked = false;

	var save = b64_to_utf8(unescape(originalSave).split("!END!")[0]);
	if (!save) { throw new TypeError("Invalid save"); }

	// save = save.split("|");
	save = splitSave(save);

	var doRepack = function (index) {
		if (save[index] && save[index].slice(-1) === "|") {
			save[index] = pack2Fixed(unpack2(save[index]));
			repacked = true;
		}
	};

	var version = parseFloat(save[0]);
	if (isNaN(version) || save.length < 5 || version < 1) {
		throw new TypeError("Invalid save");
	}

	//repack potentially faulty save fields

	if (version >= 1.0503) {
		doRepack(3);
	}

	if (version >= 1.0502) {
		doRepack(6);
		doRepack(7);
	}

	save = save.join("|");
	save = escape(utf8_to_b64(save) + "!END!");

	if (repacked) {
		localStorage.CookieClickerGame = save;

		doPrompt('<h3>Save fixer</h3><div class="block">Save found and fixed. -<a href="https://coderpatsy.bitbucket.io" target="_blank">patsy</a>' +
			'<br><br>Refresh the page to load the fixed save.</div>' +
			'<div class="block">Here is the previous save for posterity:' +
			'<br><br><textarea id="textareaPrompt" style="width:100%;height:128px;" readonly>' + originalSave + '</textarea></div>',
			[["Refresh page", "window.location.reload()"]]);
		l("textareaPrompt").select();
	} else {
		doPrompt('<div class="block">No problems detected with current save. -<a href="https://coderpatsy.bitbucket.io" target="_blank">patsy</a></div>', ["Okay"]);
	}
})(this);
