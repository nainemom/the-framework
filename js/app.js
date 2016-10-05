angular.module('app', ['theFramework'])
    .config(function($routeProvider, $tfHttpProvider) {
        $routeProvider
            .when('/page-one', {
                templateUrl: 'templates/page-one.html',
                controller: 'PageOne'
            })
            .when('/page-two', {
                templateUrl: 'templates/page-two.html',
                controller: 'PageOne'
            })
            .when('/movies', {
                templateUrl: 'templates/movies.html',
                controller: 'Movies'
            })
            .when('/forms', {
                templateUrl: 'templates/forms.html',
                controller: 'Forms'
            })
            .when('/file', {
                templateUrl: 'templates/file.html',
                controller: 'File'
            })
            .otherwise({
                redirectTo: '/page-one'
            });
        $tfHttpProvider.address = 'https://api.github.com/search/repositories';
        //console.log($tfHttpProvider);
        //console.log($tfHttpProvider.address);
        //$tfHttpProvider.z('hi');

    })
    .controller('PageOne', function($scope, $theFramework, $timeout) {
        $scope.sidebar = false;
        $scope.floating = true;

        $scope.toast = function() {
            $theFramework.toast('ساعت الآن ' + Date.now() + ' است!');
        }
        $scope.images = [{
            src: 'images/1.jpg',
            alt: 'The Beach'
        }, {
            src: 'images/2.jpg'
        }, {
            src: 'images/3.jpg'
        }];
        $scope.inputs = {};
        $scope.lg = console.log;
    })
    .controller('Movies', function($scope, $theFramework, $http, $timeout, $tfHttp) {
        $scope.searchbar = false;
        $scope.items = [];
        $scope.toast = function(a) {
            $theFramework.toast(a);
        }
        $scope.lastSearch = '';
        $scope.lastPage = 1;
        $scope.stillLoad = true;
        $scope.search = function(text) {
            if (typeof text == 'undefined') {
                if (!$scope.stillLoad) {
                    return;
                }
                $scope.lastPage++;
            } else {
                $scope.lastPage = 1;
                $scope.lastSearch = text
            }
            $theFramework.loading(true);
            var data = {
                sort: 'stars',
                order: 'desc',
                q: $scope.lastSearch,
                page: $scope.lastPage
            }
            $timeout(function() {
                $tfHttp.get('', data).then(function(response) {
                    var totalLen = response.data.total_count || 0;
                    var result = response.data.items || [];
                    var newSearch = typeof text == 'undefined' ? false : true;
                    if (result < 30) {
                        $scope.stillLoad = false;
                    } else {
                        $scope.stillLoad = true;
                    }
                    $theFramework.loading(false);
                    if (newSearch) {
                        $scope.items = result;
                        if (totalLen == 0) {
                            $theFramework.toast('چیزی پیدا نشد!');
                        } else {
                            $theFramework.toast(totalLen + ' ریپازیتوری پیدا شد!');
                        }

                    } else {
                        $scope.items = $scope.items.concat(result);
                    }
                });
            }, 500);

            //$http.get('http://imdb.wemakesites.net/api/search?q=' + text);
        }
        $scope.search('angular');
    })
    .controller('Forms', function($scope, $theFramework, $http) {

        $scope.bottomSheet = false;

        $scope.inputs = {
            dt: '1395-12-01'
        };
        $scope.options = {};

        $scope.options.one = [
            { text: '1 - ایکس شماره یک', value: 1 },
            { text: '2 - ایکس شماره دو', value: 2 },
            { text: '3 - ایکس شماره سه', value: 3 }
        ];
        $scope.addOption = function() {
            $scope.options.one.push({
                text: 'new',
                value: parseInt(Math.random() * 1000)
            })
        }

    })
    .controller('File', function($scope, $theFramework, $tfHttp) {
        $tfHttp.address = 'http://192.168.2.163:1978';

        $scope.inputs = {}

        $scope.submit = function() {
            $theFramework.loading();
            $tfHttp.post('/tf', $scope.inputs).then(function(res) {
                $theFramework.loading(false);
                $theFramework.toast(res);
            }).catch(function(err) {
                $theFramework.loading(false);
                $theFramework.toast(err);
            });
        }

    })