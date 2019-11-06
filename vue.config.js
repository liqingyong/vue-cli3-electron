module.exports = {
    publicPath: './', // 默认'/'，部署应用包时的基本 URL  /config-admin
    assetsDir: '',  // 相对于outputDir的静态资源(js、css、img、fonts)目录
    pluginOptions: {
        electronBuilder: {
            webpackConfig: {//electron构建过程的webpack配置
                "commonSourceDirectory": "src/common",
                "staticSourceDirectory": "",
            },
            "electronWebpack": {
                "commonSourceDirectory": "src/common",
                "staticSourceDirectory": "",
                "title": true,
                "whiteListedModules": ["foo-ui-library"],//列入外部白名单

                "main": {
                    "extraEntries": ["@/preload.js"],
                    "sourceDirectory": "src/main",
                    "webpackConfig": "custom.webpack.additions.js"
                },

                "renderer": {
                    "dll": ["fooModule"],
                    "sourceDirectory": "src/renderer",
                    "template": "src/renderer/index.html",
                    "webpackConfig": "custom.webpack.additions.js",
                    "webpackDllConfig": "custom.webpackDll.additions.js"
                }
            },
            webpackMainConfig: {//electron主进程的webpack配置

            },
            builderOptions: {
                "appId": "com.example.app",
                "productName":"五加五科技",//项目名，也是生成的安装文件名，即aDemo.exe
                "copyright":"Copyright © 2019",//版权信息
             /*   "author": "lqy <735314662@qq.com>",
                 "license": "LQY",*/
                "directories":{
                    "buildResources":"",
                    "output":"./dist_electron"//输出文件路径
                },
                publish: [
                    {
                        "provider": "generic", // 服务器提供商 也可以是GitHub等等
                        "url": "http://94.191.125.192/updateSVN/" // 服务器地址
                    }],
                "files": [
                    "**/*",
                    "!foo/*.js"
                 /*   "./index.html",
                    "./background.js",
                    "./package.json",
                    "./dist_electron/!**!/!*",
                    "./static/!**!/!*"*/
                ],
                "win":{//win相关配置
                    "icon":"./favicon.ico",//图标，当前图标在根目录下，注意这里有两个坑
                    "target": [
                        {
                            "target": "nsis",//利用nsis制作安装程序
                            "arch": [// 这个意思是打出来32 bit + 64 bit的包，但是要注意：这样打包出来的安装包体积比较大，所以建议直接打32的安装包。
                                "x64", //64位
                               // "ia32"
                            ]
                        }
                    ]
                },
                "nsis": {
                    "oneClick": false, // 是否一键安装
                    "allowElevation": true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
                    "allowToChangeInstallationDirectory": true, // 允许修改安装目录
                    "installerIcon": "./favicon.ico",// 安装图标
                    "uninstallerIcon": "./favicon.ico",//卸载图标
                    "installerHeaderIcon": "./favicon.ico", // 安装时头部图标
                    "createDesktopShortcut": true, // 创建桌面图标
                    "createStartMenuShortcut": true,// 创建开始菜单图标
                    "shortcutName": "五加五科技", // 图标名称（在程序栏显示的名称）
                },
            }
        }
    }
}