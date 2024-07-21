/* global Base64 */
/* eslint no-unused-vars: ["error", {"vars": "local"}] */

function utf8_to_b64(str) {
	try {
		return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
			return String.fromCharCode(parseInt(p1, 16));
		}));
	} catch (err) {
		return "";
	}
}

function b64_to_utf8(str) {
	try {
		return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
			return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(""));
	} catch (err) {
		// alert("There was a problem while decrypting from base64. (" + err + ")");
		console.error(err);
		return "";
	}
}

function UncompressBin(num) { //uncompress a number like 54 to a sequence like [0, 1, 1, 0, 1, 0].
	return num.toString(2).slice(1, -1).split("").reverse();
}

function UncompressLargeBin(arr) {
	var arr2 = arr.split(";");
	var bits = [];
	for (var i in arr2) {
		bits.push(UncompressBin(parseInt(arr2[i], 10)));
	}
	arr2 = [];
	for (i in bits) {
		for (var ii in bits[i]) { arr2.push(bits[i][ii]); }
	}
	return arr2;
}

function unpack(str) {
	var bytes = [];
	var len = str.length;
	for (var i = 0, n = len; i < n; i++) {
		var char = str.charCodeAt(i);
		bytes.push(char >>> 8, char & 0xFF);
	}
	return bytes;
}

//modified from http://www.smashingmagazine.com/2011/10/19/optimizing-long-lists-of-yesno-values-with-javascript/
function pack2(/* string */ values) {
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

// function pack3(values) {
// 	//too many save corruptions, darn it to heck
// 	return values;
// }

function unpack2(/* string */ packed) {
	var values = "";
	for (var i = 0; i < packed.length; i++) {
		values += packed.charCodeAt(i).toString(2).substring(1);
	}
	return values;
}

//like str.split("|") but works around game's pack2() potentially outputting a "|",
//  by skipping over first pipe character of a pair in fields where pack2 is used
//  (the second field is intentionally empty as of this writing so still have to split that)
//never mind, the bug's been fixed long enough and this is causing problems with legit new saves
function splitSave(str) {
	// var arr = [];
	// do {
	// 	var index = str.indexOf("|");
	// 	if (index > -1 && arr.length > 2 && str.charAt(index + 1) === "|") {
	// 		index++;
	// 	}
	// 	arr.push(str.slice(0, index > -1 ? index : undefined));
	// 	str = str.slice(index + 1);
	// } while (index > -1);
	// return arr;
	return str.split("|");
}

function decodeSave(str) {
	return b64_to_utf8(unescape(str).split("!END!")[0]);
}

function encodeSave(str) {
	return escape(utf8_to_b64(str) + "!END!");
}
