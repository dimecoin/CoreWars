
var programs = {

	init: function () {

		for (var id=0; id<2; id++) {
			// var cpu = (i == 0) ? cpu0 : cpu1;
			var selector = $("#cpu" +id +"programs");

			for (var programName in this.data){
				//console.log("Adding val: " +val +" to selector: " +JSON.stringify(selector));
				selector.append('<option>'+programName+'</option>');

				var programData = $("#program_" +programName).text();
				this.data[programName]=programData;
			}

		}
	},


	getProgram : function (name) {
		return (this.data[name]);
	},

	data: {
		"test": "; error loading program",
		"slowpoke": "; error loading program",
		"loop": "; error loading program",
		"randomattack": "; error loading program",





	},
	



};



