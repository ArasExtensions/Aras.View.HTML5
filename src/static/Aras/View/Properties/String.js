/*
  Aras.HTML5 provides a HTML5 client library to build Aras Innovator Applications

  Copyright (C) 2015 Processwall Limited.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see http://opensource.org/licenses/AGPL-3.0.
 
  Company: Processwall Limited
  Address: The Winnowing House, Mill Lane, Askham Richard, York, YO23 3NW, United Kingdom
  Tel:     +44 113 815 3440
  Email:   support@processwall.com
*/

define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/form/TextBox',
	'../Property'
], function(declare, lang, TextBox, Property) {
	
	return declare('Aras.View.Properties.String', [TextBox, Property], {
			
		_viewmodelValueHandle: null, 
		
		_viewValueHandle: null, 
		
		constructor: function(args) {
	
		},
		
		startup: function() {
			this.inherited(arguments);
		},
		
		OnViewModelChange: function(name, oldValue, newValue) {
			this.inherited(arguments);
		
			// Watch ViewModel Value
			if (this._viewmodelValueHandle != null)
			{
				this._viewmodelValueHandle.unwatch();
			}
			
			this._viewmodelValueHandle = this.ViewModel.watch('Value', land.hitch(this, function(name, oldval, newval) {
				this.set('value', newval);
			}));
			
			// Watch TextBox value
			if (this._viewValueHandle == null)
			{
				this._viewValueHandle = this.watch('value', lang.hitch(this, function(name, oldval, newval) {
					this.ViewModel.set('Value', newval);
				}));
			}
		}
	});
});