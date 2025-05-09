  const typeButtons = document.querySelectorAll('.type-button');
  
  typeButtons.forEach(button => {
    button.addEventListener('click', () => {
      typeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

