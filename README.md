# DTO Maker

`DTO Maker`はデータベースのテーブル情報を参照し、DTOクラスを自動で生成する拡張機能です。フォルダごとに設定でき、複数のデータベースにも対応できます。

<br />

## 特徴

実際のエクステンションのスクリーンショットなど、エクステンションの特定の機能について説明してください。イメージパスはこのREADMEファイルを基準にしています。


> ヒント：多くの一般的な拡張機能はアニメーションを利用します。これはあなたの拡張機能を披露するための優れた方法です！従うことが簡単で、焦点を絞った短いアニメーションをお勧めします。

<br />

## 必要条件

1. プロジェクトフォルダ直下に`.dtomaker`フォルダを用意します。
2. `.dtomaker`フォルダ内に`config.json`と`テンプレート用テキストファイル`を用意します。

<br />

## 拡張設定

拡張機能を使用するための設定について説明します。<br />
参照するデータベースの設定やDTOクラスのフォーマット、出力先等を設定することが可能です。

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
            "io": {
                // 出力先のパス
                "outputPath": "${workspaceRoot}\\classes\\IO\\DataBase\\DTO",
                // DTO生成前に出力先フォルダの中身をすべて削除する [default true]
                "outputReset": true,
                // テンプレートファイルのパス
                "templatePath": "${workspaceRoot}\\.vscode\\dto-template.txt",
            },
            "format": {
                // DTOクラス名のPrefix・Suffix
                "className": "${className}DTO",
                // テーブル名からマッチした先頭文字を取り外す
                "format.ltrimTableName": "table_",
                // データ型ごとの初期値を指定する
                "defaultValues": {
                    "datetime": "DEFAULT_DATETIME",
                    "date": "DEFAULT_DATE",
                    "time": "DEFAULT_TIME"
                },
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
|`{{table_name}}`|DBテーブル名|
|`{{class_desc}}`|DBテーブルコメント|
|`{{class_name}}`|DTOのクラス名|
|`{{engine}}`|DBエンジン名|
|`{{primary_id}}`|プライマリキー指定されているフィールド名|
|`<<<fields_list`|フィールドプロパティ領域開始タグ|
|`>>>fields_list`|フィールドプロパティ領域終了タグ|
|`{{field_comment}}`|フィールドのコメント。`フィールドプロパティ領域内に記載`|
|`{{field_type}}`|フィールドの型。`フィールドプロパティ領域内に記載`|
|`{{field_name}}`|フィールド名。`フィールドプロパティ領域内に記載`|
|`{{field_default_value}}`|フィールドのデフォルト値。`フィールドプロパティ領域内に記載`|

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
    /** {{field_comment}} @var {{field_type}} */
    public ${{field_name}} = {{field_default_value}};
>>>fields_list
}
```

<br />

## 既知の問題点

問題を見つけたら報告してくれると助かります。

<br />

## リリースノート

bata版リリース

### 0.0.1

初期リリース
