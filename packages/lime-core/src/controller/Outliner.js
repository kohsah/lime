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
 * This controller takes care of managing the tree responsible for the visualization
 * of the current hierarchy of marked elements in the document. Through the related view
 * it is possible to interact with the visualized elements selecting, modifying or deleting them.
 */
Ext.define('LIME.controller.Outliner', {

    extend : 'Ext.app.Controller',

    views : ['Outliner'],

    refs : [{
        ref : 'outliner',
        selector : 'outliner'
    }, {
        ref : 'contextMenu',
        selector : 'contextMenu'
    }],

    iconBaseCls: 'explorer-icon',

    getTreeNodeFromDomNode: function(treeRootNode, domNode) {
        var treeNode = null;

        if (!domNode) return;

        if ( treeRootNode && domNode.nodeType == DomUtils.nodeType.ELEMENT ) {
            var internalId = domNode.getAttribute(DomUtils.elementIdAttribute);
            if ( internalId ) {
                return treeRootNode.findChild('cls', internalId, true);
            }
        }
        return treeNode;
    },

    /**
     * This function expands and selects the passed node.
     * @param {Ext.data.NodeInterface} node A reference the node that has to be expanded
     */
    expandItem: function(node) {
        var me = this, tree = this.getOutliner(), root, row, parents,
            nodeToSelect = null;

        root = tree.store.getRootNode();
        if (!node) {
            tree.getSelectionModel().select(root, false, true);
            return;
        };

        parents = DomUtils.getMarkedParents(node).reverse();
        parents.push(DomUtils.getFirstMarkedAncestor(node));
        parents = Ext.Array.unique(parents);

        Ext.suspendLayouts();
        Ext.each(parents, function(parent) {
            var treeNode = me.getTreeNodeFromDomNode(root, parent);
            if ( treeNode && !treeNode.hasChildNodes() && parent.querySelector('['+DomUtils.elementIdAttribute+']') ) {
                me.buildTree(parent, "partial");
                treeNode = me.getTreeNodeFromDomNode(root, parent);
            }

            if ( treeNode ) {
                treeNode.expand();
                nodeToSelect = treeNode;
            }
        });
        Ext.resumeLayouts(true);

        if ( nodeToSelect ) {
            //select the node
            tree.getSelectionModel().select(nodeToSelect, false, true);
            row = document.querySelector('#'+tree.items.items[0].getRowId(nodeToSelect));
            if ( row ) {
                Ext.fly(row).scrollIntoView(tree.items.items[0].getEl(), false, true);
            }
        }

    },

    beforeExpandItem: function(node) {
        var me = this, treeView = this.getOutliner();

        if( treeView && !treeView.isHidden() ) {
            treeView.setLoading(true);
            Ext.defer(function() {
                me.expandItem(node);
                treeView.setLoading(false);
            }, 5);
        }
    },

    getTreeDataFromNode : function(node) {
        var data = {}, id = node.getAttribute(DomUtils.elementIdAttribute),
            markedObj = DocProperties.markedElements[id], button;

        if (markedObj) {
            button = markedObj.button;
            var containsModClass = (node.querySelector('.mod') || node.querySelector('.quotedStructure')) ? 'data-containsmod' : '';
            var wrapperClass = button.pattern.wrapperClass,
                newIcon = '<div class="'+this.iconBaseCls+' ' + wrapperClass + '" '+containsModClass+' ></div>',
                text = newIcon + button.shortLabel;

            var info = DomUtils.getNodeExtraInfo(node, "hcontainer");
            if (info) {
                text += " " + info;
            }
            data = {
                text: text,
                cls: id,
                leaf: (node.querySelector('['+DomUtils.elementIdAttribute+']')) ? false : true
            }
        }
        return data;
    },

    loadCss: function() {
        var me = this,
            buttons = DocProperties.getElementsConfigList(),
            button, wrapperClass, iconColor,
            head = document.querySelector("head"),
            styleId = 'limeExplorerStyle',
            styleNode = head.querySelector('#'+styleId);


        if ( styleNode ) {
            head.removeChild(styleNode);
        }

        for (i in buttons) {
            button = buttons[i];
            if(button.pattern) {
                wrapperClass = button.pattern.wrapperClass;
                iconColor = button.pattern.styleObj["background-color"];
                DomUtils.addStyle('*[class="'+ me.iconBaseCls+' '+ wrapperClass + '"]', 'background-color: '+iconColor+';', document, styleId);
            }
        }
    },

    createTreeDataNew : function(root, desiredDepth) {

        desiredDepth = (desiredDepth !== undefined) ? desiredDepth : -1;
        var data = [], parents = [],
            nodes = root.querySelectorAll('['+DomUtils.elementIdAttribute+']'),
            parentObj = null, parentNode = null, map = {}, node, localData;

        if ( root.getAttribute(DomUtils.elementIdAttribute) ) {
            localData = this.getTreeDataFromNode(root);
            map[localData.cls] = localData;
            data.push(localData);
        }

        for(var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            parents = DomUtils.getMarkedParents(node, function(pNode) {
                if ( root == pNode || (root.compareDocumentPosition(pNode) & Node.DOCUMENT_POSITION_CONTAINED_BY) ) {
                    return true;
                }
            });

            if ( desiredDepth == -1 || parents.length <= desiredDepth ) {
                localData = this.getTreeDataFromNode(node);
                map[localData.cls] = localData;
                parentNode = parents[0];

                if (!parentNode || !map[parentNode.getAttribute(DomUtils.elementIdAttribute)]) {
                    data.push(localData);
                } else {
                    parentObj = map[parentNode.getAttribute(DomUtils.elementIdAttribute)];
                    parentObj.children = parentObj.children || [];
                    parentObj.children.push(localData);
                    parentObj.expanded = true;
                }
            }
        }

        return data;
    },

    /**
     * Build the whole tree or a part of it depending
     * on the value of the config argument that can be one of the following:
     *
     * * "partial" : the tree is partially built only where the change takes place
     * * __anything else__ : the tree is completely rebuilt
     *
     * @param {Ext.data.NodeInterface} node The node the changes start from
     * @param {String} [config] What kind of change has to be made
     */
    buildTree : function(node, config) {

        var me = this,
            tree = Ext.getStore('Outliner'),
            treeView = this.getOutliner(),
            depth = 1,
            root = tree.getRootNode(), data;

        try {
            //convert to tree format json the node
            if (config != "partial" || DomUtils.getFirstMarkedAncestor(node.parentNode) == null) {

                var docClass = DocProperties.getDocClassList().split(" "),
                    foundNode = node.ownerDocument.querySelector("."+docClass[(docClass.length-1)]);

                data = me.createTreeDataNew(foundNode, depth);

                if (Ext.isArray(data)) {
                    wrapper = {
                        text : 'root',
                        children : data
                    };
                } else {
                    wrapper = data;
                }
                tree.setRootNode(wrapper);
            } else {
                var nodeIter = node;
                var nodeBuild = null;
                var treeNode = null;
                while (!nodeBuild && nodeIter && nodeIter.nodeType == DomUtils.nodeType.ELEMENT) {
                    var internalId = nodeIter.getAttribute(DomUtils.elementIdAttribute);
                    if (internalId) {
                        // search the node in the tree
                        treeNode = root.findChild('cls', internalId, true);
                        if (treeNode) {
                            nodeBuild = nodeIter;
                        }
                    }
                    nodeIter = nodeIter.parentNode;
                }
                var rawData;
                if (nodeBuild) {
                    data = me.createTreeDataNew(nodeBuild, depth);
                } else {
                    data = me.createTreeDataNew(node, depth);
                }
                if (!Ext.isArray(data)) {
                    data = [data];
                }

                Ext.each(data, function(dataNode, index) {
                    var storedNode = root.findChild('cls', dataNode.cls, true);
                    if (!storedNode) {
                        //set the new root to the tree store
                        root.insertChild(index, dataNode);
                        root.set("leaf", false);
                        root.expand();
                    } else {
                        storedNode.parentNode.replaceChild(dataNode, storedNode);
                    }
                }, this);
            }
            treeView.getRootNode().expand();
        } catch(e) {
            Ext.log({level: "error"}, e);
        }
    },

    beforeBuildTree: function(node, type, config) {
        var me = this, treeView = this.getOutliner();
        config = config || {};
        if(treeView) {
            treeView.setLoading(true);
            Ext.suspendLayouts();
            Ext.defer(function() {
                me.buildTree(node, type);
                Ext.resumeLayouts(true);
                treeView.setLoading(false);
                Ext.callback(config.callback);
            }, 5);
        }
    },

    // init the app
    init : function() {
        // Register for events
        this.application.on({
            editorDomChange : this.beforeBuildTree,
            editorDomNodeFocused : this.beforeExpandItem,
            scope : this
        });
        this.application.on(Statics.eventsNames.markingMenuLoaded, this.loadCss, this);

        // set up the control
        this.control({
            'outliner' : {
                //on item click in the tree panel
                itemclick : function(view, rec, item, index, eventObj) {
                    var node = DocProperties.markedElements[rec.getData().cls];
                    if (node) {
                        this.application.fireEvent('nodeFocusedExternally', node.htmlElement, {
                            select : true,
                            scroll : true,
                            click : true
                        });
                    }
                },
                rowclick: function(view, rec, item, index, e) {
                    var node = DocProperties.markedElements[rec.getData().cls];
                    if ( e.target && Ext.fly(e.target).is('.x-tree-expander')
                        && node && ( !rec.childNodes.length || !rec.getChildAt(0).isVisible() ) ) {
                        this.beforeExpandItem(node.htmlElement);
                    }
                },

                itemcontextmenu : function(view, rec, item, index, e, eOpts) {
                    var coordinates = [];
                    // Prevent the default context menu to show
                    e.preventDefault();
                    //Fire an itemclick event to select the htmlNode in the editor
                    view.fireEvent('itemclick', view, rec, item, index, e, eOpts);
                    this.application.fireEvent(Statics.eventsNames.showContextMenu, e.getXY());
                }
            }
        });
    }
});
