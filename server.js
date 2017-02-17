
// モジュールの読み込み
var express = require("express"),
    app     = express(),
    http    = require("http").Server(app),
    io      = require("socket.io")(http);

app.use(express.static("htdocs"));

var userList = {}, // 参加しているユーザリスト
    shuzoText = require('./shuzo.js').func()["shuzoText"], // 修造の名言リスト
    shuzoVideo = require('./shuzo.js').func()["shuzoVideo"];


io.on("connection", function (socket) {

  // 接続時（入室時）のイベントを登録
  socket.on("connected", function (name) {
      var msg = "<b>" + name + "</b>さんが入室しました";
      userList[socket.id] = name;
      io.sockets.emit("responce_userlist", {userlist: userList}); // クライアント側のユーザリストを更新
      io.sockets.emit("receive_notice", {message: msg, userlist: userList}); // 入室したメッセージを一斉送信
  });

  // 送信ボタンを押した時のイベントを登録
  socket.on("send_message", function (info, msg_type) {
    var msg = info["message"],
        sender = info["sender_name"];
    if(msg_type == "text"){
      io.sockets.emit("receive_message_txt", {message: msg, sender_name: sender, userlist: userList});
      if(msg.indexOf("@shuzo:") != -1)
        io.sockets.emit("receive_message_shuzo", {message: convertBot(msg, sender), sender_name: sender, userlist: userList});
    }else if(msg_type == "image")
      io.sockets.emit("receive_message_img", {message: msg, sender_name: sender, userlist: userList});
  });

  // 接続終了時（退室時）のイベントを登録
  socket.on("disconnect", function () {
    if (userList[socket.id]) {
      var msg = "<b>" + userList[socket.id] + "</b>さんが退室しました";
      //remove_Image();
      delete userList[socket.id]; // ユーザ一覧から削除
      io.sockets.emit("responce_userlist", {userlist: userList}); // クライアント側のユーザリストを更新
      io.sockets.emit("receive_notice", {message: msg, userlist: userList}); //退出したメッセージを一斉送信
    }
  });

  // ユーザの一覧をクライアントに返す
  socket.on("request_userlist", function () {
    io.sockets.emit("responce_userlist", {userlist: userList});
  });
});

convertBot = function(msg, sender) {
  var text = "";
  switch (true) {
    case /ユーザ一覧/.test(msg):
      text = "このチャットに参加してるのは…<br/>";
      for(var key in userList){
        var username = ( sender == userList[key]) ? userList[key] + "（あなた）" : userList[key];
        text += "　 ・<b>" + username + "</b><br/>";
      }
      text += "　だよ！";
      break;
    case /名言/.test(msg):
        var rand = Math.floor( Math.random() * 50 );
        text = shuzoText[rand];
        break;
    case /動画/.test(msg):
        var rand = Math.floor( Math.random() * 8 );
        text = shuzoVideo[rand];
        break;
    default:
      text = "ちゃんと言えよ！";
      break;
  }
  return text;
}

port = 8080;
http.listen(port, function() {
	console.log("Server is running:%d", port);
});
