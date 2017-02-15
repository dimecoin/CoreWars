/**
* These are the CPU objects.  
*/ 

var cpu0 = new CPU(0);
var cpu1 = new CPU(1);

function CPU(id) {
	
	this.id=id;
	
	// 16 general purposes registers.
	this.r=new Uint8Array(16);

	// Instruction register, our current instruction
	this.ir=new Uint8Array(2); 
	
	// memory offset for loading.  These are start defaults, they can be changed.
	this.of=(id ==0) ? 0x00 : 128; 
	
	// Our program length, will be adjusted when program is loaded.
	this.pl=0x00;
	
	this.pc=0x00 +this.of; // program counter
	this.ppc=null; // previous program counter

	this.halted=false;
	this.disabled = false;
	if (this.id == 1) {
//		this.disabled=true; // for testing, remove
	}
	this.status = "ready"; //TODO: should be enum

	this.color=(id ==0) ? "lightblue" : "thistle";
	this.hlcolor=(id ==0) ? "steelblue" : "mediumpurple";

	// Label addresses 
	this.labels = [];

	// memory is shared, but we assume each player has their own program.
	// This keeps track of it.  It also will be updated if player writes to memory location.
	// It's mostly used for pretty colors, so we know to render them.
	this.programMap = [];
	for (var i=0; i<256; i++) {
		this.programMap[i] = false;
	}

	// number of instructions executed so far
	this.currentStep = 0;

	// Real or realative memory
	this.realMem = false;
}

/**
* Resets CPU into clear state.  Everything changed by to default, except for memory offset.
*/
CPU.prototype.reset = function() {
	this.r.reset();
		
	this.ir[0] = 0x00;
	this.ir[1] = 0x00;

	this.pc=this.of;
	this.ppc=null;
	
	// Don't change offset.
	this.pl = 0x00;

	this.halted=false;
	//this.disabled = false;
	this.status = (this.disabled) ? "disabled" : "ready"; 

	this.labels = [];

	for (var i=0; i<256; i++) {
		this.programMap[i] = false;
	}

	this.currentStep = 0;
}

/**
* Displays our current CPU state.
*/
CPU.prototype.display = function () {
	
	// Display general purpose registers.
	for (var i=0; i<16; i++) {
		
		var name = "cpu" +this.id +"R" +d2h(i,1);
		$("#" +name).html(d2h(this.r[i], 2));
		
		// Add some color if it's a non-default value
		if (this.r[i] != 0x00) {
			$("#" +name).css("background-color", "lightgray");
		} else {
			$("#" +name).css("background-color", "white");
		}
		
	}

	// Display special registers and status.
	$("#cpu" +this.id +"PPC").html(d2h(this.ppc, 2));
	$("#cpu" +this.id +"PC").html(d2h(this.pc, 2));
	$("#cpu" +this.id +"PC").css("background-color", this.hlcolor);
	$("#cpu" +this.id +"PC").css("font-weight", "bold");

	$("#cpu" +this.id +"IR").html(d2h(this.ir[0], 2) + d2h(this.ir[1], 2));
	$("#cpu" +this.id +"OF").html(d2h(this.of, 2));
	$("#cpu" +this.id +"OF").css("background-color", this.color);
	
	$("#cpu" +this.id +"RM").html("" +this.realMem);

	$("#cpu" +this.id +"status").html(this.status);

	$("#cpu" +this.id +"currentstep").html(this.currentStep);

}

/**
* Fetches instruction from memory, based on parameter 'location'
* Does not modify ppc/pc or ir, just a safe fetch from memory
* returns 5 byte instruction:
* (instructions are two bytes long, but parses them into high/low for easy access)
* [0]: The opcode (high byte of 1st byte)
* [1]: The first operand (low byte of 1st byte)
* [2]: The second operand (high byte of 2nd byte)
* [3]: The thrid operand (low byte of 2nd byte)
* [4]: Second byte (high/low of [3] and [4]), typically a memory address.
* 	(this just makes it easy so don't have to recombined 3 & 4)
**/
CPU.prototype.fetch = function (location) {
	
	var code = new Uint8Array(5);

	var byte1 = window.memory[location];
	var byte2 = window.memory[location+1];

	code[0] = byte1  >> 4; // our instruction.
	code[1] = byte1 & 0x0F; // first ops, always be 1 nibble

	// This splits second byte into nibbles, sometimes used.
	code[2] = (byte2 & 0xF0) >> 4;
	code[3] = byte2 & 0x0F;

	// Soemtimes we need entire byte for memory location.
	code[4] = byte2; 

	console.log("Feteched Instruction: ");
	console.log("	bytes: ( " +byte1 +" , " +byte2 +" )");
	console.log("	nibbles: [" +code[0] +" , " +code[1] +" , " +code[2] +" , " +code[3] +" ]");


return(code);
}


