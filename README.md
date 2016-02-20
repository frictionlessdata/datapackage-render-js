Render and view data packages (especially in the browser)

## Install

[![NPM](https://nodei.co/npm/datapackage-view.png)](https://nodei.co/npm/datapackage-view/)

```
npm install datapackage-view
```

Install with comamnd line tool:

```
npm install -g datapackage-view
```

# Usage

## Library

```
var dpView = require('datapackage-view');

dpView.html('path-to-datapackage', function(error, html) {
  console.log(html);
});

## Command Line

```
dpview html <path>
```

