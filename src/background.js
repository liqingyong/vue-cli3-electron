'use strict'
const electron=require("electron")
import { app, protocol,Menu,shell, BrowserWindow ,remote} from 'electron'
const {ipcMain} = require('electron')
const path = require('path')
const fs=require("fs-extra")
const  config=require("../vue.config")
import { autoUpdater } from "electron-updater"
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let mainWindow = null;

// Scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true })

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 800, height: 600, webPreferences: {
    nodeIntegration: true
  } })


    if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
   //   win.loadFile(`${__dirname}\\index.html`)
   win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
   // win.loadFile(`${__dirname}\\index.html`)
    win.loadURL('app://./index.html')
  //autoUpdater.checkForUpdatesAndNotify()
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

//自定义memu
let template = [
    {
        label:'菜单',
        submenu:[
            {
                label:'重载',
                accelerator:'Ctrl+R',
                click:function(item, focusedWindow){
                    if (focusedWindow) {
                        // on reload, start fresh and close any old
                        // open secondary windows
                        if (focusedWindow.id === 1) {
                            BrowserWindow.getAllWindows().forEach(function (win) {
                                if (win.id > 1) {
                                    win.close()
                                }
                            })
                        }
                        focusedWindow.reload()
                    }
                }
            },
            {
                label:'退出',
                accelerator:'Ctrl+W',
                role:'close'

            }
        ]
    },
    {
        label:'帮助',
        submenu:[
            {
                label:'关于',
                click:function(item,focusedWindow,webContents ){
                    if (focusedWindow) {
                        const options = {
                            type: 'info',
                            title: '关于',
                          //  buttons: ['好的'],
                            message:`公司：南宁五加五科技有限公司\n版本号：${process.version}`,
                        }
                        electron.dialog.showMessageBox(focusedWindow, options, function () {})
                    }
                }
            },

            {
                label:'开发者工具',
                accelerator:'F12',
                click:function(item,focusedWindow){
                    if(focusedWindow){
                        focusedWindow.toggleDevTools()
                    }
                }
            }
        ]
    }
];
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
  await installVueDevtools()
} catch (e) {
  console.error('Vue Devtools failed to install:', e.toString())
}

  }
  createWindow()
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    //设置版本更新地址，即将打包后的latest.yml文件和exe文件同时放在
//http://xxxx/test/version/对应的服务器目录下,该地址和package.json的publish中的url保持一致
    if (!process.env.WEBPACK_DEV_SERVER_URL){
        let feedUrl = config.pluginOptions.electronBuilder.builderOptions.publish[0].url;
        //检测版本更新
        updateHandle(win,feedUrl);
    }

})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
// 在这个文件中，你可以续写应用剩下主进程代码。
// 也可以拆分成几个文件，然后用 require 导入。
function updateHandle(window, feedUrl) {
    let updaterCacheDirName = 'electron-updater1'
    const updatePendingPath = path.join(autoUpdater.app.baseCachePath, updaterCacheDirName, 'pending')
    console.warn(updatePendingPath)
    fs.emptyDir(updatePendingPath)
    console.warn(autoUpdater.app.baseCachePath)
    mainWindow = window;
    let message = {
        error: '检查更新出错',
        checking: '正在检查更新……',
        updateAva: '检测到新版本，正在下载……',
        updateNotAva: '现在使用的就是最新版本，不用更新',
    };
    //设置更新包的地址
    autoUpdater.setFeedURL(feedUrl);
    //监听升级失败事件
    autoUpdater.on('error', function (error) {
        sendUpdateMessage({
            cmd: 'error',
            message: error
        })
    });
    //监听开始检测更新事件
    autoUpdater.on('checking-for-update', function (message) {
        sendUpdateMessage({
            cmd: 'checking-for-update',
            message: message
        })
    });
    //监听发现可用更新事件
    autoUpdater.on('update-available', function (message) {
        sendUpdateMessage({
            cmd: 'update-available',
            message: message
        })
    });
    //监听没有可用更新事件
    autoUpdater.on('update-not-available', function (message) {
        sendUpdateMessage({
            cmd: 'update-not-available',
            message: message
        })
    });

    // 更新下载进度事件
    autoUpdater.on('download-progress', function (progressObj) {
        sendUpdateMessage({
            cmd: 'download-progress',
            message: progressObj
        })
    });
    //监听下载完成事件
    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl) {
        sendUpdateMessage({
            cmd: 'update-downloaded',
            message: {
                releaseNotes,
                releaseName,
                releaseDate,
                updateUrl
            }
        })

        //只更新asar文件下 退出并安装文件
        autoUpdater.on('ExitOnUpdate',function (message) {
            app.relaunch({args: process.argv.slice(1)});  // 重启
            app.exit(0);
        })
        //退出并安装更新包
        autoUpdater.quitAndInstall();
    });

    //接收渲染进程消息，开始检查更新
    ipcMain.on("checkForUpdate", (e, arg) => {
        //执行自动更新检查
        sendUpdateMessage({cmd:'checkForUpdate',message:arg})
        autoUpdater.checkForUpdates();
    })
}
//给渲染进程发送消息
function sendUpdateMessage(text) {
    mainWindow.webContents.send('message', text)
}