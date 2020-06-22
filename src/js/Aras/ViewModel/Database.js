/*
 Copyright 2017 Processwall Limited

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 
  Company: Processwall Limited
  Address: The Winnowing House, Mill Lane, Askham Richard, York, YO23 3NW, United Kingdom
  Tel:     +44 113 815 3440
  Web:     http://www.processwall.com
  Email:   support@processwall.com
*/

define([
	'dojo/_base/declare',
	'dojo/request',
	'dojo/_base/lang',
	'dojo/json',
	'./Session'
], function(declare, request, lang, json, Session) {
	
	return declare('Aras.ViewModel.Database', null, {
		
		Server: null,
		
		ID: null,
		
		constructor: function(args) {
			declare.safeMixin(this, args);
		},
		
		Login: function(Username, AccessToken) {
			return request.post(this.Server.URL + '/databases/' + this.ID + '/login', 
								{ headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
								  handleAs: 'json', 
								  data: json.stringify({ Username: Username, AccessToken: AccessToken })
								}).then(lang.hitch(this, function(){
					return new Session({ Database: this, Username: Username, AccessToken: AccessToken });
				}),
				lang.hitch(this, function(error) {
				
					return null;
				})
			);
		}

	});
});