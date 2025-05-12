// Find logout button - could be either 'logout' or 'logout-btn' depending on the page
const logoutBtn = document.getElementById('logout') || document.getElementById('logout-btn');

// Only add event listener if the element exists
if (logoutBtn) {
  logoutBtn.addEventListener('click', e => {
    e.preventDefault();
    const confirmLogout = confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      // Clear localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      alert('Logging out… see you soon!');
      window.location.href = 'index.html';
    }
  });
}