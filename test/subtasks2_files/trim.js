// JScript File
//******************************************************************
// callable functions in this library:
//******************************************************************
// LTrim() - returns a string with Left blank spaces removed
// RTrim() - returns a string with Right blank spaces removed
// Trim() - returns a string with both Left and Right blank spaces removed
// LTrimZero() - returns a string with leading Zeros and blank spaces removed
//******************************************************************
function LTrim(str) {
	var whitespace = new String(" \t\n\r");
	var s = new String(str);

	if (whitespace.indexOf(s.charAt(0)) != -1) {
		var j=0
		var i = s.length;
		
		while (j < i && whitespace.indexOf(s.charAt(j)) != -1) {
			j++;
		}
		s = s.substring(j, i);
	}
	return s;
}

function RTrim(str) {
	var whitespace = new String(" \t\n\r");
	var s = new String(str);

	if (whitespace.indexOf(s.charAt(s.length-1)) != -1) {
		var i = s.length - 1;
	
		while (i >= 0 && whitespace.indexOf(s.charAt(i)) != -1) {
			i--;
		}
	s = s.substring(0, i+1);
	}
return s;
}

function Trim(str) {
	return RTrim(LTrim(str));
}

function LTrimZero(str) {
	var whitespace = new String("0 \t\n\r");
	var s = new String(str);

	if (whitespace.indexOf(s.charAt(0)) != -1) {
		var j=0
		var i = s.length;
		
		while (j < i && whitespace.indexOf(s.charAt(j)) != -1) {
			j++;
		}
		s = s.substring(j, i);
	}
	return s;
}

