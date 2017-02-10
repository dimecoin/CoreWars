
var memory = new Uint8Array(256);

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

function displayMemory() {

	for (var i=0; i<256; i++) {
		var location = d2h(i,2);
		var data = d2h(memory[i],2);
		$("#" +location).html(data);
	}
}

function displayCPU (cpu) {

	var id = cpu.id;

	for (var i=0; i<16; i++) {
		var name = "cpu" +id +"R" +d2h(i,1);
		$("#" +name).html(d2h(cpu.r[i], 2));

	}

	$("#cpu" +id +"PC").html(d2h(cpu.pc, 2));
	$("#cpu" +id +"IR").html(d2h(cpu.ir[0], 2) + d2h(cpu.ir[1], 2));
	$("#cpu" +id +"OF").html(d2h(cpu.of, 2));

	$("#cpu" +id +"status").html(cpu.status);




}


// refreshes entre gui
function refresh() {
	displayMemory();
	displayCPU(cpu0);
	displayCPU(cpu1);

}


function CPU(id, r) {
	this.id=id;
	// 16 general purposes registers plus PC (program counter);
	// r[16] is program counter, special case.
	this.r=r; 

	this.ir=new Uint8Array(2); // Instruction register, our current instruction
	this.of=(id ==0) ? 0x00 : 128; // memory offset for loading 
	this.pc=0x00 +this.of; // program counter
	this.ppc=null; // previous program counter

	this.halted=false;
	this.status = "ready_state"; //TODO: should be enum

}

// Gets next instruction from memory and parses it into an array.
// Does not modify PC
CPU.prototype.getNextInstruction = function () {
	
	var code = new Uint8Array(5);

	var byte1 = window.memory[this.pc];
	var byte2 = window.memory[this.pc+1];

	code[0] = byte1  >> 4; // our instruction.
	code[1] = byte1 & 0x0F; // first ops, always be 1 nibble

	// This splits second byte into nibbles, sometimes used.
	code[2] = (byte2 & 0xF0) >> 4;
	code[3] = byte2 & 0x0F;

	// Soemtimes we need entire byte for memory location.
	code[4] = byte2; 

return(code);
}


CPU.prototype.execute = function(code) {

	// code 0 == instruction
	// code 1 == first opt, typically a register
	// code 2, code 3 == second/thrid opt
	// code 4, combined byte of code 2 and 3 (memory location)

	switch (code[0]) {

		case 1:
			var location = (code[4]+this.of) % 256;
			this.r[code[1]] = window.memory[location];
		break;

		case 2:
			this.r[code[1]] = code[4];
		break;

		case 3:
			var location = (code[4] + this.of) % 256;
			//printError(this.id, "Storing value: " +this.r[code[1]] +" to memory location: " +location +" orig: " +code[4] +" of: " +this.of);
			window.memory[location] = this.r[code[1]];
		break;

		case 4:
			this.r[code[3]] = this.r[code[2]];
		break;
		
		case 5: //ADDI
			this.r[code[1]] = this.r[code[2]] + this.r[code[3]];
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
			//console.log("JMP: " +JSON.stringify(code));
			// TODO: Jump to label?  Is that valid in contest?

			if (this.r[0] == this.r[code[1]]) {
				// This will get incremented, so subtract 2
				this.pc = parseInt(code[4])+this.of-2;
			}
		break;

		case 12:
			this.halted=true;
			this.status="halted";
		break;

		// invalid instruction
		default:
			return (false);
		break;

	}

return(true);
}


// Main wrapper to execute next
// Gets from memory
// executes
// increments PC (or sets if JMP)
CPU.prototype.executeNext = function() {

	var code = this.getNextInstruction();
	console.log*("*************************");
	console.log("Code: " +JSON.stringify(code));

	this.ir[0]=(code[0]<<4)|code[1];
	this.ir[1]=code[4];
	var rc = this.execute(code);

	if (!this.halted && rc) {
		this.status="running_state";
	} else if (!this.halted && !rc) {
		this.status="error_state";
		this.halted=true;
		printError(this.id, "Error in code execution! " +JSON.stringify(code));
	}


	var locations = [ 
		d2h((this.ppc),2),
		d2h((this.ppc+1),2),
		d2h((this.pc),2),
		d2h((this.pc+1),2),
	];
	/*
	locations[0] = d2h(this.pc-2,2);
	locations[1] = d2h(this.pc-1,2);
	locations[2] = d2h(this.pc-0,2);
	locations[3] = d2h(this.pc+1,2);*/

	console.log("L: " +JSON.stringify(locations));

	if (this.ppc != null) {
		$("#" +locations[0]).removeClass('td_current');
		$("#" +locations[1]).removeClass('td_current');
	}

	$("#" +locations[2]).addClass('td_current');
	$("#" +locations[3]).addClass('td_current');
	//
	//
	this.ppc=this.pc;
	this.pc += 2;

};

var cpu0 = new CPU(0,new Uint8Array(16));
var cpu1 = new CPU(1,new Uint8Array(16));




