# AIエージェント向けガイド

## 0. プロジェクト概要

現在のファイル構成は以下のようになっている。
開発が進みファイルが増えた場合、このディレクトリツリー概要を更新して、全員が最新の構成を把握できるようにすること。

```txt
root: .
├── docs/
│   ├── adr/
│   ├── specs/
│   └── design.md
├── examples/
│   ├── realworld/
│   ├── basic.bas
│   ├── class.cls
│   └── userform.frm
├── queries/
│   ├── folds.scm
│   ├── highlights.scm
│   └── tags.scm
├── references/
│   ├── microsoft-vba-language-reference.md
│   ├── README.md
│   ├── sources.json
│   ├── unsupported-or-ambiguous-syntax.md
│   └── vba-syntax-checklist.md
├── tasks/
│   ├── feature_spec.md
│   ├── lessons.md
│   └── todo.md
├── test/
│   └── corpus/
├── AGENTS.md
├── CLAUDE.md
├── grammar.js
├── LICENSE
├── README.md
└── tree-sitter.json
```

## Critical Tree-sitter Rules

- Do not modify `grammar.js` without adding or updating corpus tests.
- Do not weaken existing corpus expectations to make tests pass.
- Always run `pnpm test` before completing a task.
- Always parse examples after grammar changes.
- Do not add semantic analysis to this repository.
- Keep grammar node names stable once introduced.

## 1. ワークフロー設計

### 1. 基本は Plan モードで進める

- 3ステップ以上に分かれる作業、またはアーキテクチャに影響する作業は、必ず Plan モードから開始すること
- 途中で進行がうまくいかなくなった場合は、無理に続行せず、いったん止めて計画を立て直すこと
- Plan モードは実装時だけでなく、検証手順の設計にも使うこと
- 実装前に仕様をできるだけ具体化し、曖昧さを減らすこと

### 2. マルチエージェント戦略

- メインのコンテキストを汚さないために、サブエージェントを積極的に活用すること
- 調査、確認、並列分析はサブエージェントへ委譲すること
- 複雑な問題では、計算資源を多く使う目的でもサブエージェントを活用すること
- 実行を集中させるため、サブエージェントには1つのタスクだけを割り当てること
- 読み取り中心のコードベース探索には explorer を使うこと
- 実装や修正には worker を使うこと
- レビューには reviewer を使うこと

### 3. 自己改善ループ

- ユーザーから修正指示を受けたら、そのパターンを `tasks/lessons.md` に記録すること
- 同じミスを繰り返さないためのルールを、自分向けに明文化すること
- エラー率が下がるまで、そのルールを継続的に改善すること
- 各セッションの開始時には、そのプロジェクトに関係する lesson を見直すこと

### 4. 完了前に必ず検証する

- 動作を証明できるまでは、タスクを完了扱いにしないこと
- 必要に応じて main ブランチと変更内容を比較すること
- 「これを staff engineer が見て承認するか？」を自問すること
- テスト実行、ログ確認、正しく動くことの提示まで行うこと

### 5. バランスを保ちながら、よりエレガントな解決を目指す

- 重要な変更の前には、「もっとエレガントなやり方はないか？」と一度立ち止まって考えること
- 修正が場当たり的に感じられる場合は、「今わかっている情報を踏まえて、より洗練された形で実装する」と考え直すこと
- ただし、単純で明白な修正にまでこの手順を持ち込まないこと。過剰設計は避けること
- 成果物を出す前に、自分の実装を自分で疑って見直すこと

### 6. バグ修正は自律的に進める

- バグ報告を受けたら、逐一指示を待たずに自分で調査し、そのまま修正まで進めること
- ログ、エラー、失敗しているテストを使って、自力で原因を特定し解決すること
- ユーザーに不要なコンテキストスイッチを発生させないこと
- 指示がなくても、CI が落ちているなら修正に取り組むこと

---

## 2. 必要な作業手順

コードを生成・変更する前に、作業規模に応じて以下を行うこと。

