document.getElementById('logout').addEventListener('click', e => {
  e.preventDefault();
  const confirmLogout = confirm('Are you sure you want to log out?');
  if (confirmLogout) {
    alert('Logging out… see you soon!');
    window.location.href = 'index.html';
  }
});