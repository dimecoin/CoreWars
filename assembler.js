/**
* These are load and assembler functions.
* TODO: Needs a better object/interface?
* TODO: Clean up this entire file.
*/


/**
 *  This pre parsers our program, it's required for look ahead labels.
 *  TODO: proabbly should clean this up or make it part of loadProram
 */
function preParser(id) {

	var cpu = (id === 0) ? cpu0 : cpu1;

	var textArea = $("#program" +id +"input");
	var lines = textArea.val().toLowerCase().split('\n');

	var memLocation = parseInt(cpu.of);

	for(var i = 0;i < lines.length;i++){

		// strip out comments:
		var line = lines[i].split(';')[0];

		// strip out blank lines
		if (!line || line.length < 4) {
			continue;
		}

		console.log("----------------------");
		console.log("Line: #" +line +"#");

		// Labels are special cases.  They just point to current memory location.
		var labelRegex = /.+:/;
		if (line.match(labelRegex)) {
			var labelName = line.split(':')[0];
			labelName = labelName.replace(/\t|\s/g).replace(" ","").replace(":", "");
			cpu.labels[labelName] = memLocation;
			console.log("Found label: #" +labelName +"# memLocation: " +memLocation);
			continue;
		}	

		memLocation += 2;

	}


}

/**
* This is our 'master' function.  It takes a cpu id and loads program from memory (obeying memory offsets).
*/
function loadProgram(id) {

	preParser(id);

	var cpu = (id === 0) ? cpu0 : cpu1;
	clearError(id); // clear all errors

	var code = new Uint8Array(128);
	var codeCount = 0;
	var currentLine = 0;

	var textArea = $("#program" +id +"input");
	var lines = textArea.val().toLowerCase().split('\n');

	var lineNumber = 0; // for debugging.

	// This gets incremented as we load into memory
	var memLocation = parseInt(cpu.of);

	for(var i = 0;i < lines.length;i++){

		lineNumber++;

		// strip out comments:
		var line = lines[i].split(';')[0];

		// strip out blank lines
		if (!line || line.length < 4) {
			continue;
		}

		// labels must be 4 or more characters long (including ending :)
	
		console.log("----------------------");
		console.log("Line: #" +line +"#");

		var labelRegex = /.+:/;
		if (line.match(labelRegex)) {
			// Support for labels on instruction lines.
			line = line.split(':')[1];

			// Just a label, skip since this is handled in preparser
			if (!line) {
				continue;
			}

		}
		/*
		// Labels are special cases.  They just point to current memory location.
		var labelRegex = /.+:$/;
		if (line.match(labelRegex)) {
			var labelName = line.replace(/\t|\s/g).replace(" ","").replace(":", "");
			cpu.labels[labelName] = memLocation;
			console.log("Found label: #" +labelName +"# memLocation: " +memLocation);
			continue;
		}	*/

		var machineCode = getMachineCode(cpu, line);
		if (machineCode[0] == 0x00) {
			printError(id, "Error loading program on line: " +lineNumber +" Line: '" +line +"' Code Returned: "
			+" bytes [ " +d2h(machineCode[0],2) +" , " +d2h(machineCode[0], 2)
			+" ] nibbles [ " 
				+d2h(machineCode[0]<<4,1) +" , "
				+d2h(machineCode[0]&0x0F,1) +" , "
				+d2h(machineCode[1]<<4,1) +" , "
				+d2h(machineCode[1]&0x0F,1) 
			+" ]");
			return;
		}
		//console.log("Mach: " +d2h(getMachineCode(line)[0],2) +d2h(getMachineCode(line)[1],2));
		console.log("[" +d2h(memLocation,2) +"] MACH: " +d2h(machineCode[0], 2) +d2h(machineCode[1], 2));

		code[currentLine] = machineCode[0];
		currentLine++;
		code[currentLine] = machineCode[1];
		currentLine++;

		codeCount+=2;
		memLocation += 2;
	}

	console.log("##############################");
	var offset = cpu.of;

	var location = (offset) % 256;

	console.log( "Memory offset for cpu: " +id + " Offset: " +d2h(offset,2) +" Location: " +location);

	// Stop writing program once we get to end of code OR we're over 128 bytes.
	for (var  i=0; i <(codeCount||i<128);  i++) {

		// Wrap around to start if we overflow.
		var oflocation = (location+i)%256;
		memory[oflocation] = code[i];

		cpu.programMap[oflocation] = true;
		cpu.programMap[oflocation+0x01] = true;
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
	return (0);
}


/**
* This is called from 'loadProgram'.
* If you give it a line of assembly (ie: "load R1,[0x00]") it will return the bytecode.
* requires cpu object, so we can look up labels.
* returns 3 bytes
* [0] : instruction
* [1] : data
*
* on error, [0] will be 0x00;
*/
function getMachineCode(cpu, line) {

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
		console.log("Base Location: "+location);
		// is number
		if (!isNaN(parseFloat(location))) {

			console.log("Offset: " +cpu.of);
			// Add offset here, hack so jmp will work.
			if (cpu.realMem) {
				console.log("Using real memory addressing for location: " +location);
				location = parseInt(location);
			} else {
				console.log("Using relative memory addressing for location: " +location +" with offset: " +cpu.of);
				location = parseInt(location) + parseInt(cpu.of);
			}
			console.log("Code Location: " +location);
			machineCode[1] = location;
		} else {
			var labelName = location.replace(/\t|\s/, '');
			location = cpu.labels[labelName];
			console.log("Found label: #" +labelName +"#" +" address lookup: " +location);
			machineCode[1] = location;
		}
		console.log("Code Location: " +location +" MachineCode[1]: " +machineCode[1]);


		return (machineCode);
	}

	// Jmp is just a jmpeq R0=R0, label
	if (instruction === "jmp") {

		machineCode[0] = 0xB0; // Always compare R0=R0

		var labelName = line.split(' ')[1].replace(/\t|\s/, '');
		var location = d2h(cpu.labels[labelName],2);
		console.log("Label: #" +labelName +"# Value: " +location);

		// TODO: jmp to label is buggy if we have an offset
		console.log("jmp to label: " +labelName +" location: " +location);

		machineCode[1] = cpu.labels[labelName];
		return (machineCode);
	}

	// This is second half of instruction (operands).
	var secondHalf = line;
	
	// Need to strip out user spaces.
	secondHalf = secondHalf.replace(instruction, "");
	secondHalf = secondHalf.replace(/\t|\s/, "");

	// Returns error if we have trouble parsing this..
	if (!secondHalf || secondHalf.match(',') == null) {
		machineCode[0] = 0x00;
		machineCode[1] = 0x00;
		return (machineCode);
	}

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
		secondHalf = secondHalf.replace("[", "");
		secondHalf = secondHalf.replace("]", "");

		// This is a memory operation if there are brakcets and only 1 registor detected in operands.
		if (regops == 1) {
			memOnly=true;
		}
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
			// flip them... ?? This is what simple sim does.
			machineCode[1] = (operands[1]<<4) | operands[0];

			// exepct for store... lol
			if (instruction == "store") {
			machineCode[1] = (operands[0]<<4) | operands[1];
			}
		}

		if (regops == 3) {
			machineCode[0] = (opCode << 4) | operands[0];
			machineCode[1] = (operands[1]<<4) | operands[2];
		}
	}






return (machineCode);
}


