
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
		$("#program1input").text(programData);


	},


	getProgram : function (name) {
		return (this.data[name]);
	},

	data: {
		"offsettest": "; error loading program",
		"loadtest": "; error loading program",
		"test": "; error loading program",
		"slowpoke": "; error loading program",
		"loop": "; error loading program",
		"randomattack": "; error loading program",


	},
	



};



