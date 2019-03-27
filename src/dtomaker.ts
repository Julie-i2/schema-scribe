import * as vscode from 'vscode';
import { DBAccessor, DBTable } from './dbAccessor';
import { writeFile } from 'fs';

export class DTOMaker {
    dbAccessor: DBAccessor;
    outputPath: string;

    /**
     * コンストラクタ
     * @param config 設定データ
     */
    constructor(config: any) {
        // テーブル情報の取得
        this.dbAccessor = new DBAccessor(config.database);
        this.outputPath = this.dirPath(config.outputPath || '${workspaceRoot}\\output');
    }

    dirPath(path: string) : string {
        path = path.replace(/\${workspaceRoot}/g, `${vscode.workspace.rootPath}`);
        return path;
    }

    dataGet() : Promise<void> {
        return this.dbAccessor.getTables().then((tables: string[]) => {
            tables.forEach((table: string) => {
                this.dbAccessor.getTableInfo(table).then((dbTable: DBTable) => {
                    console.log(dbTable);
                });
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
            writeFile(this.outputPath + '\\' + className, content, (err: Error) => {
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
