# volume-leaflet #

A geospatial visualization for Apache Zeppelin using [Leaflet](http://leafletjs.com/)

## Compatibility ##

Requires Zeppelin 0.8.0-SNAPSHOT+

## Development ##

To use this as a Zeppelin helium module, you will need to generate the helium descriptor. 
Use one of the npm scripts to generate it for you.  These scripts require jq.

Generates the descriptor using a local directory path
~~~~
npm run helium.dev 
~~~~

Generates the descriptor using an npm identifier
~~~~
npm run helium
~~~~

## License ##

* volume-leaflet: BSD-2-Clause
* Leaflet: [License](https://github.com/Leaflet/Leaflet/blob/master/LICENSE) - BSD-2-Clause
