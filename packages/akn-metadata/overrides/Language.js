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

 Ext.define('AknMetadata.Language', {
    override: 'LIME.controller.Language',

    requires: [
        'AknMain.metadata.HtmlSerializer',
        'AknMain.xml.Document',
        'LIME.DomUtils'
    ],

    appendMetadata: function() {
        var metaNode = this.callParent(arguments);

        // if the meta are related to the main document
        if (metaNode && metaNode.parentNode && metaNode.parentNode.hasAttribute(DocProperties.docIdAttribute))
            this.overwriteMetadata(metaNode, Ext.getStore('metadata').getMainDocument());
    },

    overwriteMetadata: function(metaNode, store) {
        if (!store) return;
        var metaStr = AknMain.metadata.HtmlSerializer.serialize(store),
            doc = AknMain.xml.Document.parse(metaStr);
        console.log(" XXX YYY overwriteMetadata metaStr = ", Ext.clone(metaNode), metaStr);
        var lastInsertedNode = undefined;
        doc.select('//*[@class="meta"]/*').forEach(function(node) {
            node = metaNode.ownerDocument.adoptNode(node);
            var oldNode = metaNode.querySelector('*[class="'+node.getAttribute('class')+'"]');

            if (oldNode) {
                oldNode.parentNode.replaceChild(node, oldNode);
                lastInsertedNode = node;
            }
            else if (lastInsertedNode) {
                DomUtils.insertAfter(node, lastInsertedNode);
                lastInsertedNode = node;
            }
            else
                lastInsertedNode = metaNode.appendChild(node);
        });

        this.removeInconsistentElements(metaNode);
    },

    removeInconsistentElements: function(node) {
        var doc = AknMain.xml.Document.newDocument(node);
        var query = '//*[@class="classification" or '+
                    '@class="lifecycle" or '+
                    '@class="workflow" or '+
                    '@class="analysis" or '+
                    '@class="activeModifications" or '+
                    '@class="passiveModifications" or '+
                    '@class="references"]'+
                    '[not(child::*)]';
        
        // Iterate multiple times to remove elements which become empty
        // in result of previous iterations
        var depth = 2;
        while(depth--) {
            doc.select(query).forEach(function(node) {
                node.parentNode.removeChild(node);
            });
        }
    },

    // Replace meta href values from eId to internalId
    afterLoad: function(params) {
        this.callParent(arguments);
        var store = Ext.getStore('metadata').getMainDocument();
        if (!store || !params.docDom) return;

        var getNodeByEid = function(value) {
            return params.docDom.querySelector("*[" + LangProp.attrPrefix + "eid='"+value+"']");
        };

        var updateHref = function(rec) {
            var href = rec.get('href'),
                elId = href && DomUtils.getElementId(getNodeByEid(href));
            if (!href || !elId) return;

            rec.set('oldhref', href);
            rec.set('href', elId);
        };

        store.classificationKeywords().each(updateHref);
        //TODO: call updateHref for other metadata elements
    }
 });