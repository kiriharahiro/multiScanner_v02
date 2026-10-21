/**
 * ====================================================================
 * QR・NFC ハイブリッドスキャナー (multiScanner_v02)
 * 完全組織内運用 Webアプリ - サーバー側スクリプト (Code.gs)
 * ====================================================================
 * 
 * 【特徴】
 * ・外部サーバー不要。Google Apps Script単体でスキャナー画面と記録処理を完結
 * ・Google Workspace組織内アカウントでの限定運用に完全対応
 * ・スプレッドシートのI列〜L列にリアルタイム自動追記
 * ・A〜H列に名簿データがあっても、I列の空き行を正確に特定してスマート書き込み
 */

// ★書き込み対象のシート名（空欄 "" の場合は、一番左のアクティブシートに書き込みます）
const TARGET_SHEET_NAME = "";

/**
 * Webアプリ表示エンドポイント (GET)
 * スマホやPCのブラウザで開いた際に、Index.htmlのUI画面を描画します。
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('QR・NFC ハイブリッドスキャナー v02')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    // 社内ポータル・Googleサイト等への埋め込み表示に対応
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * スキャンデータの保存処理 (クライアントの google.script.run から呼び出されます)
 * @param {Object} data { timestamp, tagText, type, uid }
 * @return {Object} 処理結果オブジェクト
 */
function saveScanData(data) {
  const lock = LockService.getScriptLock();
  try {
    // 複数端末からの同時アクセスによる重複・データ破損を防ぐ（最大10秒間待機）
    lock.waitLock(10000);

    const rawTimestamp = data.timestamp || new Date().toISOString();
    const tagText = data.tagText || ""; // QR/NFCの読み取り本文
    const type = data.type || "";       // "QR" または "NFC"
    const uid = data.uid || "";         // NFC固有のUID (QRの時は空欄)

    // 日時を「yyyy/MM/dd HH:mm:ss」の日本時間形式に変換
    const date = new Date(rawTimestamp);
    const formattedDate = Utilities.formatDate(date, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");

    // スプレッドシートおよび対象シートの取得
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = TARGET_SHEET_NAME ? ss.getSheetByName(TARGET_SHEET_NAME) : null;
    if (!sheet) {
      sheet = ss.getActiveSheet() || ss.getSheets()[0];
    }

    // --- I列の最終行をスマート特定 ---
    // A列〜H列に名簿データがあっても、I列（9列目）の最後の記入位置の次を自動判定します
    const maxRows = sheet.getMaxRows();
    const iValues = sheet.getRange(1, 9, maxRows, 1).getValues();
    let targetRow = 1;

    for (let r = iValues.length - 1; r >= 0; r--) {
      const val = iValues[r][0];
      if (val !== "" && val !== null && val !== undefined) {
        targetRow = r + 2; // 1-indexedで次の空行
        break;
      }
    }

    if (targetRow < 2) {
      targetRow = 2; // ヘッダー行(1行目)の次から開始
    }

    // 行が足りない場合は自動拡張
    if (targetRow > maxRows) {
      sheet.insertRowAfter(maxRows);
    }

    // I列〜L列（4列分）に一括書き込み
    // 9列目 = I列 (Timestamp)
    // 10列目 = J列 (QR/NFC Text)
    // 11列目 = K列 (種別)
    // 12列目 = L列 (NFC固有ID)
    sheet.getRange(targetRow, 9, 1, 4).setValues([[
      formattedDate,
      tagText,
      type,
      uid
    ]]);

    // 実行したユーザーのアカウント情報（組織内確認用）
    let currentUser = "";
    try {
      currentUser = Session.getActiveUser().getEmail();
    } catch (e) {
      currentUser = "不明";
    }

    return {
      status: "success",
      message: "書き込みが完了しました",
      row: targetRow,
      text: tagText,
      type: type,
      user: currentUser,
      time: formattedDate
    };

  } catch (error) {
    Logger.log("エラー発生: " + error.toString());
    return {
      status: "error",
      message: error.toString()
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * エディタから直接動作確認できるテスト関数
 */
function testWrite() {
  const result = saveScanData({
    timestamp: new Date().toISOString(),
    tagText: "テスト成功！(v02)",
    type: "TEST",
    uid: "TEST_UID_9999"
  });
  Logger.log(JSON.stringify(result));
}
