<div class="dy-dropdown">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label tabindex="0" class="dy-btn dy-btn-ghost p-0.5 dy-no-animation">
        <slot name="label" />
    </label>
    <div tabindex="0" class="dy-dropdown-content dy-menu dy-shadow bg-base-100">
        <slot name="content" />
    </div>
</div>
