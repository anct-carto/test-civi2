<template>
    <div>
        <label for="select-territoire">
            Territoire
            <span v-if="route=='Contrat de ville'">
                (trouvez votre territoire de rattachement sur <a class="link" href="https://sig.ville.gouv.fr/" target="_blank">SIG Ville</a>)
            </span>
        </label>
        <v-select :options="cvList"
                :get-option-label="e => `${e.libgeo} (${e.codgeo})`" 
                :reduce="e => e.codgeo"
                placeholder="Nom, code ..."
                v-model="selected"
                id="select-territoire"
                class="select-input"/>
    </div>
</template>

<script>
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css';
// https://codepen.io/anon/pen/PgyLXz

export default {
    name:'List',
    props:['filterCodeFromStore'],
    components:{
        'v-select':vSelect,
    },
    data() {
        return {
            selected:null
        }
    },
    computed:{
        cvList() {
            return this.$store.state.cvList
        },
        route() {
            return this.$route.name
        }
    },
    updated() {
         if(this.selected) {
             this.onChange()
         } else {
            this.$store.dispatch('resetCodegeo')
         }
    },
    watch: {
        filterCodeFromStore() {
            this.selected = this.filterCodeFromStore
        }
    },
    methods: {
        onChange() {
            this.$store.state.filterCode = this.selected;
            this.$store.dispatch('crossFilter', {
                type:'codgeo',
                value:this.selected
            })
        }
    }
}
</script>

<style>
    #select-territoire .vs__dropdown-toggle,
    #select-territoire .vs__dropdown-menu {
        background: white;
        border:px solid #e0e0e0;
        border-radius: 8px;
        padding:6px 2px;
        z-index:1001;
    }

    #select-territoire .vs__dropdown-toggle {
        max-height:35px;
    }

    #select-territoire .vs__selected {
        max-height: 15px;
    }
   
    #select-territoire .vs__dropdown-option--highlight {
        background: var(--bleu-second);
    }

    a.link {
        color:var(--rose-gerr) !important;
        text-decoration: none !important;
    }

    a.link:hover {
        color:var(--rose-gerr) !important;
        text-decoration: underline !important;
    }

</style>