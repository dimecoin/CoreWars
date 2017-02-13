
var programs = {

	init: function () {

		for (var id=0; id<2; id++) {
			// var cpu = (i == 0) ? cpu0 : cpu1;
			var selector = $("#cpu" +id +"programs");

			for (var programName in this.data){
				//console.log("Adding val: " +val +" to selector: " +JSON.stringify(selector));
				selector.append('<option>'+programName+'</option>');
			}

		}
	},


	getProgram : function (name) {
		return (this.data[name]);
	},

	data: {
		"test": "halt",




	},
	



};



