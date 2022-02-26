var app = angular.module('ScrapCoordinator', ['marketservice'])

app.factory('ScrapLogic',['$http', '$q', 'MarketDataService',
               function($http, $q, MarketService){
	
	var factory = {}
	
	factory.baseReprocessing = 54;
	factory.taxrate = 1;
	factory.skill = '5';
	factory.netReprocessing = 0;
	factory.updateReprocessing = function(){
		console.log("Inside factory.updateReprocessing");
		factory.netReprocessing = factory.baseReprocessing * 
			(1 + 0.02 * factory.skill) * 
			(1 - factory.taxrate / 100);
		factory.updateItemDetails();
	}
	
	
	factory.itemIdList = [];
	factory.jitaprices = {};
	factory.selectedprices = {};
	factory.itemdetails = {}
	factory.itemdetails.info = {};
	factory.itemdetails.items = {};
	factory.itemdetails.itemIdList = [];
	
	setItemdetails = function(info, items){
		factory.itemdetails.info = info;
		factory.itemdetails.items = items;
		
		var list = [];
		
		angular.forEach(info, function(value, key){
			list.push(key);
		})
		console.log("list to set: ", list);
		factory.itemdetails.itemIdList = list;
		console.log("set list to: ", factory.itemdetails.itemIdList);
	}
	
	factory.updateItemDetails = function(){
		console.log("inside factory.updateItemDetails");
		angular.forEach(factory.itemdetails.items, function(item, itemid){
			item.prices = {}
			item.prices.jitabuy = {};
			item.prices.jitabuy.market = factory.jitaprices[itemid].buy.fivePercent * item.quantity;
			item.prices.jitabuy.reprocessed = 0;
			item.prices.jitabuy.percent = 0;
			
			item.prices.jitasell = {};
			item.prices.jitasell.market = factory.jitaprices[itemid].sell.fivePercent * item.quantity;
			item.prices.jitasell.reprocessed = 0;
			item.prices.jitasell.percent = 0;
			
			item.prices.localbuy = {};
			item.prices.localbuy.market = factory.selectedprices[itemid].buy.fivePercent * item.quantity;
			item.prices.localbuy.reprocessed = 0;
			item.prices.localbuy.percent = 0;
			
			item.prices.localsell = {};
			item.prices.localsell.market = factory.selectedprices[itemid].sell.fivePercent * item.quantity;
			item.prices.localsell.reprocessed = 0;
			item.prices.localsell.percent = 0;
			
			angular.forEach(item.recipe, function(component){
				component.reprocessedQuantity = Math.floor(item.quantity * component.quantity * factory.netReprocessing / 100)
				item.prices.jitabuy.reprocessed += component.reprocessedQuantity * factory.jitaprices[component.id].buy.fivePercent;
				item.prices.jitasell.reprocessed += component.reprocessedQuantity * factory.jitaprices[component.id].sell.fivePercent;
				item.prices.localbuy.reprocessed += component.reprocessedQuantity * factory.selectedprices[component.id].buy.fivePercent;
				item.prices.localsell.reprocessed += component.reprocessedQuantity * factory.selectedprices[component.id].sell.fivePercent;
			})
			item.prices.jitabuy.percent = item.prices.jitabuy.reprocessed / item.prices.jitabuy.market;
			item.prices.jitasell.percent = item.prices.jitasell.reprocessed / item.prices.jitasell.market;
			item.prices.localbuy.percent = item.prices.localbuy.reprocessed / item.prices.localbuy.market;
			item.prices.localsell.percent = item.prices.localsell.reprocessed / item.prices.localsell.market;
		})
	}
	
	factory.testLogic = function(){
		console.log("Successfully connected to scrap logic");
	}
	
	factory.parseInputAndCallEndpoint = function(market, pasted){
		var items = pasted.split('\n');
		var itemForm = []
		angular.forEach(items, function(item){
			console.log("iterating over " + item)
			var parsed = item.split('\t')
			if(parsed.length != 6){
				console.log("improper parsing: " + item)
			}
			var q = 0;
			if(parsed[1]) q = parsed[1] 
			else q=1
			itemForm.push({
				name: parsed[0],
				quantity: q
			})
		})
		console.log(angular.toJson(itemForm))
		var postData = {
			method: 'POST',
			url: '/scrap/scrapInfo',
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				"items": itemForm
			}
		}
		console.log("about to make request with details: ", angular.toJson(postData));
		var defer = $q.defer();
		$http(postData)
		.success(function(data){
//			console.log("Successful result in ScrapLogic.parseInputAndCallEndpoint with response: ", angular.toJson(data));
			console.log("Successful result in ScrapLogic.parseInputAndCallEndpoint");
//			factory.setItemdetails(data);
			defer.resolve(data);
		})
		.error(function(data, status, headers, config){
			console.error("ScrapLogic.parseInputAndCallEndpoint failed with status" + status + "and info: " + info)
			defer.reject();
		})
		console.log("defer promise", angular.toJson(defer.promise));
		
		defer.promise.then(
		function(val){
			console.log("Resolved data, setting: ");
			setItemdetails(val.info, val.items);
			
			console.log("final itemIdList: ", factory.itemdetails.itemIdList)
			
			jitaMarketInfoPromise = MarketService.getMarketInfo(10000002, factory.itemdetails.itemIdList)
			selecteedMarketInfoPromise = MarketService.getMarketInfo(market, factory.itemdetails.itemIdList)
			
			jitaMarketInfoPromise.then( function(jitaVal){
				console.log("successfully called Jita market info");
				factory.jitaprices = jitaVal.statMap;
				
				//nested promise resolution for factory.updateItemDetails
				selecteedMarketInfoPromise.then( function(selectedVal){
					console.log("successfully called Jita market info");
					factory.selectedprices = selectedVal.statMap;
					factory.updateItemDetails();
				}, function(selectedReason){
					console.log("Failed market call for (market, reason) ", market, reason);
				})
				
			}, function(jitaReason){
				console.log("Failed jita market call with reason: ", reason);
			})
			
		}, function(reason){
			console.log("defer error: ", reason);
			alert("Service error: ", reason);
		})
	};

	//init stuff
	factory.updateReprocessing();
	
	return factory;

}])