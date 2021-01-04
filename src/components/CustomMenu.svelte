<script>
  import Menu from './Menu.svelte';
  import MenuOption from './MenuOption.svelte';
  import MenuDivider from './MenuDivider.svelte';

    export let exportFunction
  let pos = { x: 0, y: 0 };
  let showMenu = false;

  async function onRightClick(e) {
    if (showMenu) {
      showMenu = false;
      await new Promise(res => setTimeout(res, 100));
    }

    pos = { x: e.clientX, y: e.clientY };
    showMenu = true;
  }

  function closeMenu() {
    showMenu = false;
  }
</script>

{#if showMenu}
  <Menu {...pos} on:click={closeMenu} on:clickoutside={closeMenu}>
    <MenuOption
      on:click={exportFunction}
      text="Custom export" />
            <MenuDivider />
    <MenuOption
      isDisabled={true}
      on:click={console.log}
      text="Gain £1,000,000" />
            <MenuOption
      isDisabled={true}
      on:click={console.log}
      text="Find true happiness" />
  </Menu>
{/if}

<svelte:body on:contextmenu|preventDefault={onRightClick} />
