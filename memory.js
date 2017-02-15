
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

	// clear from CPUs too
	cpu0.programMap.fill(false);
	cpu1.programMap.fill(false);
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

		// player memory space colors

		// defaults
		$("#" +d2h(i,2)).css("background-color", "white");
		$("#" +d2h(i,2)).css("color", "black");
		$("#" +d2h(i,2)).css("font-weight", "normal");


		for (var c=0; c<2; c++) {
			var cpu = (c==0) ? cpu0 : cpu1;

			if (cpu.programMap[i]) { 
				$("#" +location).css("background-color", cpu.color); 
			}
		}


		// Bomb will only explode if on even memory.
		// Can cause bugs if on odd, but won't cause a hard crash
		if (i%2 == 0 && memory[i] == 0xFF) {
			$("#" +d2h(i,2)).css("color", "red");
			$("#" +d2h(i,2)).css("font-weight", "bold");
		} else if (memory[i] == 0x00) {

			// This is player code, not clear memory.  Don't highlight it.
			if (!cpu0.programMap[i] && !cpu1.programMap[i]) {
				$("#" +d2h(i,2)).css("color", "lightgrey");
				$("#" +d2h(i,2)).css("font-weight", "normal");
			}

		} else {
			$("#" +d2h(i,2)).css("color", "black");
			$("#" +d2h(i,2)).css("font-weight", "normal");
		}


	}

	// Highlight current instruction that cpus are on.
	for (var c=0; c<2; c++) {
		var cpu = (c==0) ? cpu0 : cpu1;
		$("#" +d2h(cpu.pc, 2)).css("background-color", cpu.hlcolor);
		$("#" +d2h(cpu.pc,2)).css("font-weight", "bold");
		$("#" +d2h(cpu.pc+1, 2)).css("background-color", cpu.hlcolor);
		$("#" +d2h(cpu.pc+1,2)).css("font-weight", "bold");
	}

	// TODO: Should add colors (white or cpu color) when refreshed.
	//		$("#" +d2h(i,2)).css("background-color", "white");
//		$("#" +d2h(i,2)).css("background-color", "white");

}
