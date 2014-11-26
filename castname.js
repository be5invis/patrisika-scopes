exports.escapeId = function(){
	var COMPARE_CODES = function(P, Q){
		if(P.code === Q.code) return P.j - Q.j;
		else return P.code - Q.code;
	};
	var DIGITS = 'abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	var encNum = function(x){
		var buff = '' + (x % 10);
		x = ~~(x / 10);
		while(x > 0){
			buff += DIGITS[x % 53];
			x = ~~(x / 53);
		};
		return buff;
	};
	var encodeNonBasics = function(s, a){
		if(a.length < 1) return s;
		var buf = '';
		a = a.sort(COMPARE_CODES);
		var code = a[0];
		buf += encNum((code.j << 16) + code.ch);
		for(var i = 1; i < a.length; i++){
			if(a[i].ch === code.ch && a[i].j - code.j < 0x10000){
				buf += encNum(a[i].j - code.j).toString(36);
			} else {
				buf += encNum(((a[i].j) << 16) + (a[i].ch)).toString(36);
			}
			code = a[i];
		};
		return s + '$' + buf;
	};
	return function(s){
		var nonBasics = [];
		s = s.replace(/[^a-zA-Z0-9_]/g, function(ch, j){
			nonBasics.push({ch: ch.charCodeAt(0), j: j + 1});
			return '';
		});
		if(nonBasics.length) return 'xn$' + encodeNonBasics(s, nonBasics);
		else return s;
	}
}();