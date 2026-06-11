// ==========================================
// 1. Firebaseの設定
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getDatabase, ref, push, set, onChildAdded, remove, onChildRemoved }
    from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); 
// 自由なお願いごとは、チャットと混ざらないように "free_tasks" という別の部屋に保存
const freeTasksRef = ref(db, "free_tasks"); 


// ==========================================
// 2. 自由なお願いごとを「送信」ボタンでFirebaseに登録する処理
// ==========================================
$("#free-send").on("click", function () {
    const unameValue = $("#free-uname").val();
    const textValue = $("#free-text").val();

    if (textValue === "") {
        alert("メッセージを入力してください");
        return;
    }

    // Firebaseに送るデータの塊（オブジェクト）を作る
    const msg = {
        uname: unameValue,
        text: textValue
    };

    // Firebaseに保存する
    const newPostRef = push(freeTasksRef);
    set(newPostRef, msg);

    // 入力欄を空っぽにする
    $("#free-text").val("");
});


// ==========================================
// 3. Firebaseからデータをリアルタイムに取得して、画面に表示する処理
// ==========================================
onChildAdded(freeTasksRef, function (data) {
    const msg = data.val();
    const key = data.key; // データを削除するときに使うID

    // 画面に出力するHTMLを組み立てる（削除/完了ボタン付き）
    let html = `
        <div id="${key}" class="free-task-item" style="margin: 10px 0; padding: 10px; border-bottom: 1px dashed #ccc;">
            <strong>【${msg.uname}からのお願い】</strong>
            <span>${msg.text}</span>
            <button class="btn-delete" onclick="deleteFreeTask('${key}')" style="margin-left: 10px;">完了（消去）</button>
        </div>
    `;

    // 自由なお願い表示エリア（#free-output）の最後に追加する
    $("#free-output").append(html);
});


// ==========================================
// 4. 【応用】自由なお願いごとの「完了（消去）」ボタンを押した時の処理
// ==========================================
window.deleteFreeTask = function (key) {
    if (confirm("このお願いごとを完了に（削除）しますか？")) {
        // Firebase内の、指定したキー（背番号）のデータを直接削除する命令
        const itemRef = ref(db, `free_tasks/${key}`);
        remove(itemRef);
    }
};

// Firebaseからデータが削除されたら、画面からも自動で消すおまじない
onChildRemoved(freeTasksRef, function (data) {
    const key = data.key;
    $(`#${key}`).remove(); // 画面からその要素を消す
});
import { update, onValue } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";

// 💡 ルーティン家事のデータは、チャットとは別に "routine_tasks" という部屋に保存します
const routineRef = ref(db, "routine_tasks");

// ==========================================
// 5. 日付・時間を「◯/◯ ◯:◯」の形にする関数
// ==========================================
function getFormattedDate() {
    const now = new Date();
    const month = now.getMonth() + 1; // 月は0から始まるので+1
    const date = now.getDate();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${month}/${date} ${hours}:${minutes}`;
}

// ==========================================
// 6. 各ルーティン家事の「完了」ボタンを押した時の処理
// ==========================================

// ① 買い出しの完了ボタン
$("#btn-kaidashi").on("click", function () {
    const user = $("#user-kaidashi").val(); // 選択された担当（T・R・K）
    const time = getFormattedDate();        // 今の時間

    // Firebaseの "routine_tasks/kaidashi" の中に上書き保存
    set(ref(db, "routine_tasks/kaidashi"), {
        user: user,
        time: time
    });
});

// ② ルンバの完了ボタン
$("#btn-roomba").on("click", function () {
    const user = $("#user-roomba").val();
    const time = getFormattedDate();

    set(ref(db, "routine_tasks/roomba"), {
        user: user,
        time: time
    });
});

// ③ トイレ掃除の完了ボタン
$("#btn-toilet").on("click", function () {
    const user = $("#user-toilet").val();
    const time = getFormattedDate();

    set(ref(db, "routine_tasks/toilet"), {
        user: user,
        time: time
    });
});

// ④ 猫トイレの完了ボタン
$("#btn-cat").on("click", function () {
    const user = $("#user-cat").val();
    const time = getFormattedDate();

    set(ref(db, "routine_tasks/cat"), {
        user: user,
        time: time
    });
});


// ==========================================
// 7. Firebaseから最新の「完了状態」をリアルタイムに受け取って表に表示する
// ==========================================
// 💡 `onValue` を使うと、データが更新されるたびに「部屋全体」の最新データを丸ごと持ってきてくれる
onValue(routineRef, function (snapshot) {
    const data = snapshot.val();
    
    // まだFirebaseにデータが何も無いときは処理をスキップ
    if (!data) return;

    // ① 買い出しのデータを画面に反映
    if (data.kaidashi) {
        $("#user-kaidashi").val(data.kaidashi.user); // 完了した人をセレクトボックスに自動セット
        $("#time-kaidashi").text(`確認済 (${data.kaidashi.time} by ${data.kaidashi.user})`);
        $("#row-kaidashi").css("background-color", "#e6f7ff"); // 完了したら行の色を薄い青に変える演出
    }

    // ② ルンバのデータを画面に反映
    if (data.roomba) {
        $("#user-roomba").val(data.roomba.user);
        $("#time-roomba").text(`確認済 (${data.roomba.time} by ${data.roomba.user})`);
        $("#row-roomba").css("background-color", "#e6f7ff");
    }

    // ③ トイレのデータを画面に反映
    if (data.toilet) {
        $("#user-toilet").val(data.toilet.user);
        $("#time-toilet").text(`確認済 (${data.toilet.time} by ${data.toilet.user})`);
        $("#row-toilet").css("background-color", "#e6f7ff");
    }

    // ④ 猫トイレのデータを画面に反映
    if (data.cat) {
        $("#user-cat").val(data.cat.user);
        $("#time-cat").text(`確認済 (${data.cat.time} by ${data.cat.user})`);
        $("#row-cat").css("background-color", "#e6f7ff");
    }
});