function loadProgram(id) {

	var code = new Uint8Array(128);
	var currentLine = 0;

	var textArea = $("#program" +id +"input");
	var lines = textArea.val().toLowerCase().split('\n');

	var lineNumber = 0; // for debugging.

	for(var i = 0;i < lines.length;i++){

		lineNumber++;

		// strip out comments:
		var line = lines[i].split(';')[0];

		// strip out blank lines
		if (line.length === 0) {
			continue;
		}

		console.log("----------------------");
		console.log("Line: " +line);
		var machineCode = getMachineCode(line);
		if (machineCode[0] == 0xE0) {
			printError(id, "Error loading program! Line: " +line +" Code: " +JSON.stringify(machineCode));
		}
		//console.log("Mach: " +d2h(getMachineCode(line)[0],2) +d2h(getMachineCode(line)[1],2));
		console.log("Mach: " +d2h(machineCode[0], 2) +d2h(machineCode[1], 2));

		code[currentLine] = machineCode[0];
		currentLine++;
		code[currentLine] = machineCode[1];
		currentLine++;
	}

	console.log("##############################");
	var offset = (id === 0) ? cpu0.of : cpu1.of;
	console.log( "Memory offset for cpu: " +id + " Offset: " +offset);
	for (var  i=0; i<128; i++) {
		memory[offset+i] = code[i];
		console.log("Code: " +code[i]);
	}


}

// retruns an opt code based on instruction.
// brakcets can denoate context
// switch is awkward, probably should have did as a map with edge case.
function getOptCode(line) {
	
	switch (line) {
		case "loadm": return (1); break; // special case, overloading opcode
		case "load": return (2); break;
		case "store": return (3); break;
		case "move": return (4); break;
		case "addi": return (5); break;
		case "addf": return (6); break;
		case "or": return (7); break;
		case "and": return (8); break;
		case "xor": return (9); break;
		case "ror": return (10); break;
		case "jmp": return (11); break;
		case "jmpeq": return (11); break;
		case "halt": return (12); break;
	}

	// invalid instruction
	return (14);
}


function getMachineCode(line) {

	var machineCode = new Uint8Array(2);
	var regOnly = false;
	var memOnly = false;

	var instruction = line.split(' ')[0];
	console.log("instruction: " +instruction);

	// Special cases, just return so don't have to keep checking.
	if (instruction === "halt") {
		machineCode[0] = 0xC0;
		machineCode[1] = 0x00;
		return (machineCode);
	}
	if (instruction === "jmpeq") {
		var reg = line.match(/r([0-9ABCDEF])\=r0/);

		console.log("Reg: " +reg[1]);
		machineCode[0] = 0xB0 | reg[1];

		machineCode[1] = line.split(/,/)[1];
		return (machineCode);
	}


	// This is second half of instruction (operands).
	var secondHalf = line;
	
	// Need to strip out user spaces.
	secondHalf = secondHalf.replace(instruction, "");
	secondHalf.replace(" ", "");

	// Determine number of parameters based on commas
	var parameters = secondHalf.match(/,/g).length+1;

	// How many are register operations, instead of memory
	var regops=0;
	if (secondHalf.match(/r/g)) {
		regops = secondHalf.match(/r/g).length;
	} else {
		machineCode[0] = 0xE0;
		machineCode[1] = 0x00;
		return (machineCode);
	}

	if (secondHalf.match(/\[/)) {
		memOnly = true;
		secondHalf = secondHalf.replace("[", "");
		secondHalf = secondHalf.replace("]", "");
	}

	var operands = secondHalf.split(/,/);

	for (var i=0; i<operands.length; i++) {
		operands[i] = operands[i].replace(" ", "");
		operands[i] = operands[i].replace("r", "");

		if (operands[i].match("0x")) {
			operands[i] = parseInt(+operands[i]);
		} else {
			operands[i] = parseInt("0x" +operands[i]);
		}
	}


	if (memOnly && instruction == "load") { 
		instruction += "m";
	}
	var opCode = getOptCode(instruction);
	
	console.log("opCode: " +opCode +" Operands: " +JSON.stringify(operands) 
			+" MemOnly: " +memOnly +" Parameters: " +parameters +" RegOps: " +regops);

	// shift over 4 spaces for instruction, then put in first operand

	if (memOnly) {
		machineCode[0] = (opCode << 4) | operands[0];
		machineCode[1] = operands[1];
	} else {

		// reg and mem operation or immediate load.
		if (regops == 1) {
			machineCode[0] = (opCode << 4) | operands[0];
			machineCode[1] = operands[1];
		}

		// reg to reg operations
		if (regops == 2) {
			machineCode[0] = (opCode << 4);
			// flip them... ??
			machineCode[1] = (operands[1]<<4) | operands[0];
		}

		if (regops == 3) {
			machineCode[0] = (opCode << 4) | operands[0];
			machineCode[1] = (operands[1]<<4) | operands[2];
		}


		/*
		if (regops == 2) {
			machineCode[1] = (operands[1]<<4) | operands[2]; // reverses them... odd
		} else {
			machineCode[0] = machineCode[0] | operands[1];
			machineCode[1] = (operands[2]<<4) | operands[3]; // reverses them... odd
		}*/


	}






return (machineCode);
}






function printError (id, error) {
	$("#program" +id +"output").append(error +"\n");
	console.log("Error on CPU: " +id +" " +error);
}







