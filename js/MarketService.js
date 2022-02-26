var marketService = angular.module('marketservice', [])

marketService.service('MarketDataService',['$http', '$q', function($http, $q){
	
	return{
		getMarketInfo: function(market, typeList) {
			//int market, List<Int> typeList
			console.log("Inside MarketService.getMarketInfo with args: ", market, typeList);
			var postData = {
				method: 'POST',
				url: '/webapi/getMarketInfo',
				data: {
					"system": market,
					"idList": typeList
				}
			}
			var defer = $q.defer();
			$http(postData)
			.success(function(data){
				console.log("Successful result in MarketService.getMarketInfo with response: ", angular.toJson(data));
				defer.resolve(data);
				/*
				 * 	market
				 * 	statMap
				 * 		INT
				 * 			buy
				 * 			sell
				 * 			all
				 */
			})
			.error(function(data, status, headers, config){
				console.error("MarketService.getMarketInfo failed with status" + status + "and info: " + info)
				defer.reject();
				return null;
			})
			return defer.promise
		}
	}
	
}])


