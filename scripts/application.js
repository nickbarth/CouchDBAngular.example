// Routes

var Routes = function ($routeProvider) {
  $routeProvider.when('/',{
    templateUrl: 'news.html',
    controller: 'NewsCtrl',
    controllerAs: 'news'
  }).
  when('/submit',{
    templateUrl: 'submit.html',
    controller: 'SubmitCtrl',
    controllerAs: 'submit'
  }).
  when('/page/:pageId',{
    templateUrl: 'news.html',
    controller: 'NewsCtrl',
    controllerAs: 'news'
  }).
  when('/photo/:itemId',{
    templateUrl: 'photo.html',
    controller: 'PhotoCtrl',
    controllerAs: 'photo'
  }).
  when('/login',{
    templateUrl: 'login.html',
    controller: 'LoginCtrl',
    controllerAs: 'login'
  }).
  when('/logout',{
    template: '',
    controller: 'LogoutCtrl'
  }).
  when('/register',{
    templateUrl: 'register.html',
    controller: 'RegisterCtrl',
    controllerAs: 'register'
  }).
  otherwise({
    redirectTo: '/'
  })
}

// Factories

var LegoNews = function ($http) {
  return {
    view: function (limit, offset) {
      return $http.get('http://0.0.0.0:5984/lego-news/_design/news/_view/all_news?limit=' + limit + '&skip=' + offset)
    },
    get: function (id) {
      return $http.get('http://0.0.0.0:5984/lego-news/' + id)
    },
    put: function (title, genre, photos, description) {
      return $http.post('http://0.0.0.0:5984/lego-news', {
        title: title,
        type: 'Photo',
        genre: genre,
        photos: photos,
        description: description
      })
    }
  }
}

var User = function ($http) {
  var currentUser = null;

  return {
    connect: function () {
      return $http.get('http://0.0.0.0:5984/_session', { withCredentials: true });
    },
    set: function (user) {
      currentUser = user;
    },
    get: function () {
      return currentUser;
    },
    login: function (username, password) {
      return $http.post('http://0.0.0.0:5984/_session', { name: username, password: password }, { withCredentials: true });
    },
    logout: function () {
      return $http.delete('http://0.0.0.0:5984/_session', { withCredentials: true });
    },
    register: function (username, password) {
      return $http.put('http://0.0.0.0:5984/_users/org.couchdb.user:' + username, {
        _id: 'org.couchdb.user:' + username,
        name: username,
        roles: [],
        type: 'user',
        password: password
      });
    }
  }
}

// Controllers

var UserCtrl = function (User) {
  var self = this;
  //this.user = localStorage.getItem('user') || false;
  this.User = User;
  User.set(false);

  User.connect().success(function (data) {
    if (data.userCtx.name) {
      User.set(data.userCtx);
      console.log('success');
      //localStorage.setItem('user', self.user);
    }
  })
}

UserCtrl.prototype.currentUser = function () {
  return this.User.get();
}

var NewsCtrl = function (LegoNews, $routeParams) {
  this.name = 'test';
  this.total_pages = [];
  this.limit = 4;

  this.currentPage = $routeParams.pageId || 1;
  this.prevPage = parseInt(this.currentPage, 10) - 1 || 1;
  this.nextPage = parseInt(this.currentPage, 10) + 1;

  this.offset = (this.currentPage - 1) * this.limit || 0;
  this.items = [];

  LegoNews.view(this.limit, this.offset).success(function (data) {
    this.total_pages = Array(Math.ceil(data.total_rows / this.limit));
    this.nextPage = this.total_pages.length < this.nextPage ? this.total_pages.length : this.nextPage;

    this.items = data.rows.map(function (data) {
      return data.value;
    });
  }.bind(this));
}

var PhotoCtrl = function (LegoNews, $routeParams) {
  console.log($routeParams.itemId);
  var that = this;

  LegoNews.get($routeParams.itemId)
  .success(function (data) {
    console.log(data);
    that.item = data;
  })
  .error(function (data) {
    alert(data);
  })
}

