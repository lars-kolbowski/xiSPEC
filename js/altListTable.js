//		a spectrum viewer
//
//      Copyright  2015 Rappsilber Laboratory, Edinburgh University
//
// 		Licensed under the Apache License, Version 2.0 (the "License");
// 		you may not use this file except in compliance with the License.
// 		You may obtain a copy of the License at
//
// 		http://www.apache.org/licenses/LICENSE-2.0
//
//   	Unless required by applicable law or agreed to in writing, software
//   	distributed under the License is distributed on an "AS IS" BASIS,
//   	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   	See the License for the specific language governing permissions and
//   	limitations under the License.
//
//		authors: Lars Kolbowski
//
//
//		altListTable.js

var altListTableView = DataTableView.extend({

	events : {

	},

	initialize: function() {

		this.listenTo(CLMSUI.vent, 'scoreChange', this.changeDisplayScore);
		this.listenTo(CLMSUI.vent, 'loadSpectrum', this.updateTitle);

		var self = this;

		this.wrapper = d3.select(this.el);

		/* Create an array with the values of all the input boxes in a column, parsed as numbers */
		$.fn.dataTable.ext.order['dom-text-numeric'] = function  ( settings, col )
		{
		    return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
		        return $('span', td).text() * 1;
		    } );
		}

		var tableVars = {
			"dom": '<"altListToolbar">frti<"bottom-lenMenu"l>p',
			"searching": true,
			"pageLength": 8,
			"lengthMenu": [ 4, 6, 8, 10, 12 ],
			"paging":   true,
			//"ordering": true,
			"order": [[2, "desc"], [9, "desc"]],
			//"info":     false,
			"ajax": "/php/getAltList.php?id=-1&db="+this.model.get('database')+'&tmp='+this.model.get('tmpDB'),
			"columns": [
				{ "title": "internal_id", "data": "id" },		//0
				{ "title": "id", "data": "sid" }, 	//1
				{ "title": "rank", "data": "rank", "className": "dt-center" },		//2
				{ "title": "peptide 1", "data": "pep1", "name": "pep1" },	//3
				{ "title": "peptide 2", "data": "pep2", "name": "pep2" },	//4
				{ "title": "CL pos 1", "data": "linkpos1", "className": "dt-center", "name": "linkpos1" },	//5
				{ "title": "CL pos 2", "data": "linkpos2", "className": "dt-center", "name": "linkpos2" },	//6
				{ "title": "charge", "data": "charge", "className": "dt-center" },		//7
				{ "title": "isDecoy", "data": "isDecoy", "className": "dt-center" },	//8
				{ "title": "score", "data": "score", "className": "dt-center", "name": "score" },    //9
				{ "title": "allScores", "data": "allScores", "name": "allScores" },    //10
				{ "title": "protein1", "data": "protein1", "className": "dt-center", "name": "protein1" },	//11
				{ "title": "protein2", "data": "protein2", "className": "dt-center", "name": "protein2" },	//12
				{ "title": "passThreshold", "data": "passThreshold" },	//13
				{ "title": "alt_count", "data": "alt_count" },		//14 needed?
			],
			"createdRow": function( row, data, dataIndex ) {
				if ( data[6] == "0" )
					$(row).addClass('red');
				if ( data[0] == self.model.requestId )
					$(row).addClass("selected");
			 },
		    "columnDefs": [
		    	{
					"class": "invisible",
					"targets": [ 0, 1, 10, 13, 14 ],
				},
				{
					"render": function ( data, type, row, meta ) {
						if (data == -1)
							return '';
						else
							return data;
					},
					"searchable": false,
					"targets": [ 2, 5, 6, ]
				},
				{
					"render": function ( data, type, row, meta ) {
						if (data == 0)
							return 'False';
						else
							return 'True';
					},
					"targets": [ 8 ],
				},
				{
					"render": function ( data, type, row, meta ) {
						var json = JSON.parse(row.allScores);
						var result = new Array();
						for (key in json) {
							result.push(key+'='+json[key]);
						}
						return '<span title="'+result.join("; ")+'">'+data+'</span>'
					},
					"targets": [ 9 ],
				},
			],
			"drawCallback": function( settings ) {
					self.hideEmptyColumns();
			}
		};

		var main = this.wrapper.append('div').attr('id', 'altList_main');
		var table = main.append('table').attr('id', 'altListTable').attr('class', 'display').attr('style', 'width:100%;');

		this.DataTable = $(table[0]).DataTable(tableVars);

		// ToDo: move to BB event handling?
		this.DataTable.on('click', 'tbody tr', function(e) {
			self.DataTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
			CLMSUI.vent.trigger('loadSpectrum', self.DataTable.row(this).data());
		});

		this.altListToolbar = d3.selectAll('.altListToolbar').attr('class', 'listToolbar').attr('id', 'altListId');

	},

	render: function(){
		var url = "/php/getAltList.php?id="+this.model.sid+"&db="+this.model.get('database')+'&tmp='+this.model.get('tmpDB');
		this.DataTable.ajax.url( url ).load();
	},

	changeDisplayScore: function(scoreName){
		console.log('altListTable - changeDisplayScore: '+scoreName);
		var url = "/php/getAltList.php?id="+this.model.sid+"&db="+this.model.get('database')+'&tmp='+this.model.get('tmpDB')+'&scol='+scoreName;
		this.DataTable.ajax.url( url ).load();
	},

	updateTitle: function(rowdata){
		var sid = rowdata['sid'];
		this.altListToolbar.text("Alternatives for "+rowdata['sid']);
	},
	//
	// userScoreChange: function(e){
	// 	CLMSUI.vent.trigger('scoreChange', parseInt($(e.target).attr('data-score')));
	// },
	//
	// hideEmptyColumns: function(e) {
	// 	if (this.DataTable === undefined)
	// 		return false;
	// 	if(this.isEmpty(this.DataTable.columns('pep2:name').data()[0])){
	// 		this.DataTable.columns('pep2:name').visible( false );
	// 		this.DataTable.columns('linkpos1:name').visible( false );
	// 		this.DataTable.columns('linkpos2:name').visible( false );
	// 		this.DataTable.columns('protein2:name').visible( false );
	// 	}
	// 	else{
	// 		this.DataTable.columns('pep2:name').visible( true);
	// 		this.DataTable.columns('linkpos1:name').visible( true );
	// 		this.DataTable.columns('linkpos2:name').visible( true );
	// 		this.DataTable.columns('protein2:name').visible( true );
	// 	}
	// },
	//
	// isEmpty: function(arr) {
	// 	for(var i=0; i<arr.length; i++) {
	// 		if(arr[i] !== "") return false;
	// 	}
	// 	return true;
	// },

});
