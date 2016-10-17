var log = alert;
var isCordova = typeof window.cordova == 'undefined' ? false : true;

angular.module('theFramework', ['ngRoute', 'ngAnimate', 'ngTouch', 'angular-carousel'])
    .run(function($rootScope) {
        FastClick.attach(document.body);
    })
    .factory('$theFramework', function($timeout, $http, $location, $window) {
        var ret = {};
        ret._ = {
            toast: {
                show: false,
                text: '',
                promise: false
            },
            loading: {
                show: false,
                promise: false
            }
        };
        ret.toast = function(text, timeout) {
            if (ret._.toast.promise) {
                $timeout.cancel(ret._.toast.promise);
            }
            text = typeof text != 'undefined' ? text : '';
            timeout = typeof timeout != 'undefined' ? timeout : 3500;
            ret._.toast.text = text;
            ret._.toast.show = true;
            ret._.toast.promise = $timeout(function() {
                ret._.toast.show = false;
                ret._.toast.promise = false;
            }, timeout);
        }
        ret.loading = function(show, timeout) {
            if (ret._.loading.promise) {
                $timeout.cancel(ret._.loading.promise);
            }
            show = typeof show != 'undefined' ? show : true;
            timeout = typeof timeout != 'undefined' ? timeout : false;
            ret._.loading.show = show;
            if (timeout !== false) {
                ret._.loading.promise = $timeout(function() {
                    ret._.loading.show = false;
                    ret._.loading.promise = false;
                }, timeout);
            }
        }
        ret.go = function(path) {
            if (path == 'back') {
                $window.history.back();
            } else {
                $location.path(path);
            }
        }
        ret.tfClick = function(element, callback) {
            var event = 'mouseup';
            if ('ontouchstart' in document.documentElement) {
                event = 'touchstart';
            }
            element.bind(event, callback);
        }
        return ret;
    })
    .provider('$tfHttp', function() {
        var self = this;
        self.address = '';
        self.sid = false;
        self.serialize = function(obj) {
            var str = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    var k = p,
                        v = obj[p];
                    str.push(typeof v == "object" ?
                        serialize(v, k) :
                        encodeURIComponent(k) + "=" + encodeURIComponent(v));
                }
            }
            return str.join("&");
        }
        self._appendSid = function(url) {
            var newUrl = url;
            if (self.sid !== false) {
                if (url.indexOf('?') == -1) {
                    newUrl += '?_sid=' + self.sid;
                } else {
                    newUrl += self.address + url + '&_sid=' + self.sid;
                }
            }
            return newUrl;
        }
        self.$get = function($http, $rootScope) {
            return {
                address: self.address,
                sid: self.sid,
                serialize: self.serialize,
                post: function(url, data) {
                    // todo: now, its just one file allowed in cordova!
                    var newUrl = self._appendSid(self.address + url);
                    data = typeof data == 'undefined' ? {} : data;
                    dt = {};
                    var cordovaFile = false;
                    for (var i in data) {
                        if (typeof data[i] == 'object' && data[i]._cordovaFile) {
                            cordovaFile = data[i].uri;
                        } else {
                            dt[i] = data[i];
                        }
                    }
                    if (cordovaFile !== false) {
                        if (typeof navigator == 'undefined' || typeof FileUploadOptions == 'undefined' || typeof FileTransfer == 'undefined') {
                            log('Faild to load cordova-plugin-file-transfer');
                        } else {
                            var options = new FileUploadOptions();
                            options.fileKey = "file";
                            options.fileName = 'file.jpg';
                            options.mimeType = "text/plain";
                            options.params = dt;
                            var fileTransfer = new FileTransfer();
                            var resolve = function() {};
                            var reject = function() {};
                            var promise = {
                                then: function(userFunc) {
                                    resolve = userFunc;
                                },
                                catch: function(userFunc) {
                                    reject = userFunc;
                                }
                            }
                            fileTransfer.upload(cordovaFile, newUrl, function(dt) {
                                $rootScope.$apply(function() {
                                    resolve();
                                });

                            }, function(dt) {
                                $rootScope.$apply(function() {
                                    reject();
                                });
                            }, options);
                            return promise;

                        }
                    } else {
                        var formData = new FormData();
                        for (var i in data) {
                            if (typeof data[i] == 'object' && data[i]._browserFile) {
                                formData.append('file', data[i].file);
                            } else {
                                formData.append(i, data[i]);
                            }

                        }
                        return $http.post(newUrl, formData, {
                            transformRequest: angular.identity,
                            headers: { 'Content-Type': undefined }
                        });
                    }
                },
                get: function(url, data) {
                    data = typeof data == 'undefined' ? {} : data;
                    data = self.serialize(data);
                    if (data.length > 0) {
                        if (url.indexOf('?') == -1) {
                            url += '?' + data;
                        } else {
                            url += '&' + data;
                        }
                    }
                    var newUrl = self._appendSid(self.address + url);
                    return $http.get(newUrl);
                }
            };
        }
    })
    .directive('tfView', function($theFramework, $compile) {
        return {
            restrict: 'EA',
            replace: true,
            link: function(scope, element, attrs) {
                scope.animation = attrs.animation ? attrs.animation : 'fade';
                scope.onload = function() {
                    //$theFramework.loading(false);
                };
                element.replaceWith(
                    $compile('<ng-view class="tf-view tf-view-{{animation}}" onload="onload()"></ng-view>')(scope)
                );
            }
        }
    })
    .directive('tfGo', function($theFramework) {
        return function(scope, element, attrs) {
            var path;
            attrs.$observe('tfGo', function(val) {
                path = val;
            });
            FastClick.attach(element[0]);
            element.on('click', function() {
                scope.$apply(function() {
                    $theFramework.loading(false);
                    $theFramework.go(path);
                });
            })

        };
    })
    .directive('tfComponents', function($timeout, $theFramework) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            link: function(scope) {
                scope.$theFramework = $theFramework;
            },
            template: '' +
                '<div>' +
                '	<div class="tf-toast" ng-show="$theFramework._.toast.show"><div>{{$theFramework._.toast.text}}</div></div>' +
                '	<div ng-show="$theFramework._.loading.show" class="tf-loading"><div></div></div>' +
                '</div>'
        }
    })
    .directive('tfScroll', function($timeout) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var raw = element[0];
                var didIt = false;
                var didIt2 = false;

                var scrollTop = attrs.tfScrollTop ? attrs.tfScrollTop : function() {};
                var scrollBottom = attrs.tfScrollBottom ? attrs.tfScrollBottom : function() {};
                var scrollDown = attrs.tfScrollDown ? attrs.tfScrollDown : function() {};
                var scrollUp = attrs.tfScrollUp ? attrs.tfScrollUp : function() {};

                var offset = 7;
                var upDownOffset = 0;
                var lastScrollPos = 0;
                var lastDirection = 'down';

                var bottomFired = false;
                var topFired = false;
                element.bind('scroll', function() {
                    if (raw.scrollTop > lastScrollPos) { // scrolling down
                        if (lastDirection == 'up') {
                            upDownOffset = 0;
                        }
                        upDownOffset++;
                        if (upDownOffset >= offset) {
                            scope.$apply(scrollDown);
                        }
                        lastDirection = 'down';
                    } else { // scrolling up
                        if (lastDirection == 'down') {
                            upDownOffset = 0;
                        }
                        upDownOffset++;
                        if (upDownOffset >= offset) {
                            scope.$apply(scrollUp);
                        }
                        lastDirection = 'up';
                    }
                    if (raw.scrollTop <= 0 + offset) {
                        if (lastDirection == 'down') {
                            topFired = false;
                        } else if (!topFired) {
                            scope.$apply(scrollTop);
                            topFired = true;
                        }
                    } else {
                        topFired = false;
                    }

                    if (raw.scrollTop >= (raw.scrollHeight - raw.offsetHeight) - offset) {
                        if (lastDirection == 'up') {
                            bottomFired = false;
                        } else if (!bottomFired) {
                            scope.$apply(scrollBottom);
                            bottomFired = true;
                        }
                    } else {
                        bottomFired = false;
                    }
                    lastScrollPos = raw.scrollTop;
                });
            }
        };
    })
    .directive('tfSidebar', function($timeout) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                open: '=',
                direction: '@'
            },
            link: function(scope) {
                scope.direction = typeof scope.direction == 'string' ? scope.direction : 'left';
            },
            template: '' +
                '<div>' +
                '	<div class="tf-overlay" ng-show="open" ng-click="open = false"></div>' +
                '	<div class="tf-sidebar {{direction}}" ng-show="open" ng-transclude></div>' +
                '</div>'
        }
    })
    .directive('tfSearchbar', function($timeout) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: false,
            scope: {
                open: '=',
                placeholder: '@',
                callback: '&search'
            },
            link: function(scope, element) {
                scope.placeholder = typeof scope.placeholder == 'string' ? scope.placeholder : 'متن مورد نظر خود را وارد کنید…';
                scope.searchText = '';
                scope.myCallback = function() {
                    if (scope.callback({ $text: scope.searchText }) !== false) {
                        scope.open = false;
                    }
                }
                scope.$watch(function() {
                    return scope.open;
                }, function(newVal) {
                    if (newVal == true) {
                        scope.searchText = '';
                        $timeout(function() {
                            var inp = element.find('input')[0];
                            inp.focus();
                            inp.click();
                        }, 150);
                    }
                });

            },
            template: '' +
                '<div>' +
                '	<div class="tf-overlay" ng-show="open" ng-click="open = false"></div>' +
                '	<form class="tf-searchbar" ng-show="open" ng-submit="myCallback()">' +
                '		<input type="search" class="title form-control input input-sm" placeholder="{{placeholder}}" ng-model="searchText">' +
                '		<section class="icon button" ng-click="myCallback()"><i class="fa fa-check"></i></section>' +
                '	</form>' +
                '</div>'
        };
    })
    .directive('tfImageSlider', function($compile) {

        return {
            restrict: 'EA',
            replace: true,
            scope: {
                ngModel: '=?',
                index: '=?'
                    //height: '@?'
            },
            link: function(scope, element, attrs) {
                scope.images = scope.ngModel || [];
                scope.index = scope.index || 0;
                scope.height = attrs.height || 300;
                scope.height += 'px';
                scope.oldClasses = attrs.class || '';

                //
                element.replaceWith(
                    $compile(
                        '<div class="tf-image-slider {{oldClasses}}">' +
                        '<ul rn-carousel rn-carousel-controls rn-carousel-index="index" rn-carousel-pause-on-hover rn-carousel-buffered ng-style="{height: height}">' +
                        '<li ng-repeat="slide in images">' +
                        '   <div ng-style="{\'background-image\': \'url(\' + slide.src + \')\', height: height}"  class="bgimage">' +
                        '   </div>' +
                        '</li>' +
                        '</ul>' +
                        '<ul class="tf-image-slider-pagination">' +
                        '<li ng-repeat="slide in images" ng-class="{current: $index == index}"></li>' +
                        '</ul>' +
                        '</div>'
                    )(scope)
                );
            }
        };
    })
    .directive('tfSelect', function($compile, $timeout) {
        return {
            restrict: 'E',
            replace: true,
            transclude: false,
            scope: {
                options: '=',
                ngModel: '='
            },
            link: function(scope, element, attrs) {
                //console.log('logging opts');
                //console.log(scope.options());
                var inp = element.find('input')[0];
                scope.open = false;
                scope.displayOptions = [];

                scope.multiple = typeof attrs.multiple != 'undefined' ? true : false;
                scope.allowCreate = typeof attrs.allowCreate != 'undefined' ? true : false;

                scope.searchText = '';

                scope.focusIndex = 0;


                scope.search = function(text) {
                    scope.searchText = text;
                    scope.displayOptions = [];
                    if (text == '') {
                        for (var i = 0; i < scope.options.length; i++) {
                            scope.displayOptions.push(
                                Object.assign(scope.options[i], { action: 'select' })
                            );
                        }
                    } else {
                        var dublicate = false;
                        for (var i = 0; i < scope.options.length; i++) {
                            if (text == '' || scope.options[i].text.indexOf(text) !== -1) {
                                scope.displayOptions.push(
                                    Object.assign(scope.options[i], { action: 'select' })
                                );
                            }
                            if (text == scope.options[i].value) {
                                dublicate = true;
                            }
                        }

                        if (text != '' && scope.allowCreate && !dublicate) {
                            scope.displayOptions.push({
                                value: text,
                                text: 'اضافه کردن "' + text + '"',
                                action: 'create'
                            })
                        }
                        if (scope.displayOptions.length == 0) {
                            scope.displayOptions.push({
                                value: '',
                                text: 'هیچ گزینه‌ای موجود نیست!',
                                action: 'none'
                            })
                        }
                    }

                    scope.focusIndex = 0;
                }




                scope.clickItem = function(index) {
                    $timeout(function() {
                        scope.focusItem(index);
                        var justSelect = function(item) {
                            if (scope.multiple) {
                                var _index = scope.ngModel.indexOf(item.value);
                                if (_index === -1) {
                                    scope.ngModel.push(item.value);
                                } else {
                                    scope.ngModel.splice(
                                        _index, 1
                                    );
                                }
                            } else {
                                scope.open = false;
                                scope.ngModel = item.value;
                            }
                        }
                        var item = scope.displayOptions[scope.focusIndex];
                        switch (item.action) {
                            case 'select':
                                justSelect(item);
                                break;
                            case 'create':
                                scope.search('');
                                var _item = {
                                    text: item.value,
                                    value: item.value
                                }
                                scope.options.push(_item);
                                justSelect(_item);
                                break;
                            case 'none':
                                scope.search('');
                                scope.ngModel = scope.multiple ? [] : '';
                        }
                    });
                    return true;
                }
                scope.focusItem = function(index) {
                    var len = scope.displayOptions.length;
                    if (index >= len) {
                        scope.focusIndex = 0;
                    } else if (index < 0) {
                        scope.focusIndex = len - 1;
                    } else {
                        scope.focusIndex = index;
                    }
                    inp.focus();
                    return true;
                }

                scope.itemClass = function(index) {
                    if (index >= scope.displayOptions.length) {
                        return false;
                    }
                    var item = scope.displayOptions[index];
                    var ret = '';
                    if (item.action == 'select') {
                        if (scope.multiple) {
                            if (scope.ngModel.indexOf(item.value) !== -1) {
                                ret = 'active ';
                            }
                        } else {
                            if (scope.ngModel == item.value) {
                                ret = 'active ';
                            }
                        }
                    }
                    if (scope.focusIndex == index) {
                        ret += 'focus';
                    }

                    return ret;
                }
                angular.element(inp).bind('keydown', function(event) {
                    if ([13, 27, 38, 40, 9].indexOf(event.keyCode) !== -1) {
                        scope.$apply(function() {
                            var len = scope.options.length;
                            if (event.keyCode == 9 || event.keyCode == 27) { // tab. esc
                                scope.open = false;
                            } else if (event.keyCode == 13) { // enter
                                scope.clickItem(scope.focusIndex);
                            } else if (event.keyCode == 38) { // top
                                scope.focusItem(scope.focusIndex - 1);
                            } else if (event.keyCode == 40) { // down
                                scope.focusItem(scope.focusIndex + 1);
                            }

                        });
                        return false;
                    }
                })

                scope.$watch('open', function(newVal) {
                    if (newVal) {
                        $timeout(function() {
                            scope.search('');
                            inp.focus();
                        }, 150);
                    }
                });


                scope.displayVal = function() {
                    var ret, i, j;
                    if (scope.multiple) {
                        ret = [];
                        for (i = 0; i < scope.ngModel.length; i++) {
                            for (j = 0; j < scope.options.length; j++) {
                                if (scope.ngModel[i] == scope.options[j].value) {
                                    ret.push(scope.options[j].text);
                                }
                            }
                        }
                    } else {
                        ret = '';
                        for (i = 0; i < scope.options.length; i++) {
                            if (scope.options[i].value == scope.ngModel) {
                                ret = scope.options[i].text;
                                break;
                            }
                        }

                    }
                    return ret;
                }

                scope.globalClick = function(event) {
                    var el = angular.element(event.target);
                    if (el.hasClass('tf-select')) {
                        scope.open = false;
                    } else if (el.hasClass('tf-select-element') || el.hasClass('item')) {
                        scope.open = true;
                        inp.focus();
                    }
                }

            },
            template: '' +
                '<div class="tf-select-element" ng-class="{focus: open}" ng-focus="open=true" tabindex="0" ng-click="globalClick($event)">' +
                '   <div class="tf-select-element-inner">' +
                '       <span class="item item-multiple" ng-if="multiple" ng-repeat="item in displayVal() track by $index" ng-bind="item"></span>' +
                '       <span class="item item-single" ng-if="!multiple" ng-bind="displayVal()"></span>' +
                '   </div>' +
                '   <div class="tf-overlay" ng-show="open"></div>' +
                '   <div class="tf-select" ng-show="open">' +
                '       <div class="tf-select-inner" ng-show="open">' +
                '           <nav class="tf-navbar">' +
                '              <section class="title"><input ng-model="searchText" ng-change="search(searchText)" class="form-control" placeholder="نام گزینه مورد نظر را وارد کنید..."/></section>' +
                '              <section class="icon button" ng-click="open = false"><i class="fa fa-check"></i></section>' +
                '           </nav>' +
                '           <div class="tf-container">' +
                '               <ul class="list-group block">' +
                '                   <li class="list-group-item" ng-repeat="item in displayOptions" ng-bind="item.text" ng-mouseover="focusItem($index)" ng-click="clickItem($index)" ng-class="itemClass($index)"></li>' +
                '               </ul>' +
                '           </div>' +
                '       </div>' +
                '   </div>' +
                '</div>'
        };
    })
    .directive('tfSwitch', function($timeout, $document) {
        return {
            restrict: 'AE',
            replace: true,
            scope: {
                'ngModel': '=?',
                'ngChange': '&?'
            },
            link: function(scope, element, attrs) {
                scope.ngModel = typeof attrs.ngModel != 'undefined' && typeof scope.ngModel != 'undefined' ? scope.ngModel : false;
                scope.focus = false;

                function bindKeyboard(event) {
                    if ([32, 37, 39].indexOf(event.keyCode) !== -1) {
                        scope.$apply(function() {
                            if (event.keyCode == 32) { // space
                                scope.ngModel = !scope.ngModel;
                            } else if (event.keyCode == 37) { // left
                                scope.ngModel = true;
                            } else if (event.keyCode == 39) { // right
                                scope.ngModel = false;
                            }
                        });
                        return false;
                    }
                }
                scope.$watch('focus', function(val) {
                    if (val) {
                        $document.bind('keydown', bindKeyboard);
                    } else {
                        $document.off('keydown', bindKeyboard);
                    }
                });
            },
            template: function(element, attrs) {
                var html = '';
                html += '<span tabindex="0" ng-focus="focus=true" ng-blur="focus=false" class="tf-switch' + (attrs.class ? ' ' + attrs.class : '') + '"';
                html += ' ng-click="focus=true; ' + attrs.disabled + ' ? ngModel : ngModel=!ngModel;ngChange();"';
                html += ' ng-class="{ checked: ngModel, disabled: ' + attrs.disabled + ', focus: focus }"';
                html += '>';
                html += '<span class="switch-text">'; /*adding new container for switch text*/
                html += '{{ngModel? "بله": "خیر"}}';
                html += '</span>';
                html += '<span class="switch-lever"></span>';
                html += '</span>';
                return html;
            }
        }
    })
    .directive('tfDatepicker', function($timeout, $document, $compile, $window, $interval) {
        return {
            restrict: 'EA',
            replace: true,
            scope: {
                'ngModel': '=?',
                'ngChange': '&?'
            },
            link: function(scope, element, attrs) {
                moment.loadPersian();
                moment.locale('fa');

                scope.ngModel = typeof attrs.ngModel != 'undefined' && typeof scope.ngModel != 'undefined' ? scope.ngModel : false;

                var picker = '';
                picker += '<div class="tf-datepicker" ng-show="open" tabindex="0" ng-click="openPicker()" ng-blur="closePicker()">';
                picker += '<div class="display" ng-bind="vDate.display"></div>';
                picker += '<div class="j" ng-repeat="type in [\'day\',\'month\',\'year\']" ng-class="{active: currentCursur == $index}">';
                picker += '   <div class="button" ng-click="math(\'add\', type, 1)" ng-mousedown="mathMousedown($event, \'add\', type, 1)" ng-touchstart="ng-mousedown="mathMousedown($event, \'add\', type, 1)" ng-mouseup="cancelPromise()" ng-touchend="cancelPromise()"><i class="fa fa-chevron-up"></i></div>';
                picker += '   <div class="display" ng-bind="vDate[type]"></div>';
                picker += '   <div class="button" ng-click="math(\'subtract\', type, 1)" ng-mousedown="mathMousedown($event, \'subtract\', type, 1)" ng-touchstart="mathMousedown($event, \'subtract\', type, 1)" ng-mouseup="cancelPromise()" ng-touchend="cancelPromise()"><i class="fa fa-chevron-down"></i></div>';
                picker += '</div>';
                picker += '</div>';
                var picker = angular.element(picker);
                var mask = angular.element('<div class="' + (attrs.class ? ' ' + attrs.class : '') + ' focus" ng-show="open" ng-bind="ngModel"></div>');


                scope.open = false;

                scope.calendar = typeof attrs.calendar != 'undefined' ? scope.calendar : 'jalaali';
                scope.format = typeof attrs.format != 'undefined' ? scope.format : (scope.calendar == 'jalaali' ? 'jYYYY-jMM-jDD' : 'YYYY-MM-DD');

                scope.currentCursur = -1;

                function bindKeyboard(event) {
                    var action = false;
                    if (event.keyCode == 13) {
                        action = 'submit';
                    } else if (event.keyCode >= 37 && event.keyCode <= 40) {
                        action = ['left', 'add', 'right', 'subtract'][event.keyCode - 37];
                    }
                    if (action) {
                        scope.$apply(function() {
                            switch (action) {
                                case 'submit':
                                    scope.closePicker();
                                    break;
                                case 'right':
                                    if (scope.currentCursur > 0) {
                                        scope.currentCursur -= 1;
                                    } else {
                                        scope.currentCursur = 2;
                                    }
                                    break;
                                case 'left':
                                    if (scope.currentCursur < 2) {
                                        scope.currentCursur += 1;
                                    } else {
                                        scope.currentCursur = 0;
                                    }
                                    break;
                                case 'add':
                                case 'subtract':
                                    var cursorType = ['day', 'month', 'year'][scope.currentCursur];
                                    scope.math(action, cursorType, 1);
                            }
                        });
                        return false;
                    }
                }


                scope.date = moment.utc();

                scope.vDate = {
                    refresh: function() {
                        scope.vDate.day = scope.date.format((scope.calendar == 'jalaali' ? 'j' : '') + 'D');
                        scope.vDate.month = scope.date.format((scope.calendar == 'jalaali' ? 'j' : '') + 'MMMM');
                        scope.vDate.year = scope.date.format((scope.calendar == 'jalaali' ? 'j' : '') + 'YYYY');
                        scope.vDate.display = scope.date.format('dddd, jD jMMMM jYYYY');
                        scope.ngModel = scope.date.format(scope.format);
                    }
                };
                if (scope.ngModel != false) {
                    scope.date = moment(scope.ngModel, scope.format);
                }
                scope.vDate.refresh();


                scope.math = function(action, type, value) {
                    scope.date[action](value, type + 's');
                    scope.vDate.refresh();

                }

                scope.promise = {};
                scope.mathMousedown = function(event, action, type, value, interval) {
                    scope.cancelPromise();
                    if (event.which != 1 && event.button != 0) {
                        return false;
                    }
                    interval = typeof interval == 'undefined' ? 400 : interval;
                    interval = interval <= 50 ? 50 : interval;

                    scope.promise = $timeout(function() {
                        scope.math(action, type, value);
                        scope.mathMousedown(event, action, type, value, interval - 50);
                    }, interval);
                }
                scope.cancelPromise = function() {
                    $timeout.cancel(scope.promise);
                }


                scope.openPicker = function() {
                    if (scope.open) {
                        return false;
                    }
                    picker.width(element.outerWidth(true));
                    scope.open = true;
                    scope.currentCursur = -1;
                    scope.cancelPromise();
                    $document.bind('keydown', bindKeyboard);
                    $timeout(function() {
                        picker.focus();
                    });
                }

                scope.closePicker = function() {
                    if (!scope.open) {
                        return false;
                    }
                    scope.open = false;
                    $document.off('keydown', bindKeyboard);
                    scope.cancelPromise();
                }
                picker.width(element.outerWidth(true));
                $compile(picker)(scope);
                element.after(picker);
                $compile(mask)(scope);
                element.after(mask);

            },
            template: function(element, attrs) {
                return '<div class="' + (attrs.class ? ' ' + attrs.class : '') + '" ng-click="openPicker()" ng-focus="openPicker()" ng-bind="ngModel" ng-show="!open" tabindex="0"></div>';
            }
        }
    })
    .directive('tfBottomSheet', function($timeout) {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            scope: {
                open: '=',
                label: '@?'
            },
            template: '' +
                '<div>' +
                '	<div class="tf-overlay" ng-show="open" ng-click="open = false"></div>' +
                '	<div class="tf-bottom-sheet" ng-show="open">' +
                '       <label class="tf-label" ng-bind="label" ng-if="label"></label>' +
                '       <div class="content" ng-transclude></div>' +
                '   </div>' +
                '</div>'
        }
    })
    .directive('tfImagePicker', function($timeout, $compile, $theFramework) {
        return {
            restrict: 'A',
            scope: {
                ngModel: '=?',
                ngChange: '&?'
            },
            link: function(scope, element, attrs) {
                scope.ngChange = typeof scope.ngChange != 'undefined' ? scope.ngChange : new Function();
                scope.ngModel = typeof scope.ngModel != 'undefined' ? scope.ngModel : '';

                scope.fileChanged = function(data) {
                    if (isCordova) { // for mobile
                        scope.ngModel = {
                            _cordovaFile: true,
                            uri: data
                        }
                    } else { // for browser
                        scope.ngModel = {
                            _browserFile: true,
                            file: data
                        }
                    }
                    scope.$apply();
                    scope.ngChange();
                }
                if (isCordova) {
                    element.bind('click', function(event) {
                        if (typeof navigator.camera.getPicture == 'undefined') {
                            log('Faild to load cordova-plugin-mfilechooser');
                        } else {
                            navigator.camera.getPicture(function(res) {
                                scope.fileChanged(res);
                            }, function(err) {
                                log(err)
                            }, {
                                destinationType: Camera.DestinationType.FILE_URI,
                                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                                encodingType: Camera.EncodingType.JPEG,
                            });
                        }
                        event.stopPropagation();
                    });
                } else {
                    element.append(
                        $compile('<input type="file" class="hide"/>')(scope)
                    );
                    var fileElem = element.find('input')[0];
                    element.bind('click', function(event) {
                        fileElem.click();
                        event.stopPropagation();
                    });
                    $timeout(function() {
                        fileElem.onchange = function() {
                            if (!fileElem.files || !fileElem.files[0]) {
                                log('Faild to load input file');
                            } else {
                                scope.fileChanged(fileElem.files[0]);
                            }
                            return;
                        }
                    });
                }
            }
        }
    })
    .directive('tfFloatingBtn', function($document) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            template: '<button class="tf-floating-btn" ng-transclude></button>'
        }
    })