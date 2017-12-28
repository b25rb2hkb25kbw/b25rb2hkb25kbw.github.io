var query;
var problemData;
var solvedData;

$(function(){
	query=parse_query_string(location.search.substring(1));
    query.start_time = parseInt(query.start_time);
    query.end_time = parseInt(query.end_time);
    var ok=parseInt(query.correct_count), 
        all=ok + parseInt(query.incorrect_count);
    if(all==0 || isNaN(all)) returnToTopPage();
    $("#count-result").text("結果："+ok+"問正解／"+all+"問中 （"+(ok/all * 100).toFixed(1)+"%） ");
    $("#return-button").click(returnToTopPage);
    solvedData = JSON.parse(localStorage.getItem("solved_data"));
    $.get("data.txt", function(data){
        try{
            var decrypted = CryptoJS.AES.decrypt(data,Cookies.get("encryption_key")).toString(CryptoJS.enc.Utf8);
            problemData = JSON.parse(decrypted);
        }catch(error){
            console.log("Parsing Error");
            goLoginPage();
        }
        addWrongProblems();
    });
});

function addWrongProblems(){
    var wrongResults = [];
    for(var i = 0; i < problemData.problemIdList.length; i++){
        var id = problemData.problemIdList[i];
        var resultList = solvedData[id];
        for(var j = 0; j < resultList.length; j++){
            var result = resultList[j];
            if(query.start_time <= result.time && 
              result.time < query.end_time &&
              !result.correct)
                wrongResults.push(result);
        }
    }
    for(var i = 0; i < wrongResults.length; i++){
        var result = wrongResults[i];
        var problem = problemData.problems[result.id];
        var newItem = $("section.wrong-problems-item.template")
            .clone().removeClass("template");
        setProblemStatementHTML(
            newItem.find("p.problem-statement"), problem);
        setAnswerStatementHTML(
            newItem.find("p.answer-statement"), problem, true);
        newItem.appendTo("#wrong-problems");
    }
    if(wrongResults.length == 0) 
        $("#wrong-problems").hide();
}

function returnToTopPage(){
    location.href = "./index.html";
}