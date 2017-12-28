var query;
var problemData;
var gameData = {
    getElapsedTime: function(){return new Date().getTime() - this.startMillis; }
};
var solvedData;
$(function(){
	query=parse_query_string(location.search.substring(1));
    setEvents();
    solvedData = JSON.parse(localStorage.getItem("solved_data"));
    // solvedData = Cookies.getJSON("solved_data");
    if(solvedData == null) solvedData = {};
    $.ajax({
        url: "data.txt",
        type: "get",
        data: {},
        xhr: function () {
            var xhr = $.ajaxSettings.xhr();
            xhr.onprogress = function (e) {
                if (e.lengthComputable) {
                    setProgressBarValue(e.loaded / e.total);
                    console.log(e.loaded);
                }
            };
            return xhr;
        }
    }).done(function(data){
        try{
            var decrypted = CryptoJS.AES.decrypt(
                    data,localStorage.getItem("encryption_key"))
                .toString(CryptoJS.enc.Utf8);
            problemData = JSON.parse(decrypted);
        }catch(error){
            console.log("Parsing Error");
            goLoginPage();
        }
        initGame();
    });
});

function setEvents(){
    window.addEventListener("keydown", keyDown);
    $("div.game-wrapper").click(pageClicked);
    $("div.quit-button").click(function(event){
        event.stopPropagation();
        goToResultPage();
    });
    $("div.skip-button").click(function(event){
        event.stopPropagation();
        skipQuestion();
    });
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
        if(solvedData[id] === void 0)
            solvedData[id]=[];
        if(problem.word_source_index < query.start ||
           query.end < problem.word_source_index)
            continue;
        gameData.questionIdList.push(id);
    }
    if(gameData.questionIdList.length == 0)
        returnToTopPage(true, "該当する問題がありません。");
    if(query.mode == "recent"){
        var lastPlayed = {};
        for(var i=0; i<gameData.questionIdList.length; i++){
            var id=gameData.questionIdList[i];
            if(solvedData[id].length == 0) lastPlayed[id] = 0;
            else lastPlayed[id] = 
                solvedData[id][solvedData[id].length - 1].time;
            lastPlayed[id] += 6 * 60 * 60 * 1000 * Math.random();
        }
        gameData.questionIdList
            .sort(function(a,b){return lastPlayed[a]-lastPlayed[b];});
    }else if(query.mode=="wrong"){
        var risks = {};
        for(var i=0; i<gameData.questionIdList.length; i++){
            var id=gameData.questionIdList[i];
            var record=solvedData[id];
            var sum=0, denominator = 1e-10;
            var now=new Date().getTime();
            for(var j=0; j<record.length; j++){
                var data=record[j];
                var factor=Math.pow(2, -(now-data.time)/(7*24*60*60*1000));
                sum+=(data.correct?-factor:factor)
                denominator+=factor;
            }
            risks[id]=sum/denominator;
            if(sum!=0){
                console.log(id, sum/denominator);
            }
        }
        gameData.questionIdList
            .sort(function(a,b){return risks[b]-risks[a];});
    }else{
        shuffle(gameData.questionIdList);
    }
    if(query.question_count) gameData.questionIdList = 
        gameData.questionIdList.slice(0, query.question_count)
    gameData.currentQuestionCount = 0;
    gameData.showingAnswer = false;
    gameData.correctCount = 0;
    gameData.incorrectCount = 0;
    gameData.startTime = new Date().getTime();
    gameData.showTranslation = (query.show_translation == "on");
    gameData.timeLimit = parseFloat(query.time_limit) * 1000;
    if(!(gameData.timeLimit >= 0)) gameData.timeLimit = 0;
    reloadProblem();
    $("div.quit-button").show();
    $("div.skip-button").show();
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
    setProblemStatementHTML(
        $("#quiz-game-main-section>p.problem-statement"), problem);
    setAnswerStatementHTML(
        $("#quiz-game-main-section p.answer-statement"), problem, false);
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

function clickChoices(index, clickEvent){
    if(!gameData.showingAnswer){
        decideChoices(index);
        clickEvent.stopPropagation();
    }
}

function decideChoices(index){
    $("#quiz-game-main-section li").eq(index).addClass("wrong_choice");
    var problem = currentProblem();
    var ans = gameData.answerIndex;
    finishQuestion(index == ans);
}

function skipQuestion(event){
    if(gameData.showingAnswer) return;
    $("#quiz-game-main-section li").addClass("wrong_choice");
    finishQuestion(false);
}

function pageClicked(){
    goNextProblem();
}

function goNextProblem(){
    if(gameData.showingAnswer){
        if(++gameData.currentQuestionCount 
           >= gameData.questionIdList.length){
            goToResultPage();
            return;
        }
        gameData.showingAnswer = false;
        reloadProblem();
    }
}

function keyDown(event){
    if(!gameData.showingAnswer){
        for(var i = 0; i < 4; i++){
            if(event.key != i+1) continue;
            decideChoices(i);
        }
        if(event.key == "0") skipQuestion();
    }else{
        var isSelection=false;
        for(var i = 0; i <= 4; i++) 
            if(event.key==i) isSelection=true;
        if(!isSelection) goNextProblem();
    }
}

function reloadTimer(){
    if(gameData.showingAnswer) return;
    var rate=1-gameData.getElapsedTime()/gameData.timeLimit;
    if(rate<=0){
        console.log("end!");
        $("#quiz-game-main-section li").addClass("wrong_choice");
        finishQuestion(false);
        rate = 0;
    }
    setProgressBarValue(rate);
    if(!gameData.showingAnswer) setTimeout(reloadTimer, 100);
}

function setProgressBarValue(rate){
    $("div.progress-bar-colored").css("width", rate*100+"%");
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
    setAnswerStatementHTML(
        $("#quiz-game-main-section p.answer-statement"), problem, true);
    $("p.system-message").text("画面タップで次へ");
    $("#quiz-game-main-section div.answer-div").show();
    solvedData[problem.id].push({
        id: problem.id,
        time: new Date().getTime(), 
        correct: isCorrect
    });
    localStorage.setItem("solved_data", JSON.stringify(solvedData));
//    Cookies.set("solved_data", solvedData, 
//               {expires: 365});
//    console.log(Cookies.get("solved_data"));
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
        incorrect_count: gameData.incorrectCount,
        start_time: gameData.startTime,
        end_time: new Date().getTime()
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