const tagsInputContainer = document.getElementById('tagsInput');
const tagInput = document.getElementById('tagInput');
let tags = [];


tagInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && tagInput.value.trim() !== '') {
    event.preventDefault();
    const tagText = tagInput.value.trim();

    if (tags.length >= 2) {
      alert('You can only add up to 2 tags.');
      tagInput.value = '';
      return;
    }

    if (!tags.includes(tagText)) {
      tags.push(tagText);
      createTagElement(tagText);
    }
    tagInput.value = ''; 
  }
});

function createTagElement(text) {
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.innerHTML = `${text} <i class="bi bi-x-circle" onclick="removeTag('${text}')"></i>`;
  tagsInputContainer.insertBefore(tag, tagInput);
}

function removeTag(tagText) {
  tags = tags.filter(tag => tag !== tagText);
  renderTags();
}


const recommendationTagInput = document.getElementById('tagInput');

function renderTags() {

  tagsInputContainer.querySelectorAll('.tag').forEach(tagEl => tagEl.remove());
  tags.forEach(tag => createTagElement(tag));
}
