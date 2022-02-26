var app = angular.module('ScrapGadget', ['ScrapCoordinator']);

app.controller('scrapAppController', ['$scope', 'ScrapLogic', function($scope, ScrapLogic){
	
	$scope.appName = "Scrap for everyone - but mostly you";
	
	$scope.worldSeed = "The world of Scrap";
	
	$scope.system = 10000006;
	
	$scope.test = function(){
		console.log("Successful test");
	}
	
	$scope.testValue = function(value){
		console.log("value: " + value);
	}
	
	$scope.callScrapInto = function(market, pastedItems){
		console.log("inside callScrapInfo with args: ", market, pastedItems)
		ScrapLogic.parseInputAndCallEndpoint(market, pastedItems)
	}
	
	$scope.Logic = ScrapLogic;
	
}])