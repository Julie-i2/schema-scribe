# DTO Maker

`DTO Maker`はデータベースのテーブル情報を参照し、DTOクラスを自動で生成する拡張機能です。フォルダごとに設定でき、複数のデータベースにも対応できます。

<br />

## 必要条件

1. プロジェクトフォルダ直下に`.dtomaker`フォルダを用意します。
2. `.dtomaker`フォルダ内に`config.json`と`テンプレート用テキストファイル`を用意します。

<br />

## 設定

参照するデータベースの設定やDTOクラスのフォーマット、出力先等を設定することが可能です。<br />
設定は`workspace`直下の`.dtomaker/config.json`に記載します。

> **注意**：この設定はVS Codeの`setting.json`とは異なります。

For example:
``` json
{
  "DTOMaker.configs": [
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
        "databse": "system_name",
      },
      "format": {
        // 出力先のパス
        "outputPath": "${workspaceRoot}\\classes\\IO\\DataBase\\DTO",
        // DTO生成前に出力先フォルダの中身をすべて削除する [default true]
        "outputReset": true,
        // テンプレートファイルのパス
        "templatePath": "${workspaceRoot}\\.vscode\\dto-template.txt",
        // 出力を1つのファイルにまとめる [default false]
        "combine": false,
        // 出力を1つのファイルにまとめた際のファイル名
        "combineFileName": "dtos",
        // 種別 ["dto", "create", "sqlite"]
        "type": "dto",
        // DTOクラス名のPrefix・Suffix
        "className": "${className}DTO",
        // 作成するファイルの拡張子
        "fileExtension": "php",
        // テーブル名からマッチした先頭文字を取り外す
        "ltrimTableName": "table_",
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
|`${className}`|format.className|DTOクラス・ファイル名|

<br />

## テンプレート用テキストファイルについて

DTOクラスを生成するにはテンプレートファイルを用意する必要があります。<br />
名前は何でも構いませんが、テキスト形式である必要があります。<br />
テンプレート内の以下の文字列はシステムで自動的に置き換わります。

|置換え文字|説明|
|---|---|
|`{{class_name}}`|DTOのクラス名|
|`{{class_desc}}`|DTO用DBテーブルコメント|
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

For example:

``` php
<?php
namespace IO\DataBase\DTO;
use Standard\IO\Data\DTO\AbstractParameter;

/**
 * データベースDTO
 * Table: {{table_name}}
 * {{class_desc}}
 * @author DTO Maker
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
