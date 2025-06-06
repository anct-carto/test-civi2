<template>
    <div id="map"></div>
</template>


<script>

import cv_geom from '@/assets/geom_cv_ctr.json'
import dep_geom_ctr from '@/assets/geom_dep_ctr.json'
import reg_geom_ctr from '@/assets/geom_reg_ctr.json'
import dep_geom from '@/assets/geom_dep.json'
import cercles_drom from '@/assets/cercles_drom.json'
import labels from '@/assets/labels.json'
import L from 'leaflet'
import "leaflet/dist/leaflet.css";
import "leaflet.zoomhome/dist/leaflet.zoomhome.js";
import {mapState} from 'vuex'
import * as _ from "underscore"

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
})


export default {
  name: 'MapComponent',
  props: ['echelle','idGeo','libGeo'],
  data() {
    return {
      depGeom:dep_geom,
      cerclesDrom:cercles_drom,
      radiusCoeff:70
    }
  },
  computed: {
    // 1. variables globales du store
    // utilisation de mapstate, module de vuex, pour appeler les données présentes dans le state
    // plutôt que de faire à chaque fois return this.$store.state.data ... etc.
    ...mapState({
      actions: state => state.data,
      filterTheme: state => state.filterTheme,
      filterCodeGlobal: state => state.filterCode,
      themeColor: state => state.themeColor,
      annee: state => state.annee
    }),
    // choix du fichier de géométrie à charger en fonction del'échelle choisie : reg, dep ou cdv
    baseGeom() {
    // baseGeom() {
      if(this.echelle == "cdv") {
        return cv_geom
      } else if (this.echelle == "dep") {
        return dep_geom_ctr
      } else {
        return reg_geom_ctr
      }
    },
    // 2. Initialisation carte avec fond 
    map() {
      let soutWest = L.latLng(55, -23);
      let northEast = L.latLng(37, 26);
      let bounds = L.latLngBounds(soutWest, northEast);
      // let extent = this.$route.query['@'].split(',');
      let map = L.map('map', {
        zoomControl:false,
        zoomSnap:0.05,
        minZoom:5,
        maxBounds:bounds ,
      })
      // .setView([46.413220, 1.219482],6);

      // ajout fond cercles drom
      new L.GeoJSON(this.cerclesDrom, {
        interactive:false,
        style:{
          fillColor:'rgb(250,250,250)',
          color:'#3b5fa9',
          fillOpacity:1,
          weight:0.5,
        }
      }).addTo(map)

      // ajout fond département
       let bgGeom = new L.GeoJSON(this.depGeom, {
        interactive:false,
        style:{
          fillColor:'rgb(245, 233, 223)',
          fillOpacity:1,
          weight:1,
          color:'rgb(255,255,255)'
        }
      }).addTo(map)
      
      map.fitBounds(bgGeom.getBounds().pad(0.1,0.1,0.1,0.1))

      const zoomHome = L.Control.zoomHome({ 
        position : 'topright',
        // icon: 
      });
      zoomHome.addTo(map)


      map.on("click", () => {
        this.clickedBubbleLayer.clearLayers()
        this.$store.dispatch('resetCodegeo')
      })

      // https://cartographicperspectives.org/index.php/journal/article/view/cp76-donohue-et-al/1307

      return map
    },
    // 3. CALQUES
    bubbleLayer() {
      // calque accueillant les cercles proportionnels
      return L.featureGroup({interactive:true, className:'bubbles'}).addTo(this.map)
    },
    clickedBubbleLayer() {
      // calque accueillant le cercle surligné de l'élément cliqué
      return L.layerGroup({interactive:true}).addTo(this.map)
    },
    hoveredLayer() {
      // calque accueillant le cercle créé au passage de souris
      return L.layerGroup({interactive:false}).addTo(this.map)
    },
    labelLayer() {
      // calque accueillant le cercle créé au passage de souris
      return L.layerGroup({interactive:false}).addTo(this.map)
    },
    // 4. calcul valeur max à utilisée pour garder proportionnalité des cercles
    maxCount() {
      let actionsCount = _.groupBy(this.actions,'codgeo')
      actionsCount = _.map(actionsCount, (v,k) => {
        return {
          codgeo:k,
          count:_.reduce(v, (total, o) => {
            return total + o.montant
          },0)
        }
      })
      let max = actionsCount.reduce((a,b) => (a.count > b.count) ? a : b).count;

      // let max =  15000000;
      return max
    }
  },
  watch: {
    filterTheme() {
      this.updateBubbles();
    },    
    annee() {
      this.updateBubbles()
    },
    filterCodeGlobal(e) {
      // efface contenu précédent calque si non vide, puis remplis le avec le cercle créé au choix d'un territoire
      this.clickedBubbleLayer.clearLayers();
      let clickedFeature = this.pinSelected(e);
      clickedFeature.addTo(this.clickedBubbleLayer);

      // change style des autres cercles au clic excepté celui cliqué
      // this.bubbleLayer.eachLayer(layer => {
      //   layer.eachLayer(e => {
      //     if(e.feature.properties.codgeo == this.filterCodeGlobal) {
      //       e.setStyle({fillColor:this.themeColor})
      //       console.log(e);
      //     } else {
      //       e.setStyle({fillColor:'lightgrey'})
      //     }
      //   })
      // })
    }
  },
  mounted() {
    this.computeData();
    this.drawBubbles();
    this.createLegend();
    this.displayChefsLieux();
    // this.map.on('moveend',this.setMapExtent);
  },
  methods: {
    displayChefsLieux() {
      const data = labels;
      const map = this.map
      let labelLayer = this.labelLayer

      let labelPref = new L.GeoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng,{
            icon:createLabelIcon("labelClassDep", feature.properties.libgeom),
            interactive: false,
          })
        },
        filter : function (feature) {
          return feature.properties.STATUT == "département" || feature.properties.STATUT == "région";
        },
        className:"depLabels",
        rendererFactory: L.canvas()
      });

      let labelSspref = new L.GeoJSON(data, {
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng,{
            icon:createLabelIcon("labelClassDep", feature.properties.libgeom),
            interactive: false
          })
        },
        filter : function (feature) {
          return feature.properties.STATUT == "sous-prefecture";
        },
        className:"depLabels",
        rendererFactory: L.canvas()
      });

      map.on('zoomend', function() {
        let zoom = map.getZoom();

        switch (true) {
          case zoom < 7 :
            labelLayer.clearLayers()
            break;
          case zoom >= 7 && zoom < 9:
            labelPref.addTo(labelLayer);
            break;
          case zoom > 9:
            labelPref.addTo(labelLayer);
            labelSspref.addTo(labelLayer);
            break;
        }
      });

      function createLabelIcon(labelClass,labelText){
          return L.divIcon({
              className: svgText(labelClass),
              html: svgText(labelText),
              iconAnchor:   [23, 10],
          })
      }
      function svgText(txt) {
          return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text x="0" y = "10">'
          + txt + '</text></svg>';
      }
    },
    createLegend() {
      let legend = L.control({position:'bottomright'});
      let previousLegend = document.getElementsByClassName('info-legend')

      // si légende déjà présente, supprimer et regénérer, sinon elle sera duppliquée
      if(previousLegend.length) {
        previousLegend[0].remove()
      }
      
      legend.onAdd = function() {
        var legendContainer = L.DomUtil.create('div','info-legend');


        // let val1 = createLegendBubble(2000000)
        // let val2 = createLegendBubble(500000)
        // let val3 = createLegendBubble(100000)

        // let legend = `
        // <div class="legend-bubble max" style="width:${val1}px;height:${val1}px;">
        //   <span class="legend-bubble-text">2 millions</span>
        //   <div class="legend-bubble mean" style="width:${val2}px;height:${val2}px;">
        //     <span class="legend-bubble-text">500 000</span>
        //     <div class="legend-bubble min" style="width:${val3}px;height:${val3}px;">
        //       <span class="legend-bubble-text">100 000</span>
        //     </div>
        //   </div>
        // </div>`

        // function createLegendBubble(r) {
        //   let radius = Math.sqrt(r)*(this.radiusCoeff/Math.sqrt(1500000))
        //   return radius
        // }

        legendContainer.innerHTML += "<b>Montant total en euros</b><br><i>Les cercles sont<br>proportionnels aux<br>montants des subventions";
        // legendContainer.innerHTML += legend;

        return legendContainer
      }
      legend.addTo(this.map)
    },
    // FONCTIONS APPELEES
    // agrégation par code territoire avant de faire la carte
    computeData() {
      let data = this.actions;
      // filtrer sur modalité sélectionnée dans le doghnut (si sélectionnée)
      if(this.filterTheme) {
        data = data.filter(e => {
          return e.theme == this.filterTheme
        });
      }

      // grouper pour sommer les montants par territoire
      let actionsCount = _.groupBy(data,'codgeo')
      actionsCount = _.map(actionsCount, (v,k) => {
        return {
          codgeo:k,
          count:_.reduce(v, (total, o) => {
            return total + o.montant
          },0)
        }
      })

      // jointure géomtries CV / nb d'actions par CV
      this.baseGeom.features.forEach(e => {
        // supprimer au préalable le champ "count" car valeur précédente gardée si aucune actions dans le thème sélectionée
        if(e.properties.count) {
          delete e.properties.count
        }
        actionsCount.forEach(f => {
          if(e.properties[this.idGeo] == f.codgeo) {
            e.properties.count = f.count
            // !! ne pas oublier d'intégrer le codegeo
            e.properties["codgeo"] = f.codgeo
          }
        })
        if(e.properties.count === undefined) {
          e.properties.count = 0
        }
      });

      // tri décroissant pour afficher les plus petites valeurs en premier
      this.baseGeom.features.sort(function (a, b) {
        if (a.properties.count > b.properties.count) { return -1 }
        if (a.properties.count < b.properties.count) { return 1 }
      });
      
      // alimenter liste contrats de ville présents sur la carte vers liste déroulante
      this.$store.state.cvList = this.baseGeom.features.filter(e => e.properties.count>0).
      map(e => {
        return {
          codgeo:e.properties[this.idGeo],
          libgeo:e.properties[this.libGeo],
          pop:e.properties.pop
        }
      }).sort((a,b) => {
                if(a.libgeo<b.libgeo) return -1
                if(a.libgeo>b.libgeo) return 1
                return 0
      });
    },
    // représentation carto
    drawBubbles() {
      new L.GeoJSON(this.baseGeom, {
        interactive:true,
        filter:(feature) => {
          if(feature.properties.count > 0) {
            return true
          }
        },
        pointToLayer: (feature, latlng) => {
          // à partir des latlng, retourne les cercles proportionnels
          return L.circleMarker(latlng, {
            radius:this.computeRadius(feature.properties["count"]),
            fillColor:this.themeColor,
            fillOpacity:.5,
            color:'white',
            weight:1,
            interactie:true,
            pane: 'markerPane'
          })
          .on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            let code = feature.properties[this.idGeo];
            this.$store.dispatch('crossFilter',{type:'codgeo',value:code});

            this.clickedBubbleLayer.clearLayers();
            this.pinSelected(code).addTo(this.clickedBubbleLayer)
          })
          .on("mouseover", (e) => {
            // console.log(e);
            e.originalEvent.stopPropagation();
            this.hoveredFeature = feature.properties[this.idGeo]
            this.stylishHovered(feature)
          })
          .on("mouseout", () => {
            this.hoveredLayer.clearLayers();
          })
        }
      }).addTo(this.bubbleLayer);
    },
    updateBubbles() {
      this.computeData();
      this.createLegend();

      // méthode 1 : regénérer les cercles (un peu plus long)
      this.bubbleLayer.clearLayers();
      this.drawBubbles();

      // méthode 2 : animation cercles (fonctionne mal)
      // this.bubbleLayer.eachLayer(layer => {
      //   layer.setStyle({fillColor:this.themeColor});
      //   let intervalDuration = 10
      //   layer.eachLayer(e => {
      //     let newRadius = this.computeRadius(e.feature.properties["count"]);

      //     if(newRadius != e.getRadius) {
      //       let intervalMinus = setInterval(() => {
      //         let currentRadius = e.getRadius();
      //         if(currentRadius<newRadius) {
      //           e.setRadius(++currentRadius)
      //         } else {
      //           clearInterval(intervalMinus)
      //         }
      //       }, intervalDuration);
  
      //       let intervalPlus = setInterval(() => {
      //         let currentRadius = e.getRadius();
      //         if(currentRadius>newRadius) {
      //           e.setRadius(--currentRadius)
      //         } else {
      //           clearInterval(intervalPlus)
      //         }
      //       }, intervalDuration);
      //     } 
      //   })
      // })

      // regnérer la taille du cercle cliqué
      this.clickedBubbleLayer.clearLayers();
      let clickedFeature = this.pinSelected(this.filterCodeGlobal);
      clickedFeature.addTo(this.clickedBubbleLayer)

    },
    // créé un marqueur au dessus du cercle survolé 
    stylishHovered(feature) {
      let hoveredFeature = this.pinSelected(feature.properties[this.idGeo]);
      hoveredFeature.addTo(this.hoveredLayer)
    },
    // créé un cercle correspond similaire à celui qui a été cliqué
    pinSelected(code) {
      let selectedFeature = new L.GeoJSON(this.baseGeom, {
        filter:feature => {
          return feature.properties[this.idGeo] == code
        },
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius:this.computeRadius(feature.properties["count"]),
            color:'red',
            fillOpacity:.8,
            fillColor:this.themeColor,
            opacity:1,
            weight:2,
            interactive:false,
            pane: 'markerPane'
          }).bindTooltip(`${feature.properties[this.libGeo]} (${feature.properties[this.idGeo]}) : ${feature.properties.count.toLocaleString("fr-FR")} €`, {
            permanent:true,
            direction:'top',
            className:'leaflet-tooltip-custom',
            offset:[0,-this.computeRadius(feature.properties["count"])]
          }).openTooltip()
        },
        interactive:false
      });
      return selectedFeature;
    },
    // calcul du rayon des cercles
    computeRadius(baseCount) {
      // changer la valeur "100" pour agrandir ou réduire la taille max des cercles
      return Math.sqrt(baseCount)*(this.radiusCoeff/Math.sqrt(this.maxCount))
    },
    setMapExtent() {
      // ajoute lat lng zoom à l'URL 
      // n'est pas utilisé mais utile pour partager la vue de l'appli
      // à partir de l'URL avec d'autres paramètres
      let map = this.map;
      let center = map.getCenter();
      let lat = center.lat.toFixed(4);
      let lng = center.lng.toFixed(4);
      let z = map.getZoom();
      this.$router.push({path:this.$route.path, query: {'@':`${lat},${lng},${z}`}});
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

#map {
  width: auto;
  height:calc(100vh - 150px) !important;
  background: white;
   /* border: 0.5px solid rgb(116, 116, 116); */
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.20), 0 0px 2px rgba(0,0,0,.01);
  border-radius: 5px;
}

