import { createStore } from 'vuex'
import _ from 'underscore'

export default createStore({
  state: {
    annee:null,
    // ici ajouter au tableau l'année pour lire les nouveaux fichiers
    listAnnees:["2024", "2020-2023"], 
    echelle:null,
    filterCode:null,
    filterTheme:null,
    themeColor:'gray',
    dataFonjep:null,
    dataAdulteRelais:null,
  },
  getters: {
    montantSubventions(state) {
      return state.filteredData ? state.filteredData.map(e => e.montant).reduce((a,b) => a + b,0) : 0 
    },
    montantFonjep(state) {
      return state.filteredDataFonjep ? state.filteredDataFonjep.map(e => e.montant).reduce((a,b) => a + b,0) : 0 
    },
    montantAdulteRelais(state) {
      return state.filteredDataAdulteRelais ? state.filteredDataAdulteRelais.map(e => e.montant).reduce((a,b) => a + b,0) : 0 
    },
    nbActions(state) {
      return state.filteredData ? state.filteredData.length : 0
    },
    nbFonjep(state) {
      return state.filteredDataFonjep ? state.filteredDataFonjep.length : 0
    },
    nbAdulteRelais(state) {
      return state.filteredDataAdulteRelais ? state.filteredDataAdulteRelais.length : 0
    },
    nbStructures(state) {
      if(state.filteredData) {
        let nbStructures = _.chain(state.filteredData)
        .groupBy('code_tiers')
        .size()
        ._wrapped
        return nbStructures
      } else {
        return 0
      }
    },
    population(state) {
      return !state.filterCode ? 5400000: state.cvList.filter(e => e.codgeo == state.filterCode)[0].pop
    }
  },
  mutations: {
    CHANGE_ECHELLE(state,echelle) {
      for(let i = 0;i<state.data.length;i++) {
        // label thème
        let theme = state.data[i].theme 
        switch (theme) {
          case "1":
            theme = "1 - Éducation"
            break;
          case "2":
            theme = "2 - Accès aux droits"
            break;
          case "3":
            theme = "3 - Cadre de vie, sociabilité et transitions"
            break;
          case "4":
            theme = "4 - Jeunesse, accès à la culture, aux sports et aux loisirs"
            break;
          case "5":
            theme = "5 - Emploi et développement économique"
            break;
          case "6":
            theme = "6 - Soutien aux acteurs de la politique de la ville"
            break;
        }
        state.data[i].theme = theme;

        // label sous thème
        let sous_theme = state.data[i].sous_theme 
        switch (sous_theme) {
          case "1.1":
            sous_theme = "1.1 - Programme de réussite éducative (PRE)"
            break;
          case "1.2":
            sous_theme = "1.2 - Soutien à la scolarité"
            break;
          case "1.3":
            sous_theme =  "1.3 -Cités éducatives"
            break;
          case "1.4":
            sous_theme =  "1.4 - Persévérance scolaire et accès à des études supérieures"
            break;
          case "2.1":
            sous_theme =  "2.1 - Santé"
            break;
          case "2.2":
            sous_theme =  "2.2 - Soutien à la parentalité"
            break;
          case "2.3":
            sous_theme =  "2.3 - Citoyenneté"
            break;
          case "2.4":
            sous_theme =  "2.4 - Prévention et lutte contre les discriminations liées à l'origine et à l'adresse"
            break;
          case "3.1":
            sous_theme =  "3.1 - Cadre de vie" 
            break;
          case "3.2":
            sous_theme =  "3.2 - Tranquillité et sûreté publique"
            break;
          case "3.3":
            sous_theme =  "3.3 - Médiation sociale"
            break;
          case "3.4":
            sous_theme =  "3.4 - Transitions"
            break;
          case "4.1":
            sous_theme =  "4.1 - Jeunesse"
            break;
          case "4.2":
            sous_theme =  "4.2 - Culture et expression artistique"
            break;
          case "4.3":
            sous_theme =  "4.3 - Sports"
            break;
          case "4.4":
            sous_theme =  "4.4 - Vacances et loisirs"
            break;
          case "5.1":
            sous_theme = "5.1 - Emploi"
            break;
          case "5.2":
            sous_theme = "5.2 - Cités de l'emploi"
            break;
          case "5.3":
            sous_theme =  "5.3 - Engagement des entreprises et PAQTE"
            break;
          case "5.4":
            sous_theme =  "5.4 - Attractivité et développement économique"
            break;
          case "5.5":
            sous_theme =  "5.5 - Entrepreneuriat Quartiers 2030"
            break;
          case "6.1":
            sous_theme =  "6.1 - Soutien à l'initiative associative"
            break;
          case "6.2":
            sous_theme =  "6.2 - Participation des habitants"
            break;
          case "63":
            sous_theme =  "63 - Pilotage, ingénierie, ressources et évaluations"
            break;
          case "6.4":
            sous_theme =  "6.4 - Structures mutualisatrices" 
            break;
          }
          state.data[i].sous_theme = sous_theme;
      }

      state.echelle = echelle
      switch (echelle) {
        case "National":
          state.data = state.data.filter(e => e.echelle == "nat")
          break;
        case "Région":
          state.data = state.data.filter(e => e.echelle != "nat") // 1. Filtrage sur les échelles concernées par l'option choisie
          state.data.forEach(e => e.codgeo = e.insee_reg) // 2. assignation du code géographique correspond : reg, dep ou cdv 
          state.dataFonjep.forEach(e => e.codgeo = e.insee_reg) // 2. assignation du code géographique correspond : reg, dep ou cdv 
          state.dataAdulteRelais.forEach(e => e.codgeo = e.insee_reg) // 2. assignation du code géographique correspond : reg, dep ou cdv 
          break;
        case "Département":
          state.data = state.data.filter(e => e.echelle == "dep" || e.echelle == "cdv")
          state.data.forEach(e => e.codgeo = e.insee_dep)
          state.dataFonjep.forEach(e => e.codgeo = e.insee_dep)
          state.dataAdulteRelais.forEach(e => e.codgeo = e.insee_dep)
          break;
        case "Contrat de ville":
          state.data = state.data.filter(e => e.echelle == "cdv")
          state.data.forEach(e => e.codgeo = e.code_cv)
          state.dataFonjep.forEach(e => e.codgeo = e.code_cv)
          state.dataAdulteRelais.forEach(e => e.codgeo = e.code_cv)
          break;
      }
      state.filteredData = state.data
    },
    UPDATE_COLOR(state,color) {
      state.themeColor = color
    },
    CROSS_FILTER(state,filterParams) {
      // 1. récupère les valeurs de filtres (même si elles sont vides)
      const filterName = filterParams.type;
      const value = filterParams.value;
      switch (filterName) {
        case "theme":
          state.filterTheme = value
          break;
        case "codgeo":
          state.filterCode = value
          break;
      }
      // 2. créé une liste des filtres avec leurs valeurs
      let filters = {theme:state.filterTheme,codgeo:state.filterCode}
      // dans cette liste, supprime les filtres dont la valeur est null
      Object.keys(filters).forEach(e => {
        if(filters[e] === null) {
          delete filters[e]
        }
      })
      // 3. donne moi le nom des filtres obtenus dans une liste / array []
      const selectedFilterKeys = Object.keys(filters)

      // 4. si la liste des filtres est vide ...
      if(state.filterTheme == null && state.filterCode == null) {
        // 4.1 ... renvoie les données par défaut
        state.filteredData = state.data
        state.filteredDataFonjep = state.dataFonjep
        state.filteredDataAdulteRelais = state.dataAdulteRelais
      } else {
        // 4.2 ... sinon filtre le tableau sur la base de la liste des filtres non vides
        state.filteredData = state.data.filter(e => selectedFilterKeys.every(key => 
            filters[key] === e[key] 
        ))
        // filtrage fonjep par code géo et par territoire présents sur la carte
        // !!! attention : cette fonctionnalité est désactivée
        // let codgeoMatchingTheme = [];
        // for(let i=0; i<state.filteredData.length; i++) {
        //   const codgeoAction = state.filteredData[i].codgeo;
        //   codgeoMatchingTheme.push(codgeoAction)
        // }
        // state.filteredDataFonjep = state.dataFonjep.filter(e => codgeoMatchingTheme.includes(e.codgeo))
        if(state.filterCode != null) {
          state.filteredDataFonjep = state.dataFonjep.filter(e => e.codgeo == state.filterCode)
          state.filteredDataAdulteRelais = state.dataAdulteRelais.filter(e => e.codgeo == state.filterCode)
        }
      }
    },
    async CHANGE_ANNEE(state, annee) {
      if (annee === "2020-2023") {
        // Redirection vers le Ci.ville 2020-2023 - ouverture dans un nouvel onglet : 
        window.open("https://carto.pages.gitlab.donnees.incubateur.anct.gouv.fr/vie-associative/#/panorama/contrat-de-ville", "_blank");
      } else {
        // Si une autre année est sélectionnée, charger les fichiers JSON comme avant
        state.annee = annee;
        try {
          state.data = require(`@/assets/subventions-${state.annee}.json`);
          state.dataFonjep = require(`@/assets/postes-fonjep-${state.annee}.json`);
          state.dataAdulteRelais = require(`@/assets/adulte-relais-${state.annee}.json`);
        } catch (error) {
          console.error("Erreur lors du chargement des fichiers pour l'année sélectionnée :", error);
        }
      }
    },
  },
  actions: {
    crossFilter({commit},filterParams) {
      commit('CROSS_FILTER',filterParams)
    },
    updateThemeColor({commit},color) {
      commit('UPDATE_COLOR',color)
    },
    resetTheme({commit}) {
      commit('UPDATE_COLOR','gray')
      commit('CROSS_FILTER',{type:"theme",value:null})
    },
    resetCodegeo({commit}) {
      commit('CROSS_FILTER',{type:"codgeo",value:null})
    },
    changeEchelle({commit,state},echelle) {
      let selectedAnnee;
      // pour garder en cache la dernière année sélectionnée : 
      // s'il y a une valeur garde cette valeur sinon par défaut mets la première année du tableau
      state.annee ? selectedAnnee = state.annee : selectedAnnee = state.listAnnees[0];
      commit('CHANGE_ANNEE',selectedAnnee);
      commit('CHANGE_ECHELLE',echelle);
    },
    changeAnnee({commit,state},annee) {
      commit('CHANGE_ANNEE',annee);
      commit('CHANGE_ECHELLE',state.echelle)
      commit('CROSS_FILTER',{type:"theme",value:state.filterTheme})
      commit('CROSS_FILTER',{type:"codgeo",value:state.filterCode})
    },
  },
})