1. 要件を理解する：関連する仕様書、ADR、既存実装を確認する。
2. 設計を検討する：影響範囲、既存設計との整合性、代替案を確認する。
3. 必要に応じて作業用メモを作成する：
   - 複雑な作業: `tasks/feature_spec.md`
   - 進捗管理: `tasks/todo.md`
   - 再発防止: `tasks/lessons.md`
4. テストを追加・更新する。
5. 実装する。
6. 動作確認する。
7. テストを実行する。
8. 自己レビューする。
9. 必要に応じてドキュメント、ADR、仕様書、CHANGELOG を更新する。

- ADR、仕様書に更新がある場合は次のディレクトリに記録すること
  - ADR: `docs/adr/`
  - 仕様書: `docs/specs/`

### 2-1. テスト戦略

- grammar.js を変更したら、必ず corpus test を追加・更新する
- 既存テストを弱めない
- pnpm test を通す
- examples を parse する
- ERROR ノードが増えていないか確認する

---

## 3. ドキュメント保持ポリシー

### 役割の分離

- `tasks/todo.md` には、セッション単位の進捗管理だけでなく、検証結果、未解決事項、判断理由の要約などを一時的に記録してよい
- `tasks/feature_spec.md` は実装前の作業用仕様書として使ってよいが、将来参照する仕様、制約、検証条件が含まれる場合は使い捨てにしないこと
- `tasks/lessons.md` は再発防止ルールを記録する場所であり、設計判断や仕様そのものを置く場所として使わないこと
- 設計判断やトレードオフは `docs/adr/` に、現行の内部仕様や制約は `docs/specs/` に移すこと
- 実装が完了し不要になった `todo.md` や `feature_spec.md` は、必要な情報を抽出してから削除すること

### ADR と仕様書の使い分け

- ADR には、将来の実装者が同じ問題に再び直面したときに役立つ、判断の背景や複数案を比較したうえで採用した方針を記録すること
  - ADR を編集する場合は `adr-manager` skill　を使うこと
- 仕様書には、レビュー、CI、障害対応を通じて確立された恒久的なルールや、CLI、バリデーション、互換性に関わる契約事項を記録すること
- 追加した回帰テストについて、理由を忘れると再発につながるような仕様上の文脈がある場合は、仕様書に記録すること

### 残すべき情報

- 将来の実装者が同じ問題に再び直面したときに役立つ、判断の背景
- 複数案を比較したうえで採用した方針
- レビュー、CI、障害対応を通じて確立された恒久的なルール
- CLI、バリデーション、互換性に関わる契約事項
- 追加した回帰テストについて、理由を忘れると再発につながるような仕様上の文脈

### 捨ててよい情報

- 単発の作業順メモ
- 途中で終わった仮説や中間メモ
- 完了後に参照価値のない進捗ログ
- 判断理由を伴わない単純な手順一覧

---

## 4. コア原則

- **まずはシンプルに**: すべての変更は、可能な限りシンプルに保つこと。影響範囲を最小限にすること
- **手を抜かない**: 根本原因を特定すること。場当たり的な修正は避けること。シニアエンジニア水準を保つこと
- **影響を最小化する**: 必要な部分だけを変更すること。新たなバグを持ち込まないこと

# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage with zero behavior change. If rtk has no filter for a command, it passes
through unchanged — so it is always safe to use.

This project is developed on **Windows**, so prefer PowerShell-compatible
commands and paths.

## Key Commands

```powershell
# Git
rtk git status
rtk git diff
rtk git log --oneline -20

# Files & Search
rtk dir
rtk dir .\src
rtk read .\path\to\file.txt
rtk rg "pattern"
rtk rg "pattern" .\src
rtk find "pattern"
rtk diff .\path\to\file.txt

# Analysis
rtk err <command>
rtk log .\path\to\log.txt
rtk json .\path\to\file.json
rtk summary <command>
rtk deps
rtk env

# GitHub
rtk gh pr view <number>
rtk gh run list
rtk gh issue list
```
