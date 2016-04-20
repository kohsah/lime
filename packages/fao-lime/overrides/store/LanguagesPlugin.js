/*
 * Copyright (c) 2014 - Copyright holders CIRSFID and Department of
 * Computer Science and Engineering of the University of Bologna
 *
 * Authors:
 * Monica Palmirani – CIRSFID of the University of Bologna
 * Fabio Vitali – Department of Computer Science and Engineering of the University of Bologna
 * Luca Cervone – CIRSFID of the University of Bologna
 *
 * Permission is hereby granted to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The Software can be used by anyone for purposes without commercial gain,
 * including scientific, individual, and charity purposes. If it is used
 * for purposes having commercial gains, an agreement with the copyright
 * holders is required. The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * Except as contained in this notice, the name(s) of the above copyright
 * holders and authors shall not be used in advertising or otherwise to
 * promote the sale, use or other dealings in this Software without prior
 * written authorization.
 *
 * The end-user documentation included with the redistribution, if any,
 * must include the following acknowledgment: "This product includes
 * software developed by University of Bologna (CIRSFID and Department of
 * Computer Science and Engineering) and its authors (Monica Palmirani,
 * Fabio Vitali, Luca Cervone)", in the same place and form as other
 * third-party acknowledgments. Alternatively, this acknowledgment may
 * appear in the software itself, in the same form and location as other
 * such third-party acknowledgments.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/**
 *This store is used for loading all .json configuration files.
 */
Ext.define('FaoLime.LanguagesPlugin', {
    //override : 'LIME.store.LanguagesPlugin',

    lastConfiguration : {
        docType : null,
        docEditorType: null,
        docLocale : null,
        loaded : false
    },

    /* TODO This directory structure has to be read from a web service! */
    languagePlugin : {
        languageRoot : new Ext.Template('{lang}/interface'),
        subDirs : {
            docEditorType : '',
            locale : '',
            language : Locale.getLang()
        }
    },

    loadPluginData : function(app, docType, editorType, docLocale, callback) {
        var me = this;
        /**
         * If the last loaded configuration is the same of the passed configuration
         * all files is already loaded
         */
        if (this.lastConfiguration.markingLanguage == Config.getLanguage()
            && this.lastConfiguration.loaded && this.lastConfiguration.docType == docType
            && this.lastConfiguration.docLocale == docLocale) {
            return callback(this.dataObjects);
        }

        /* For each directory retrieve all the needed json files starting from the languageRoot */
        var languagesPlugins = this;
        var directoriesList = this.languagePlugin.subDirs;
        var directoriesListDefault = Ext.clone(this.languagePluginDefault);
        directoriesListDefault.languageRoot = directoriesListDefault.languageRoot.apply({lang: Config.getLanguage()});
        var currentDirectory = this.baseDirectories['plugins']+'/'+this.languagePlugin.languageRoot.apply({lang: Config.getLanguage()});
        var currentDirectoryDefault = this.baseDirectories['plugins'];
        /* Build a list of urls to make the requests to */
        var reqUrls = [];
        var globalFiles = this.requiredFiles['global'];
        var pluginsFiles = this.requiredFiles['plugins'];
        var globalDir = this.baseDirectories['global'];
        for (var file in globalFiles) {
            var reqUrl = globalDir + '/' + globalFiles[file];
            var reqObject = {
                name : file,
                url : reqUrl,
                level: 'global'
            };
            reqUrls.push(reqObject);
        }
        this.app = app;
        this.dataObjects = {};
        app.fireEvent(Statics.eventsNames.progressUpdate, Locale.strings.progressBar.configurationFiles);
        this.lastConfiguration = {
            docType: docType,
            docEditorType : editorType,
            docLocale : docLocale,
            loaded : false,
            markingLanguage: Config.getLanguage()
        };

        var styleUrls = [];

        for (var directory in directoriesListDefault) {
            var newDir = directoriesListDefault[directory];
            currentDirectoryDefault += '/' + newDir;
            styleUrls.push({url: currentDirectoryDefault+"/"+me.styleFile});
            for (var files in pluginsFiles) {
                for (var file in pluginsFiles[files]) {
                    var reqUrl = currentDirectoryDefault + '/' + pluginsFiles[files][file];
                    var reqObject = {
                        name : file,
                        url : reqUrl,
                        level: 'defaults'
                    };
                    reqUrls.push(reqObject);
                }
            }
        }

        for (var directory in directoriesList) {
            var newDir = directoriesList[directory];
            if (directory == "locale") {
                newDir = docLocale;
            } else if (directory == "docEditorType") {
                newDir = editorType;
            }
            currentDirectory += '/' + newDir;
            styleUrls.push({url: currentDirectory+"/"+me.styleFile});
            for (var files in pluginsFiles) {
                for (var file in pluginsFiles[files]) {
                    var reqUrl = currentDirectory + '/' + pluginsFiles[files][file];
                    var reqObject = {
                        name : file,
                        url : reqUrl,
                        level: directory
                    };
                    reqUrls.push(reqObject);
                }
            }
        }
        me.reqUrls = reqUrls;
        Server.filterUrls(styleUrls, false, me.setStyleAndRequestFiles.bind(me, callback), me.setStyleAndRequestFiles.bind(me, callback), me);
    }

});
