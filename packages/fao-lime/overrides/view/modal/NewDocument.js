/**
 * This view is used by different elements for nationality selection.
 */
Ext.define('FaoLime.NewDocument', {
    override: 'LIME.view.modal.NewDocument',
    requires: ["LIME.view.DocumentNumberEntry", "LIME.view.CouncilSessionSelector"],

    faoMeetingSymbolTmpl:
        {
            "dc": "CL {sessionNumber}/DC/{itemNumber}",
            "rep": "CL {sessionNumber}/REP/{itemNumber}"
        },

    /**
     * Return the data set in the view
     * @return {Object} An object containing the key-value pairs in the form
     */
    getData : function() {
        var form = this.down('form').getForm();
        if (!form.isValid())
            return null;
        var formData =  form.getValues(false, false, false, true);
        formData["docEditorType"] = this.editorType;
        console.log(" XXX YYY getData ", formData);
        return formData;
    },

    setEditorType: function(et) {
        me.newDocumentData.editorType = et;
    },

    setSessionInfo: function(sessionNo, fromDate, toDate) {
        me.newDocumentData.sessionNumber = parseInt(sessionNo);
        me.newDocumentData.fromDate = fromDate;
        me.newDocumentData.toDate = toDate;
    },

    initComponent: function() {
        var me = this;
        me.callParent(arguments);
        me.newDocumentData = {
            editorType: "",
            sessionNumber: 0,
            fromDate: undefined,
            toDate: undefined,
            number: "",
            numberUri: ""
        };
        //me.editorType = "";
        //me.sessionNumber = 0;
        //me.number = "";
        //me.numberUri = "";
        me.title = Locale.strings.newDocument;
        var form = me.down("[xtype=form]");
        form.add([
            {
                xtype: "docCouncilSessionSelector",
                listeners: {
                    "select": function(cbo, record) {
                        //var form = cbo.up("form");
                        //var wnd = form.up("window");
                        me.setSessionInfo(
                          record.data["sessionNumber"],
                            record.data["fromDate"],
                            record.data["toDate"]
                        );
                        console.log(" newDocumentData ", me.newDocumentData);
                    }
                }
            },
            {
                xtype: "textfield",
                name: "docNumber",
                allowBlank: false,
                value: "CL 1",
                emptyText: "CL 1"
            }
        ]);
    }


});
