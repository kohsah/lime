
/**
 * This store lists the available interface languages.
 */
Ext.define('LIME.store.CouncilSessions', {
    extend : 'Ext.data.Store',
    autoLoad: true,
    fields : [
        { name: 'sessionNumber', type: "int"},
        { name: 'fromDate', type: "date", format: "Y-m-d"},
        { name: 'toDate', type: "date", format: "Y-m-d"}
    ],

    data : [
        { sessionNumber : 153 , fromDate: '2015-11-30', toDate: '2015-12-04'},
        { sessionNumber : 154 , fromDate: '2016-05-30', toDate: '2016-06-03'},
        { sessionNumber : 155 , fromDate: '2016-12-05', toDate: '2016-12-09'},
        { sessionNumber : 156 , fromDate: '2017-04-24', toDate: '2017-04-28'},
        { sessionNumber : 157 , fromDate: '2017-07-10', toDate: '2017-07-10'}
    ]
});