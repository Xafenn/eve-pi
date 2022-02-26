var app = angular.module('PlanetCoordinator', ['PlanetModel','PlanetData', 'marketservice', 'persistservice'])

app.factory('PlanetLogic',['$http', '$q', 'Planet', 'PiDataModel', 'MarketDataService', 'persistHandler',
                          function($http, $q, Planet, Data, MarketService, PersistHandler){
	
	function arrayObjectIndexOf(array, term, property){
		for(var i = 0; i < array.length; i++){
			if(array[i][property] == term) return i;
		}
		return -1;
	}


	var service = {};
	service.planets = [];
	
	var data = Data.getData();
	var len = 0;
	// var planetList = [];
	
	var basicTypeList = function() {
		//console.log("Inside Logic.basicTypeList")
		var typeList = [];
		angular.forEach(data.itemDetails, function(det, id){
			if(det.tier == 1){
				typeList.push({id: id, name: det.name})
			}
		});
		// console.log("basic type list: " + typeList);
		return typeList;
	}
	
	var advancedTypeList = function() {
		//console.log("Inside Logic.advancedTypeList")
		var typeList = [];
		angular.forEach(data.itemDetails, function(det, id){
			if(det.tier == 2 || det.tier == 3){
				typeList.push({id: id, name: det.name})
			}
		});
		return typeList;
	}
	
	var hightechTypeList = function() {
		//console.log("Inside Logic.hightechTypeList");
		var typeList = [];
		angular.forEach(data.itemDetails, function(det, id){
			if(det.tier == 4){
				typeList.push({id: id, name: det.name})
			}
		});
		return typeList;
	}
	
	function getSystemImportExports() {
		//console.log("Inside Logic.getSystemImportExports");
		var ioList = [];
		angular.forEach(service.planets, function(planet){
//			planet.ioDetails {id, quantity}
			angular.forEach(planet.ioDetails, function(io){
				var index = arrayObjectIndexOf(ioList, io.id, "id");
				if(io.quantity != 0){
					if(index == -1){
						ioList.push({id: io.id, quantity: io.quantity / planet.cyclesPerActiveCycle});
					}
					else {
						ioList[index].quantity += io.quantity / planet.cyclesPerActiveCycle;
					}
				}
			})
		})
		ioList.sort(function(a,b){return a.quantity - b.quantity})
		return ioList;
	}
	
	function getSystemTaxes() {
		//console.log("Inside Logic.refreshTotalTaxes");
		var taxes = {importTaxes: 0, exportTaxes: 0};
		angular.forEach(service.planets, function(planet){
			taxes.importTaxes += planet.importTaxes / planet.cyclesPerActiveCycle;
			taxes.exportTaxes += planet.exportTaxes / planet.cyclesPerActiveCycle;
		})
		return taxes;
	}
	
	function getSystemRuntime() {
		//console.log("Inside Logic.refreshSystemRuntime");
		var runtimeInfo = {bottleneck:'', minRuntime: 999999};
		angular.forEach(service.planets, function(planet){
			if(planet.runtime > 0 && 
					planet.runtime < runtimeInfo.minRuntime &&
					planet.cyclesPerActiveCycle == 1){
				runtimeInfo.bottleneck = planet.name;
				runtimeInfo.minRuntime = planet.runtime; 
			}
		})
		if(runtimeInfo.minRuntime == 999999){
			runtimeInfo.bottleneck = 'N/A';
			runtimeInfo.minRuntime = 0;
		}
		return runtimeInfo;
	}
	
	function getSystemSetupCost() {
		//console.log("Inside Logic.refreshSystemSetupCost");
		var totalCost = 0;
		angular.forEach(service.planets, function(planet){
			totalCost += planet.Cost;
		})
		return totalCost;
	}
	
	
	
	

	service.addPlanet = function() {
		//console.log("Inside Logic.addPlanet");
		len = len + 1;
		var p = new Planet("Planet " + len);
		service.planets.push(p);
		return service.planets.length-1;
	}
	service.createPlanetFromCopy = function(p) {
		//console.log("Inside Logic.createPlanetFromCopy with ars: " + angular.toJson(p))
		var newPlanet = p.getCopyOfThisPlanet();
		len = len + 1;
		service.planets.push(newPlanet);
	}
	service.deletePlanet = function(p){
		var index = service.planets.indexOf(p);
		service.planets.splice(index, 1);
		return index-1;
	}
	
	service.System = {};
	service.System.importExports = [];
	service.System.taxes = {};
	service.System.taxes.importTaxes = 0;
	service.System.taxes.exportTaxes = 0;
	service.System.runtimeInfo = {}
	service.System.runtimeInfo.bottleneck = '';
	service.System.runtimeInfo.minRuntime = 0;
	service.System.setupCost = 0;
	
	service.loadOverviewTab = function(){
		service.System.importExports = getSystemImportExports();
		
		var taxes = getSystemTaxes();
		service.System.taxes.importTaxes = taxes.importTaxes;
		service.System.taxes.exportTaxes = taxes.exportTaxes;
		
		var runtimeInfo = getSystemRuntime();
		service.System.runtimeInfo.bottleneck = runtimeInfo.bottleneck;
		service.System.runtimeInfo.minRuntime = runtimeInfo.minRuntime;
		
		service.System.setupCost = getSystemSetupCost();
	}
	
	service.loadMarketDetailsTab = function(){
		//console.log("Inside Logic, loadMarketDetailsTab")
		service.loadOverviewTab();
		service.getMarketInfo();
	}

	service.refreshSystemMarketTotals = function(){
		//Total hourly export revenue
		//Total hourly import cost
		//Total hourly customs tax
		//per planet:
		//	total hourly export revenue
		//	total hourly import cost
		var totalHourlyExportRevenue = 0;
		var totalHourlyImportCost = 0;
		var totalHourlyCustomsTax = 0;
		angular.forEach(service.planets, function(planet){
			planet.exportRevenue = 0;
			planet.importCost = 0;
			angular.forEach(planet.ioDetails, function(io){
				//console.log("Inside refreshSystemMarketTotals: ", angular.toJson(io));
				if(io.quantity > 0){
					planet.exportRevenue += this.marketprices[io.id][this.exportOrderType].fivePercent * io.quantity
				} else if (io.quantity < 0) {
					planet.importCost -= this.marketprices[io.id][this.importOrderType].fivePercent * io.quantity
				}
			},this)
			// totalHourlyExportRevenue += planet.exportRevenue / planet.cyclesPerActiveCycle;
			// totalHourlyImportCost += planet.importCost / planet.cyclesPerActiveCycle;
			totalHourlyCustomsTax += (planet.exportTaxes + planet.importTaxes) / planet.cyclesPerActiveCycle;
		},this)
		angular.forEach(service.System.importExports, function(io){
			//Only update import and export costs for complete setup, not both imports and exports
			if(io.quantity > 0){
				totalHourlyExportRevenue += 
					this.marketprices[io.id][this.exportOrderType].fivePercent * io.quantity;
			} else if (io.quantity < 0){
				totalHourlyImportCost -= 
					this.marketprices[io.id][this.importOrderType].fivePercent * io.quantity;
			}
		}, this)
		console.log("After refreshSystemMarketTotals: ", totalHourlyExportRevenue, totalHourlyImportCost, totalHourlyCustomsTax);
		this.totalHourlyExportRevenue = totalHourlyExportRevenue;
		this.totalHourlyImportCost = totalHourlyImportCost;
		this.totalHourlyCustomsTax = totalHourlyCustomsTax;
		//update market fees 
		this.refreshMarketFees();
	}

	service.refreshMarketFees = function(){
		//console.log("Inside Logic's refreshMarketFees");
		//exports have sales tax. Imports do not.
		//exports with SELL orders have broker fees. Imports with BUY orders have broker fees. 
		if(this.importOrderType == "buy"){
			//obtain import materials with buy orders: broker fees
			this.totalHourlyImportMarketFees = this.totalHourlyImportCost * this.importBrokerFees/100;
		} else{
			//obtain import materials with sell orders: nothing
			this.totalHourlyImportMarketFees = 0;
		}
		if(this.exportOrderType == "sell"){
			//liquidate by creating sell orders: sales tax and broker fees
			this.totalHourlyExportMarketFees = this.totalHourlyExportRevenue * (this.taxRate + this.exportBrokerFees)/100
		} else {
			//liquidate by consuming buy orders: sales tax
			this.totalHourlyExportMarketFees = this.totalHourlyExportRevenue * this.taxRate/100;
		}
		angular.forEach(service.planets, function(planet){
			if(this.importOrderType == "buy"){
				planet.importMarketFees = planet.importCost * this.importBrokerFees/100;
			} else{
				planet.importMarketFees = 0;
			}
			if(this.exportOrderType == "sell"){
				planet.exportMarketFees = planet.exportRevenue * (this.taxRate + this.exportBrokerFees)/100
			} else {
				planet.exportMarketFees = planet.exportRevenue * this.taxRate/100;
			}
		},this)
		// console.log("market fees? ", this.importOrderType, this.exportOrderType, this.taxRate, this.brokerFees, this.totalHourlyImportMarketFees, this.totalHourlyExportMarketFees)
	}

	this.totalHourlyCustomsTax = 0;
	this.totalHourlyImportCost = 0;
	this.totalHourlyExportRevenue = 0;
	this.totalHourlyImportMarketFees = 0;
	this.totalHourlyExportMarketFees = 0;
	
	service.marketId = "10000002"; //jita
	service.taxRate = 12/10;
	service.exportBrokerFees = 3;
	service.importBrokerFees = 3/10;
	service.importOrderType = "buy";
	service.exportOrderType = "sell";
	service.marketprices = {};

	service.marketCallOngoing = false;
	
	service.getMarketInfo = function(marketId) {
		//console.log("Inside Logic's function getMarketInfo");
		service.marketCallOngoing = true;

		var idList = [];
		angular.forEach(service.System.importExports, function(io){
			idList.push(io.id);
		})
		var promise = MarketService.getMarketInfo(service.marketId, idList)
		
		promise.then(function(successVal){
			console.log("Successful call with val:", angular.toJson(successVal))
			service.marketprices = successVal.statMap;
			service.refreshSystemMarketTotals();
			service.marketCallOngoing = false;
		}, function(failReason){
			console.log("failed market call with reason: ", failReason);
			service.marketCallOngoing = false;
		})
	}

	service.saveSetup = function(){
		//console.log("Inside Logic.saveSetup")
		var promise = PersistHandler.saveSetup(service.planets, service.marketId, service.taxRate*100, service.exportBrokerFees*100, service.importBrokerFees*100);
		var defer = $q.defer();
		if(!promise){
			defer.reject();
		} else {
			promise.then(function(successVal){
				//market and service.planets
				console.log("saveSetup call succeeded with reply: ", successVal);
				defer.resolve(successVal); //key
			}, function(failReason){
				console.error("saveSetup call failed with reason: ", failReason);
				defer.reject();
			});
		}
		return defer.promise;
	}

	service.loadedSetup = false;

	service.loadSetup = function(key){
		var promise = PersistHandler.loadSetup(key)
		if(!promise){
			console.log("Promise doesn't exist for some reason");
			return null;
		} 
		promise.then(function(successVal){
			//{market, planetList}
			console.log("attempting to set planet stuff: ", angular.toJson(successVal));
			service.planets = successVal.planetList;
			service.marketId = successVal.market;
			service.taxRate = successVal.taxrate/100;
			service.exportBrokerFees = successVal.ebfees/100;
			service.importBrokerFees = successVal.ibfees/100;
			service.loadedSetup = true;
		}, function(failReason){
			console.error("loadSetup call failed with reason:", failReason);
		});
	}

/*
	service.populateSetupFromJson = function(stringVersion){
		var json = angular.fromJson(stringVersion)
		if(json.is){service.marketId = json.is;}
			else if(json.es){service.marketId = json.es;}
			else {service.marketId = 10000002;}
		// if(json.is && json.es && json.is != json.es) {console.error("Legacy import detected: multiple systems not supported")}
		if(json.io){service.importOrderType = json.io;} else {service.importOrderType = "buy";}
		if(json.eo){service.exportOrderType = json.eo;} else {service.exportOrderType = "buy";}
		if(json.im && json.im != "fivePercent"){console.error("Legacy incompatibility: only supported stat is 'fivePercent'")}
		if(json.em && json.em != "fivePercent"){console.error("Legacy incompatibility: only supported stat is 'fivePercent'")}
		if(json.ib){service.brokerFees = json.ib;} 
			else if(json.eb && !json.ib){service.brokerFees = json.eb;} 
			else {service.brokerFees = 1;}
		if(json.it){service.taxRate = json.it;} 
			else if(json.et){service.taxRate = json.et;} 
			else {$scope.ex_salestax = 1.5;}
		var planets = [];
		angular.forEach(json.pl, function(p){
			len = len + 1
			var pName = "Planet " + len
			if(p.x){pName = p.x}
			var planet = new Planet(pName);
			angular.forEach(p.b, function(f){
				var factory ={schematic:"", number:1, avgActiveCycles:1};
				if(f.s){
					factory.schematic = f.s
				} if (f.n){
					factory.number = f.n
				} if (f.a){
					factory.avgActiveCycles = f.a
				}
				planet.factoriesBasic.push(factory);
			});
			angular.forEach(p.a, function(f){
				var factory ={schematic:"", number:1, avgActiveCycles:1};
				if(f.s){
					factory.schematic = f.s
				} if (f.n){
					factory.number = f.n
				} if (f.a){
					factory.avgActiveCycles = f.a
				}
				planet.factoriesAdvanced.push(factory);
			});
			angular.forEach(p.h, function(f){
				var factory ={schematic:"", number:1, avgActiveCycles:1};
				if(f.s){
					factory.schematic = f.s
				} if (f.n){
					factory.number = f.n
				} if (f.a){
					factory.avgActiveCycles = f.a
				}
				planet.factoriesHightech.push(factory);
			});
			angular.forEach(p.e, function(e){
				var extractor = {resourceId:'', headcount:0};
				if(e.r){
					extractor.resourceId = e.r;
				}
				if(e.h){
					extractor.headcount = e.h;
				}
				planet.extractors.push(extractor);
			});
			if(p.s){planet.numStorage = p.s};
			if(p.p){planet.numLaunchpads = p.p};
			if(p.c){planet.useCCStorage = p.c};
			if(p.r){planet.restrictPads = p.r};
			if(p.t){planet.taxRate = p.t};
			if(p.l){planet.level = p.l};
			if(p.n){planet.avgLinkLength = p.n};
			if(p.v){planet.cyclesPerActiveCycle = p.v};
			if(p.f){planet.isFactoryPlanet = p.f};
			planet.planetId = planets.length;
			planets.push(planet);
			console.log(planet);
		});
		console.log("should be pushing this now");
		service.planets = planets;
		angular.forEach(service.planets, function(p){
			p.refreshAllowedPlanets();
			p.refreshImportExports();
		})
		// $scope.changeActivePlanet(0);
	}//populateSetupFromJson
*/


	service.data = data;
	// service.planets = planetList;
	service.basicTypeList = basicTypeList();
	service.advancedTypeList = advancedTypeList();
	service.hightechTypeList = hightechTypeList();
		
	return service;
	
}])