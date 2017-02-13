/**
* This is our main simulator object.
* It manages states of simulation and cpu/memory.
*/

sim = new Simulator();

function Simulator() {
	this.running = false;

	// CPUs are executed in turns, one after another
	// Randomly pick one to go first, out of fairiness.
	// true=cpu0s turn, false=cpu1s turn.
	//
	this.turn =  Math.random() >= 0.5;

	// This is speed cpu runs at.  It's time between step
	// So high value will run it slower.
	this.cpuSpeed = 250;

	this.currentStep = 0;

	
}

/**
* called on page load.  Just make things easy 
*/
Simulator.prototype.init = function() {

	//console.log("memory: " +memory);
	//console.log("cpu0: " +JSON.stringify(cpu0));
	//console.log("cpu1: " +JSON.stringify(cpu1));

	loadProgram(0);
	loadProgram(1);
	this.display();

}

/**
* Resets "everything" in simulation to clean slate.
*/ 
Simulator.prototype.reset = function() {

	this.turn =  Math.random() >= 0.5;

	this.currentStep = 0;

	memory.reset();
	cpu0.reset();
	cpu1.reset();

}

/**
* Displays current state of "everything" to screen.
*/ 
Simulator.prototype.display = function() {

	$("#currentstep").html(this.currentStep);

	memory.display();
	cpu0.display();
	cpu1.display();

}

/**
* Halts the simulation.
*/
Simulator.prototype.halt = function() {
	this.running=false;
}

/**
* Runs one step in simulation.
*/ 
Simulator.prototype.runNextStep = function() {

	if (cpu0.halted || cpu1.halted) {
		this.halt();
		return;
	}

	// We are running in single CPU mode
	if (cpu1.disabled) {
		cpu0.executeNext();
	} else {
		// Dual CPU mode.
		if (this.turn) {
			cpu0.executeNext();
		} else {
			cpu1.executeNext();
		}

		this.turn=!this.turn;
	}

	this.currentStep++;

	// Update our screen, not sure if this belongs here.
	this.display();
}

/**
* Runs a continious simulation.
*/
Simulator.prototype.runLoop = function() {

	if (!this.running) {
		return;
	}

	this.runNextStep();

	// This loops back and reruns sim and delays by cpuSpeed (step).
	setTimeout( function () { sim.runLoop(); }, this.cpuSpeed);
}




