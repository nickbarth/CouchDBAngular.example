// Routes

var Routes = function ($routeProvider) {
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
  when('/login',{
    templateUrl: 'login.html',
    controller: 'LoginCtrl',
    controllerAs: 'login'
  }).
  when('/register',{
    templateUrl: 'register.html',
    controller: 'RegisterCtrl',
    controllerAs: 'register'
  }).
  otherwise({
    redirectTo: '/'
  })
};

// Factories

var LegoNews = function ($http) {
  return {
    get: function (limit, offset) {
      return $http.get('http://localhost:5984/lego-news/_design/news/_view/all_news?limit=' + limit + '&skip=' + offset);
    },
    login: function (username, password) {
      return $http.post('http://localhost:5984/_session', { name: username, password: password });
    },
    register: function (username, password) {
      return $http.put('http://localhost:5984/_users/org.couchdb.user:' + username, {
        _id: 'org.couchdb.user:' + username,
        name: username,
        roles: [],
        type: 'user',
        password: password
      });
    }
  }
};

// Controllers

var UserCtrl = function () {
  this.user = localStorage.getItem('email') || false;
  this.password = localStorage.getItem('email') || false;
}

var NewsCtrl = function (LegoNews, $routeParams) {
  this.name = 'test';
  this.total_pages = [];
  this.limit = 9;

  this.currentPage = $routeParams.pageId || 1;
  this.prevPage = parseInt(this.currentPage, 10) - 1 || 1;
  this.nextPage = parseInt(this.currentPage, 10) + 1;

  this.offset = (this.currentPage - 1) * this.limit || 0;
  this.items = [];

  LegoNews.get(this.limit, this.offset).success(function (data) {
    this.total_pages = Array(Math.ceil(data.total_rows / this.limit));
    this.nextPage = this.total_pages.length < this.nextPage ? this.total_pages.length : this.nextPage;

    this.items = data.rows.map(function (data) {
      return data.value;
    });
  }.bind(this));
};

var LoginCtrl = function (LegoNews, $location) {
  this.email = '';
  this.password = '';
  this.LegoNews = LegoNews;
  this.$location = $location;
}

LoginCtrl.prototype.submit = function (username, password) {
  this.LegoNews.login(username, password)
  .success(function (data) {
    console.log(data);
    this.$location.path('/');
  }.bind(this))
  .error(function (err) {
    alert(err.error.toUpperCase() + ": " + err.reason);
  })
}

var RegisterCtrl = function (LegoNews, $location) {
  this.email = '';
  this.password = '';
  this.LegoNews = LegoNews;
  this.$location = $location;
}

RegisterCtrl.prototype.submit = function (username, password) {
  var self = this;

  this.LegoNews.register(username, password)

  .success(function () {
    self.LegoNews.login(username, password).success(function (data) {
      console.log(data);
      self.$location.path('/');
    })
  })

  .error(function (err) {
    alert(err.error.toUpperCase() + ": " + err.reason);
  })
}

angular.module('App', ['ngRoute', 'ngResource'])
  .config(['$routeProvider', Routes])
  .factory('LegoNews', ['$http', LegoNews])
  .controller('NewsCtrl', ['LegoNews', '$routeParams', NewsCtrl])
  .controller('LoginCtrl', ['LegoNews', '$location', LoginCtrl])
  .controller('RegisterCtrl', ['LegoNews', '$location', RegisterCtrl]);

angular.element(document).ready(function () {
  angular.bootstrap(document, ['App']);
});

/*
   curl -H 'Content-Type: application/json' -X POST http://127.0.0.1:5984/lego-news -d '{ "caption": "Ranxom", "image": "http://placekitten.com/200/200", "link": "#" }'
*/
