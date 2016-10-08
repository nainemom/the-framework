var pages = [{
    alias: 'تصاویر لغزنده (Image Slider)',
    icon: 'fa-picture-o',
    id: 'image-slider',
    controller: 'ImageSlider'
}, {
    alias: 'جدول انتخاب پایین (Bottom Sheet)',
    icon: 'fa-table',
    id: 'bottom-sheet',
    controller: 'BottomSheet'
}, {
    alias: 'نوار پیمایش (Navbar)',
    icon: 'fa-header',
    id: 'navbar'
}, {
    alias: 'نوار کناری (Sidebar)',
    icon: 'fa-bars',
    id: 'sidebar',
    controller: 'Sidebar'
}, {
    alias: 'نوار جست‌وجو (Searchbar)',
    icon: 'fa-search',
    id: 'searchbar',
    controller: 'Searchbar'
}, {
    alias: 'دکمه شناور (Floating Button)',
    icon: 'fa-circle',
    id: 'floating-btn',
    controller: 'FloatingBtn'
}, {
    alias: 'انتخاب‌کننده تاریخ (Datepicker)',
    icon: 'fa-calendar-o',
    id: 'datepicker',
    controller: 'Datepicker'
}, {
    alias: 'انتخاب آیتم از لیست (Dropdown)',
    icon: 'fa-caret-down',
    id: 'dropdown',
    controller: 'Dropdown'
}, {
    alias: 'هدایت‌کننده صفحه (Conduction)',
    icon: 'fa-arrow-left',
    id: 'conduction',
    controller: 'Conduction'
}, {
    alias: 'اسکرول (Scroll)',
    icon: 'fa-arrows-v',
    id: 'scroll',
    controller: 'Scroll'
}, {
    alias: 'دستگیره (Switch)',
    icon: 'fa-toggle-on',
    id: 'switch',
    controller: 'Switch'
}, {
    alias: 'تُست (Toast)',
    icon: 'fa-bell-o',
    id: 'toast',
    controller: 'Toast'
}, {
    alias: 'لطفا صبر کنید! (Loading)',
    icon: 'fa-circle-o-notch fa-spin',
    id: 'loading',
    controller: 'Loading'
}, {
    alias: 'انتخاب کننده تصویر! (Image Picker)',
    icon: 'fa-file-image-o',
    id: 'image-picker',
    controller: 'ImagePicker'
}, {
    alias: 'ای‌جکس! (Ajax Provider)',
    icon: 'fa-paper-plane',
    id: 'ajax',
    controller: 'Ajax'
}]
angular.module('app', ['theFramework'])
    .config(function($routeProvider, $tfHttpProvider) {
        $routeProvider
            .when('/main', {
                templateUrl: 'templates/main.html',
                controller: 'Main'
            }).otherwise({
                redirectTo: '/main'
            });
        for (var i in pages) {
            $routeProvider.when('/' + pages[i].id, {
                templateUrl: 'templates/' + pages[i].id + '.html',
                controller: pages[i].controller
            });
        }
    })
    .run(function($rootScope, $location) {
        $rootScope.activeTab = 0;
        $rootScope.items = pages;
        $rootScope.currentItem = function() {
            var pageId = $location.path().substr(1);
            var pageIndex = $rootScope.items.map(function(x) {
                return x.id;
            }).indexOf(pageId);
            return pageIndex === -1 ? {} : $rootScope.items[pageIndex];
        }
    })
    .controller('Main', function($scope, $location) {

    })
    .controller('ImageSlider', function($scope) {
        $scope.images = [{
            src: 'http://lorempixel.com/500/300/people/1/',
            alt: 'The Beach'
        }, {
            src: 'http://lorempixel.com/500/300/people/2/'
        }, {
            src: 'http://lorempixel.com/500/300/people/3/'
        }];
    })
    .controller('BottomSheet', function($scope) {
        $scope.sheets = [
            { visible: false },
            { visible: false },
            { visible: false }
        ]
    })
    .controller('Sidebar', function($scope) {
        $scope.bars = [
            { visible: false },
            { visible: false },
            { visible: false }
        ]
    })
    .controller('Searchbar', function($scope) {
        $scope.bars = [
            { visible: false },
            { visible: false }
        ]
    })
    .controller('FloatingBtn', function($scope) {
        $scope.bars = [
            { visible: false },
            { visible: false }
        ]
    })
    .controller('Datepicker', function($scope) {

    })
    .controller('Dropdown', function($scope) {
        $scope.options = [
            { text: '1 - ایکس شماره یک', value: 1 },
            { text: '2 - ایکس شماره دو', value: 2 },
            { text: '3 - ایکس شماره سه', value: 3 }
        ];
        $scope.inputs = {};
    })
    .controller('Conduction', function($scope) {

    })
    .controller('Scroll', function($scope, $timeout) {
        $scope.scrollDir = '';
        $scope.scrollAtEnd = '';
        $scope.$watch('scrollAtEnd', function() {
            $timeout(function() {
                $scope.scrollAtEnd = '';
            }, 1500);
        });
    })
    .controller('Switch', function($scope, $timeout) {
        $scope.scrollDir = '';
    })
    .controller('Toast', function($scope, $theFramework) {
        $scope.toast = $theFramework.toast;
    })
    .controller('Loading', function($scope, $theFramework) {
        $scope.loading = $theFramework.loading;
    })
    .controller('ImagePicker', function($scope) {
        $scope.file = '';
    })
    .controller('Ajax', function($scope, $tfHttp, $theFramework) {
        $scope.result = [];
        $scope.search = function() {
            $theFramework.loading(true);
            var data = {
                sort: 'stars',
                order: 'desc',
                q: 'angular',
                page: 1
            }
            var url = 'https://api.github.com/search/repositories';
            $tfHttp.get(url, data).then(function(response) {
                var totalLen = response.data.total_count || 0;
                $scope.result = response.data.items || [];
                $theFramework.loading(false);
                $theFramework.toast(totalLen + ' ریپازیتوری پیدا شد!');
            })
        }
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