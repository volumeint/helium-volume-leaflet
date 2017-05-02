/**
 * Copyright 2017 Volume Integration
 * Copyright 2017 Tom Grant
 *
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import Visualization from 'zeppelin-vis'
import ColumnselectorTransformation from 'zeppelin-tabledata/columnselector'


import L from 'leaflet/dist/leaflet'
import 'leaflet/dist/leaflet.css'

// workaround https://github.com/Leaflet/Leaflet/issues/4968
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41], 
    tooltipAnchor: [12, -28],
    shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

export default class LeafletMap extends Visualization {

  constructor(targetEl, config) {
    super(targetEl, config)

    const columnSpec = [
		{ name: 'coordinates'},
		{ name: 'tooltip'},
		{ name: 'popup'}
	];

    this.transformation = new ColumnselectorTransformation(config, columnSpec);
    this.chartInstance = L.map(this.getChartElementId());
  }

  getTransformation() {
    return this.transformation;
  }
  
  showChart() {
    super.setConfig(config);
    this.transformation.setConfig(config);
  };

  getChartElementId() {
    return this.targetEl[0].id
  };

  getChartElement() {
    return document.getElementById(this.getChartElementId());
  };

  clearChart() {
    if (this.chartInstance) { 
	this.chartInstance.off();
        this.chartInstance.remove();
        this.chartInstance = null; 
    }
  };

  showError(error) {
    this.clearChart()
    this.getChartElement().innerHTML = `
        <div style="margin-top: 60px; text-align: center; font-weight: 100">
            <span style="font-size:30px;">
                ${error.message} 
            </span>
        </div>`
  }

  drawMapChart(chartDataModel) {

      const map = this.chartInstance;

      var minLat = 180;
      var maxLat = -180;
      var minLng = 90;
      var maxLng = -90;

      // split coordinates into lat,lng,alt
      const coordRegex = /^([-+]?[1-8]?\d(\.\d+)?|90(\.0+)?)\s*,\s*([-+]?(180(\.0+)?|(1[0-7]\d)|([1-9]?\d)(\.\d+)?))\s*(,\s*([-+]?\d+(\.\d+)?))?$/
      
      for (var i = 0; i < chartDataModel.rows.length; i++) {
	const row = chartDataModel.rows[i];
        const coord = row[0];
	const tooltip = row[1];
	const popup = row[2];

        const regexResults = coordRegex.exec(coord);

        if(null !== regexResults) {
		const lat = Number(regexResults[1]);
		const lng = Number(regexResults[4]);
                //const alt = Number(regexResults[11]);

		minLat = Math.min(minLat, (lat - 0.04));
		minLng = Math.min(minLng, (lng - 0.01));
		maxLat = Math.max(maxLat, (lat + 0.04));
		maxLng = Math.max(maxLng, (lng + 0.01));

		const marker = L.marker([lat, lng]);
		const mapMarker = marker.addTo(map);

		if(tooltip && tooltip !== '') {
		    mapMarker.bindTooltip(tooltip);
		}

                if(popup && popup !== '') {
		    mapMarker.bindPopup(popup);
		}
	}
        
      }

    const bounds = [
      [maxLat, maxLng],
      [minLat, minLng]
    ];

    map.fitBounds(bounds);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    this.getChartElement().style.height = '300px';
  };

  createMapDataModel(data) {

	const getColumnIndex = function(config, fieldName, isOptional) {
		var fieldConf = config[fieldName]
		if(fieldConf instanceof Object) {
			return fieldConf.index
                } else if(isOptional) {
			return -1
		} else {
			throw {
				message: "Please set " + fieldName + " in Settings"
			}
		}
        };

	const config = this.getTransformation().config
        const coordIdx = getColumnIndex(config, 'coordinates')
	const tooltipIdx = getColumnIndex(config, 'tooltip')
        const popupIdx = getColumnIndex(config, 'popup', true)

	const mapDataModel = {
	    rows: []
	};

	for (var i = 0; i < data.rows.length; i++) {
		const tableRow = data.rows[i];
                const coord = tableRow[coordIdx]
                const tooltip = tableRow[tooltipIdx]
                const popup = popupIdx < 0 ? null : tableRow[popupIdx]
		const mapRow = [
			coord,
			tooltip,
			popup
		];
		mapDataModel.rows.push(mapRow)
	}

	return mapDataModel
  }

  render(data) {
	try {
		const mapDataModel = this.createMapDataModel(data)
		this.drawMapChart(mapDataModel)
	} catch (error) {
		console.error(error)
		this.showError(error)
	}
  }
}

