/**
* This is our main simulator object.
* It's the main object to coordinates everything.
*/

sim = new Simulator();

function Simulator() {
		var running = false;
	
}

/**
* Resets "everything" in simulation to clean slate.
*/ 
Simulator.prototype.reset = function() {
	memory.reset();
	cpu0.reset();
	cpu1.reset();
}

/**
* Displays current state of "everything" to screen.
*/ 
Simulator.prototype.display = function() {
	memory.display();
	cpu0.display();
	cpu1.display();
}


Simulator.prototype.halt = function() {
	this.running=false;

	// TODO: this interface junk should go some place else.
	$("#button_runsim").prop("disabled",false);
	$("#button_step").prop("disabled",false);
	
}






