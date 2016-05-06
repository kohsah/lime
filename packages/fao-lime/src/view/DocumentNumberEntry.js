Ext.define('LIME.view.DocumentNumberEntry', {
    extend: 'Ext.form.field.Text',
    alias: 'widget.docNumber',
    name: 'docNumber',
    listeners: {
        beforehide: function(cmp) {
            cmp.hideAction(cmp);
        },
        beforedestroy: function(cmp) {
            cmp.hideAction(cmp);
        }
    },
    allowBlank: false
});
