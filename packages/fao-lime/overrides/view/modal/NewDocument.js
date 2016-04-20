/**
 * This view is used by different elements for nationality selection.
 */
Ext.define('FaoLime.NewDocument', {
    override: 'LIME.view.modal.NewDocument',

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
        this.editorType = et;
    },

    initComponent: function() {
        this.callParent(arguments);
        this.editorType = "";
    }


});