.leaflet-tooltip-custom {
  font-family: 'Marianne-Regular';
  font-size:1em;
  background: rgba(0,0,0,.85);
  color:white;
  border-radius:6px;
  border:0px;
  padding:3px 6px 3px 6px;
  box-shadow: none;
}

.leaflet-tooltip-top::before {
  bottom: 0;
  margin-bottom: -12px;
  border-top-color:rgba(0,0,0,.85);
}

.info-legend {
  font-family: 'Marianne-Regular';
  background-color: rgba(255,255,255,0.8);
  box-shadow: 0 2px 2px rgba(0,0,0,.2), 0 0px 2px rgba(0,0,0,.01);
  border-radius: 7px;
  padding:10px;
  display: block;
  height: 100px;
}

.legend-bubble {
  border-radius:50%;
  border: 1px solid rgb(116, 116, 116);
  position: absolute;
}

.legend-bubble-text {
  position: absolute;
  transform: translateX(250%);
}

.info-legend > span {
  position:absolute
}

.mean {
  left:18%;
  bottom:-1%;
}

.min {
  left: 26%;
  bottom:-1%;
}

.min > .legend-bubble-text {
  left:-30%;
}

.mean > .legend-bubble-text {
  left:5%;
}

.depLabels {
  font-size: 1em;
  color:white
}

</style>