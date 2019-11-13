'use strict';

$(function(){


	var timer = document.getElementById(`timer`);
	var level_btn = document.getElementById(`level_btn`);
	var bomb_zan = document.getElementById(`bomb_zan`);

	var W = 12;
	var H = 12;
	var BOMB = 20;
	var BOMB_fix = 20;
	var cell= [];
	var opened = 0;
	var x_posi;
	var y_posi;
	var open_check;
	var bomb_check;
	var bomb_cnt;
	var bomb_first_set = 0;
	var startTime = 0;
	var timeoutId;
	var ending = 0;
	var item_plane = 1;
	var plane_cnt = 0;
	var flag_mode = 0;

	//選択した難易度に応じて爆弾と配列を変更
	function level_change(){
		var elements = document.getElementsByName( "level" ) ;

		console.log(elements);

		for(var i = 0; i < elements.length; i++){
			if ( elements[i].checked ) {
				var difficult = elements[i].value ;
				break ;
			}
		}

		if(difficult == "syokyu"){
			W = 12;
			H = 12;
			BOMB = 15;
			BOMB_fix = BOMB;
		}else if(difficult == "chukyu"){
			W = 12;
			H = 12;
			BOMB = 20;
			BOMB_fix = BOMB;
		}else{
			W = 12;
			H = 12;
			BOMB = 30;
			BOMB_fix = BOMB;
		}

		//初期値で配置されたテーブルを削除して、新しい数値で再配置
		table_clash();
		count_reset();
		init();

	}


	//初期テーブルの生成
	function init() {

	var main = document.getElementById("main");

		for (var i = 0; i < H; i ++){
			cell[i] = [];
			var tr = document.createElement("tr");

			for (var j = 0; j < W; j ++){
				var td = document.createElement("td");
				td.addEventListener("click",click);
				td.addEventListener("dblclick",dblclick);
				td.addEventListener("contextmenu",contextmenu);
				td.className = "cell";
				td.y = i;
				td.x = j;
				cell[i][j] = td;
				tr.appendChild(td);
			}

			main.appendChild(tr);
		}

		bomb_zan.textContent = BOMB;
	} 

	//作成したテーブルを全て削除
	function table_clash(){
		$("#main").children().remove();
	}

	//変数を初期値に戻す
	function count_reset(){
		bomb_first_set = 0;
		ending = 0;
		opened = 0;
		timer.textContent = "00:00";
		startTime = Date.now();
		plane_cnt = 0;
		plane_item.textContent = plane_cnt + "個";
		$('tbody tr').removeClass('danger');
	}

	//爆弾をランダムに配置
	function set_bomb(){
		for(var i = 0; i < BOMB; i ++){

			while(true){
				var x = Math.floor(Math.random() * W);
				var y = Math.floor(Math.random() * H);

				//爆弾が配置されていない、最初に選択したセル以外
				if(!cell[x][y].bomb && x_posi != y && y_posi != x) {
					cell[x][y].bomb = true;
					break;
				}
			}
		}
	}

	//飛行機アイテムの配置
	function set_plane(){
		for(var i = 0; i < 2; i ++){

			while(true){
				var x = Math.floor(Math.random() * W);
				var y = Math.floor(Math.random() * H);

				//爆弾が配置されていない、最初に選択したセル以外
				if(!cell[x][y].bomb && x_posi != y && y_posi != x) {
					cell[x][y].plane = true;
					break;
				}
			}
		} 
	}

	//周囲の爆弾の数をカウント
	function count(x, y) {
		var b = 0;

		for (var j = y - 1; j <= y + 1; j ++) {
			for (var i = x - 1; i <= x + 1; i ++) {

				if (cell[j] && cell[j][i]) {

					if (cell[j][i].bomb) b++;
				}
			}
		}
		return b;
	}

	//周囲のフラグの数をカウント
	function count_flag(x, y) {
		var b = 0;

		for (var j = y - 1; j <= y + 1; j ++) {

			for (var i = x - 1; i <= x + 1; i ++) {

				if (cell[j] && cell[j][i]) {

					if (cell[j][i].flag) b++;
				}
			}
		}
		return b;
	}

 	//タイマー表示
 	function countUp(){
               
        //現在の時間-最初に取得した時間=経過した時間
        const d = new Date(Date.now() - startTime);
		let m = d.getMinutes();
		let s = d.getSeconds();

		timer.textContent =`${String(m).padStart(2, `0`)}:${String(s).padStart(2, `0`)}`;
		
		timeoutId = setTimeout(() =>{
			countUp();
		}, 1000);
	}

	//旗を立てる
	function flag(x, y){

		bomb_check = cell[y][x];

		console.log(bomb_check);

		//既に開いているセルなら処理をせず返す
		if($(bomb_check).hasClass('open')){
			return;

		//既に旗が立っていれば旗を削除
		}else if(cell[y][x].flag){
			$(bomb_check).removeClass('flag');
			$(bomb_check).children().remove();
			cell[y][x].flag = false;
			BOMB += 1;
			bomb_zan.textContent = BOMB;

		//旗を立てる
		}else{
			var td = document.createElement("td");
			td = cell[y][x];
			var flag_img = document.createElement("img");
			flag_img.src = 'img/flag.png';
			td.appendChild(flag_img);
			$(bomb_check).addClass('flag');
			cell[y][x].flag = true;
			BOMB -= 1;
			bomb_zan.textContent = BOMB;
		}
	}

	//クリックされたセルを開く
	function open(x, y){

		open_check = cell[y][x];
		bomb_cnt = count(x, y);

		//既に開いているセルor旗が立っている場合は処理をせず返す
		if(ending != 0 || open_check.flag){
			return;

		//既に開いており、その数字と周辺の旗の数が一緒なら、free_open起動
		}else if($(open_check).hasClass('open')){
			if(open_check.textContent == count_flag( x, y)){
				free_open(x_posi, y_posi);
			}
			return;
		//爆弾の数が1以上のセルはそのセルだけの処理
		}else if(bomb_cnt != 0){

			flip(open_check);

			if(open_check.plane){
				plane_cnt += 1;
				plane_item.textContent = plane_cnt + "個";
				if(plane_cnt == 1){
					$('tbody tr').addClass('danger');
				}

				//それぞれの数字に対してclassを付与してHTMLに追記
				if(bomb_cnt == 1){
					$(open_check).html('<span class="one plane">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 2){
					$(open_check).html('<span class="two plane">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 3){
					$(open_check).html('<span class="three plane">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 4){
					$(open_check).html('<span class="four plane">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 5){
					$(open_check).html('<span class="five plane">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 6){
					$(open_check).html('<span class="six plane">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 7){
					$(open_check).html('<span class="seven plane">' + bomb_cnt + '</span>');
				}else{
					$(open_check).html('<span class="eight plane">' + bomb_cnt + '</span>');
				}

			}else{
				//それぞれの数字に対してclassを付与してHTMLに追記
				if(bomb_cnt == 1){
					$(open_check).html('<span class="one">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 2){
					$(open_check).html('<span class="two">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 3){
					$(open_check).html('<span class="three">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 4){
					$(open_check).html('<span class="four">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 5){
					$(open_check).html('<span class="five">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 6){
					$(open_check).html('<span class="six">' + bomb_cnt + '</span>');
				}else if(bomb_cnt == 7){
					$(open_check).html('<span class="seven">' + bomb_cnt + '</span>');
				}else{
					$(open_check).html('<span class="eight">' + bomb_cnt + '</span>');
				}
			}
			
			
		//爆弾が周囲に無い場合はfree_openへ
		}else{
			free_open(x_posi, y_posi);
		}
	}

var z = 0;
var tryx = 0;

	//飛行機攻撃したときの挙動
	function random_pannel(){

		plane_cnt -= 1;
		plane_item.textContent = plane_cnt + "個";

		if(plane_cnt == 0){
			$('tbody tr').removeClass('danger');
		}

		for(var i = 0; i < 3; i ++){
			
			while(true){
				var x = Math.floor(Math.random() * W);
				var y = Math.floor(Math.random() * H);

				bomb_cnt = count(x, y);
				tryx += 1;



				//爆弾が配置されていない、最初に選択したセル以外
				if(!cell[y][x].bomb && !cell[y][x].opened && !cell[y][x].flag && bomb_cnt != 0) {
					break;
				}
			}
			z = z + 1;
			open(x, y);
		} 
	}

	//8方向のセルを連続して開く
	function free_open( x, y){

		for (var j = y - 1; j <= y + 1; j ++) {

			for (var i = x - 1; i <= x + 1; i ++) {

				if (cell[j] && cell[j][i]) {
					var c = cell[j][i];

					//既に開いている、爆弾が設置、旗が立っている場合は処理をせず続ける
					if (c.opened || c.bomb || c.flag) {
						continue;
					}

					flip(c);
					var n = count(i,j);

					if (n == 0) {
						free_open(i,j);
					}else if(c.plane){
						plane_cnt += 1;
						plane_item.textContent = plane_cnt + "個";
						if(plane_cnt == 1){
							$('tbody tr').addClass('danger');
						}

						if(n == 1){
							$(c).html('<span class="one plane">' + n + '</span>');
						}else if(n == 2){
							$(c).html('<span class="two plane">' + n + '</span>');
						}else if(n == 3){
							$(c).html('<span class="three plane">' + n + '</span>');
						}else if(n == 4){
							$(c).html('<span class="four plane">' + n + '</span>');
						}else if(n == 5){
							$(c).html('<span class="five plane">' + n + '</span>');
						}else if(n == 6){
							$(c).html('<span class="six plane">' + n + '</span>');
						}else if(n == 7){
							$(c).html('<span class="seven plane">' + n + '</span>');
						}else{
							$(c).html('<span class="eight plane">' + n + '</span>');
						}

					}else{
						if(n == 1){
							$(c).html('<span class="one">' + n + '</span>');
						}else if(n == 2){
							$(c).html('<span class="two">' + n + '</span>');
						}else if(n == 3){
							$(c).html('<span class="three">' + n + '</span>');
						}else if(n == 4){
							$(c).html('<span class="four">' + n + '</span>');
						}else if(n == 5){
							$(c).html('<span class="five">' + n + '</span>');
						}else if(n == 6){
							$(c).html('<span class="six">' + n + '</span>');
						}else if(n == 7){
							$(c).html('<span class="seven">' + n + '</span>');
						}else{
							$(c).html('<span class="eight">' + n + '</span>');
						}
						
					}
				}
			}
		}
	}

	//セルを開く際に行う処理
	function flip(cell) {
		cell.className = "cell open";
		cell.opened = true;
		console.log(opened + "," + W + "," + H + "," + BOMB_fix);

		//クリアー
		if (++opened >= (W * H - BOMB_fix)) {

			clearTimeout(timeoutId);
			ending = 1;
			clearMessage();
		}
	}

	function clearMessage(){
		$('#result').show();
	}

	function badMessage(){
		$('#bad_result').show();
	}

	function clearMessage_sage(){
		$('#result').hide();
	}

	function badMessage_sage(){
		$('#bad_result').hide();
	}

	//テーブル内では右クリックメニュー非表示
	$(function(){
    	$('#main').on("contextmenu", function(e){
        return false;
    	});
	});

	//右クリック時の操作
	function contextmenu(e){
		var src = e.currentTarget;
		x_posi = src.x;
		y_posi = src.y;
		flag(x_posi, y_posi);
	}

	//ダブルクリック時の操作
	function dblclick(e){
		var src = e.currentTarget;
		x_posi = src.x;
		y_posi = src.y;
		console.log(x_posi);
		console.log(y_posi);
	}

	//クリック時の操作
	function click(e) {
		if(flag_mode == 0){

			var src = e.currentTarget;
			x_posi = src.x;
			y_posi = src.y;

			//爆弾を選択したら爆弾を全て表示してゲームオーバー
			if(src.flag){
				return;
			}else if (src.bomb && ending == 0) {
				
				cell.forEach(function (tr) {
					tr.forEach(function (td) {
						if (td.bomb) {
							if($(td).hasClass('flag')){
								$(td).removeClass('flag');
								$(td).children().remove();
							}

							clearTimeout(timeoutId);
							ending = 1;
							badMessage();

							var bomb_img = document.createElement("img");
							bomb_img.src = 'img/bomb.png';
							td.appendChild(bomb_img);
						}
					})
				});


			}else{
				//最初の1回目をクリックしたらそこ以外に爆弾配置
				if(bomb_first_set == 0){
					set_bomb();
					set_plane();
					startTime = Date.now();
					countUp();
				}

				open(x_posi, y_posi);
				bomb_first_set += 1;
			}
		}else{
			var src = e.currentTarget;
			x_posi = src.x;
			y_posi = src.y;
			flag(x_posi, y_posi);
		}
	}

	//難易度選択した際のイベント
	$('#level_btn').click(function(){
		level_change();
	});

	//ニコちゃんを選択した際のイベント
	$('#restart_btn').click(function(){
		level_change();
	});

	//フラグモードに切り替え
	$('#flag_mode_choice').click(function(){
		console.log("1kai");
		switch(flag_mode){
			case 0:
				flag_mode = 1;
				break

			case 1:
				flag_mode = 0;
				break
		}
	});

	$('#restartone').click(function(){
		clearMessage_sage();
		level_change();
	});

	$('#plane').click(function(){
		if(plane_cnt == 0){
			return;
		}
		random_pannel();
	});

	$('#restarttwo').click(function(){
		badMessage_sage();
		level_change();
	});

	//最初に必ず実行。初期配置
	window.addEventListener('DOMContentLoaded', function() {
		init();
	})

});
