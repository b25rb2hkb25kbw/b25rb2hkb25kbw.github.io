function parse_query_string(query) {
  var vars = query.split("&");
  var query_string = {};
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
      // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
      // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}

var query;
var problems = [];

$(function(){
	query=parse_query_string(location.search.substring(1));
	$.get("passwd", function(data){
		if(query.password_check != data){
			console.log("error");
			return;
		}
		$.get("data.txt", function(data){
			var decrypted = CryptoJS.AES.decrypt(data, query.encryption_key).toString(CryptoJS.enc.Utf8);
			console.log(decrypted);
		});
	});
});

function encryptData(fileName, password){
	$.get(fileName, function(data){
		var parsedData = {problems: []};
		var key = CryptoJS.SHA256(password + "+").toString(CryptoJS.enc.Base64);
		var lines=data.split("\n");
		for(var i = 0; i < lines.length; i++){
			var line = lines[i];
			var elems = line.split("\t");
			if(elems.length != 10) continue;
			var problem = {
				id: elems[0],
				problem_statement: elems[1],
				statement_source: elems[2],
				problem_choices:[elems[3], elems[4], elems[5], elems[6]],
				answer_statement: elems[7],
				word_source_index: elems[8],
				answer_index: elems[9]
			};
			parsedData.problems.push(problem);
			// console.log(encrypted.toString());
			// parsedData.problems.push(encrypted.toString());
		}
		console.log(parsedData);
		var encrypted = CryptoJS.AES.encrypt(JSON.stringify(parsedData), key);
		console.log(encrypted.toString());
	});
}