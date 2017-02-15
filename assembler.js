/**
* These are load and assembler functions.
*/


/**
 *  This pre parsers our program, it does two things:
 *  1) cleans up text format and changes into internal format.
 *  2) Collects memory addresses for labels
 */
function preParser(cpu, textArea) {

	var lines = textArea.val().toLowerCase().split('\n');

	var lineCount = 0;
	var newLines = [];

	// Loop 1:
	// Remove null lines, spaces/tabs and comments
	// Switch space delimeter with comma
	// convert to lower case.
	for(var i = 0;i < lines.length;i++){

		// strip out comments:
		var line = lines[i].split(';')[0];
		//console.log("Staring line: #" +line +"#");

		// Remove leading spaces
		line = line.trim();
		// remove duplicate spaces
		line = line.replace(/\s{2,}|\t{2,}/g, ' ');
		//console.log("Trimmed line: #" +line +"#");

		// strip out blank lines, labels should be at least 4 characters
		if (!line || line.length < 4) {
			continue;
		}

		// We need to temporarily remove label while we parse out op and operands.
		var labelName = '';
		if (line.match('.+:')) {
			labelName = line.match('.+:')[0];
			line = line.replace(labelName, '');
			line = line.trim();
		}

		var lineData = line.split(/\s|\t/);

		// strip out spaces and tabs
		var newLine = "";
		for (var j=0; j<lineData.length; j++) {

			newLine += lineData[j].replace(/\t|\s/g, '');

			// use comma for instruction delimeter for now on
			if (j==0 && lineData.length > 1) {
				newLine +=",";
			}

		}

		// Should be good, re-add label if there is one.
		newLine = labelName +newLine;

		// Convert to lower case
		newLine = newLine.toLowerCase();

		newLines[lineCount] = newLine;
		lineCount++;
	}


	// Loop 2:
	// Gather label data and convert to mem addressing.
	// This is counter intutive, but cpu instruction convert relative addresses.
	// But labels need to be relative, even if cpu is set to real addressing.
	// So we subtract the offset so it works for labels and don't have to change constant mem coordinates.
	var memLocation = parseInt(0x00);
	if (cpu.realMem) {
		memLocation = parseInt(cpu.of);
	}
	//	cpu.of);

	for(var i = 0;i < newLines.length;i++){

		var line = newLines[i];

		// Labels are special cases.  They just point to current memory location.
		var labelRegex = /.+:/;
		if (line.match(labelRegex)) {

			// labels can be on same line as instructions, strip them out.
			var labelName = line.split(':')[0];

			// Set it.
			cpu.labels[labelName] = memLocation;
			console.log("Found label: #" +labelName +"# memLocation: " +memLocation);

			// Remove label
			line = line.replace(labelName +':', '');

			//console.log("Modified line after label: " +line);

			// remove labels from our text since they are no longer needed.
			if (line.length < 1) {
				newLines.splice(i, 1); 
			} else {
				newLines[i] = line;
			}

		}	

		memLocation += 2;
	}

	// Loop 3:
	// Subsitution
	for(var i = 0;i < newLines.length;i++){

		var line = newLines[i];
		var lineData = line.split(/,/);

		// Update labels with memory addresses.
		var jmpOffset = false;
		for (var j=1; j<lineData.length; j++) {

			if (typeof lineData[j] === 'string' && lineData[j].match(/[a-z]{4,}/)) {

				var address = cpu.labels[lineData[j]];

				if (address !== undefined) {

					// load of label is really a 'loadm' instructions.  
					// Put in brakets so it gets detected below.
					if (lineData[0] == "load") {
						lineData[j] = "[" +address +"]";
					} else{
						// This is ok for jmp
						lineData[j] = address;
					}

				} else {
					printError(cpu.id, "Error parsing program: Found memory label: '" +lineData[j] +"' but has no address defined! Did you forget label?");
				}
			} else if (lineData[0] == "jmpeq") {
				jmpOffset = true;
			}
		}

		if (jmpOffset) {
			console.log("Checking jmpeq");
			// special case for jmplabel
			// Labels get set to realtive address.
			// But if they are using a constant address, we need to update with offset if using relative memory model
			if (!cpu.realMem) {
				console.log("jmpeq relative offset, before: " +lineData[2]);
				lineData[2] = parseInt(lineData[2]) + cpu.of;
				console.log("jmpeq relative offset, after: " +lineData[2]);
			}
		}



		// Instructions 'load' and 'store', change to internal opcodes if working with memory instead of immediate values
		if (lineData[0] == "load" || lineData[0] == "store") {

			if ( typeof lineData[2] === 'string' && lineData[2].match(/\[/)) {

				// If this has a [R4] value (only for store), it's using reg not memory so don't set.
				// Load doesn't load from reg, only memory or value
				if (!lineData[2].match(/\[r(\d{1,}|[a-f])\]/)) {
					lineData[0] += "m";
				}

				lineData[2] = lineData[2].replace("[", "").replace("]", "");

			}

		}			

		// Remove 'r' from registor locations.
		for (var j=1; j<lineData.length; j++) {
			if (typeof lineData[j] === 'string') {
				lineData[j] = lineData[j].replace('r', '');
			}
		}

		// Convert to numbers
		for (var j=1; j<lineData.length; j++) {

			if (typeof lineData[j] !== 'string') {
			       continue;
			}

			if (lineData[j].match('[0,1]{8,8}b$')) {
				// parse binary
				lineData[j] == lineData[j].replace('b', '');
				lineData[j] = parseInt(lineData[j], 2);
			} else if (lineData[j].match(/[a-f]/) && !lineData[j].match("0x") ) {
				// parse hex
				lineData[j] = parseInt("0x" + lineData[j]);
			} else {
				// probably digit
				lineData[j] = parseInt(lineData[j]);
			}
		}


		// push back into array after modification
		var newLine = lineData.join(",");
		newLines[i] = newLine;
	}


	return (newLines);
}

/**
* This is our 'master' function.  It takes a cpu id and loads program from memory (obeying memory offsets).
*/
function loadProgram(id) {

	var cpu = (id === 0) ? cpu0 : cpu1;
	clearError(id); // clear all errors

	var textArea = $("#program" +id +"input");

	var lines = preParser(cpu, textArea);

	// for testing only, this prints internal text to output console
	/*
	var text = lines.join("\n");
	printError(id, "-------------------------------");
	$("#program" +id +"output").append(text +"\n");
	printError(id, "-------------------------------");
	*/

	var code = new Uint8Array(128);
	var codeCount = 0;
	var currentLine = 0;

	// TODO: make sure cpu.of is always input as number
	var memLocation = cpu.of;

	for(var i = 0;i < lines.length;i++){

		var line=lines[i];

		var machineCode = [ 0x00, 0x00];
		var error;
		try {
			machineCode = getMachineCode(cpu, line);
		} catch (e) {
			error = e;
		}
		if (machineCode[0] == 0x00 || error) {
			printError(id, "Error loading program on internal line: " +currentLine +" Line: '" +line +"' Code Returned: "
			+" bytes [ " +d2h(machineCode[0],2) +" , " +d2h(machineCode[0], 2)
			+" ] nibbles [ " 
				+d2h(machineCode[0]<<4,1) +" , "
				+d2h(machineCode[0]&0x0F,1) +" , "
				+d2h(machineCode[1]<<4,1) +" , "
				+d2h(machineCode[1]&0x0F,1) 
			+" ]. Exception : " +error);
			return;
		}

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
	for (var  i=0; (i<codeCount&&i<128);  i++) {

		// Wrap around to start if we overflow.
		var oflocation = (location+i)%256;
		memory[oflocation] = code[i];

		cpu.programMap[oflocation] = true;
	}

	// Set PC to starting location
	cpu.ppc=null;
	cpu.pc=location;
}

// retruns an opt code based on instruction.
// brakcets can denoate context
// switch is awkward, probably should have did as a map with edge case.
function getOpCode(line) {
	
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
	// In case it doesn't parse right, we return error instruction (0x00)
	machineCode[0] = 0x00;
	machineCode[1] = 0x00;

	var lineData = line.split(',');
	instruction  = lineData[0];
	console.log("----- MARCH ------");
	console.log("instruction: #" +instruction +"#");


	var opCode = getOpCode(lineData[0]);
	var operands = line.split(/,/);

	var type = null
	// Valid types: 
	// null
	// R,BYTE
	// R,R
	// R,R,R
	// BYTE
	
	switch (instruction) {
		case "load":
		case "loadm":
		case "storem":
		case "ror": 
		case "jmpeq": 
			type = "rb";
		break;

		case "store":
		case "move": 
			type="rr";
		break;

		case "addi": 
		case "addf": 
		case "or": 
		case "and": 
		case "xor": 
			type="rrr";
		break;

		case "jmp": 
			type="b";
		break;

		case "halt": 
			type = "null";
		break;
	};

	console.log("MachineParse: Instruction : " +instruction +" opCode: " +opCode 
			+" Operands length: " +operands.length +" Operands " +JSON.stringify(operands) +" type: " +type);

	machineCode[0] = (opCode << 4);

	switch (type) {
		case "rb":
			machineCode[0] = machineCode[0] | operands[1];
			machineCode[1] = operands[2];
		break;

		case "rr":
			machineCode[0] = machineCode[0] & 0xF0;
			machineCode[1] = (operands[1] << 4 | operands[2]);
		break;

		case "rrr":
			machineCode[0] = machineCode[0] | operands[1];
			machineCode[1] = (operands[2] << 4 | operands[3]);
		break;

		case "b":
			machineCode[0] = machineCode[0] & 0xF0;
			machineCode[1] = operands[1];
		break;

		case "null":
			machineCode[0] = machineCode[0] & 0xF0;
			machineCode[1] = 0x00;
		break;
	}

	console.log("MCODE: " +getMCString(machineCode));

return (machineCode);
}



/**
 * Converts to user friendly string for debugging
 **/
function getMCString(machineCode) {

	var string = "Bytes: [ " +d2h(machineCode[0],2) +" , " +d2h(machineCode[1],2) +" ]"
			+" Nibbles: [ " +d2h(machineCode[0] >> 4,1) 
			+" , " +d2h(machineCode[0]&0x0F,1)
			+" , " +d2h(machineCode[1]>> 4,1)
			+" , " +d2h(machineCode[1]&0x0F,1)
			+" ]";

	return (string);
}
