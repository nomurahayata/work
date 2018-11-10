var express = require('express');
var app = express();
var mysql = require('mysql');
var moment = require('moment');
var ejs = require('ejs');
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.engine('ejs', ejs.renderFile);
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'gacha'
});

//画像用ファイル
app.use(express.static(__dirname));



//ガチャを引く
app.get('/gacha', function (req, res) {
	var ran = Math.random();
	var rarity;

	//レア度を決める
	rarity = get_rarity(ran);

	//レア度に応じたデータの抽出
	connection.query('SELECT * FROM characters WHERE rarity =' + rarity, function (error, results, fields) {
		console.log(rarity);
		console.log(results);
		ran = Math.random();
		console.log(ran);
		//キャラを決める
		var nomber = fnc_get_character(ran,results.length);

		//時間保存
		var when = moment().format('YYYY-MM-DD HH:mm:ss');
		//出たキャラの保存
		connection.query('INSERT INTO get_characters(id,name,rarity,time)VALUES(' + results[nomber].id + ',"' + results[nomber].name + '",' + results[nomber].rarity + ',"' + when + '");', function (error1, results1, fields1) {
			//出たキャラの表示
			res.render('gacha.ejs', {
				data: results[nomber],
				id: results[nomber].id,
				name: results[nomber].name.split("_")[1],
				rarity: results[nomber].rarity,
				image: '/public/images/' + results[nomber].name + '.jpg  width=450 height=600'
			});
		});
	});
});

 function get_rarity(ran) {

 	 if (ran < 0.01) {
	    return  0;
	 } else if (ran < 0.2) {
		return  1;
	 } else if (ran < 0.6) {
		return  2;
	 } else if (ran < 0.9) {
		return  3;
	 } else {
		return  4;
	 }
 }

 function fnc_get_character(ran,res_len) {

	 for (var i = 1; i <= res_len; i++) {
		 if (ran <= i / res_len) {
			return i-1;
		 }
	 }
 }
//入手キャラ一覧　（並び替え機能追加予定）
app.get('/characters', function (req, res) {
	connection.query('select * from get_characters', function (error, results, fields) {
		res.render('getCharacters.ejs', {

			images: results

		});
	});


});
//「編成」をクリックして飛んできた時
app.get('/deckManeger', function (req, res) {

	connection.query('select * from decks', function (error, results, fields) {
		res.render('deckManeger.ejs', {
			images: results

		});

	});

});
//デッキ編成して戻ってきた時　htmlから送られてきたデータをもとにデッキを編成
app.get('/deckManeger/:datas', function (req, res) {
	var pp = [];
	//処理が終了するまで待つ
	var fp = new Promise(function (resolve, reject) {
		connection.query('select * from get_characters', function (error, results, fields) {

			console.log(req.params.datas);
			var ch = req.params.datas.split(",");
			var ch_name = [Number(ch[0])];
			for (var i = 1; i <= 3; i++) {
				ch_name.push(Number(ch[i]));
			}
			console.log(ch_name);

			//デッキのデータ上書き
			pp.push(new Promise(function (resolve, reject) {

				for (var i = 1; i <= 3; i++) {

					console.log(results[ch_name[i]]);
					console.log(results[ch_name[i]].name);
					console.log('update decks set name="' + results[ch_name[i]].name + '",rarity=' + results[ch_name[i]].rarity + ' where deckId=' + ch_name[0] + ' and id=' + (i));
					connection.query('update decks set name="' + results[ch_name[i]].name + '",rarity=' + results[ch_name[i]].rarity + ' where deckId=' + ch_name[0] + ' and id=' + (i));
					//console.log(results)

				}
				resolve();
			}));
			resolve();
		});
	});
	//デッキの上書きが終わったら実行　
	fp.then(function () {
		Promise.all(pp).then(function () {
			//デッキの表示
			connection.query('select * from decks', function (error2, results2, fields2) {
				res.render('deckManeger.ejs', {
					images: results2
				});
			});

		});
	});
});
//});
//デッキを作る
app.get('/deck/:deckname', function (req, res) {
	connection.query('select * from get_characters', function (error, results, fields) {
		res.render('deck.ejs', {
			images: results,
			deckname: req.params.deckname
		});
	});
});
//チャット機能
app.get('/chat',function(req,res){
	res.render('chat.ejs');
})
//チャットの送受信
io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});
//最初のところ
app.get('/', function (req, res) {
	res.render('index.ejs');
});
//サーバー開く
http.listen(3000,function() { console.log('listen on *：3000'); });
//サーバー開く
//app.listen(3000, function (req, res) {
//	console.log("ひらいたよ");
//});
