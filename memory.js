
/**
* This is our memory object.  
* It's just a bunch of bytes, so we're hijacking Uint8Array object and creating our own method.
* Some registers also use Uint8Array, something to be aware of.
*/
var memory = new Uint8Array(256);

/**
* Resets (clears) our memory.  Can not be undone.
*/
Uint8Array.prototype.reset = function() { 
	this.fill(0x00);
	
	// TODO: this color coding should not go here.
	for (var i=0; i<256; i++) {
		$("#" +d2h(i,2)).css("background-color", "white");
	}
}

/**
* Displays our current memory state to screen.  
* Will be called automatically from Simulator, so probably don't need to do manually.
*/
Uint8Array.prototype.display = function() { 

	for (var i=0; i<256; i++) {
		
		var location = d2h(i,2);
		var data = d2h(memory[i],2);
		
		$("#" +location).html(data);
		
		//$("#" +d2h(i,2)).css("background-color", "white");
		
	}

	// TODO: Should add colors (white or cpu color) when refreshed.
	//		$("#" +d2h(i,2)).css("background-color", "white");
//		$("#" +d2h(i,2)).css("background-color", "white");

}
