document.addEventListener('DOMContentLoaded', function() {
  const track = document.querySelector('.genre-list-track');
  const prevButton = document.getElementById('genre-prev'); 
  const nextButton = document.getElementById('genre-next'); 
  const genreButtons = document.querySelectorAll('.genre-list-item');
  
  let currentPosition = 0;
  const buttonsVisible = 4; 
  const totalButtons = genreButtons.length;
  const maxPosition = totalButtons - buttonsVisible;
  
  nextButton.addEventListener('click', function() {
    if (currentPosition < maxPosition) {
      currentPosition++;
      updateTrackPosition();
    }
  });
  
  prevButton.addEventListener('click', function() {
    if (currentPosition > 0) {
      currentPosition--;
      updateTrackPosition();
    }
  });
  
  function updateTrackPosition() {
    const itemHeight = genreButtons[0].offsetHeight + 8;
    
    let transformY = currentPosition * itemHeight;
    
    if (currentPosition === maxPosition) {

      const lastButtonIndex = genreButtons.length - 1;
      const containerElement = document.querySelector('.genre-list');
      

      const bottomPadding = 10;
      

      const lastButtonBottom = genreButtons[lastButtonIndex].offsetTop + genreButtons[lastButtonIndex].offsetHeight + bottomPadding;
      const containerHeight = containerElement.offsetHeight;
      
      transformY = lastButtonBottom - containerHeight;
      

      transformY = Math.max(0, transformY);
    }
    
    track.style.transform = `translateY(-${transformY}px)`;
    
    prevButton.disabled = currentPosition === 0;
    nextButton.disabled = currentPosition >= maxPosition;
  }
  
  genreButtons.forEach(button => {
    button.addEventListener('click', function() {
      genreButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      const selectedGenre = this.dataset.genre;
      console.log('Selected genre:', selectedGenre);
    });
  });
  
  const mediaTypeButtons = document.querySelectorAll('.media-type-btn');
  mediaTypeButtons.forEach(button => {
    button.addEventListener('click', function() {
      mediaTypeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      const selectedMediaType = this.dataset.mediaType;
      console.log('Selected media type:', selectedMediaType);
    });
  });
  
  const filterOffcanvasElement = document.getElementById('filterOffcanvas');
  const sortBtn = document.getElementById('sort-btn');
  const randomBtn = document.getElementById('random-btn');
  const genresBtn = document.getElementById('genres-btn');

  if (!filterOffcanvasElement || !sortBtn || !randomBtn || !genresBtn) {
    console.error('One or more filter UI elements (offcanvas or buttons) not found.');
    return;
  }

  const bootstrapOffcanvasInstance = new bootstrap.Offcanvas(filterOffcanvasElement);
  const allFilterButtons = [sortBtn, randomBtn, genresBtn];

  function setActiveFilterButton(buttonToActivate) {
    allFilterButtons.forEach(btn => {
      if (btn === buttonToActivate) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  filterOffcanvasElement.addEventListener('show.bs.offcanvas', function () {
    allFilterButtons.forEach(btn => btn.classList.remove('active'));
    sortBtn.classList.add('active');
  });

  filterOffcanvasElement.addEventListener('hide.bs.offcanvas', function () {
    if (sortBtn.classList.contains('active')) {
      sortBtn.classList.remove('active');
    }
  });

  randomBtn.addEventListener('click', function () {
    setActiveFilterButton(randomBtn);
    if (filterOffcanvasElement.classList.contains('show')) {
      bootstrapOffcanvasInstance.hide();
    }
  });

  genresBtn.addEventListener('click', function () {
    setActiveFilterButton(genresBtn);
    if (filterOffcanvasElement.classList.contains('show')) {
      bootstrapOffcanvasInstance.hide();
    }
  });

  updateTrackPosition();
});