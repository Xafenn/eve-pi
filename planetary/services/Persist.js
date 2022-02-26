var persistService = angular.module("persistservice", ['PlanetModel'])

persistService.service("persistHandler", ['$http', '$q', 'Planet', function($http, $q, Planet){

	// var service = {}
	// return service;

	return{
		loadSetup: function(key){
			//create planets? Yes. 
			var postData = {
				method: 'POST', 
				url: '/planetary/persist/load',
				data: {
					"id": key
				}
			};
			var defer = $q.defer();
			$http(postData)
			.success(function(data){
				if(!data || !data.planets || !data.planets.length || !data.market){
					console.error("Call to loadSetup failed: malformed reply")
					defer.reject();
				} else {
					console.log("Call to loadSetup succeeded, filters passed, yay!");
					var planetList = [data.planets.length];
					for (var i = data.planets.length - 1; i >= 0; i--) {
						var planet = new Planet(data.planets[i].name);
						//do not use add**Factory methods due to inherent expensive refresh methods
						for (var j = data.planets[i].factoriesBasic.length - 1; j >= 0; j--) {
							if(data.planets[i].factoriesBasic[j] &&
								data.planets[i].factoriesBasic[j].schematic &&
								data.planets[i].factoriesBasic[j].number &&
								data.planets[i].factoriesBasic[j].avgActiveCycles)
							planet.factoriesBasic[j] = data.planets[i].factoriesBasic[j]
						};
						for (var j = data.planets[i].factoriesAdvanced.length - 1; j >= 0; j--) {
							if(data.planets[i].factoriesAdvanced[j] &&
								data.planets[i].factoriesAdvanced[j].schematic &&
								data.planets[i].factoriesAdvanced[j].number &&
								data.planets[i].factoriesAdvanced[j].avgActiveCycles)
							planet.factoriesAdvanced[j] = data.planets[i].factoriesAdvanced[j]
						};
						for (var j = data.planets[i].factoriesHightech.length - 1; j >= 0; j--) {
							if(data.planets[i].factoriesHightech[j] &&
								data.planets[i].factoriesHightech[j].schematic &&
								data.planets[i].factoriesHightech[j].number &&
								data.planets[i].factoriesHightech[j].avgActiveCycles)
							planet.factoriesHightech[j] = data.planets[i].factoriesHightech[j]
						};
						for (var j = data.planets[i].extractors.length - 1; j >= 0; j--) {
							if(data.planets[i].extractors[j] &&
								data.planets[i].extractors[j].resourceId &&
								data.planets[i].extractors[j].headcount)
							planet.extractors[j] = data.planets[i].extractors[j]
						};
						planet.numStorage = data.planets[i].numStorage;
						planet.numLaunchpads = data.planets[i].numLaunchpads;
						planet.useCCStorage = data.planets[i].useCCStorage;
						planet.restrictPads = data.planets[i].restrictPads;
						planet.taxRate = data.planets[i].taxRate;
						planet.level = data.planets[i].level;
						planet.avgLinkLength = data.planets[i].avgLinkLength;
						planet.cyclesPerActiveCycle = data.planets[i].cyclesPerActiveCycle;
						planet.isFactoryPlanet = data.planets[i].isFactoryPlanet;

						planet.refreshStorage(); //includes fitting
						planet.refreshImportExports();
						planet.refreshAllowedPlanets();
						planetList[i] = planet;
					};
					// console.log("planetList is now: ", angular.toJson(planetList));
					defer.resolve({
						"market": data.market.toString(),
						"taxrate": data.taxrate,
						"ebfees": data.ebfees,
						"ibfees": data.ibfees,
						"planetList": planetList
					});
				}
			}).error(function(info,status,headers,config){
				console.error("Persist.loadSetup failed with status " + status + " and info: " + info)
				defer.reject(info);
				return null;
			})
			return defer.promise;
		},
		saveSetup: function(planetList, marketid, taxRate, exportBrokerFees, importBrokerFees){
			console.log("inside Persist>saveSetup");
			if(!planetList || !planetList.length){
				console.log("planetList isn't a thing, returning NOT promise");
				console.log("planetList details: ", planetList.length, angular.toJson(planetList));
				return null;
			}
			var request = [planetList.length];
			for (var i = planetList.length - 1; i >= 0; i--) {
				request[i] = {
					name: planetList[i].name,
					factoriesBasic: planetList[i].factoriesBasic,
					factoriesAdvanced: planetList[i].factoriesAdvanced,
					factoriesHightech: planetList[i].factoriesHightech,
					extractors: planetList[i].extractors,
					numStorage: planetList[i].numStorage,
					numLaunchpads: planetList[i].numLaunchpads,
					useCCStorage: planetList[i].useCCStorage,
					restrictPads: planetList[i].restrictPads,
					taxRate: planetList[i].taxRate,
					level: planetList[i].level,
					avgLinkLength: planetList[i].avgLinkLength,
					cyclesPerActiveCycle: planetList[i].cyclesPerActiveCycle,
					isFactoryPlanet: planetList[i].isFactoryPlanet
				};
			};
			console.log("constructing postData");
			var postData = {
				method: 'POST',
				url: '/planetary/persist/save',
				data: {
					"market": marketid,
					"taxrate": taxRate,
					"ebfees": exportBrokerFees,
					"ibfees": importBrokerFees,
					"planets": request
				}
			}
			console.log("before $q.defer")
			var defer = $q.defer();
			$http(postData)
			.success(function(data){
				if(data.key){
					console.log("Successful result in Persist.saveSetup with response: ", angular.toJson(data));
					defer.resolve(data.key);
				} else {
					console.error("Call to save returned success but did not have a valid key");
					defer.reject();
				}
			})
			.error(function(data, status, headers, config){
				console.error("Persist.saveSetup failed with status" + status + "and data: " + data)
				defer.reject();
				return null;
			})
			console.log("returning promise");
			return defer.promise
		}
	}

}])