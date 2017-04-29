
var programs = {

	init: function () {

		for (var id=0; id<2; id++) {
			// var cpu = (i == 0) ? cpu0 : cpu1;
			var selector = $("#cpu" +id +"programs");

			for (var programName in this.data){
				//console.log("Adding val: " +val +" to selector: " +JSON.stringify(selector));
				// load loop for program1 to make testing easier
				if (programName == "loop" && id == 1) {
					selector.append('<option selected>'+programName+'</option>');
				} else {
					selector.append('<option>'+programName+'</option>');
				}

				var programData = $("#program_" +programName).text();
				this.data[programName]=programData;
			}
		}

		// load loop for program1 to make testing easier
		var programData = this.getProgram("loop");
		$("#program0input").text(programData);

		var programData = this.getProgram("loop");
		$("#program1input").text(programData);



	},


	getProgram : function (name) {
		return (this.data[name]);
	},

	data: {
		"bot_slowpoke": "; error loading program",
		"bot_randomattack": "; error loading program",

		"bot_simplebomb": "; error loading program",
		"bot_aggrobot3": "; error loading program",
		"bot_randomattack2": "; error loading program",

		"test_d": "; error loading program",
		"test_jumper": "; error loading program",
		"test_junk": "; error loading program",
		"test_load": "; error loading program",
		"test_managler": "; error loading program",
		"test_offset": "; error loading program",
		"loop": "; error loading program",


	},
	



};



