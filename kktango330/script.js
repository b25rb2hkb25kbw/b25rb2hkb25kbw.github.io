var query;
var problemData;
var gameData = {
    getElapsedTime: function(){return new Date().getTime() - this.startMillis; }
};

$(function(){
	query=parse_query_string(location.search.substring(1));
    setEvents();
    $.get("data.txt", function(data){
        try{
            var decrypted = CryptoJS.AES.decrypt(data,Cookies.get("encryption_key")).toString(CryptoJS.enc.Utf8);
            problemData = JSON.parse(decrypted);
        }catch(error){
            console.log("Parsing Error");
            goLoginPage();
        }
        initGame();
    });
});

function setEvents(){
    $("div.game-wrapper").click(pageClicked);
    $("div.quit-button").click(goToResultPage);
}

function initGame(){
    query.start = parseInt(query.start);
    if(query.start < 1 || query.start > 330) query.start = 1;
    query.end = parseInt(query.end);
    if(query.end < 1 || query.end > 330) query.end = 330;
    if(query.start > query.end)
        query.end = [query.start, query.start = query.end][0]; //swap
    query.question_count = parseInt(query.question_count);
    if(!(query.question_count > 0)) query.question_count = 0;
    gameData.questionIdList = [];
    for(var i=0; i<problemData.problemIdList.length; i++){
        var id = problemData.problemIdList[i];
        var problem = problemData.problems[id];
        // console.log(problem.word_source_index + ", " + query.start + ", " + query.end);
        if(problem.word_source_index < query.start ||
           query.end < problem.word_source_index)
            continue;
        gameData.questionIdList.push(id);
    }
    if(gameData.questionIdList.length == 0)
        returnToTopPage(true, "該当する問題がありません。");
    shuffle(gameData.questionIdList);
    if(query.question_count) gameData.questionIdList = 
        gameData.questionIdList.slice(0, query.question_count)
    gameData.currentQuestionCount = 0;
    gameData.showingAnswer = false;
    gameData.correctCount = 0;
    gameData.incorrectCount = 0;
    gameData.showTranslation = (query.show_translation == "on");
    gameData.timeLimit = parseFloat(query.time_limit) * 1000;
    if(!(gameData.timeLimit >= 0)) gameData.timeLimit = 0;
    reloadProblem();
    $("div.quit-button").show();
}

function currentProblem(){
    return problemData.problems[gameData.questionIdList[
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
    if(!gameData.showTranslation)
        $("#quiz-game-main-section div.answer-div").hide();
    $("#quiz-game-main-section li").remove();
    var choices = problem.problem_choices.slice();
    shuffle(choices);
    for(let i = 0;i < 4; i++){
        if(choices[i] == problem.problem_choices[problem.answer_index])
            gameData.answerIndex = i;
        $("#quiz-game-main-section ul").append($("<li>")
            .html('<span class="choice-index-mark">'
                  +String.fromCharCode('①'.codePointAt(0) + i)
                  +'</span>' + choices[i])
            .click(function(event){clickChoices(i,event);})
        );
    }
    gameData.startMillis = new Date().getTime();
    if(gameData.timeLimit > 0) reloadTimer();
}

function setAnswerDivHTML(problem, showAnswer){
    var answer = problem.answer_statement;
    if(showAnswer){
        var replacements = problem
            .problem_choices[problem.answer_index].split("／");
        let i = 0;
        answer = answer.replace(/〔　*〕/g, function(){
            if(i+1 < replacements.length) i++;
            return "<strong>" + replacements[i] + "</strong>"
        });
    }
    $("#quiz-game-main-section p.answer-statement")
        .html(answer)
        .append($("<span>")
            .addClass("statement-source")
            .text("→" + problem.word_source_index));
    $("p.system-message").text("画面タップで次へ");
}

function clickChoices(index, clickEvent){
    if(!gameData.showingAnswer){
        $("#quiz-game-main-section li").eq(index).addClass("wrong_choice");
        var problem = currentProblem();
        var ans = gameData.answerIndex;
        finishQuestion(index == ans);
        clickEvent.stopPropagation();
    }
}

function pageClicked(){
    if(gameData.showingAnswer){
        if(++gameData.currentQuestionCount >= gameData.questionIdList.length){
            goToResultPage();
            return;
        }
        gameData.showingAnswer = false;
        reloadProblem();
    }
}

function reloadTimer(){
    if(gameData.showingAnswer) return;
    var rate = 100 - gameData.getElapsedTime()/gameData.timeLimit*100;
    if(rate<=0){
        console.log("end!");
        $("#quiz-game-main-section li").addClass("wrong_choice");
        finishQuestion(false);
        rate = 0;
    }
    $("div.progress-bar-colored").css("width", rate+"%");
    if(!gameData.showingAnswer) setTimeout(reloadTimer, 100);
}

function finishQuestion(isCorrect){
    if(gameData.showingAnswer) return;
    gameData.showingAnswer = true;
    var problem = currentProblem();
    var ans = gameData.answerIndex;
    $("#quiz-game-main-section li").eq(ans).addClass("right_choice");
    if(isCorrect){
        gameData.correctCount++;
    }else{
        gameData.incorrectCount++;
    }
    setAnswerDivHTML(problem, true);
    $("#quiz-game-main-section div.answer-div").show();
}

function returnToTopPage(error, message){
    var link = "./index.html?error=true&error_message="
            + encodeURIComponent(message);
    console.log("go to login page: " + link);
    if(window.location.host == "b25rb2hkb25kbw.github.io"){
        location.href = link;
    }
}

function goToResultPage(){
    location.href = "./result.html?" + $.param({
        correct_count: gameData.correctCount,
        incorrect_count: gameData.incorrectCount
    });
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
				word_source_index: parseInt(elems[8]),
				answer_index: parseInt(elems[9])
			};
			parsedData.problems[problem.id] = problem;
            parsedData.problemIdList.push(problem.id);
			// console.log(encrypted.toString());
			// parsedData.problems.push(encrypted.toString());
		}
		console.log(parsedData);
		var encrypted = CryptoJS.AES.encrypt(JSON.stringify(parsedData), key);
		// console.log(encrypted.toString());
        var blob = new Blob([encrypted], {type: "text/plain"});var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.target = '_blank';
        a.download = outputFileName;
        a.click();
	});
}

function getPasswdString(password){
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64);
}