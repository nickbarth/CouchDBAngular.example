var app = angular.module('App', ['ngRoute', 'ngResource']);

app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/',{
    templateUrl: 'news.html',
    controller: 'NewsCtrl',
    controllerAs: 'news'
  }).
  when('/page/:pageId',{
    templateUrl: 'news.html',
    controller: 'NewsCtrl',
    controllerAs: 'news'
  }).
  when('/photo/:photoId',{
    templateUrl: 'news.html',
    controller: 'NewsCtrl',
    controllerAs: 'news'
  }).
  otherwise({
    redirectTo: '/'
  })
}])

var LegoNews = function ($http) {
  return {
    get: function (limit, offset) {
      return $http.get('http://localhost:5984/lego-news/_design/news/_view/news?limit=' + limit + '&skip=' + offset);
    }
  };
};

LegoNews.$inject = ['$http'];
app.factory('LegoNews', LegoNews);

var NewsCtrl = function (LegoNews, $routeParams) {
  this.name = 'test';
  this.total_pages = [];
  this.limit = 9;

  this.currentPage = $routeParams.pageId || 1;
  this.prevPage = parseInt(this.currentPage, 10) - 1 || 1;
  this.nextPage = parseInt(this.currentPage, 10) + 1;

  this.offset = (this.currentPage - 1) * this.limit || 0;
  this.items = [];

  console.log(this.currentPage, this.offset);

  LegoNews.get(this.limit, this.offset).success(function (data) {
    this.total_pages = Array(Math.ceil(data.total_rows / this.limit));
    this.nextPage = this.total_pages.length < this.nextPage ? this.total_pages.length : this.nextPage;

    this.items = data.rows.map(function (data) {
      return data.value;
    });
  }.bind(this));
};

NewsCtrl.$inject = ['LegoNews', '$routeParams'];
app.controller('NewsCtrl', NewsCtrl);

angular.element(document).ready(function () {
  angular.bootstrap(document, ['App']);
});

/*
   curl -H 'Content-Type: application/json' -X POST http://127.0.0.1:5984/lego-news -d '{ "caption": "Ranxom", "image": "http://placekitten.com/200/200", "link": "#" }'
*/
