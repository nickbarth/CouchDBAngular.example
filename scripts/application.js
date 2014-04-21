// Routes

var Routes = function ($routeProvider) {
  $routeProvider
    .when('/',{
      templateUrl: 'news.html',
      controller: 'NewsCtrl',
      controllerAs: 'news'
    }).
    when('/submit',{
      templateUrl: 'submit.html',
      controller: 'SubmitCtrl',
      controllerAs: 'submit'
    }).
    when('/edit/:itemId',{
      templateUrl: 'edit.html',
      controller: 'EditCtrl',
      controllerAs: 'edit'
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
    when('/account',{
      templateUrl: 'account.html',
      controller: 'AccountCtrl',
      controllerAs: 'account'
    }).
    otherwise({
      redirectTo: '/'
    })
}

// Factories

var LegoNews = function ($http) {
  return {
    view: function (limit, offset) {
      return $http.get('http://0.0.0.0:5984/lego-news/_design/news/_view/all_news?include_docs=true&limit=' + limit + '&skip=' + offset)
    },
    get: function (id) {
      return $http.get('http://0.0.0.0:5984/lego-news/' + id)
    },
    delete: function (id, rev) {
      return $http.delete('http://0.0.0.0:5984/lego-news/' + id + '?rev=' + rev, { withCredentials: true })
    },
    put: function (title, genre, photos, description) {
      var photoData = {};

      photos.forEach(function (photo, index) {
        photoData['photo' + index + '.png'] = {
          content_type: 'image/png',
          data: photo.replace('data:image/png;base64,', '')
        }
      });

      return $http.post('http://0.0.0.0:5984/lego-news', {
        title: title,
        type: 'Photo',
        genre: genre,
        description: description,
        _attachments: photoData
      }, { withCredentials: true })
    }
  }
}

var User = function ($http) {
  var currentUser = null,
      callback = null;

  return {
    connect: function () {
      return $http.get('http://0.0.0.0:5984/_session', { withCredentials: true });
    },
    load: function (username) {
      return $http.get('http://0.0.0.0:5984/_users/org.couchdb.user:' + username, { withCredentials: true });
    },
    onChange: function (func) {
      callback = func;
    },
    set: function (user) {
      currentUser = user;
      typeof(callback) === 'function' && callback();
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
    update: function (user) {
      return $http.put('http://0.0.0.0:5984/_users/' + user._id, user, { withCredentials: true });
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
  var self = this,
      user = localStorage.getItem('user') || false;

  this.User = User;

  if (user) {
    return User.set(JSON.parse(user));
  }

  User.connect()
  .then(function (session) {
    if (session.data.userCtx.name) {
      return User.load(session.data.userCtx.name);
    }
  })
  .then(function (user) {
    if (user) {
      User.set(user.data);
      localStorage.setItem('user', JSON.stringify(user.data));
    }
  })
}

UserCtrl.prototype.currentUser = function () {
  return this.User.get();
}

var NewsCtrl = function (LegoNews, $routeParams) {
  var self = this;

  this.pagination = new Pagination($routeParams.pageId, 4, 0);

  LegoNews.view(this.pagination.itemsPerPage, this.pagination.offset())
  .success(function (data) {
    self.pagination.setTotal(data.total_rows);

    self.items = data.rows.map(function (data) {
      var item = data.doc;

      if (item._attachments) item.photos = Object.keys(item._attachments).map(function (attachment) {
        return '//localhost:5984/lego-news/' + data.value._id + '/' + attachment
      })

      return item;
    })
  })
}

var PhotoCtrl = function (LegoNews, $routeParams, $location) {
  var that = this;

  this.LegoNews = LegoNews;
  this.$location = $location;

  LegoNews.get($routeParams.itemId)
  .success(function (data) {
    if (data._attachments) data.photos = Object.keys(data._attachments).map(function (attachment) {
      return '//localhost:5984/lego-news/' + data._id + '/' + attachment
    });
    console.log(data);
    that.item = data;
  })
  .error(function (data) {
    alert(data);
  })
}

PhotoCtrl.prototype.delete = function (id, rev) {
  var self = this;

  this.LegoNews.delete(id, rev).success(function () {
    self.$location.path('/');
  })
}

var LoginCtrl = function (User, $location) {
  this.username = 'nick@nick.so';
  this.password = 'nick';
  this.User = User;
  this.$location = $location;
}

LoginCtrl.prototype.submit = function () {
  var self = this;

  this.User.login(this.username, this.password)
  .then(self.User.load.bind(null, this.username))
  .then(function (user) {
    self.User.set(user.data);
    self.$location.path('/');
  })
  .catch(function (err) {
    err = err.data;
    alert(err.error.toUpperCase() + ': ' + err.reason);
  })
}

var LogoutCtrl = function (User, $location) {
  User.logout()
  .then(function () {
    User.set(false);
    localStorage.setItem('user', '');
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
    self.User.login(username, password).success(function () {
      self.User.load(username).success(function (data) {
        console.log(data);
        self.User.set(data);
        self.$location.path('/');
      })
    })
  })
  .error(function (err) {
    alert(err.error.toUpperCase() + ': ' + err.reason);
  })
}

var SubmitCtrl = function (User, $location, LegoNews) {
  this.title = '';
  this.photos = [];
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
  .error(function (err) {
    alert(err.error.toUpperCase() + ': ' + err.reason);
  })
}

var EditCtrl = function (User, $location, $routeParams, LegoNews) {
  var self = this;

  this.User = User;
  this.$location = $location;
  this.LegoNews = LegoNews;

  LegoNews.get($routeParams.itemId)
  .success(function (data) {
    if (data._attachments) data.photos = Object.keys(data._attachments).map(function (attachment) {
      return '//localhost:5984/lego-news/' + data._id + '/' + attachment
    });
    console.log(data);
    self.item = data;
  })
  .error(function (data) {
    alert(data);
  })
}

EditCtrl.prototype.photoPreview = function (event) {
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

EditCtrl.prototype.edit = function () {
  var self = this;

  this.LegoNews.put(this.title, this.genre, this.photos, this.description)
  .success(function (data) {
    self.$location.path('/photo/' + data.id);
  })
  .error(function (err) {
    alert(err.error.toUpperCase() + ': ' + err.reason);
  })
}

var AccountCtrl = function (User, $location) {
  this.email = User.get().name;
  this.password = '';
  this.User = User;
  this.$location = $location;

  User.onChange(this.updateEmail.bind(this));
}

AccountCtrl.prototype.updateEmail = function () {
  this.email = this.User.get().name;
}

AccountCtrl.prototype.submit = function (username, password) {
  var self = this;

  var user = this.User.get();
  user.password = password;

  this.User.update(user)
  .success(function () {
    console.log('done');
  })
  .error(function (err) {
    alert(err.error.toUpperCase() + ': ' + err.reason);
  })
}

// Directives

var FileChange = function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var func = element.attr('file-change').split('.'),
        onChange = element.scope()[func[0]][func[1]];
      element.bind('change', onChange.bind(element.scope()[func[0]]));
    }
  }
}

var Paginate = function () {
  return {
    restrict: 'E',
    scope: { pagination: '=' },
    templateUrl: 'pagination.html'
  }
}

var Pagination = function (currentPage, itemsPerPage, totalItems) {
  this.currentPage = parseInt(currentPage, 10) || 1;
  this.itemsPerPage = itemsPerPage;
  this.totalItems = totalItems;
}

Pagination.prototype.setTotal = function (total) {
  this.totalItems = total;
}

Pagination.prototype.offset = function () {
  return (this.currentPage - 1) * this.itemsPerPage || 0;
}

Pagination.prototype.totalPages = function () {
  return Math.ceil(this.totalItems / this.itemsPerPage);
}

Pagination.prototype.totalPagesArray = function () {
  return Array(this.totalPages())
}

Pagination.prototype.prevPage = function () {
  return this.currentPage - 1 || 1;
}

Pagination.prototype.nextPage = function () {
  return this.totalPages() === this.currentPage ? this.currentPage : this.currentPage + 1;
}

angular.module('App', ['ngRoute'])
  .constant('FIREBASE_URL', 'https://legonews.firebaseio.com')
  .config(['$routeProvider', Routes])
  .directive('fileChange', FileChange)
  .directive('paginate', Paginate)
  .factory('User', ['$http', User])
  .factory('LegoNews', ['$http', LegoNews])
  .controller('UserCtrl', ['User', UserCtrl])
  .controller('NewsCtrl', ['LegoNews', '$routeParams', NewsCtrl])
  .controller('PhotoCtrl', ['LegoNews', '$routeParams', '$location', PhotoCtrl])
  .controller('SubmitCtrl', ['User', '$location', 'LegoNews', SubmitCtrl])
  .controller('EditCtrl', ['User', '$location', '$routeParams', 'LegoNews', EditCtrl])
  .controller('LoginCtrl', ['User', '$location', LoginCtrl])
  .controller('LogoutCtrl', ['User', '$location', LogoutCtrl])
  .controller('AccountCtrl', ['User', '$location', AccountCtrl])
  .controller('RegisterCtrl', ['User', '$location', RegisterCtrl]);

angular.element(document).ready(function () {
  angular.bootstrap(document, ['App']);
});

/*
   curl -H 'Content-Type: application/json' -X POST http://127.0.0.1:5984/lego-news -d '{ "caption": "Ranxom", "image": "http://placekitten.com/200/200", "link": "#" }'
*/
