<template>
      <div id="sidepanel" class="d-flex flex-column h-100">
        <div class="row">
              <div class="col-12 col-md-3 d-flex flex-column">            
                  <Number :chiffreCle="montantSubventions + montantFonjep + montantAdulteRelais" 
                          :texte="'Montant engagé (€)'"
                          />
                  <Number :chiffreCle="Math.round(montantSubventions)" 
                          :about="`Montant financé sous forme de subvention par le programme 147 - politique de la ville`"
                          :texte="`dont subventions`"
                          />
                  <Number :chiffreCle="montantFonjep" 
                          :about="`Les aides aux postes Fonjep sont matérialisées par les effectifs présents au 31/12/N enregistrés à date avec les coûts (théoriques) associés.`"
                          :texte="'dont Fonjep'"
                          />
                  <Number :chiffreCle="montantAdulteRelais" 
                          :about="'Les aides versées dans le cadre du dispositif adultes relais correspondent au nombre de postes théoriques au 31/12/N (postes vacants liés au recrutement et postes non occupés compris) associés au montant forfaitaire annuel de chaque poste.'"
                          :texte="'dont Adulte-relais'"
                          />
                  <Number :chiffreCle="nbActions" 
                          :texte="`Actions financées`"
                          :color="color.bleuGrandeEquipe"
                          />
                  <Number :chiffreCle="nbStructures" 
                          :texte="'Porteurs de projets'"
                          :color="color.bleuGrandeEquipe"
                          />
                
                  <Number :chiffreCle="nbFonjep" 
                          :texte="'Postes Fonjep'"
                          :color="color.bleuGrandeEquipe"
                          />
                  <Number :chiffreCle="nbAdulteRelais" 
                          :texte="'Postes Adulte-relais'"
                          :color="color.bleuGrandeEquipe"
                          />
                  <Number :chiffreCle="population" 
                          :texte="'Habitants en QPV'"
                          :color="color.bleuGrandeEquipe"
                          />
              </div>
            <div class="col-12 col-sm-9 d-flex flex-column h-100" id="charts">
                <Card :title="`Répartition subventions par thème de contrat de ville`" 
                      :about='"Sélectionnez un thème pour filtrer les chiffres clés, la carte et la répartition dans les sous-thèmes correspondants"'>
                  <ThemeChart/>
                </Card>
                <Card :title="`Répartition subventions par sous-thème`"
                      :about="`Survolez chaque barre pour connaître le sous-thème correspondant et la valeur exacte de son montant.`">
                  <SubThemeChart v-if="filterTheme"/>
                  <span class="msg-else" v-else>Sélectionnez un pilier pour voir à la répartition par sous-thème</span>
                </Card>
          </div>
        </div>
      </div>
</template>


<script>

import ThemeChart from "@/components/ThemeChart.vue";
import SubThemeChart from "@/components/SubThemeChart.vue";
import Number from "@/components/Number.vue";
import Card from "@/components/CardComponent.vue";
import {mapGetters} from 'vuex'
import {mapState} from 'vuex'

export default {
  name: 'SidePanel',
  components: {
    ThemeChart,
    SubThemeChart,
    Number,
    Card,
  },
  computed: {
      ...mapGetters(['nbActions','nbStructures','montantSubventions','montantFonjep','montantAdulteRelais','nbFonjep','nbAdulteRelais','population']),
      ...mapState(['filteredData','filterCode','filterTheme']),
  },
  data() {
        return {
                color:{
                        roseGrandeEquipe:"#d24b6b",
                        bleuGrandeEquipe:'#5770be',
        
                }
        }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.msg-else {
        font-style: italic;
        display: flex;
        justify-content: center;
        vertical-align: middle;
        text-align: center;
        width: 100%;
}

#charts {
        height:calc(100vh - 105px) !important;
}

</style>
