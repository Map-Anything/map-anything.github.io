// Initialize the selection panel images
$('#comparisonSelectionPanel .selectable-image').each((i, img) => {
    img.src = `static/comparison/${img.getAttribute('name')}_src.jpg`;
})

const comparisonSelectionPanel = document.getElementById('comparisonSelectionPanel');
const comparisonImage = document.getElementById('comparisonImage');

comparisonSelectionPanel.addEventListener('click', async function(event) {
    const img = event.target.closest('.selectable-image');

    if (!img || img.classList.contains('selected'))
        return;

    comparisonSelectionPanel.querySelectorAll('.selectable-image').forEach(function(image) {
        image.classList.remove('selected');
    });
    img.classList.add('selected');

    const name = img.getAttribute('name');

    comparisonImage.src = `static/comparison/${name}.png`;
});


window.addEventListener("DOMContentLoaded", () => {
    const selected = comparisonSelectionPanel.querySelector('.selectable-image.selected');
    if (selected) {
        const name = selected.getAttribute('name');
        comparisonImage.src = `static/comparison/${name}.png`;
    }
});
