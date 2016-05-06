/**
 * This view is used by different elements for nationality selection.
 */
Ext.define('LIME.view.CouncilSessionSelector', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.docCouncilSessionSelector',
    name: 'docCouncilSession',
    requires: [
        "LIME.store.CouncilSessions"
    ],
    emptyText: '15', //TODO: localize
    valueField: 'sessionNumber',
    displayField: 'sessionNumber',
    queryMode: 'local',
    store: 'CouncilSessions',

    listeners: {
        beforehide: function(cmp){
            cmp.hideAction(cmp);
        },
        beforedestroy: function(cmp){
            cmp.hideAction(cmp);
        }
    },
    allowBlank: false
});
