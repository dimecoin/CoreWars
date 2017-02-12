/**
* These are load and assembler functions.
* TODO: Needs a better object/interface?
* TODO: Clean up this entire file.
*/

/**
* This is our 'master' function.  It takes a cpu id and loads program from memory (obeying memory offsets).
*/
function loadProgram(id) {

	var cpu = (id === 0) ? cpu0 : cpu1;

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
		if (!line || line.length < 4) {
			continue;
		}

		console.log("----------------------");
		console.log("Line: #" +line +"#");
		var machineCode = getMachineCode(line);
		if (machineCode[0] == 0x00) {
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
	var offset = cpu.of;

	var location = (offset) % 256;

	console.log( "Memory offset for cpu: " +id + " Offset: " +d2h(offset,2) +" Location: " +location);
	for (var  i=0; i<128; i++) {


		// Wrap around to start if we overflow.
		var oflocation = (location+i)%256;


		// probably shouldn't have this here?

		// TODO: very ulgy hack.  This highlights our program memory, but don't want to highlight 0x00 instructions.
		// WARNING: this also prevents us from writing 0x00 into the other programs space... since we can get 128 bytes in size
		// if both programs are large enough and overlap, we can overwrite each other with code.. that is acceptable..
		// but should not ever "zero out" the other program.
		
		// TODO: NEWEST - I added value 'pl' (program length) to CPU.  
		// We can calculate program size, update cpu.pl and use memory.display() to add colors since would have size of program.
		
		if (!(code[i] == 0x00 && code[i+1] == 0x00) && i != 127) {	
	
			memory[oflocation] = code[i];

			var htmllocation = d2h(oflocation,2);	
			$("#" +htmllocation).css("background-color", cpu.color);
		}
	}

	// Set PC to starting location

	cpu.ppc=null;
	cpu.pc=location;
}

// retruns an opt code based on instruction.
// brakcets can denoate context
// switch is awkward, probably should have did as a map with edge case.
function getOptCode(line) {
	
	switch (line) {
		case "loadm": return (1); break; // special case, overloading opcode
		case "load": return (2); break;
		case "storem": return (3); break;
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
		case "store": return (14); break;
	}

	// invalid instruction
	// TODO: switch to 0x00. 14=E which is allowed now
	return (14);
}


/**
* This is called from 'loadProgram'.
* If you give it a line of assembly (ie: "load R1,[0x00]") it will return the bytecode.
*/
function getMachineCode(line) {

	var machineCode = new Uint8Array(2);
	var regOnly = false;
	var memOnly = false;

	var instruction = line.split(' ')[0];
	instruction  = instruction.replace(/\t|\s/, "");
	console.log("instruction: #" +instruction +"#");

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

		var location = line.split(/,/)[1].replace(/\t|\s/, '');
		console.log("Location: "+location);

		machineCode[1] = location;
		return (machineCode);
	}


	// This is second half of instruction (operands).
	var secondHalf = line;
	
	// Need to strip out user spaces.
	secondHalf = secondHalf.replace(instruction, "");
	secondHalf = secondHalf.replace(/\t|\s/, "");

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
	console.log("Second Half: " +secondHalf +" Operands: " +JSON.stringify(operands));

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
	if (instruction == "store" && regops == 1) {
		instruction +="m";
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


