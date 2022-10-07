<!--
  @component
  Share App pop up window.
-->
<script>
    import { BibleIcon } from '$lib/icons';
    import { globalConfig } from '$lib/data/stores';
    const openModal = () => {
        document.activeElement.blur();
    };
    let modalId = 'my-modal';
</script>

<!-- modal content -->
<input type="checkbox" id={modalId} class="modal-toggle" />
<div class="modal">
    <div class="modal-box">
        <p>
            Enim dolorem dolorum omnis atque necessitatibus. Consequatur aut adipisci qui iusto illo
            eaque. Consequatur repudiandae et. Nulla ea quasi eligendi. Saepe velit autem minima.
        </p>
        <div class="modal-action">
            <label for={modalId} class="btn">Close</label>
        </div>
    </div>
</div>
