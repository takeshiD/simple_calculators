# 簡易Scheme処理系の色々な実装方法コレクション

## 評価戦略
- スタックマシン : [stackbase.ts](stackbase.ts)
- ラムダ計算 : [lambdabase.ts](lambdabase.ts)

## 実行

結果は双方とも同じです。

```bash
$ deno run src/stackbase.ts
5 3 + = 8
Define x = 10: 10
x + 5 = 15

$ deno run src/lambdabase.ts
5 + 3 = 8
Define x = 10: 10
x + 5 = 15
```

## 処理の動き
動きを追いやすくするために'5 3 +'を処理させたときのフローを比較してみます。

### スタックマシン
1. トークン"5"の処理:
   - parseToken("5") → { type: 'PUSH', value: 5 }
   - スタック: [5]

2. トークン"3"の処理:
   - parseToken("3") → { type: 'PUSH', value: 3 }
   - スタック: [5, 3]

3. トークン"+"の処理:
   - parseToken("+") → { type: 'ADD' }
   - pop()で3を取得
   - pop()で5を取得
   - 5 + 3を計算
   - push(8)
   - スタック: [8]

### ラムダ計算
1. トークン"5"の処理:
   - parse("5") → Expression { type: 'number', value: 5 }
   - スタックに5をプッシュ
   - スタック: [5]

2. トークン"3"の処理:
   - parse("3") → Expression { type: 'number', value: 3 }
   - スタックに3をプッシュ
   - スタック: [5, 3]

3. トークン"+"の処理:
   - parse("+") → Expression { type: 'operator', value: '+' }
   - 2つの値を取り出して環境内で評価
   - 結果をスタックにプッシュ
   - スタック: [8]

# ついでに
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

