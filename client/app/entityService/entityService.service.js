'use strict';

angular
.module('memexLinkerApp')
.factory('entityService', entityService);

entityService.$inject = ['$http', '$q', '$sce','$resource', 'linkUtils', 'lodash'];

// API endpoints
// /api/v1/search?size=10&page=1&count=yes -d query=fun -XPOST
var _SEARCH_URL = '/api/v1/search';

function entityService($http, $q, $sce, $resource, linkUtils, lodash) {
	var _ = lodash;

	// size - aka "perPage", the number of ads returned pe page of paginated results
	//var EntityResource = $resource('/api/v1/entity/:id', {size:100, page:1}, {'query': {method: 'GET', isArray: false }});
	var EntityResource = $resource('/api/v1/entity/:id', {}, {'query': {method: 'GET', isArray: false }});
	var SuggestResource = $resource('/api/v1/entity/:id/suggest', {}, {'query': {method: 'GET', isArray: false }});
	var SimilarImageResource = $resource('/api/v1/image/similar', {}, {'query': {method: 'GET', isArray: false }});
	var AttachResource = $resource('/api/v1/entity/:id/link/:adid');

	var sources = {
		1 : 'Backpage',
		2 : 'Craigslist',
		3 : 'Classivox',
		4 : 'MyProviderGuide',
		5 : 'NaughtyReviews',
		6 : 'RedBook',
		7 : 'CityVibe',
		8 : 'MassageTroll',
		9 : 'RedBookForum',
		10 : 'CityXGuide',
		11 : 'CityXGuideForum',
		12 : 'RubAds',
		13 : 'Anunico',
		14 : 'SipSap',
		15 : 'EscortsInCollege',
		16 : 'EscortPhoneList',
		17 : 'EroticMugshots',
		18 : 'EscortsAdsXXX',
		19 : 'EscortsinCA',
		20 : 'EscortsintheUS',
		21 : 'LiveEscortReviews',
		22 : 'MyProviderGuideForum',
		23 : 'USASexGuide',
		24 : 'EroticReview',
		25 : 'AdultSearch',
		26 : 'HappyMassage',
		27: 'UtopiaGuide',
		28 : 'MissingKids'
	};

	var icons = {
		1 : '/assets/images/backpage.png',
		2 : '/assets/images/craigslist.png',
		3 : '/assets/images/classivox.png',
		4 : '/assets/images/myproviderguide.jpeg',
		5 : '/assets/images/naughtreviews.jpg',
		6 : '/assets/images/myredbook.jpg',
		7 : '/assets/images/cityvibe.jpg',
		8 : '/assets/images/massagetroll.jpg',
		9 : '/assets/images/myredbook.jpg',
		10 : '/assets/images/cityguide.jpg',
		11 : '/assets/images/cityguide.jpg',
		12 : '/assets/images/rubads.png',
		// 13:
		14 : '/assets/images/sipsap.jpg',
		15 : '/assets/images/escortsincollege.jpg',
		16 : '/assets/images/escortphonelist.jpg',
		17 : '/assets/images/eroticmugshots.jpg',
		18 : '/assets/images/escortads.png',
		19 : '/assets/images/escortsinca.jpg',
		20 : '/assets/images/escortsintheus.png',
		21 : '/assets/images/liveescortreviews.jpg',
		22 : '/assets/images/myproviderguide.jpeg',
		//'USASexGuide' : ,
		// 'EroticReview' : ,
		25 : '/assets/images/adultsearch.jpg'
		// 'HappyMassage' : ,
		// 'UtopiaGuide' : ,
		// 'MissingKids' : 
	};

	var service = {
		search: search,
		Attach: AttachResource,
		Entity: EntityResource,
		Suggest: SuggestResource,
		SimilarImage: SimilarImageResource,
		sources: sources,
		icons: icons
	};
	return service;

	/**
	 * [search description]
	 * @param  String query [description]
	 * @param  Integer size  [description]
	 * @param  Integer page  [description]
	 * @return Array       [description]
	 */
	 function search(query, size, page) {
	 	console.log('entityService:search');
	 	var deferred = $q.defer();
	 	var params = {
	 		size: size,
	 		page: page,
	 		count: 'yes'
	 	};
	 	$http.post(_SEARCH_URL, {query:query}, {params:params}).then(function(response){
			// Callback when response is available.
			// console.log("__________________bonjour__________")
			// console.log(response)

			var entities = _.map(response.data.entities, function(e) {
				var entity = _formatEntity(e);
				return entity;
			});

			var paginatedResults = {
				entities: entities,
				page: response.data._page,
				perPage: response.data._max_num,
				total: response.data.total
			};
			deferred.resolve(paginatedResults);
		}, function(response){
			// Callback when an error occurs or server returns response with an error status.
			deferred.reject(response);
		});
	 	return deferred.promise;
	 }

	 /**
	  * Cleans up 'entites'.
	  * @param  {Object} rawEntity
	  * @return {[type]}           [description]
	  */
	 function _formatEntity(rawEntity) {
	 	console.log(rawEntity)
	 	if (rawEntity.highlight) {
 		 	var highlight =  rawEntity.highlight["docs._source.text"][0];
 			var spanStart = new RegExp("<em>","gi");
 			var spanEnd = new RegExp("</em>","gi");
 			highlight = highlight.replace(spanStart,'<span style="background-color: #FFFF00">');
 			highlight = highlight.replace(spanEnd,'</span>');
 			highlight = $sce.trustAsHtml(highlight);
	 	}

	 	var ads = rawEntity._source.docs;
		// Aggregate ad details
		console.log("1")
		console.log(ads)
		console.log("2")
		var postTimes = _.map(ads, function(ad){
			return new Date(ad._source.posttime);
		});
		//console.log(postTimes)
		var lastPostTime = _.max(postTimes);
		var firstPostTime = _.min(postTimes);
		var ages = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.age')).sort();
		var rates60 = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.rate60')).sort();
		var websites=[];
		var sourcesid = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.sources_id'));
		for (var i = 0; i < sourcesid.length; i++) {
			websites = websites.concat(sources[sourcesid[i]]);
		}
		websites = _.filter(_.uniq(websites), function(element){
			return ! _.isUndefined(element);
		});
		var phones = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.phone'));

		var titles = linkUtils.collectAdProperty(ads, '_source.title');
		var texts = linkUtils.collectAdProperty(ads, '_source.text');
		var names = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.name'));
		var cities = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.city'));
		for (var i = 0; i < cities.length; i++) {
          cities[i]=cities[i].substring(0,20);
        }
       	var cities = linkUtils.uniqueFlatAndDefined(cities);
		var youtube = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.youtube'));
		var instagram = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.instagram'));
		var twitter = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.twitter'));
		var socialmedia = twitter + instagram + youtube;
		var ethnicity = linkUtils.uniqueFlatAndDefined(linkUtils.collectAdProperty(ads, '_source.ethnicity'));
		var imageUrls = _.uniq(lodash.flatten(
			_.map(ads, function(ad) {
				return ad.image_locations;
			}),
        	true));

		imageUrls = _.filter(imageUrls, function(element){
			return ! _.isUndefined(element);
		});
		var faceImageUrls = _.uniq(lodash.flatten(
			_.map(ads, function(ad) {
				return ad.face_image_url;
			}),
			true
		));
		faceImageUrls = _.filter(faceImageUrls, function(element){
			return ! _.isUndefined(element);
		});
	
		var entity = {
			id: rawEntity._id,
			phones: phones,
			names: names,
			nPosts: ads.length,
			firstPostTime: firstPostTime,
			lastPostTime: lastPostTime,
			websites: websites,
			cities: cities,
			ages: ages,
			rates60: rates60,
			imageUrls: imageUrls,
			nPics: imageUrls.length,
			faceImageUrls: faceImageUrls,
			nSuggestedByImage: 0,
			nSuggestedByPhone: 0,
			nSuggestedByText: 0,
			socialmedia: socialmedia,
			titles: titles,
			texts: texts,
			highlight: highlight
		};
		return entity;
	}

}