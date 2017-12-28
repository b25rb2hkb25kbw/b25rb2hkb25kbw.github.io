$(function(){
    var passCheck=Cookies.get("password_check");
//    console.log(passCheck);
    if(passCheck === void 0){
        goLoginPage();
    }
    $.get("passwd", function(data){
//        console.log(data);
//        console.log(data == passCheck);
        if(data != passCheck) goLoginPage();
    });
});
function goLoginPage(){
    Cookies.remove("password_check");
    Cookies.remove("encryption_key");
    location.href = "./login.html";
}

//function checkPassword(elem){
//    var encrypted = CryptoJS.SHA256(elem.value).toString(CryptoJS.enc.Base64);
//    $("input[name=password_check]").val(encrypted);
//    var modifiedKey = CryptoJS.SHA256(elem.value + "+").toString(CryptoJS.enc.Base64)
//    $("input[name=encryption_key]").val(modifiedKey);
//    if(truePassword==encrypted){
//        $("#password-information").text("");
//        $("input[type=submit]").removeAttr('disabled');
//    }else{
//        $("#password-information").text("パスワードが違います。");
//        $("input[type=submit]").attr('disabled','disabled');
//    }
//}

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

function shuffle(array) {
    var counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}