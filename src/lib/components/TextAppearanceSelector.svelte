<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import { TextAppearanceIcon } from '$lib/icons';
    import { globalConfig } from '$lib/data/stores';

    /** Checks if normal is enabled*/
    $: countThemesNormal = $globalConfig.themes.find((x) => x.name === 'Normal').enabled;

    /** Checks if sepia is enabled*/
    $: countThemesSepia = $globalConfig.themes.find((x) => x.name === 'Sepia').enabled;

    /** Checks if dark is enabled*/
    $: countThemesDark = $globalConfig.themes.find((x) => x.name === 'Dark').enabled;

    /**  Gets the count of enabled themes by comparison*/
    function simpleCount() {
        /** If all 3 themes are enabled*/
      if (countThemesNormal && countThemesSepia && countThemesDark){
        return true; 
      }
      /** 2 theme are enabled*/
      /** If Normal and Sepia are enabled*/
      else if (countThemesNormal && countThemesSepia){
        return true; 
      }
      /** If Normal and Dark are enabled*/
      else if (countThemesNormal && countThemesDark){
        return true; 
      }
      /** If Dark and Sepia are enabled*/
      else if (countThemesDark && countThemesSepia){
        return true; 
      } 
      /** If 1 or less themes are enabled*/
      else return false;
    }

    /**  Gets the count of enabled themes by comparison*/
    function countTheme() {
        /** If all 3 themes are enabled*/
      if ($globalConfig.themes.find((x) => x.name === 'Normal').enabled &&
      $globalConfig.themes.find((x) => x.name === 'Sepia').enabled &&
      $globalConfig.themes.find((x) => x.name === 'Dark').enabled
      ){
        return true; 
      }
      /** 2 theme are enabled*/
      /** If Normal and Sepia are enabled*/
      else if ($globalConfig.themes.find((x) => x.name === 'Normal').enabled &&
      $globalConfig.themes.find((x) => x.name === 'Sepia').enabled 
      ){
        return true; 
      }
      /** If Normal and Dark are enabled*/
      else if ($globalConfig.themes.find((x) => x.name === 'Normal').enabled &&
      $globalConfig.themes.find((x) => x.name === 'Dark').enabled 
      ){
        return true; 
      }
      /** If Dark and Sepia are enabled*/
      else if ($globalConfig.themes.find((x) => x.name === 'Dark').enabled &&
      $globalConfig.themes.find((x) => x.name === 'Sepia').enabled 
      ){
        return true; 
      } /** If 1 or less themes are enabled*/
      else return false;
    }

    let showTextAppearence =
        $globalConfig.mainFeatures['text-font-size-slider'] ||
        $globalConfig.mainFeatures['text-line-height-slider'] ||
        /**countTheme();*/ simpleCount();
</script>

<!-- TextAppearanceSelector -->
{#if showTextAppearence}
    <Dropdown>
        <svelte:fragment slot="label">
            <TextAppearanceIcon />
        </svelte:fragment>
        <!-- TODO: implement text appearance options -->
    </Dropdown>
{/if}
