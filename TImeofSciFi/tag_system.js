const tagsInputContainer = document.getElementById('tagsInput');
const tagInput = document.getElementById('tagInput');
let tags = [];

// Custom tags are now enabled - no predefined list needed


tagInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && tagInput.value.trim() !== '') {
    event.preventDefault();
    const tagText = tagInput.value.trim();

    if (tags.length >= 2) {
      alert('You can only add up to 2 tags.');
      tagInput.value = '';
      return;
    }

    // Allow any custom tag (no validation against allowedTags)
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

// Simple tag input without suggestions
const recommendationTagInput = document.getElementById('tagInput');

// No suggestions or dropdown functionality

function renderTags() {
  // Clear all tags (except input)
  tagsInputContainer.querySelectorAll('.tag').forEach(tagEl => tagEl.remove());
  tags.forEach(tag => createTagElement(tag));
}
