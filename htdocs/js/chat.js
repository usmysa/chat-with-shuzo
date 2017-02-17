var socket = io();
var msg_id = 0; //チャットのid

// 入力補完の設定
function startSuggest() {
  new Suggest.Local(
        "text",    // 入力のエレメントID
        "suggest", // 補完候補を表示するエリアのID
        ['@shuzo:修造の名言を聞く', '@shuzo:修造の動画を見る', '@shuzo:修造にユーザ一覧を聞く'],      // 補完候補の検索対象となる配列
        {dispMax: 10, interval: 1000}); // オプション
}

// Enterキーが押されたら自動送信
$("#text").keypress( function (e) {
	if ( e.which == 13 ) {
		send_message();
		return false;
	}
});

// 送信ボタンを押した時の処理
$("#sendBtn").click(function(){
  send_message();
});

$("#exitBtn").click(function(){
  location.replace('./index.html');
  socket.emit("disconnect");
});

// サーバにテキストを送信
function send_message() {
  // 空文字チェック
  if ($("#text").val() != ""){
    socket.emit("send_message", {message:$("#text").val(), sender_name:username}, "text"); // サーバに送信
    $("#text").val("").focus();
  } else
    alert("テキストを入力してください！"); // 空文字の場合、アラートを表示
}

// イメージをエンコード
function imageEncoder(image){
  var fileReader = new FileReader() ;
  fileReader.onload = function() {
    var encodedImage = this.result;
    socket.emit("send_message", {message:encodedImage, sender_name:username}, "image");
  }
  fileReader.readAsDataURL(image) ;
}

// ブラウザ上でファイルを展開する挙動を抑止
function onDragOver(event) {
  event.preventDefault();
}

// Drop領域にドロップした際のファイルのプロパティ情報読み取り処理
function onDrop(event) {
  event.preventDefault(); // ブラウザ上でファイルを展開する挙動を抑止

  var files = event.dataTransfer.files; // ドロップされたファイルのfilesプロパティを参照
  for (var i = 0; i < files.length; i++) {
      var filetype = files[i]["type"].split("/")[0];
      if (filetype == "image")
        imageEncoder(files[i]) // 1枚ずつエンコードしてアップロード
      else { //画像ではなかった場合
        msg_id++;
        $("#messages").append('<div class="alert alert-danger" id="alertfadeout' +  msg_id + '" style="text-align:center;">\
                                画像ファイル（png, jpeg, gif）をアップロードしてください！</div>');
        var order = "$('#alertfadeout" + msg_id + "').fadeOut()";
        setTimeout(order, 3000); // 3秒後に自動削除
        $("#messages").scrollTop($("#alertfadeout" + msg_id).get(0).offsetTop); // 自動スクロール
      }
  }
}

/*--- それぞれのイベントを登録 ---*/
socket.on("connected", function (name) {} );
socket.on("disconnect", function() {} );

// メッセージが来た時の処理
socket.on("receive_message_txt", function(info) {
  // 時刻が "7:41:30 JST" となるので、"JST"部分を削除して時刻情報を付与
  var msg = info["message"],
      sender = info["sender_name"],
      time = new Date().toLocaleTimeString().replace("JST", "");

  var element;
  msg_id++;
  if(sender == username){
    if(30 < msg.length)
      $("#messages").append('<div id="msg' + msg_id + '" class="msgArea_right"><div class="msg_right">' + msg + '</div>\
                             <div class="msg_time" style="margin-right:.5em;">' + time + '</div></div>');
    else
      $("#messages").append('<div id="msg' + msg_id + '" class="msgArea_right"><div class="msg_right" style="display:inline;">' + msg + '</div>\
                             <div class="msg_time" style="margin-right:.5em;">' + time + '</div></div>');
  }else{
    if(30 < msg.length)
      $("#messages").append('<div id="msg' + msg_id + '" class="msgArea_left"><div class="msg_name">' + sender + '</div>\
                             <div class="msg_left">' + msg + '</div>\
                             <div class="msg_time" style="margin-left:.5em;">' + time + '</div></div>');
    else
      $("#messages").append('<div id="msg' + msg_id + '" class="msgArea_left"><div class="msg_name">' + sender + '</div>\
                             <div class="msg_left" style="display:inline;">' + msg + '</div>\
                             <div class="msg_time" style="margin-left:.5em;">' + time + '</div></div>');
  }
  $("#messages").scrollTop($("#msg" + msg_id).get(0).offsetTop); // 自動スクロール
  $("#usernum").html(Object.keys(info["userlist"]).length);// 参加者人数を更新
});

socket.on("receive_message_shuzo", function(info) {
  var msg = info["message"],
      shuzo_path = "image/shuzo/shuzo_" + Math.floor(Math.random() * 5) + ".png";
      time = new Date().toLocaleTimeString().replace("JST", "");
  msg_id++;
  console.log(typeof msg);
  if(typeof msg == "object"){ // 動画の場合
    var width = 310,
        height = width * msg["height"] / msg["width"],
        video_path = msg["url"];
    $("#messages").append('<div id="msg' + msg_id + '" class="msgBot"><img src="' + shuzo_path + '"><div class="msg_name" style="padding:0 0 0 6.5em;">松岡修造</div>\
                           <div class="msg_bot"><iframe width="' + width + '" height="' + height + '" src="' + video_path + '" frameborder="0" allowfullscreen></iframe></div>\
                           <div class="msg_time" style="clear:both; margin-left:8.5em;">' + time + '</div></div>');
  }else // テキストの場合
    $("#messages").append('<div id="msg' + msg_id + '" class="msgBot"><img src="' + shuzo_path + '"><div class="msg_name" style="padding:0 0 0 6.5em;">松岡修造</div>\
                           <div class="msg_bot">' + msg + '</div>\
                           <div class="msg_time" style="clear:both; margin-left:8.5em;">' + time + '</div></div>');

    $("#messages").scrollTop($("#msg" + msg_id).get(0).offsetTop); // 自動スクロール
});

// 入室/退室の通知が来た時の処理
socket.on("receive_notice", function(info) {
  msg = info["message"];
  msg_id++;
  $("#messages").append('<h4><span id="notice' + msg_id + '" class="label label-default">' + msg + '</span><h4>');
  $("#messages").scrollTop($("#notice" + msg_id).get(0).offsetTop); // 自動スクロール
  $("#usernum").html(Object.keys(info["userlist"]).length);
});

// 画像ファイルが送れらた時の処理
socket.on("receive_message_img", function(info) {
  var image_uri = info["message"];
      sender = info["sender_name"],
      time = new Date().toLocaleTimeString().replace("JST", "");
  msg_id++;
  if(sender == username)
      $("#messages").append('<div id="image' + msg_id + '" class="msgArea_right"><img src="' + image_uri + '" class="image_size">\
                             <div class="msg_time" style="margin-right:.5em;">' + time + '</div></div>');
  else
      $("#messages").append('<div id="image' + msg_id + '" class="msgArea_left"><div class="msg_name">' + sender + '</div>\
                             <img src="' + image_uri + '" class="image_size">\
                             <div class="msg_time" style="margin-left:.5em;">' + time + '</div></div>');
  $("#messages").scrollTop($("#image" + msg_id).get(0).offsetTop); // 自動スクロール
});

// 入力補完の設定
window.addEventListener ?
  window.addEventListener('load', startSuggest, false) :
  window.attachEvent('onload', startSuggest);

//ユーザ名の取得および入室処理
var currnt_url = window.location.href,
    username = currnt_url.substr(32, currnt_url.length);
    username = decodeURI(username); // 日本語へデコード
$("#username").html(username);
socket.emit("connected", username);
