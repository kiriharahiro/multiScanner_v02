# multiScanner_v02: QR・NFC ハイブリッドスキャナー (Webホスティング＋GAS連携版)

GitHub Pagesにデプロイされたフロントエンドと、Google Apps Script (GAS) バックエンドが直結する、学校・教育現場・組織運用のためのハイブリッドスキャナーWebアプリケーションです。

## 構成ファイル

- [**システム仕様書.md**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/システム仕様書.md): システムの全体設計・データ仕様・詳細機能仕様書
- [**Code.gs**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/Code.gs): サーバー側スクリプト（`doPost`, `saveScanDataCore` / 排他制御付き）
- [**index.html**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/index.html): クライアント側UI（HTML + CSS + JavaScript統合 / オフラインキュー＆再送対応）
- [**操作手順書.md**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/操作手順書.md): スプレッドシートへの導入・デプロイ・運用マニュアル
- [**.gitignore**](file:///g:/共有ドライブ/KiriPlayPark/Tool/Antigravity/kiriplaypark-projects/multiScanner_v02/.gitignore): 組織内本番手順書・実業務データ・AI対話生ログ等の漏洩防止設定

## 主な特徴

1. **カメラ制限なしのスムーズ起動（GitHub Pagesデプロイ）**
   - Googleのiframeサンドボックスによるカメラ権限制限（Permissions Policy）を回避し、常時快適なカメラ映像ストリームを実現。
2. **GAS Web API（doPost）によるリアルタイム書き込み**
   - 設定モーダルからGASのWebアプリURLを登録するだけで、スプレッドシートへ即時連携。
3. **I列〜L列への自動スマート書き込み**
   - A〜H列の名簿データの存在を考慮し、I列の空き行を特定して自動追記。
4. **排他制御 (LockService)**
   - 複数端末からの同時スキャン時も行の重複・上書きを防止（最大10秒待機）。
5. **データ損失防止（Auto-Recovery & Queue）**
   - スキャンデータをローカル（LocalStorage）に即時保存し、通信失敗・電波不良時の「未送信データ一括再送」に対応。
6. **高速連続スキャン & 五感フィードバック**
   - カメラ/NFCの即座の切り替え、2.5秒二重読み取り防止、Web Audio電子音、バイブレーション。

## セキュリティ設計 (Privacy & Security by Design)

- **実名・認証情報の完全非保持**: ソースコード内にAPIキーや実在組織名のハードコードを含みません。
- **排他制御 (Concurrency Control)**: `LockService` により、複数端末からの同時スキャン時も行の重複書き込みを防止。
- **XSS防御**: 読み取り結果およびログ描画時のエスケープ・サニタイズ処理を徹底。
- **Git管理の安全性**: 機密情報や現場本番用手順書（`*_本番用.*`, `*.local.*`）は `.gitignore` により自動除外されます。
