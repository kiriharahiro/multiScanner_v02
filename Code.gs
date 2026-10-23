/**
 * ====================================================================
 * QR・NFC ハイブリッドスキャナー (multiScanner_v02)
 * スプレッドシート連携バックエンド スクリプト (Code.gs)
 * ====================================================================
 * 
 * 【特徴】
 * ・外部Webホスティング（GitHub Pages / Vercel等）からのPOSTリクエスト(doPost)に対応
 * ・GAS内部Webアプリ(doGet / google.script.run)にも完全両対応
 * ・スプレッドシートのI列〜L列にリアルタイム自動追記
 * ・A〜H列に名簿データがあっても、I列の空き行を正確に特定してスマート書き込み
 * ・LockServiceによる排他制御で、複数端末からの同時書き込みデータ競合を完全防止
 */

// ★書き込み対象のシート名（空欄 "" の場合は、一番左のアクティブシートに書き込みます）
const TARGET_SHEET_NAME = "";

/**
 * 外部Webアプリ（GitHub Pages / Vercel等）からのPOSTリクエスト受付
 * @param {Object} e イベントオブジェクト
 * @return {TextOutput} JSONレスポンス
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // 複数端末からの同時アクセス競合を防ぐ（最大10秒待機）
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("POSTデータが受信できませんでした。");
    }

    const data = JSON.parse(e.postData.contents);
    const result = saveScanDataCore(data);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error(`doPostエラー発生: ${error.message || error}`, error);
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Webアプリ表示エンドポイント (GET) / 接続確認用
 */
function doGet(e) {
  // パラメータなしで直接アクセスされた場合、接続確認用JSONまたは画面を返却
  if (e && e.parameter && e.parameter.mode === 'html') {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('QR・NFC ハイブリッドスキャナー v02')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "multiScanner_v02 バックエンドAPIは正常に稼働しています！"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * スキャンデータの保存処理 (google.script.run 呼び出し用)
 * @param {Object} data { timestamp, tagText, type, uid }
 * @return {Object} 処理結果オブジェクト
 */
function saveScanData(data) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    return saveScanDataCore(data);
  } catch (error) {
    console.error(`saveScanDataエラー発生: ${error.message || error}`, error);
    return {
      status: "error",
      message: error.toString()
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * スキャンデータ書き込みのコアロジック (スマート行判定 ＆ 排他書き込み)
 * @param {Object} data { timestamp, tagText, type, uid }
 * @return {Object} 処理結果オブジェクト
 */
function saveScanDataCore(data) {
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
}

/**
 * エディタから直接動作確認できるテスト関数
 */
function testWrite() {
  const result = saveScanDataCore({
    timestamp: new Date().toISOString(),
    tagText: "テスト成功！(v02-API連携)",
    type: "TEST",
    uid: "TEST_UID_9999"
  });
  console.log('テスト書き込み結果:', JSON.stringify(result));
}
