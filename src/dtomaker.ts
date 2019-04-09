import * as vscode from 'vscode';
import { DBAccessor, DBTable, DBTableColumn } from './dbAccessor';
import { Template } from './template';

/**
 * 入出力設定
 */
export class SettingIO {
    public outputPath: string;
    public outputReset: boolean;
    public templatePath: string;
    constructor(config: any) {
        this.outputPath =  this.dirPath(config.outputPath || '${workspaceRoot}\\output', config.folderName);
        this.outputReset = !!config.outputReset;
        this.templatePath = this.dirPath(config.templatePath || '', config.folderName);
    }

    private dirPath(path: string, folderName: string) : string {
        if (!vscode.workspace.workspaceFolders) {
            throw Error('DTO Maker: WorkSpace上でないと使用できません');
        }
        let projectFolder: vscode.WorkspaceFolder = vscode.workspace.workspaceFolders[0];
        vscode.workspace.workspaceFolders.forEach((folder) => {
            if (folder.name === folderName) {
                projectFolder = folder;
            }
        });
        path = path.replace(/\${workspaceRoot}/g, `${projectFolder.uri.fsPath}`);
        return path;
    }
}

/**
 * DB設定
 */
export class SettingDataBase {
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
export class SettingFormat {
    public className: string;
    public ltrimTableName: string;
    public defaultValues: any;
    constructor(config: any) {
        this.className = config.className || '';
        this.ltrimTableName = config.ltrimTableName || '';
        this.defaultValues = config.defaultValues;
    }
}

/**
 * DTOメーカー
 */
export class DTOMaker {
    private dbAccessor: DBAccessor;
    private template: Template;
    private settingIO: SettingIO;
    private tableNames: string[];

    /**
     * コンストラクタ
     * @param config 設定データ
     */
    constructor(config: any) {
        // テーブル情報の取得
        this.settingIO = new SettingIO(config.io);
        this.dbAccessor = new DBAccessor(config.database);
        this.template = new Template(
            this.settingIO.templatePath,
            new SettingFormat(config.format)
        );
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

    /**
     * 生成
     */
    public build() : Promise<void> {
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
        }).catch((err: Error) => {
            console.log(err);
            process.exit(1);
            vscode.window.showErrorMessage('DTO Maker: MySQL Error...');
        });
    }
}
