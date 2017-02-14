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
	'dojo/request',
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/json',
	'dojo/when',
	'./Control',
	'./Command',
	'./ApplicationType',
	'../View/Containers/BorderContainer',
	'../View/Grid',
	'../View/Panes/TitlePane',
	'../View/Button',
	'../View/Properties/Integer',
	'../View/Properties/String',
	'../View/Properties/Integers/Spinner',
	'../View/ToolbarSeparator',
	'../View/Containers/TableContainer',
	'../View/Properties/Item',
	'../View/Properties/Sequence',
	'../View/Properties/Date',
	'../View/Properties/List',
	'../View/Properties/Decimal',
	'../View/Panes/ContentPane'
], function(
	declare, 
	request, 
	lang, 
	array, 
	json, 
	when, 
	Control, 
	Command, 
	ApplicationType, 
	BorderContainer, 
	Grid, 
	TitlePane, 
	Button, 
	Integer, 
	String, 
	Spinner, 
	ToolbarSeparator, 
	TableContainer,
	Item,
	Sequence,
	DateProp,
	ListProp,
	DecimalProp,
	ContentPane
) {
	
	return declare('Aras.ViewModel.Session', null, {
		
		Database: null, 
		
		Username: null,
		
		Password: null,
		
		_controlCache: new Object(),
		
		_commandCache: new Object(),
		
		_applicationTypeCache: new Object(),
		
		constructor: function(args) {
			declare.safeMixin(this, args);
		},
		
		_processCommands: function(Commands)
		{
			array.forEach(Commands, lang.hitch(this, function(command) {
				
				if (this._commandCache[command.ID] === undefined)
				{
					// Create new Command
					this._commandCache[command.ID] = new Command(this, command.ID, command.CanExecute);
				}
				else
				{			
					// Set CanExecute
					this._commandCache[command.ID].set('CanExecute', command.CanExecute);	
				}
			}));		
		},
		
		_processResponse: function(Response) {
				
			// Ensure Controls are in Cache
			array.forEach(Response.ControlQueue, lang.hitch(this, function(control) {
				
				// Process attached Commands
				this._processCommands(control.Commands);
				
				if (this._controlCache[control.ID] === undefined)
				{
					// Create new Control
					this._controlCache[control.ID] = new Control(this, control.ID, control.Type);
				}
			}));
			
			// Set Control Data
			array.forEach(Response.ControlQueue, lang.hitch(this, function(control) {

				// Set new Data in existing Control
				this._controlCache[control.ID].set('Data', control);
			}));
		},
		
		ApplicationTypes: function() {
			return request.get(this.Database.Server.URL + '/applicationtypes',
							   { headers: {'Accept': 'application/json'}, 
								 handleAs: 'json'
							   }).then(
				lang.hitch(this, function(result) {					
					return result;
				}),
				lang.hitch(this, function(error) {
					this.ProcessError(error);
					return [];
				})
			);
		},
		
		Application: function(Name) {
				return request.put(this.Database.Server.URL + '/applications', 
							   { headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, 
								 handleAs: 'json',
								 data: json.stringify({ Name: Name })
							   }).then(
				lang.hitch(this, function(result) {

					// Process Response
					this._processResponse(result);
					
					return this._controlCache[result.Value.ID];
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
					return null;
				})
			);
		},
		
		Plugin: function(Name, Context) {
				return request.put(this.Database.Server.URL + '/plugins', 
							   { headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, 
								 handleAs: 'json',
								 data: json.stringify({ Name: Name, Context: Context })
							   }).then(
				lang.hitch(this, function(result) {
				
					// Process Response
					this._processResponse(result);
					
					// Process Attached Commands
					this._processCommands(result.Value.Commands);
					
					// Create Plugin
					if (this._controlCache[result.Value.ID] === undefined)
					{
						this._controlCache[result.Value.ID] = new Control(this, result.Value.ID, result.Value);
					}
					else
					{
						this._controlCache[result.Value.ID].set('Data', result.Value);
					}
					
					return this._controlCache[result.Value.ID];
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
					return null;
				})
			);
		},
		
		_readControl: function(Control) {
		
			request.get(this.Database.Server.URL + '/controls/' + Control.ID, 
						{ headers: {'Accept': 'application/json'}, 
						  handleAs: 'json'
						}).then(
				lang.hitch(this, function(result) {
							
					// Process Response
					this._processResponse(result);
					
					// Process Attached Commands
					this._processCommands(result.Value.Commands);
					
					// Update Data on Control
					Control.set("Data", result.Value);
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
				}));	
		},
		
		Control: function(ID) {
			
			if (ID)
			{	
				return this._controlCache[ID];
			}
			else
			{
				return null;
			}
		},
			
		Command: function(ID) {
			
			if (ID)
			{
				return this._commandCache[ID];
			}
			else
			{
				return null;
			}
		},
		
		Execute: function(Command, Parameters) {
			
			// Execute Command
			request.put(this.Database.Server.URL + '/commands/' + Command.ID + '/execute', 
								{ headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
								  handleAs: 'json',
								  data: json.stringify(Parameters)
								}).then(
				lang.hitch(this, function(response){
									
					// Process Response
					this._processResponse(response);
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
				})
			);				
		},
		
		_writeControl: function(Control) {
			
			// Send to Server
			request.put(this.Database.Server.URL + '/controls/' + Control.ID, 
								{ headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
								  handleAs: 'json',
								  data: json.stringify(Control.Data)
								}).then(
				lang.hitch(this, function(response){
									
					// Process Response
					this._processResponse(response);
				}),
				lang.hitch(this, function(error) {
					this.Database.Server.ProcessError(error);
				})
			);				
		},
		
		ViewControl: function(ViewModelControl) {
			
			var viewcontrol = null;
			
			// Build Parameters for Control
			var parameters = new Object();
			
			// ViewModel
			parameters['ViewModel'] = ViewModelControl;
			
			// Region 
			switch(ViewModelControl.Region)
			{
				case 1:
					parameters['region'] = 'top';
					break;
				case 2:
					parameters['region'] = 'bottom';
					break;
				case 3:
					parameters['region'] = 'right';
					break;
				case 4:
					parameters['region'] = 'left';
					break;
				case 5:
					parameters['region'] = 'center';
					break;
				case 6:
					parameters['region'] = 'leading';
					break;
				case 7:
					parameters['region'] = 'trailing';
					break;
				default:
					parameters['region'] = 'center';
					break;			
			}
			
			// Style
			var style = '';
			
			if (ViewModelControl.Height != null)
			{
				style = style + 'height:' + ViewModelControl.Height + 'px;';
			}
	
			if (ViewModelControl.Width != null)
			{
				style = style + 'width:' + ViewModelControl.Width + 'px;';
			}
			
			if (style.length > 0)
			{
				parameters['style'] = style;
			}
			
			switch(ViewModelControl.Type)
			{
				case 'Aras.View.Containers.BorderContainer':
					viewcontrol = new BorderContainer(parameters);
					break;
				case 'Aras.View.Grid':
					viewcontrol = new Grid(parameters);
					break;
				case 'Aras.View.Panes.TitlePane':
					viewcontrol = new TitlePane(parameters);
					break;
				case 'Aras.View.Button':
					viewcontrol = new Button(parameters);
					break;
				case 'Aras.View.Properties.Integer':
					viewcontrol = new Integer(parameters);
					break;
				case 'Aras.View.Properties.String':
					viewcontrol = new String(parameters);
					break;
				case 'Aras.View.Properties.Integers.Spinner':
					viewcontrol = new Spinner(parameters);
					break;
				case 'Aras.View.ToolbarSeparator':
					viewcontrol = new ToolbarSeparator(parameters);
					break;
				case 'Aras.View.Containers.TableContainer':
					viewcontrol = new TableContainer(parameters);
					break;	
				case 'Aras.View.Properties.Item':
					viewcontrol = new Item(parameters);
					break;	
				case 'Aras.View.Properties.Sequence':
					viewcontrol = new Sequence(parameters);
					break;	
				case 'Aras.View.Properties.Date':
					viewcontrol = new DateProp(parameters);
					break;
				case 'Aras.View.Properties.List':
					viewcontrol = new ListProp(parameters);
					break;	
				case 'Aras.View.Properties.Decimal':
					viewcontrol = new DecimalProp(parameters);
					break;
				case 'Aras.View.Panes.ContentPane':
					viewcontrol = new ContentPane(parameters);
					break;				
				default:
					console.debug("View not supported: " + ViewModelControl.Type);
					break;
			}
			
			return viewcontrol;
		}
		
	});
});