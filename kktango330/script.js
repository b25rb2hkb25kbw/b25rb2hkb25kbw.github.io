// var query;
var problemData;
var gameData = {};

$(function(){
	// query=parse_query_string(location.search.substring(1));
    setEvents();
    $.get("data.txt", function(data){
        try{
            var decrypted = CryptoJS.AES.decrypt(data,$.cookie("encryption_key")).toString(CryptoJS.enc.Utf8);
            problemData = JSON.parse(decrypted);
            initGame();
        }catch(error){
            console.log("Parsing Error");
            goLoginPage();
        }
    });
});

function setEvents(){
    $("div.wrapper").click(pageClicked);
}

function initGame(){
    gameData.questionIdList = [];
    for(var i=0; i<problemData.problemIdList.length; i++){
        gameData.questionIdList.push(problemData.problemIdList[i]);
    }
    shuffle(gameData.questionIdList);
    gameData.currentQuestionCount = 0;
    gameData.showingAnswer = false;
    reloadProblem();
}

function currentProblem(){
    return  problemData.problems[gameData.questionIdList[
        gameData.currentQuestionCount]];
}

function reloadProblem(){
    var questionCount = gameData.currentQuestionCount;
    var problem = currentProblem();
    $("#quiz-game-main-section>h3").html(
        "問題 " + (questionCount + 1) + "/" + gameData.questionIdList.length);
    $("#quiz-game-main-section>p.problem-statement")
        .html(problem.problem_statement)
        .append($("<span>")
            .addClass("statement-source")
            .text("（" + problem.statement_source + "）"));
    setAnswerDivHTML(problem, false);
    $("#quiz-game-main-section div.answer-div").hide();
    $("#quiz-game-main-section li").remove();
    var choices = problem.problem_choices.slice();
    shuffle(choices);
    for(let i = 0;i < 4; i++){
        if(choices[i] == problem.problem_choices[problem.answer_index])
            gameData.answerIndex = i;
        $("#quiz-game-main-section ul").append($("<li>")
            .text(choices[i])
            .click(function(event){clickChoices(i,event);})
        );
    }
}

function setAnswerDivHTML(problem, showAnswer){
    var answer = problem.answer_statement;
    if(showAnswer){
        answer = answer.replace(/〔　*〕/, "<strong>" + 
            problem.problem_choices[problem.answer_index] + "</strong>");
    }
    $("#quiz-game-main-section p.answer-statement")
        .html(answer)
        .append($("<span>")
            .addClass("statement-source")
            .text("→" + problem.word_source_index));
}

function clickChoices(index, clickEvent){
    if(!gameData.showingAnswer){
        var problem = currentProblem();
        var ans = gameData.answerIndex;
        $("#quiz-game-main-section li").eq(index).addClass("wrong_choice");
        $("#quiz-game-main-section li").eq(ans).addClass("right_choice");
        if(index == ans){
        }else{
        }
        setAnswerDivHTML(problem, true);
        $("#quiz-game-main-section div.answer-div").show();
        gameData.showingAnswer = true;
        clickEvent.stopPropagation();
    }
}

function pageClicked(){
    if(gameData.showingAnswer){
        if(++gameData.currentQuestionCount == gameData.questionIdList.length){
            returnToTopPage(false);
            return;
        }
        gameData.showingAnswer = false;
        reloadProblem();
    }
}

function returnToTopPage(error){
    console.log("go to login page");
    if(window.location.host == "b25rb2hkb25kbw.github.io"){
        location.href = "./index.html?error=true";
    }
}

function encryptData(fileName, password, outputFileName){
	$.get(fileName, function(data){
		var parsedData = {problems: {}, problemIdList: []};
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
			parsedData.problems[problem.id] = problem;
            parsedData.problemIdList.push(problem.id);
			// console.log(encrypted.toString());
			// parsedData.problems.push(encrypted.toString());
		}
		console.log(parsedData);
		var encrypted = CryptoJS.AES.encrypt(JSON.stringify(parsedData), key);
		console.log(encrypted.toString());
        var blob = new Blob([encrypted], {type: "text/plain"});var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.target = '_blank';
        a.download = outputFileName;
        a.click();
	});
}