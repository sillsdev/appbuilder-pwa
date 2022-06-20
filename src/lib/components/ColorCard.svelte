<script lang="ts">
    import CardMenu from './CardMenu.svelte';
    export let reference = '';
    export let text = '';
    export let date = '';
    export let actions = [''];
    export let highlight_color = '1';
</script>

<div class="annotation-item-block">
    <div class="annotation-item-color {'hlp' + highlight_color} annotation-float-left" />
    <!--Menu-->
    <CardMenu on:menuaction {actions} />
    <!--Content-->
    <div class="annotation-item-content-block">
        <div
            class="annotation-item-reference annotation-item-reference-bcC01 annotation-item-reference-bcC01-bkJHN"
        >
            {reference}
        </div>
        <div
            class="annotation-item-text annotation-item-text-bcC01 annotation-item-text-bcC01-bkJHN"
        >
            {text}
        </div>
    </div>
    <!--Date-->
    <div class="annotation-item-date annotation-align-right">{date}</div>
</div>

<!--Notes static HTML-->
<!--<div id="0" class="annotation-item-block">
    <div class="annotation-item-icon annotation-float-left">
        <span><img src="ic_note_24_black.png" alt="text bubble"></span>
    </div>
    <div class="annotation-item-menu annotation-float-right">
        <span onclick="onShowDropdownMenu('0')" class="dropbtn"><img class="dropbtn-image" src="ic_dots_vertical_24_black.png" alt="vertical dots"></span>
        <div id="menu-0" class="dropdown-content">
            <a href="I-0">View</a>
            <a href="E-0">Edit</a>
            <a href="S-0">Share</a>
            <a href="D-0">Delete</a>
        </div>
    </div>
    <div class="annotation-item-content-block">
        <div class="annotation-item-reference annotation-item-reference-bcC01 annotation-item-reference-bcC01-bkJHN">
            John 1:9
        </div>
        <div class="annotation-item-text annotation-item-text-bcC01 annotation-item-text-bcC01-bkJHN">
            He is the light
        </div>
    </div>
    <div class="annotation-item-date annotation-align-right">
        23 May 2022
    </div>
</div>-->

<!--Highlights static HTML-->
<!--<div id="0" class="annotation-item-block">
    <div class="annotation-item-color hlp1 annotation-float-left"></div>
    <div class="annotation-item-menu annotation-float-right">
        <span onclick="onShowDropdownMenu('0')" class="dropbtn"><img class="dropbtn-image" src="ic_dots_vertical_24_black.png" alt="vertical dots"></span>
        <div id="menu-0" class="dropdown-content">
            <a href="I-0">View</a>
            <a href="S-0">Share</a>
            <a href="D-0">Delete</a>
        </div>
    </div>
    <div class="annotation-item-content-block">
        <div class="annotation-item-reference annotation-item-reference-bcC01 annotation-item-reference-bcC01-bkJHN">
            John 1:7
        </div>
        <div class="annotation-item-text annotation-item-text-bcC01 annotation-item-text-bcC01-bkJHN">
            The same came as a witness, that he might testify about the light, that all might believe through him. 
        </div>
    </div>
    <div class="annotation-item-date annotation-align-right">
        24 May 2022
    </div>
</div>-->
