/**
* This file is for gloabl helper functions now.
*/

var version = "1.5";


/** 
* Convert dec to hex 
* see: http://stackoverflow.com/a/17204359
* d: digit to conver
* places: number of places, either 1 or 2 (ie, 10 would return either A or 0A)
**/
function d2h(d, places) {

	var value = (d / 256 + 1 / 512).toString(16).substring(2, 4).toUpperCase();

	// default is 2 
	if (places == 1) {
		value = value.charAt(1);
	}

	return (value);
}

/**
* Prints a message out to players 'output' console.
*/
function printError (id, error) {
	$("#program" +id +"output").append(error +"\n");
	console.log("Error on CPU: " +id +" " +error);
}

/**
* clears all errors from players 'output' console.
*/
function clearError(id) {
	$("#program" +id +"output").html("");
}














