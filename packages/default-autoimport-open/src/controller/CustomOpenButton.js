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

// Replace action for the open button in the main menu.
// NIR file: ask user if he wants to convert it to AKN.
// Doc file: automatically import
// Pdf file: ???
Ext.define('DefaultAutoimportOpen.controller.CustomOpenButton', {
    extend: 'Ext.app.Controller',

    refs: [
        { ref: 'appViewport', selector: 'appViewport' },
        { ref: 'pdf',         selector: 'pdf' },
        { ref: 'exportMenu',  selector: 'openDocumentButton' },
        { ref: 'openButton',  selector: 'openDocumentButton' }
    ],

    init: function () {
        this.replaceOpenMenu();
    },

    // Make sure the open button cam open NIR, DOC and PDF files.
    replaceOpenMenu: function () {
        this.application.fireEvent("addMenuItem", this, {
            menu: "fileMenuButton",
            replace: "openDocumentButton"
        }, {
            icon: 'resources/images/icons/folder_page.png',
            name: 'newOpenMenu',
            text: Locale.strings.openDocumentButtonLabel,
            tooltip: Locale.strings.openDocumentButtonTooltip,
            handler: this.openHandler.bind(this)
        });
    },

    openHandler: function () {
        var me = this;
        this.getController('Storage').selectDocument({
            callback: function(data) {
                me.startLoading();
                var path = data.id;
                var extension = path.substring(path.length - 3);
                if(extension == 'pdf')
                    me.onPdfSelected(path);
                else if(extension == 'doc')
                    me.onDocSelected(path);
                else {
                    Server.getDocument(path, function (content) {
                        if(typeof NirUtils !== 'undefined' && NirUtils.isNirContent(content))
                            me.onNirSelected(path, content);
                        else {
                            console.log('expecting akn');
                            me.onAknSelected(path);
                        }
                    }, function() {
                        me.stopLoading();
                    });
                }
            }
        });
    },

    startLoading: function() {
        this.application.fireEvent(Statics.eventsNames.progressStart, null, {
            value : 0.1,
            text : Locale.strings.progressBar.openingDocument
        });
    },

    stopLoading: function() {
        this.application.fireEvent(Statics.eventsNames.progressEnd);
    },

    onPdfSelected: function (path) {
        console.log('onPdfSelected', path);
        this.onBinaryDocumentSelected(path);
    },

    onBinaryDocumentSelected: function (path) {
        var me = this;
        Server.fileToHtml(path, function (html, lang) {
            console.log('html', html, lang);
            // Load the resulting Htmltoso document
            Ext.GlobalEvents.fireEvent(Statics.eventsNames.loadDocument, {
                docText: html,
                docMarkingLanguage: 'akoma3.0',
                docLang: lang
            });
        }, function() {
            me.stopLoading();
        });
    },

    onDocSelected: function (path) {
        console.log('onDocSelected', path);
        this.onBinaryDocumentSelected(path);
    },

    onNirSelected: function (path, content) {
        console.log('onNirSelected', path);
        var me = this;
        //NirUtils.confirmAknTranslation(function () {
            NirUtils.nirToHtml(content, function(html, akn) {
            // Load the resulting Htmltoso document
                Ext.GlobalEvents.fireEvent(Statics.eventsNames.loadDocument, {
                    docText: html,
                    docMarkingLanguage: 'akoma3.0',
                    originalXml: akn
                });
            });
        //});
    },

    onAknSelected: function (path) {
        this.getController('Storage').openDocument(path);
    }
});
