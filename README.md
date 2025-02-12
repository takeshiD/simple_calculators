# 簡易Scheme処理系の色々な実装方法コレクション

## 評価戦略
- スタックマシン : [stackbase.ts](stackbase.ts)
- ラムダ計算 : [lambdabase.ts](lambdabase.ts)

# ついで
普段denoを触る環境では無いのでフォーマッターやLSP周りについてのメモを残す。

## LSP
denoはdenolsというLSPがあり型チェック、Diagnosticはそのまま利用できる。

neovimでもnvim-lspconfigでそのまま利用可能。


## Formatter
deno fmtを利用したかったが、利用のためにはnone-lsを利用する必要がありそうで少し設定が面倒そうだったため断念。

deno fmt が内部的に利用しているdprintがMasonでインストール出来たのでこれを利用。

唯一面倒なのはdeno fmtであればフォーマッター、リンターなども含めてdeno.jsonに書けばいいのだが、dprintはdprint.jsonを作成しなければならない。

普段そこまでdenoを利用しないのでいいし、設定内容も酷似しているのでそこまでハードルでは無い。


[dprint - configuration](https://dprint.dev/config/)


## Linter
eslintでOK

