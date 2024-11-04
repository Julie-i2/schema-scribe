# Scheme Scribe

`Scheme Scribe`はデータベースのテーブル情報を参照し、Entityクラスを自動で生成するVSCode拡張機能です。  
フォルダごとに設定でき、複数のデータベースにも対応できます。  
ベースになった元の拡張機能`DTO Maker`の進化版です。

## インストール

1. [Releases](https://github.com/Julie-i2/schema-scribe/releases)から`vsix`ファイルをダウンロードします。
2. VSCode > 拡張機能 > 「…」(ビューとその他アクション) > VSIXからのインストール を選択します。
3. ダウンロードした`vsix`ファイルを選択すればインストールが始まります。

## 使用方法

コマンドパレット(`F1`)を開き、「scheme scribe」と入力するとコマンドが表示されます。  
コマンドを実行する前に以下の設定を行ってください。

### 設定ファイルの用意

1. プロジェクトフォルダ直下に`.scheme-scribe`フォルダを用意します。
2. `.scheme-scribe`フォルダ内に`config.json`と`テンプレート用テキストファイル`を用意します。

### 設定ファイルの詳細

参照するデータベースの設定やEntityクラスのフォーマット、出力先等を設定することが可能です。  
設定は`workspace`直下の`.scheme-scribe/config.json`に記載します。

> **注意**：この設定はVS Codeの`setting.json`とは異なります。

For example:

```json
{
  "SchemeScribe.configs": [
    {
      "database": {
        // データベースのホスト
        "host": "192.168.1.100",
        // データベースのポート
        "port": 3306,
        // データベースのユーザー名
        "user": "root",
        // データベースのパスワード
        "password": "pass",
        // データベース名
        "database": "system_name",
        // データベースアプリケーション(`mysql` or `oracle`)
        "application": "mysql",
      },
      "format": {
        // 出力先のパス
        "outputPath": "${workspaceRoot}/classes/IO/DataBase/DTO",
        // Entity生成前に出力先フォルダの中身をすべて削除する [default true]
        "outputReset": true,
        // テンプレートファイルのパス
        "templatePath": "${workspaceRoot}/.vscode/dto-template.txt",
        // 出力を1つのファイルにまとめた際のファイル名 [default ""]
        // - この指定がある時は1つのファイルにまとめて出力する
        "combineFileName": "entities",
        // 種別 ["entity", "create", "sqlite"]
        "type": "entity",
        // Entityクラス名のカスタマイズ
        // - そのままのテーブル名 or キャメルケース 例: "${plain}" or "${camelize}"
        // - Prefix・Suffix 例: "DataBase${plain}Entity"
        // - Trim 例: "${plain(ltrim:'table_',rtrim:'_table',trim:'data')}"
        "className": "${camelize}Entity",
        // 作成するファイルの拡張子
        "fileExtension": "php",
        // データ型ごとの初期値を指定する
        "defaultValues": {
          "datetime": "DEFAULT_DATETIME",
          "date": "DEFAULT_DATE",
          "time": "DEFAULT_TIME"
        },
        // 作成するファイルの改行コード [default \n]
        "eol": "\n",
      },
      // 対象にするテーブルリスト(未指定時は全テーブル)
      "tableList": [
        "table1",
        "table2",
      ],
    }, ...
  ]
}
```

### 置き換え文字

ファイル・フォルダ指定や名称指定する際の置き換え文字。

|置き換え文字|利用可能設定項目|説明|
|---|---|---|
|`${workspaceRoot}`|io.outputPath \| io.templatePath|ワークスペースルートフォルダ|
|`${className}`|format.className|クラス・ファイル名|

## テンプレート用テキストファイルについて

Entityクラスを生成するにはテンプレートファイルを用意する必要があります。  
名前は何でも構いませんが、テキスト形式である必要があります。  
テンプレート内の以下の文字列はシステムで自動的に置き換わります。

|置換え文字|説明|
|---|---|
|`{{class_name}}`|Entityのクラス名|
|`{{class_desc}}`|Entity用DBテーブルコメント|
|`{{table_name}}`|DBテーブル名|
|`{{table_comment}}`|DBテーブルコメント|
|`{{engine}}`|DBエンジン名|
|`{{primary_id}}`|プライマリキー指定されているフィールド名(最初の1つ)|
|`{{primary_ids}}`|プライマリキー指定されているフィールド名(カンマ区切り)|
|`{{primary_ids_sq}}`|プライマリキー指定されているフィールド名(カンマ区切り+`'`で囲む)|
|`{{primary_ids_dq}}`|プライマリキー指定されているフィールド名(カンマ区切り+`"`で囲む)|
|`<<<fields_list`|フィールドプロパティ領域開始タグ|
|`>>>fields_list`|フィールドプロパティ領域終了タグ|
|`<<<indexes_list`|インデックスプロパティ領域開始タグ|
|`>>>indexes_list`|インデックスプロパティ領域終了タグ|
|`{{field_comment}}`|フィールドのコメント。`フィールドプロパティ領域内に記載`|
|`{{field_type}}`|フィールドの型。`フィールドプロパティ領域内に記載`|
|`{{field_lang_type}}`|プログラミング言語用に変換されたフィールドの型。`フィールドプロパティ領域内に記載`|
|`{{field_name}}`|フィールド名。`フィールドプロパティ領域内に記載`|
|`{{field_name_uppercase}}`|フィールド名(大文字版)。`フィールドプロパティ領域内に記載`|
|`{{field_nullable}}`|フィールドのNull許容情報。`フィールドプロパティ領域内に記載`|
|`{{field_default_value}}`|フィールドのデフォルト値。`フィールドプロパティ領域内に記載`|
|`{{field_lang_default_value}}`|プログラミング言語用に変換されたフィールドのデフォルト値。`フィールドプロパティ領域内に記載`|
|`{{field_key}}`|フィールドが持つキー情報。`フィールドプロパティ領域内に記載`|
|`{{field_extra}}`|フィールドがExtra情報。`フィールドプロパティ領域内に記載`|
|`{{index_name}}`|インデックス名。`インデックスプロパティ領域内に記載`|
|`{{index_columns}}`|インデックスの指定カラム。`インデックスプロパティ領域内に記載`|
|`{{index_order}}`|複合インデックスの順番。`インデックスプロパティ領域内に記載`|
|`{{index_nullable}}`|Null許容情報。`インデックスプロパティ領域内に記載`|
|`{{index_unique}}`|ユニーク情報。`インデックスプロパティ領域内に記載`|

### For example

#### php

```php
<?php
namespace IO\DataBase\DTO;
use Standard\IO\Data\DTO\AbstractParameter;

/**
 * データベースDTO
 * Table: {{table_name}}
 * {{class_desc}}
 * @author Scheme Scribe
 */
class {{class_name}} extends AbstractParameter
{
    /** テーブル名 */
    const TABLE_NAME = '{{table_name}}';

    /** エンジン */
    const ENGINE = '{{engine}}';

    /** プライマリID */
    const PRIMARY_KEY = '{{primary_id}}';

<<<fields_list
    /** {{field_comment}} @var {{field_lang_type}} */
    public ${{field_name}} = {{field_lang_default_value}};
>>>fields_list
}
```

#### Mark Down

```md
# 「{{table_name}}」テーブル定義書

{{table_comment}}

{{engine}}

Primary ID: {{primary_ids}}

## カラム

|カラム名|型|Null許容|デフォルト値|キー|その他|コメント|
|---|---|---|---|---|---|---|
<<<fields_list
|{{field_name}}|{{field_type}}|{{field_nullable}}|{{field_default_value}}|{{field_key}}|{{field_extra}}|{{field_comment}}|
>>>fields_list

## インデックス

|インデックス名|カラム|複合順|Null許容|ユニーク|
|---|---|---|---|---|
<<<indexes_list
|{{index_name}}|{{index_columns}}|{{index_order}}|{{index_nullable}}|{{index_unique}}|
>>>indexes_list
```
