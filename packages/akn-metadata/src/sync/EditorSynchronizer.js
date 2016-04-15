/*
 * Copyright (c) 2015 - Copyright holders CIRSFID and Department of
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

// Update the metadata store when some elmeents are marked in the editor:
// - marking a docDate updates all URI
// - marking a signature adds a reference
Ext.define('AknMetadata.sync.EditorSynchronizer', {
    extend: 'Ext.app.Controller',

    listen: {
        store: {
            '#metadata': {
                maindocumentchanged: 'onMetadataUpdate',
                update: 'onMetadataUpdate'
            }
        },
        global: {
            nodeAttributesChanged: 'onAttributeChange'
        }
    },

    onMetadataUpdate: Utilities.events.debounce(function () {
        this.getController('Editor').showDocumentIdentifier();
    }, 100),

    init: function () {
        this.application.on({
            nodeChangedExternally: this.onNodeMarked.bind(this)
        });
    },

    onNodeMarked: function (nodes, config) {
        var me = this;
        if (config.unmark) return;
        nodes.forEach(function (node) {
            var tagName = DomUtils.getNameByNode(node);
            switch (tagName) {
            case 'role':
            case 'location':
            case 'person':
                me.addRefersTo(node, {
                    role: 'TLCRole',
                    location: 'TLCLocation',
                    person: 'TLCPerson'
                }[tagName]);
                break;
            case 'docNumber':
                me.addDocNumberMeta(node);
                break;
            case 'docType':
                me.addDocTypeMeta(node);
                break;
            default:
                // console.log(DomUtils.getNameByNode(node));
            }
        });
    },

    addRefersTo: function (node, type) {
        var meta = Ext.getStore('metadata').getMainDocument(),
            text = node.textContent.trim(),
            showAs = text.substring(0, 40),
            eid = showAs.toLowerCase().replace(/[^\w]/g, ''),
            data = {
                eid: eid,
                type: type,
                href: '/ontology/'+DomUtils.getNameByNode(node)+'/'+meta.get('country')+'/'+eid,
                showAs: showAs
            };
        if(eid) {
            node.setAttribute('akn_refersto', '#' + eid);
            meta.references().add(data);
            Ext.GlobalEvents.fireEvent('forceMetadataWidgetRefresh');
        }
    },

    addDocNumberMeta: function(node) {
        var meta = Ext.getStore('metadata').getMainDocument();
        var numStr = node.textContent;
        var num = numStr.match(/(?!((n|num|no|nr)(\.|º|°|\s)?))\w+/); //TODO: move to parsers!!

        num = (num.length) ? num[0] : numStr;
        meta.set('number', this.normalize(num));
    },

    addDocTypeMeta: function(node) {
        var meta = Ext.getStore('metadata').getMainDocument();
        var type = this.normalize(node.textContent);
        meta.set('subtype', type);
    },

    normalize: function(str) {
        return str.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    },

    onAttributeChange: function (node) {
        switch (DomUtils.getNameByNode(node)) {
        case 'docDate':
            this.docDateUpdated(node);
            break;
        default:
            // console.log(DomUtils.getNameByNode(node));
        }
    },

    docDateUpdated: function (node) {
        console.info('docDateUpdated')
        var meta = Ext.getStore('metadata').getMainDocument();
        var date = new Date(node.getAttribute('akn_date'));
        if (!isNaN(date.getTime())) {
            meta.set('date', date);
            meta.set('version', date);
        }
    }
});
