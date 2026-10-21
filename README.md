# multiScanner_v02: QR・NFC ハイブリッドスキャナー (完全組織内運用版)

Google Apps Script (GAS) 内に完全統合された、教育機関・組織内限定運用のためのハイブリッドスキャナーWebアプリケーションです。

## 構成ファイル

- [**Code.gs**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/Code.gs): サーバー側スクリプト（`doGet`, `saveScanData`, `testWrite` / 排他制御付き）
- [**Index.html**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/Index.html): クライアント側UI（HTML + CSS + JavaScript統合 / オフラインキュー＆再送対応）
- [**操作手順書.md**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/操作手順書.md): スプレッドシートへの導入・デプロイ・汎用運用マニュアル
- [**.gitignore**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/.gitignore): 組織内本番手順書・実業務データ・AI対話生ログ等の漏洩防止設定

## 主な特徴

1. **外部サーバー不要（完全GAS内完結）**
   - Vercelなどの外部ホスティングを使用せず、GASのWebアプリとして動作。
2. **アカウント指定起動（AccountChooser）に完全対応**
   - Google公式ドメイン（`script.google.com`）で稼働するため、`https://accounts.google.com/AccountChooser?continue=...` を安全に利用可能。
3. **URL手動設定が不要**
   - スプレッドシートと直接バインドされているため、ユーザーによるURLコピペ設定が不要。
4. **I列〜L列への自動スマート書き込み**
   - A〜H列の名簿データの存在を考慮し、I列の空き行を特定して自動追記。
5. **データ損失防止（Auto-Recovery & Queue）**
   - スキャンデータをローカルに即時保存し、通信失敗・電波不良時の「未送信データ一括再送」に対応。
6. **高速連続スキャン & 五感フィードバック**
   - カメラ/NFCの即座の切り替え、2.5秒二重読み取り防止、Web Audio電子音、バイブレーション。

## セキュリティ設計 (Privacy & Security by Design)

- **実名・認証情報の完全非保持**: ソースコード内にAPIキーや実在組織名のハードコードを含みません。
- **排他制御 (Concurreny Control)**: `LockService` により、複数端末からの同時スキャン時も行の重複書き込みを防止。
- **XSS防御**: 読み取り結果およびログ描画時のエスケープ・サニタイズ処理を徹底。
- **Git管理の安全性**: 機密情報や現場本番用手順書（`*_本番用.*`, `*.local.*`）は `.gitignore` により自動除外されます。
