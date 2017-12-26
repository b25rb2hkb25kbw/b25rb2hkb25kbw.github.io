var query;

$(function(){
	query=parse_query_string(location.search.substring(1));
    var ok=parseInt(query.correct_count), 
        all=ok + parseInt(query.incorrect_count);
    if(all==0 || isNaN(all)) returnToTopPage();
    $("#count-result").text("結果："+ok+"問正解／"+all+"問中 （"+(ok/all * 100).toFixed(1)+"%） ");
    $("#return-button").click(returnToTopPage);
});

function returnToTopPage(){
    location.href = "./index.html";
}