# the-framework
An AngularJs mobile first framework for the Persian community. I tried to write this as simple as i could to easy creating Cordova, Electron and normal web applications.

#### Demo:
[the-framework](http://nainemom.github.io/the-framework)

#### Depends: ( bundled, no need to include manually )
- angular
- angular-animate
- angular-route
- angular-touch
- bootstrap
- jquery
- fastclick
- moment
- moment-jalaali
- selectize

#### Directives:
- tf-view
- tf-go
- tf-components
- tf-scroll
- tf-sidebar
- tf-searchbar
- tf-image-slider
- tf-selectize
- tf-switch
- tf-datepicker
- tf-bottom-sheet
- tf-image-picker
- tf-floating-btn

#### Grunt Commands:
- grunt buildjs
- grunt buildcss
- grunt build
- grunt fastbuild
- grunt start



## How To Use?
#### Include the-framework files in head tag of your index.html:
```html
<link rel="stylesheet" href="xxx/the-framework.bundle.css">
<script src="xxx/the-framework.bundle.js"></script>
```

#### Create two main the-framework directives in body tag of your index.html:
```html
<tf-view></tf-view>
<tf-components></tf-components>
```

#### Add the-framework to your angular app:
```javascript
var app = angular.module('app', ['theFramework'])
```

That's all. To start playing, clone this repostory and run it by [http-server](https://www.npmjs.com/package/http-server).
```bash
git clone https://github.com/nainemom/the-framework
cd the-framework
npm install
grunt start
```

All contributions are welcome :-)
