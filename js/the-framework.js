var log = alert;
angular.module('theFramework', ['ngRoute', 'ngAnimate', 'ngTouch'])
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
                tfc = jQuery('.tf-container');
                jQuery('.tf-container').scroll(function() {
                    console.log(tfc[0].scrollTop);
                });
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
                    } else if (raw.scrollTop >= (raw.scrollHeight - raw.offsetHeight) - offset) {
                        if (lastDirection == 'up') {
                            bottomFired = false;
                        } else if (!bottomFired) {
                            scope.$apply(scrollBottom);
                            bottomFired = true;
                        }
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
    .directive('tfImageSlider', function($interval) {

        return {
            restrict: 'E',
            scope: {
                ngModel: '=?'
            },
            link: function(scope, attrs) {
                scope.images = scope.ngModel || [];
                scope.setTime = attrs.attr('interval') || 7000;

                scope.numberOfImages = scope.images.length;
                scope.dots = new Array(scope.numberOfImages);
                scope.selectedImage = 0;
                scope.setSelected = function(idx) {
                    scope.stopSlider();
                    scope.selectedImage = idx;
                };

                //Slideshow controls
                scope.sliderBack = function() {
                    scope.stopSlider();
                    scope.selectedImage === 0 ? scope.selectedImage = scope.numberOfImages - 1 : scope.selectedImage--;
                };

                scope.sliderForward = function() {
                    scope.stopSlider();
                    scope.autoSlider();
                };

                scope.autoSlider = function() {
                    scope.selectedImage < scope.numberOfImages - 1 ? scope.selectedImage++ : scope.selectedImage = 0;
                };

                scope.stopSlider = function() {
                    $interval.cancel(scope.intervalPromise);
                    scope.activePause = true;
                    scope.activeStart = false;
                };

                scope.toggleStartStop = function() {
                    if (scope.activeStart) {
                        scope.stopSlider();
                    } else {
                        scope.startSlider();
                    }
                };

                scope.startSlider = function() {
                    scope.intervalPromise = $interval(scope.autoSlider, scope.setTime);
                    scope.activeStart = true;
                    scope.activePause = false;
                };
                scope.startSlider();

                scope.show = function(idx) {
                    if (scope.selectedImage == idx) {
                        return true;
                    }
                    return false;
                };

                scope.oldClasses = attrs.class || '';
            },
            template: '<div class="tf-image-slider {{oldClasses}}" interval="{{setTime}}">' +
                '<ul>' +
                '   <li ng-repeat="image in images" ng-click="toggleStartStop()" ng-swipe-right="sliderBack()" ng-swipe-left="sliderForward()"><img data-ng-src="{{image.src}}" data-ng-alt="{{image.alt}}" ng-show="show($index)"/></li>' +
                '</ul>' +
                '<div class="tf-image-slider-pagination">' +
                '<ul>' +
                '   <li ng-repeat="i in dots track by $index" ng-class="{current: selectedImage==$index}" ng-click="setSelected($index)"></li>' +
                '</ul>' +
                '</div>' +
                '</div>'
        };
    })
    .directive('tfSelectize', function($timeout) {
        return {
            restrict: 'EA',
            require: 'ngModel',
            scope: {
                selectize: '&',
                options: '&',
                ngDisabled: '=',
                allowCreate: '='
            },
            link: function(scope, element, attrs, ngModel) {
                var changing, options, selectize, invalidValues = [];
                var data = scope.options();
                var settings = typeof attrs.selectize != 'undefined' ? scope.selectize() : {};

                var mode = element[0].hasAttribute('multiple') ? 'multi' : 'single';
                // Default options
                options = angular.extend({
                    delimiter: ',',
                    persist: true,
                    mode: mode,
                    create: ((typeof attrs.allowCreate !== 'undefined' && attrs.allowCreate !== false) ? function(input) {
                        return {
                            value: input,
                            text: input
                        }
                    } : false),
                    closeAfterSelect: mode == 'single' ? true : false,
                    placeholder: 'انتخاب کنید',
                    render: {
                        option_create: function(data, escape) {
                            return '<div class="create">اضافه کردن <strong>' + escape(data.input) + '</strong>&hellip;</div>';
                        }
                    }
                }, settings || {});

                // Activate the widget
                selectize = element.selectize(options)[0].selectize;

                selectize.on('change', function() {
                    //console.log('selectize changed ');
                    setModelValue(selectize.getValue());

                });

                function setModelValue(value) {
                    //console.log('set model value ' + value);
                    value = value && value !== '' ? value : undefined;
                    if (changing) {
                        return;
                    }
                    scope.$parent.$apply(function() {
                        ngModel.$setViewValue(value);
                    });

                    if (options.mode === 'single') {
                        selectize.blur();
                    }
                }

                // Normalize the model value to an array
                function parseValues(value) {
                    if (angular.isArray(value)) {
                        return value;
                    }
                    if (!value) {
                        return [];
                    }
                    return String(value).split(options.delimiter);
                }

                // Non-strict indexOf
                function indexOfLike(arr, val) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i] === val) {
                            return i;
                        }
                    }
                    return -1;
                }

                // Boolean wrapper to indexOfLike
                function contains(arr, val) {
                    return indexOfLike(arr, val) !== -1;
                }

                // Store invalid items for late-loading options
                function storeInvalidValues(values, resultValues) {
                    values.map(function(val) {
                        if (!(contains(resultValues, val) || contains(invalidValues, val))) {
                            invalidValues.push(val);
                        }
                    });
                }

                function restoreInvalidValues(newOptions, values) {
                    var i, index;
                    for (i = 0; i < newOptions.length; i++) {
                        index = indexOfLike(invalidValues, newOptions[i][selectize.settings.valueField]);
                        if (index !== -1) {
                            values.push(newOptions[i][selectize.settings.valueField]);
                            invalidValues.splice(index, 1);
                        }
                    }
                }

                function setSelectizeValue(value) {
                    //console.log('set selectize value ' + value)
                    $timeout(function() {
                        var values = parseValues(value);

                        if (changing || values === parseValues(selectize.getValue())) {
                            return;
                        }

                        changing = false;

                        selectize.setValue(values);
                        storeInvalidValues(values, parseValues(selectize.getValue()));

                        changing = true;
                    });
                }

                function setSelectizeOptions(newOptions) {
                    var values = parseValues(ngModel.$viewValue);

                    if (options.mode === 'multi' && newOptions) {
                        restoreInvalidValues(newOptions, values);
                    }

                    if (newOptions) {
                        if (Array.isArray(newOptions) && newOptions.length === 0) {
                            selectize.clearOptions();
                        }
                        selectize.addOption(newOptions);
                        selectize.refreshOptions(false);
                        setSelectizeValue(values);
                    }
                }

                var toggleDisabled = function(disabled) {
                    if (disabled) {
                        selectize.disable();
                        return;
                    }

                    selectize.enable();
                };

                scope.$watch('ngDisabled', toggleDisabled);
                scope.$parent.$watch(attrs.ngModel, setSelectizeValue);

                if (attrs.options) {
                    scope.$parent.$watch(attrs.options, setSelectizeOptions, true);
                }

                scope.$parent.$watch(data, setSelectizeOptions(data), true);

                scope.$on('$destroy', function() {
                    selectize.destroy();
                });
            }
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
                var isCordova = typeof window.cordova == 'undefined' ? false : true;
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