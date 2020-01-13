const program = require('commander');
var request = require('request');

program.version('0.0.1');

var rawInput = process.argv;
var check = "";
var action;
var httpRequestStatus;
var baseURL = "http://localhost:8765/energy/api/"

var input = rawInput.toString().slice(rawInput.toString().search(/energy_unknownwords/), rawInput.toString().length);

//Send http GET request
function httpGetAsync(theURL, callback){
    request(theURL, function (error, response, body) {
	  callback(body); // Print the HTML for the Google homepage.
	});
}

//Send http POST request
function httpPostAsync(theURL, paramUsername, paramEmail, paramPassword){
	request.post({
		url: theURL, 
		form: {
	    	username: paramUsername,
	    	email: paramEmail,
	    	password: paramPassword}}, 
	    function(error, response, body){ 
			if (!error/* && response.statusCode == 200*/) {
		    	console.log("Your request has been successful");
		    	httpRequestStatus = true;
		    } else {
		    	console.log("An error occured. Error details:");
		    	console.log(error);
		    	httpRequestStatus = false;
		    }
	});
}

//Add required params if input is "scope"
function addScopeOptions(){
	if (input.includes("date")){
			program.requiredOption('--date <date>', 'YYYY-MM-DD');
			check += "date";
		} else if (input.includes("month")){
			program.requiredOption('--month <month>', 'YYYY-MM');
			check += "month";
		} else if (input.includes("year")){
			program.requiredOption('--year <year>', 'YYYY');
			check += "year";
		} else {
			console.log("error: required option '--date <date>' not specified")
			check = "failed"
			return;
		}
	program
		.requiredOption('--area <area>', 'Area name')
		.requiredOption('--timeres <timeres>', 'PT15M || PT30M || PT60M')
		.requiredOption('--apikey <apikey>', 'XXXX-XXXX-XXXX');
	if (input.includes("AggregatedGenerationPerType")){
		program.requiredOption('--prodtype <prodtype>', 'ProductionType.ProductionTypeText');
	} else {
		program.option('--prodtype <prodtype>', 'ProductionType.ProductionTypeText')
	}
	program.option('--format <format>', 'json (default) || csv', 'json');
}

//Add required params if input is "newuser" or "moduser"
function addUserOptions(){
	program
		.requiredOption('--passw <password>', 'User password')
		.requiredOption('--email <email>','User email')
		.requiredOption('--quota <quota>','User quota')
		.option('--userstatus <username>','Username');
}

//Decide which set of params to add
function addOptions(string){
	program.requiredOption('--scope <scope>', 'ActualTotalLoad || AggregatedGenerationPerType || DayAheadTotalLoadForecast || ActualvsForecast || Admin');
	if (!string.toLowerCase().includes("admin")){
		addScopeOptions();
		action = "scope"
		return;
	} else if (input.includes("newuser")){
		program.requiredOption('--newuser <username>','Username for new user');
		addUserOptions();
		action = "newuser"
		return;
	} else if (input.includes("moduser")){
		program.requiredOption('--moduser <username>','Username of user');
		addUserOptions();
		action = "moduser"
		return
	} else if (input.includes("newdata")){
		program.requiredOption('--newdata <dataType>', 'Data to be added to the database');
		program.requiredOption('--source <fileName>', 'CSV file to add to database');
		action = "newdata";
	} else {
		console.log("Accepted parameters with --scope Admin include:\n  --newuser <username>\n  --moduser <username>\n  --newdata <fileName>\ntype --help for more info");
	}
}

//Create a url and send appropriate http request
function sendHTTP(action){
	if (action === "scope"){
		baseURL += program.scope + "/";
		baseURL += program.area + "/";
		baseURL += program.timeres + "/";
		baseURL += check + "/";
		if (check === "date"){
			baseURL += program.date.substr(0, 4) + "-";
			baseURL += program.date.substr(5, 2) + "-";
			baseURL += program.date.substr(8, 2);
		} else if (check === "month"){
			baseURL += program.month.substr(0, 4) + "-";
			baseURL += program.month.substr(5, 2);
			//Server side "null" code
			//baseURL += "00/";
		} else if (check === "year"){
			baseURL += program.year.substr(0, 4);
			//Server side "null" code
			//baseURL += "00/";
			//baseURL += "00/";
		} else {
			if (check !== "failed"){
				console.log(check);
				return;
			}
			return;
		}
		if (program.format === "json" || program.format === "csv")
		baseURL += "&format="+program.format; 
		httpGetAsync(baseURL, console.log);
	} else if (action === "newuser"){
		baseURL += "users/new/"
		httpPostAsync(baseURL, program.newuser, program.email, program.passw);
		if (httpRequestStatus/* === 200 or 303 or some shit*/){
			console.log("Success!")
			console.log("Use the --moduser parameter to modify user info.")
		}
	} else if (action === "moduser"){
		var userID = "test"; //for testing purposes
		baseURL +="users/" + userID;
		//Need to create said function
		httpPutAsync(baseURL, program.moduser, program.email, program.passw);
	}
}

//Code execution starts here
if(input === "energy_unknownwords" || input === "energy_unknownwords.js"){
	console.log("Accepted parameters include:\n  --scope <value>\n  --newuser <username>\n  --moduser <username>");
} else {
	addOptions(input);
	program.parse(rawInput);
	sendHTTP(action);
	// console.log("------------");
	// console.log(baseURL);
	// console.log("------------");
}

// New params required:
// (newdata) required --source filename
// --scope admin