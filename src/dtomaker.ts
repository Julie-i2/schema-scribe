import * as vscode from 'vscode';
import { DBAccessor, DBTable, DBTableColumn } from './dbAccessor';
import { writeFile } from 'fs';
import { Template } from './template';

/**
 * 入出力設定
 */
class SettingIO {
    public outputPath: string;
    public outputReset: boolean;
    public templatePath: string;
    constructor(config: any) {
        this.outputPath =  this.dirPath(config.outputPath || '${workspaceRoot}\\output');
        this.outputReset = !!config.outputReset;
        this.templatePath = this.dirPath(config.templatePath || '');
    }

    private dirPath(path: string) : string {
        path = path.replace(/\${workspaceRoot}/g, `${vscode.workspace.rootPath}`);
        return path;
    }
}

class SettingDataBase {
    public host: string;
    public port: number;
    public user: string;
    public password: string;
    public database: string;
    constructor(config: any) {
        this.host = config.host || 'localhost';
        this.port = config.port || 3306;
        this.user = config.user || 'root';
        this.password = config.password || '';
        this.database = config.database || '';
    }
}

/**
 * フォーマット設定
 */
class SettingFormat {
    public className: string;
    public ltrimTableName: string;
    constructor(config: any) {
        this.className = config.className || '';
        this.ltrimTableName = config.ltrimTableName || '';
    }
}

/**
 * DTOメーカー
 */
export class DTOMaker {
    private dbAccessor: DBAccessor;
    private template: Template;
    private settingIO: SettingIO;
    private settingFormat: SettingFormat;
    private tableNames: string[];

    /**
     * コンストラクタ
     * @param config 設定データ
     */
    constructor(config: any) {
        // テーブル情報の取得
        this.settingIO = new SettingIO(config.io);
        this.settingFormat = new SettingFormat(config.format);
        this.dbAccessor = new DBAccessor(config.database);
        this.template = new Template(this.settingIO.templatePath, this.settingFormat.className, this.settingFormat.ltrimTableName);
        this.tableNames = config.tableList || [];
    }

    /**
     * テーブル一覧を取得
     */
    private getTableList() : Promise<string[]> {
        return new Promise((resolve, reject) => {
            if (this.tableNames.length > 0) {
                resolve(this.tableNames);
            } else {
                this.dbAccessor.getTables().then((tables: string[]) => {
                    resolve(tables);
                });
            }
        });
    }

    dataGet() : Promise<void> {
        return this.getTableList().then((tables: string[]) => {
            tables.forEach((table: string) => {
                let dtoWriter = this.template.createMaker(table);
                this.dbAccessor.getTableInfo(table).then(
                    (dbTable: DBTable) => {
                        dtoWriter.setTableInfo(dbTable);
                        return this.dbAccessor.getTableColumns(table);
                    }
                ).then(
                    (tableColumns: DBTableColumn[]) => {
                        tableColumns.forEach((tableColumn: DBTableColumn) => {
                            dtoWriter.addField(tableColumn);
                        });
                        dtoWriter.replace();
                        dtoWriter.output(this.settingIO.outputPath);
                    }
                );
            });
            vscode.window.showInformationMessage('DTO Maker: Success! Created DTO');
        }).catch((err: Error) => {
            console.log(err);
            process.exit(1);
            vscode.window.showErrorMessage('DTO Maker: MySQL Error...');
        });
    }

    /**
     * ファイル出力
     */
    print(className: string, content: string) : Promise<void> {
        return new Promise((resolve, reject) => {
            writeFile(this.settingIO.outputPath + '\\' + className, content, (err: Error) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('書き込み完了');
                resolve();
            });
        });
    }
}
