/**
*  Controller functions. 
*/

function openCodes() {
	window.open("codes.html", "_blank", "toolbar=no,scrollbars=yes,resizable=yes,top=500,left=500,width=900,height=400");
}

// helper function to enable/disable buttons
function buttonsHalt(halt) {

	// if halted, we want to re-enable our run buttons.
	if (halt) {
		$("#button_runsim").prop("disabled",false);
		$("#button_step").prop("disabled",false);
	} else {
		// dont' let user press two 'runsim' buttons at same time, it'll get wonky.
		$("#button_runsim").prop("disabled",true);
		$("#button_step").prop("disabled",true);
	}
}

// helper function for global buttons.
function buttonClick(button) {

	var selector = $("#" +button);

	console.log("Button Clicked: " +button);

	switch(button) {

		case "button_runsim":
			buttonsHalt(false);
			sim.running=true;
			sim.runLoop();
		break;

		case "button_break":
			sim.halt();
			buttonsHalt(true);
		break;

		case "button_step":
			sim.halt();
			buttonsHalt(true);
			sim.runNextStep();
		break;

		case "button_cpuspeed":
			var val = $("#cpuspeed").val();

			if (val < 10 || val > 10000) {
				alert ("CPU Step speed should be between 10 ms and 10,000 ms");
				return;
			} else {
				sim.cpuSpeed = val;
			}

			$("#currentcpuspeed").html(sim.cpuSpeed);
		break;

		case "button_clearmemory":
			sim.halt();
			buttonsHalt(true);
			memory.reset();
		break;

		case "load0": 
			loadProgram(0);
		break;

		case "load1": 
			loadProgram(1);
		break;

		case "button_pload0":
		case "button_pload1":

			var c = button.match(/button_pload([0-9])/);
			var cpuid = parseInt(c[1]);
			var cpu = (cpuid == 0) ? cpu0 : cpu1;
			var programName = $( "#cpu" +cpuid +"programs option:selected" ).text();
			console.log("Selected program: " +programName +" for CPU: " +cpuid);

			var program = programs.getProgram(programName);
			console.log("Program length: " +program.length);

			var textArea = $("#program" +cpuid +"input");
			textArea.val(program);

			// also load in memory to make it easy
			if (cpuid == 0) {
				loadProgram(0);
			} else {
				loadProgram(1);
			}
		break;


		case "button_memoryof0":
		case "button_memoryof1":

			var c = button.match(/button_memoryof([0-9])/);
			var cpuid = parseInt(c[1]);
			var cpu = (cpuid == 0) ? cpu0 : cpu1;

			var val = $("#memoryof" +cpuid).val();

			var mmVal = (cpuid==0) ?  $('input[name=mm0]:checked').val() : $('input[name=mm1]:checked').val();

			//alert("MMVAL selected: " +mmVal +" for cpu: " +cpuid);

			// TODO: needs to be even value
			if (val < 0 || val > 255 || val % 2 != 0) {
				alert ("Valule needs to be an EVEN number between 0 and 254");
				return;
			}

			selector.val(val);
			cpu.realMem= (mmVal == "real");

			cpu.real

			memory.reset();

			// reset cpu or gets in funky state.
			cpu.reset(); 
			cpu.of = val;

			// reload both to make it user friendly
			loadProgram(0);
			loadProgram(1);

		break;

		case "button_resetcpu0":
		case "button_resetcpu1":

			sim.halt();
			buttonsHalt(true);

			var c = button.match(/button_resetcpu([0-9])/);
			var cpuid = parseInt(c[1]);

			var cpu = (cpuid == 0) ?  window.cpu0 : window.cpu1;
			cpu.reset();

			// reloading to clear memory colors
			loadProgram(cpuid);

		break;

		case "button_resetcpus":
			sim.halt();
			buttonsHalt(true);

			cpu0.reset();
			cpu1.reset();
			loadProgram(0);
			loadProgram(1);

		break;
		case "button_resetall":
			sim.halt();
			buttonsHalt(true);
			sim.reset();
			loadProgram(0);
			loadProgram(1);
		break;

		case "disablecpu1":

			cpu1.disabled = !cpu1.disabled;
			if (cpu1.disabled) {
				cpu1.status="disabled";
				$("#tablecpu1").css("background-color", "dimgray");
				$("#tablecpu1controls").css("background-color", "dimgray");
			} else {
				cpu1.status="ready";
				$("#tablecpu1").css("background-color", "white");
				$("#tablecpu1controls").css("background-color", "white");
			}
			







		break;


	}

	sim.display();
}