CPU.prototype.execute = function(code) {


	// our return code object
	var rc = [];
	rc["status"] = true;
	rc["jmp"] = false;
	rc["errormessage"] = "";

	// See cpu.fetch() for code[0] 	format.

	// code 0 == instruction nibble
	// code 1 == first operand nibble, typically a register
	// code 2 & code 3 == second/thrid operand nibble
	// code 4, combined byte of code 2 and 3 (for memory location)

	// This calculates or memory location if applicable.
	// It takes offset into account and will wrap around memory space (ie. overflow) if needed
	
	var location = (parseInt(code[4]) + parseInt(this.of)) % 256;
	if (this.realMem) {
		location = parseInt(code[4]) % 256;
	}
	
	switch (code[0]) {

		case 1: // LOAD
			this.r[code[1]] = window.memory[location];
		break;

		case 2: // LOAD
			this.r[code[1]] = code[4];
		break;

		case 3: // STORE
			//printError(this.id, "Storing value: " +this.r[code[1]] +" to memory location: " +location +" orig: " +code[4] +" of: " +this.of);
			window.memory[location] = this.r[code[1]];
			this.programMap[location] = true;
		break;

		case 4: // MOVE
			this.r[code[3]] = this.r[code[2]];
		break;
		
		case 5: //ADDI

			var number1 = this.r[code[2]];
			var number2 = this.r[code[3]];
			var answer = parseInt(number1) + parseInt(number2);

			console.log("Adding " +number1 +" + " +number2 +" = " +answer);

			this.r[code[1]] = answer;
		break;

		case 6: // ADDF
			// TODO: calculate floats.
		break;

		case 7: // OR
			this.r[code[1]] = this.r[code[2]] | this.r[code[3]];
		break;

		case 8: // AND
			this.r[code[1]] = this.r[code[2]] & this.r[code[3]];
		break;

		case 9: // XOR
			this.r[code[1]] = this.r[code[2]] ^ this.r[code[3]];
		break;

		case 10: // ROR

			var places = parseInt("0x" +code[4]);
			if (places > 8) {
				places = places % 8;
			}
			//console.log("ROR: " +code[4] +" Places: "  +places);
		
			// Basically, we want to 1) save bits to be shifted off.
			// Moved them to other side.
			// shift
			// put bits back.	
	
			// These will get put on other end	
			var shiftedBits = this.r[code[1]] << (8-places);
			// Shift it, now spaces on left are zero
			var value = this.r[code[1]] >> places;

			// Combined them.
			this.r[code[1]] = value | shiftedBits;
		break;

		case 11:
			console.log("jmpeq comparing R0 (" +this.r[0] +") to R" +code[1] +" (" +this.r[code[1]] +")");
			if (this.r[0] == this.r[code[1]]) {

				this.ppc=this.pc;
				this.pc = location;

				console.log("jmp to location: " +this.pc);

				rc["jmp"] = true;
			}
		break;

		case 12:
			this.halted=true;
			this.status="halted";
		break;

		case 14:

			var value = this.r[code[2]];
			var location = (parseInt(this.r[code[3]]) + parseInt(this.of))%256;
			if (this.realMem) {
				location = parseInt(this.r[code[3]])%256;
			}

			console.log("STORE: code[3]: " +code[3] +" Reg: " +this.r[code[3]] +" of: " +this.of +" location: " +location);

			console.log("CPU: " +this.id, "Storing value: " +value +" to memory location: " +location);
			window.memory[location] = value;

			this.programMap[location] = true;
		break;

		// invalid instruction
		default:
			rc["status"] = false;
			rc["errormessage"] = "invalid instruction";
		break;

	}

return(rc);
}

/**
* Main wrapper to execute next instruction.  This modifies state (registers, ppc, inst)
* 1) Fetch from memory
* 2) Execute
* 3) Adjusts PC (increments or from JMP)
*/

// Main wrapper to execute next
// Gets from memory
// executes
// increments PC (or sets if JMP)
CPU.prototype.executeNext = function() {

	// Get next code
	var code = this.fetch(this.pc);
	console.log*("*************************");
	//console.log("Code: " +JSON.stringify(code));

	// Save to instruction register
	this.ir[0]=(code[0]<<4)|code[1];
	this.ir[1]=code[4];
	
	// Execute and capture return code
	var rc = this.execute(code);
	if (!this.halted && rc["status"]) {
		// Everything seems OK with execution.
		this.status="running";
		// Only count instructions that actucally worked?
		this.currentStep++;
	} else if (!this.halted && !rc["status"]) {
		// Our execution failed.  Illegal or junk instructions 
		// TODO: Check for bomb (0xFF) and make special fail state.
		this.status="error";
		this.halted=true;

		if (this.ir[0] == 0xFF ) {
			printError(this.id, "**KABOOM!** CPU Executed the BOMB 0xFF at address: (" +d2h(this.pc,2) +")");
			this.status="bombed"
		}
		printError(this.id, "Error in code execution at address: ( "
			+d2h(this.pc,2)
			+" )"
			+" Code: " 
			+" bytes [ " +d2h(this.ir[0],2) +" , " +d2h(this.ir[1], 2)
			+" ] nibbles [ "
			+d2h(this.ir[0]<<4,1) +" , "
			+d2h(this.ir[0]&0x0F,1) +" , "
			+d2h(this.ir[1]<<4,1) +" , "
			+d2h(this.ir[1]&0x0F,1)
		+" ]  Return Code -> Status: (" +rc["status"] +"),  Error Message: (" +rc["errormessage"] +")");

		return; // don't increment pc if we halt
	}

	// jmp instruction, don't change ppc/pc since code did
	if (!rc["jmp"]) {
		this.ppc=this.pc;
		this.pc += 2;
	}

};






