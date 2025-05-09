function encryptData(data) {
  try {
    return btoa(JSON.stringify(data));
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

function decryptData(encryptedData) {
  try {
    return JSON.parse(atob(encryptedData));
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

function saveUserData(data) {
  try {
    const encryptedUserData = encryptData({
      username: data.username,
      email: data.email
    });
    localStorage.setItem('userData', encryptedUserData);
  } catch (error) {
    console.error('Save user data error:', error);
  }
}

function loadUserData() {
  try {
    const encryptedUserData = localStorage.getItem('userData');
    return encryptedUserData ? decryptData(encryptedUserData) : null;
  } catch (error) {
    console.error('Load user data error:', error);
    return null;
  }
}

const token = localStorage.getItem('token');
console.log('Token:', token);
if (!token) {
  document.getElementById('status').textContent = 'Não tens a sessão iniciada.';
  console.error('No token found in localStorage');
} else {
  console.log('Fetching profile with token:', token); 
  fetch('http://localhost:5000/auth/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token
    }
  })
  .then(response => {
    console.log('Response status:', response.status);
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.message || 'Unauthorized');
      });
    }
    return response.json();
  })
  .then(data => {
      saveUserData(data);
      const loadedData = loadUserData();
      if (loadedData) {
        document.getElementById('status').textContent = '';
        document.getElementById('username').textContent = loadedData.username;
        document.getElementById('email').textContent = loadedData.email;
      } else {
        document.getElementById('status').textContent = 'Erro ao carregar o perfil.';
      }
    })
    .catch(error => {
      document.getElementById('status').textContent = 'Erro ao carregar o perfil.';
      console.error('Erro:', error);
    });
}