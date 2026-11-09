# 資料來源與計算範圍

維護核對日期：2026-11-05。此日期代表資料快照核對日期，不代表已確認所有資料適用最新遊戲版本或所有地區伺服器。

## 本次已核對的計算

來源：[xivapi/ffxiv-datamining](https://github.com/xivapi/ffxiv-datamining)，該專案提供遊戲資料表的擷取紀錄。
原始 CSV 快照與 SHA-256 存放於 `data/`、`data/sources.json`。

- `SubmarinePart.csv`：40 個部件的探查、收集、航速、航程、恩惠、裝備等級，以及負重（Components）。
- `SubmarineRank.csv`：Lv.1–145 的等級能力加成與 Capacity。146–150 列目前為全零占位，未開放選取。
- `SubmarineExploration.csv`：現有 143 航點的 RankReq 與 SurveyDistance。

總能力值 = 四個部件的能力值總和 + 所選等級對應的 Bonus。負重 = 四個部件的 Components 總和。
檢查項目只有航點最低等級、所選部件裝備等級與 Capacity；符合這些限制不保證任何掉落結果或完整航線可行性。

### 計算核對例

| 配裝 | 等級 | 探查 | 收集 | 航速 | 航程 | 恩惠 | 負重 / 上限 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1111 | 1 | 30 | 110 | 110 | 70 | 70 | 20 / 20 |
| 1111 | 90 | 85 | 180 | 150 | 130 | 120 | 20 / 80 |
| 4124++ | 90 | 195 | 135 | 200 | 115 | 180 | 80 / 80 |

以上為與資料快照核對的程式結果，尚未以遊戲內截圖逐一驗收。

## 已移除的錯誤假設

- 舊版固定加上 90/90/50/90，且部分部件屬性與負重不符資料表；已改用資料快照。
- 舊版 `reqSurv` 取自 `sr`，實際是 SurveyDistance，不能解讀為探查力門檻。
- 舊版 `reqRange = sr + 15` 是人工推算，沒有可靠航距依據；已移除。
- `1124++` 預設內部代號已正名；任何 24 小時 OJ 周回保證已移除。
- `++` 僅代表四件皆為改件；混裝逐件顯示代號，避免誤認為全改件。

## 保留但仍待驗證的資料

- 航點前置解鎖、百分比座標與既有海域譯名：來自 [Yiss1224/FF14-Personal-Workspace](https://github.com/Yiss1224/FF14-Personal-Workspace)。尚未重新逐點量測。
- 掉落物清單：[FFXIV Airship/Submersible Loot and Builder 試算表](https://docs.google.com/spreadsheets/d/1eiuGRrQTjJ5n4ogybKOBxJRT7EiJLlX93fge-Z8MmD4/edit)，既有資料經歷史腳本匯入；尚未重新逐項核對。部分舊資料可能包含人工補入項目。
- 道具中文對照：[thewakingsands/ffxiv-datamining-cn](https://github.com/thewakingsands/ffxiv-datamining-cn) 與英文資料，再經 zhconv 繁體化。不能保證等同官方繁中譯名。
- 七張海圖依交接文件記載取自上述原專案；原圖及二次散布使用條件尚待確認。署名本身不表示已取得授權。

本工具尚未計算：多點累計航程、航行時間、燃料消耗、收益最佳化、探查／收集與恩惠對各檔掉落的完整條件。

## 權利與第三方套件

FINAL FANTASY XIV 遊戲圖片及相關內容之權利歸 SQUARE ENIX CO., LTD. 所有。本工具為非官方玩家工具。
Vue 3.5.13 與 Tailwind CSS 3.4.17 的 MIT 授權全文附於 `assets/vendor/THIRD-PARTY-NOTICES.txt`。
本專案尚未選定自身程式碼授權，這份文件不擴張任何第三方內容的使用權。
