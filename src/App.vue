<template>
    <div id="app">
        <div id="nav">
            <iframe src="https://www.baidu.com"></iframe>
            <!--  <router-link to="/">Home</router-link> |
              <router-link to="/about">About</router-link>-->
        </div>
        <!--  <router-view/>-->
        <el-dialog
                title="正在更新新版本,请稍候..."
                :visible.sync="dialogVisible"
                width="60%"
                :close-on-click-modal="closeOnClickModal"
                :close-on-press-escape="closeOnPressEscape"
                :show-close="showClose"
                center
        >
            <div style="width:100%;height:20vh;line-height:20vh;text-align:center">
                <el-progress
                        status="success"
                        :text-inside="true"
                        :stroke-width="20"
                        :percentage="percentage"
                        :width="strokeWidth"
                        :show-text="true"
                ></el-progress>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    const electron = require('electron')
    const ipcRenderer = require('electron').ipcRenderer;
    const express = require('express');
    import {downloadFile} from './update'

    let _this = this;
    //接收主进程版本更新消息
    ipcRenderer.on("message", (event, arg) => {
        // for (var i = 0; i < arg.length; i++) {
        console.log(arg);
        if ("update-available" == arg.cmd) {
            //显示升级对话框
            _this.dialogVisible = true;
        } else if ("download-progress" == arg.cmd) {
            //更新升级进度
            /**
             *
             * message{bytesPerSecond: 47673
      delta: 48960
      percent: 0.11438799862426002
      total: 42801693
      transferred: 48960
      }
             */
            console.log(arg.message.percent);
            let percent = Math.round(parseFloat(arg.message.percent));
            _this.percentage = percent;
        } else if ("error" == arg.cmd) {
            _this.dialogVisible = false;

            _this.$message("更新失败");
        }
        // }
    });
    //20秒后开始检测新版本
    let timeOut = window.setTimeout(() => {
        ipcRenderer.send("checkForUpdate");
    }, 5000);
    clearTimeout;
    /*  //间隔1小时检测一次
      let interval = window.setInterval(() => {
          ipcRenderer.send("checkForUpdate");
      }, 3600000);*/

    export default {
        name: "app",
        data() {
            return {
                dialogVisible: false,
                closeOnClickModal: false,
                closeOnPressEscape: false,
                showClose: false,
                percentage: 0,
                strokeWidth: 200
            };
        },
        mounted() {
            _this = this;
            downloadFile({
                electron: electron,
                remoteFile: "http://94.191.125.192/updateSVN/app.asar",
                localFile: process.env.NODE_ENV !== 'production' ? "dist_electron/win-unpacked/resources/" : "resources/",
                fileName: 'app.asar',
                onProgress: function (received, total) {
                    _this.dialogVisible = true;
                    var percentage = (received * 100) / total;
                    _this.percentage = Math.floor(percentage);
                    console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
                }
            }).then(function () {
                _this.$message.success("File succesfully downloaded");
                ipcRenderer.send("ExitOnUpdate");
            });
        },

        destroyed() {
            window.clearInterval(interval);
            window.clearInterval(timeOut);
        }
    };
</script>
<style lang="less">
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        position: absolute;
        top: 0px;
        bottom: 0px;
        left: 0px;
        right: 0px;
    }

    #nav {
        padding: 0px;
        width: 100%;
        height: 100%;
        iframe {
            width: 100%;
            height: 100%;
            margin: 0px;
            border: 0px;
            padding: 0px;
            position: absolute;
            top: 0px;
            bottom: 0px;
            left: 0px;
            right: 0px;
        }
        a {
            font-weight: bold;
            color: #2c3e50;

            &.router-link-exact-active {
                color: #42b983;
            }
        }
    }
</style>
