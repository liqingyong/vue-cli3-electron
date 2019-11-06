const app=  require('electron'),
    fs = require('fs-extra'),  // 用于扩展内置 fs 方法
    request = require('request'),  // 用于发起下载请求
    path = require("path"),
    zlib = require('zlib');  // 用于执行 zip 解压缩
var express = require('express');
var server =  express();

/**
 * 下载文件
 * @param configuration
 * @returns {Promise<any>}
 */
export function downloadFile (configuration){
    return new Promise(function(resolve, reject){
        // Save variable to know progress
        var received_bytes = 0;
        var total_bytes = 0;
debugger
        server.get(configuration.remoteFile, function (req, res) {
            res.send('hello world')
        })
        var req = request({
            method: 'GET',
            uri: configuration.remoteFile
        });
       // const app=configuration.electron
      //  console.log(app)
        // 保存到临时目录，temp 为 Electron 用户可写目录
       let tempPath = "D:\\Temp\\";//path.resolve('./')+"/"+configuration.localFile;
        let dir = fs.mkdtempSync(`${tempPath}upgrade_`);
        var out = fs.createWriteStream(path.join(dir, configuration.fileName));//configuration.localFile
        try {
            req.pipe(out);
            req.on('response', function ( data ) {
                // Change the total bytes value to get progress later.
                total_bytes = parseInt(data.headers['content-length' ]);
            });

            // Get progress if callback exists
            if(configuration.hasOwnProperty("onProgress")){
                req.on('data', function(chunk) {
                    // Update the received bytes
                    received_bytes += chunk.length;

                    configuration.onProgress(received_bytes, total_bytes);
                });
            }else{
                req.on('data', function(chunk) {
                    // Update the received bytes
                    received_bytes += chunk.length;
                });
            }

            req.on('end', function() {
                // 解压完毕，复制更新文件
                fs.copySync(dir+"/"+configuration.fileName, configuration.localFile+"/"+configuration.fileName);  // 解压至指定的目录，这里用 __dirname 为例
                fs.removeSync(dir);  // 删除临时目录
                // 返回 true 表示需要重启
                resolve(true);
            });
        }catch (e) {
            console.error(e)
            fs.removeSync(dir);  // 删除临时目录
        }

    });
}
const update = {


    requestPost() {
        new Promise((resolve, reject) => {
            request({
                url: "",
                encoding: null  // encoding 为 null 使 body 生成为一个 Buffer
            }, (error, res, body) => {
                try {
                    if (error || res.statusCode !== 200) {
                        throw '请求失败';
                    }
                    // 保存到临时目录，temp 为 Electron 用户可写目录
                    let tempPath = app.getPath('temp');
                    let dir = fs.mkdtempSync(`${tempPath}/upgrade_`);
                    // 创建 Buffer 流并解压
                    let stream = new require('stream').Readable();
                    stream.push(body);
                    stream.push(null);
                    stream.pipe(zlib.extract({
                        sync: true,
                        cwd: dir
                    })).on('close', () => {
                        app.relaunch({args: process.argv.slice(1)});  // 重启
                        app.exit(0);
                        // 解压完毕，复制更新文件
                        fs.copySync(dir, __dirname);  // 解压至指定的目录，这里用 __dirname 为例
                        fs.removeSync(dir);  // 删除临时目录
                        // 返回 true 表示需要重启
                        resolve(true);
                    });
                } catch (e) {
                    reject('更新文件下载失败，请联系管理员');
                }
            })
        }).then(result => {
            if (result) {
                app.relaunch({args: process.argv.slice(1)});  // 重启
                app.exit(0);
            }
        }).catch(e => {
            // e 错误
        });
    },
    compareVersionJSON() {
        console.log(process.env.NODE_ENV)
    },
    /* v1 为本地版本号，v2 为线上版本号 */
    compareVersion(v1, v2) {
        const vs1 = v1.toString().split('.'), vs2 = v2.toString().split('.');
        if (vs1.length !== vs2.length) {
            // 版本格式不一致
            return true;
        }
        for (let i = 0; i < vs1.length; ++i) {
            let diff = parseInt(vs2[i], 10) - parseInt(vs1[i], 10);
            if (diff < 0) {
                // vs1 其中一个版本号段小于 vs2
                return false;
            }
            if (diff > 0) {
                // vs2 其中一个版本号段大于 vs1
                return true;
            }
        }
        // 版本一致
        return false;
    }
}
module.export =update