var LoginCtrl = function (User, $location) {
  this.email = 'nick@nick.so';
  this.password = 'nick';
  this.User = User;
  this.$location = $location;
}

LoginCtrl.prototype.submit = function (username, password) {
  var self = this;

  this.User.login(username, password)
  .success(function (data) {
    self.User.set(data);
    self.$location.path('/');
  }.bind(this))
  .error(function (err) {
    alert(err.error.toUpperCase() + ': ' + err.reason);
  })
}

var LogoutCtrl = function (User, $location) {
  User.logout().success(function () {
    User.set(false);
    $location.path('/');
  })
}

var RegisterCtrl = function (User, $location) {
  this.email = '';
  this.password = '';
  this.User = User;
  this.$location = $location;
}

RegisterCtrl.prototype.submit = function (username, password) {
  var self = this;

  this.User.register(username, password)
  .success(function () {
    self.User.login(username, password).success(function (data) {
      self.User.set(data);
      self.$location.path('/');
    })
  })
  .error(function (err) {
    alert(err.error.toUpperCase() + ': ' + err.reason);
  })
}

var SubmitCtrl = function (User, $location, LegoNews) {
  this.title = '';
  this.photos = [1,2,2];
  this.genre = 'Science Fiction';
  this.description = '';
  this.User = User;
  this.$location = $location;
  this.LegoNews = LegoNews;
}

SubmitCtrl.prototype.photoPreview = function (event) {
  var canvas = document.getElementById('canvas'),
      context = canvas.getContext('2d'),
      files = event.target.files,
      n = 0,
      that = this;

  canvas.classList.remove('hide');
  canvas.width = files.length * 120;
  this.photos = [];

  function previewImage (x, y) {
    return function (event) {
      var image = new Image();

      image.onload = function () {
        context.drawImage(image, x, y, 100, 100);
      }

      image.src = event.target.result;
      that.photos.push(image.src);
    }
  }

  for (n = 0; n < files.length; n++) {
    var reader = new FileReader();
    reader.onload = previewImage((100 * n) + (10 * n), 10);
    reader.readAsDataURL(files[n]);
  }
}

SubmitCtrl.prototype.submit = function () {
  var self = this;

  this.LegoNews.put(this.title, this.genre, this.photos, this.description)
  .success(function (data) {
    self.$location.path('/photo/' + data.id);
  })
  .error(function (data) {
    alert(err.error.toUpperCase() + ': ' + err.reason);
  })
}

// Directives

var FileChange = function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var func = element.attr('file-change').split('.'),
        onChange = element.scope()[func[0]][func[1]];
      element.bind('change', onChange.bind(element.scope()[func[0]]));
    }
  }
}

angular.module('App', ['ngRoute', 'ngResource', 'firebase'])
  .constant('FIREBASE_URL', 'https://legonews.firebaseio.com')
  .config(['$routeProvider', Routes])
  .directive('fileChange', FileChange)
  .factory('User', ['$http', User])
  .factory('LegoNews', ['$http', LegoNews])
  .controller('NewsCtrl', ['LegoNews', '$routeParams', NewsCtrl])
  .controller('PhotoCtrl', ['LegoNews', '$routeParams', PhotoCtrl])
  .controller('SubmitCtrl', ['User', '$location', 'LegoNews', SubmitCtrl])
  .controller('LoginCtrl', ['User', '$location', LoginCtrl])
  .controller('LogoutCtrl', ['User', '$location', LogoutCtrl])
  .controller('RegisterCtrl', ['User', '$location', RegisterCtrl]);

angular.element(document).ready(function () {
  angular.bootstrap(document, ['App']);
});

/*
   curl -H 'Content-Type: application/json' -X POST http://127.0.0.1:5984/lego-news -d '{ "caption": "Ranxom", "image": "http://placekitten.com/200/200", "link": "#" }'
*/
