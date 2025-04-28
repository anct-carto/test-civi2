<template>
      <div
      class="chart-container">
        <canvas id="theme-chart"></canvas>
      </div>
</template>

<script>

import Chart from 'chart.js/auto';
import * as _ from "underscore"
import {mapState} from 'vuex'

// Chart.defaults.font.size = 10.5;

export default {
  name: 'ThemeChart',
  data() {
    this.chart = null
    return {
      selected:null,
      colors:['#313778','#DE9F00','#88ACDC', '#03AC84', '#de7330','#0f5d48']
    }
  },
  computed: {
    ...mapState({
      actions: state => state.data,
      filterCode: state => state.filterCode,
      annee: state => state.annee,
      filteredData: state => state.filteredData
    }),
    actionsCount() {
      let actionsCount;
      if(this.filterCode || this.annee) {
        let filteredData = this.actions.filter(e => {
          if(this.filterCode) {
            return e.codgeo === this.filterCode
          } else if(this.annee) {
            return e.annee == this.annee
          }
        });
        actionsCount = this.transformData(filteredData);
      } else {
        actionsCount = this.transformData(this.actions)
      }
      return actionsCount
    },
    labels() {
      let labels = this.actionsCount.map(e => e.theme)
      return labels
    },
    dataset() {
      return this.actionsCount.map(e => e.count)
    },
  },
  watch: {
    filterCode() {
      this.updateChart()
    },
    annee() {
      this.updateChart()
    }
  },
  mounted() {
    this.createChart();
    window.addEventListener('resize', this.updateFontSize); // Ajouter l'écouteur de redimensionnement
  },
  beforeUnmount() {
  window.removeEventListener('resize', this.updateFontSize); // Nettoyage de l'écouteur lors de la destruction
  },
  methods: {
    calculateFontSize() {
      const width = window.innerWidth;
      // Calcule une taille de police en fonction de la largeur de la fenêtre
      if (width > 1200) return 9;
      if (width > 800) return 7;
      return 5;
    },
    updateFontSize() {
      // Met à jour la taille de police dans les options du graphique
      if (this.chart) {
        this.chart.options.plugins.legend.labels.font.size = this.calculateFontSize();
        this.chart.update();
      }
    },


    createChart() {
      const ctx = document.getElementById('theme-chart');
      const fontSize = this.calculateFontSize();

      let chartOptions = {
        type: 'doughnut',   // le type du graphique
        data:{
          labels: this.labels,
          datasets:[{
            label:'actionsCount',
            data:this.dataset,
            labels:this.labels,
            backgroundColor: this.colors,
            hoverOffset: 5,
            hoverBorderColor:'red',
            hoverBorderWidth:1.5,
          }]
        },
        options:{
          rotation: -90,  // Faire commencer le graphique en bas (semi-cercle)
          circumference: 180,
          onClick:(evt,el,chart) => {
            // 1. récupérer les nouvellles modalités ...
            let point = chart.getElementsAtEventForMode(evt, 'point', { intersect: true}, true);
            if(point.length) {
              let themeSelected = chart.data.datasets[point[0].datasetIndex].labels[point[0].index]; // récupère le nom du segment sélectionné
              let color = this.getColor(themeSelected); // récupère la couleur correspondante

              // 2. ... à transmettre au store
              // 2.1 ...si thème sélectionné est nouveau ou est différent du précédent sélectionné
              if(themeSelected != this.selected) {
                // enregistre le nom du theme sélectionné pour l'utiliser dans la fonction updateChart()
                this.selected = themeSelected;

                // filtre la variable filteredData dans le store
                this.$store.dispatch('crossFilter',{type:'theme',value:themeSelected}); // filtrage de tout le jeu de données sur le thème
                this.$store.dispatch('updateThemeColor',color); // thème sélectionné à appliquer à la carte
              }

              // actualise le graphique
              this.updateChart()
            } else {
              // 2.2 .. sinon efface le filtre thème appliqué
              // efface la variable
              this.selected = null;

              this.$store.dispatch('resetTheme');

              // actualise le graphique en remettant les segements et couleurs d'origine
              this.updateChart()
            }
          },
          onHover:(evt,activeElem) => {
            // 3. surligne  l'élément cliqué
            activeElem.length > 0 ? evt.chart.canvas.style.cursor = 'pointer' : evt.chart.canvas.style.cursor = 'default';
          },
          animation: {
            duration:1500
          },
          plugins: {
              legend: {
                  display: true,
                  position:'top',
                  direction:'vertical',
                  //align: "start",  // alignement à gauche
                  labels:{
                    usePointStyle:true,
                    font:{
                      family:'Marianne-Regular',
                      size:fontSize,//défini taille de la police
                    },
            padding: 8, // Ecart entre les labels des thèmes
                  },
                  onClick:(evt,el) => {
                    let themeSelected = el.text;
                    let color = this.getColor(themeSelected); // récupère la couleur correspondante

                    // 2. ... à transmettre au store
                    // 2.1 ...si thème sélectionné est nouveau ou est différent du précédent sélectionné
                    if(themeSelected != this.selected) {
                      // enregistre le nom du theme sélectionné pour l'utiliser dans la fonction updateChart()
                      this.selected = themeSelected;

                      // filtre la variable filteredData dans le store
                      this.$store.dispatch('crossFilter',{type:'theme',value:themeSelected}); // filtrage de tout le jeu de données sur le thème
                      this.$store.dispatch('updateThemeColor',color); // thème sélectionné à appliquer à la carte
                    }

                    // actualise le graphique
                    this.updateChart()
                  },
                  onHover:(evt) => {
                    evt.native.target.style.cursor = 'pointer';
                  },
              },
              title: {
                display:false,
                text:'coucou',
                options: {
                  fullSize:false
                }
              },
              tooltip: {
                position: 'nearest',
                bodyFont:{
                  family:'Marianne-Regular'
                },
                // formattage texte tooltip
                callbacks: {
                  label: tooltip => {
                    // afficher label + montant formaté + pourcentage
                    const total = this.dataset.reduce((a, b) => {
                      return a + b;
                    }, 10);
                    let pct = tooltip.parsed * 100 / total
                    let value;
                    tooltip.parsed >1000000 ? value = (tooltip.parsed/1000000).toLocaleString("fr-FR", {maximumFractionDigits: 2}) + " M" : value = tooltip.parsed.toLocaleString("fr-FR", { maximumFractionDigits: 0})
                    return [`${tooltip.label} :`, `${value} € soit ${pct.toLocaleString("fr-FR", { maximumFractionDigits: 1})} % du montant total`]
                  }
                }
              }
          },
          layout: {
            padding:2.5
          },
          responsive:true,
          maintainAspectRatio:false,
          aspectRatio: 1,
        }
      };

      // initialisation sur la page
      const chart = new Chart(ctx, chartOptions);
      this.chart = chart;
    },
    updateChart() {
      const chartData = this.chart.data;
      // mise à jour des items et des valeurs par items

      // 1. légende
      chartData.labels = this.labels;

      // 2. données
      chartData.datasets[0].data = this.dataset;
      chartData.datasets[0].labels = this.labels;

      // mise à jour des couleurs en fonction des items présents
      chartData.datasets[0].backgroundColor = [];
      const newColors = chartData.datasets[0].backgroundColor

      this.labels.forEach(theme => {
        if(this.selected) {
          if(theme == this.selected) {
            newColors.push(this.getColor(theme))
          } else {
            newColors.push('lightgrey')
          }
        } else {
          newColors.push(this.getColor(theme))
        }
      })

      this.chart.update()
    },
    getColor(theme) {
        let themeCode = theme.substring(0,1)
        switch (themeCode) {
          case "1":
            return this.colors[0]
          case "2":
            return this.colors[1]
          case "3":
            return this.colors[2]
          case "4":
            return this.colors[3]
          case "5":
            return this.colors[4]
          case "6":
            return this.colors[5]
        }
    },
    transformData(data) {
      let actionsCount = _.groupBy(data,'theme')
      actionsCount = _.map(actionsCount,(value,key) => {
        return {
          theme:key,
          count:_.reduce(value, (total, o) => {
                    return total + o.montant
                },0)
        }
      })
      actionsCount = _.sortBy(actionsCount,'theme')
      return actionsCount
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.chart-container {
  display: flex;
  justify-content: center;   /* Centre le canvas horizontalement */
  align-items: center;       /* Centre le canvas verticalement */
  height: flex;             /* Ajuste la hauteur selon ton besoin */
  width: 100%;               /* Le conteneur occupe toute la largeur */
}

canvas {
  width: 100% !important;    /* Le canvas s'adapte à la taille du conteneur */
  height: 100% !important;   /* Le canvas s'adapte à la taille du conteneur */
}
  div {
    width: 80%;
    padding:1px;
  }
</style>