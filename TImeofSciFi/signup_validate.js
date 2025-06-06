
const form = document.getElementById('signupForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');


function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  
  return errors;
}


function sanitizeInput(input) {

  return input.replace(/[&<>"']/g, (match) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match];
  });
}


form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  

  if (password !== confirmPassword) {
    alert('As senhas não correspondem');
    return;
  }

  const passwordErrors = validatePassword(password);
  const passwordErrorContainer = document.getElementById('password-errors');
  
  passwordErrorContainer.innerHTML = '';
  passwordErrorContainer.style.display = 'none';

  if (passwordErrors.length > 0) {
    passwordErrorContainer.innerHTML = passwordErrors.map(err => `<p>${err}</p>`).join('');
    passwordErrorContainer.style.display = 'block';
    return;
  }

  const sanitizedUsername = sanitizeInput(username);
  const sanitizedEmail = sanitizeInput(email);

  if (!sanitizedUsername || !sanitizedEmail || !password) {
    alert('Por favor preenche os campos em branco');
    return;
  }

  const data = { 
    username: sanitizedUsername, 
    email: sanitizedEmail, 
    password: password 
  };

  try {

    console.log('Attempting to register user:', { username: sanitizedUsername, email: sanitizedEmail });
    
    const response = await fetch('http://localhost:5000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });


    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.error('Received non-JSON response:', text);
      result = { message: 'Servidor retornou um formato inválido' };
    }

    if (response.ok && result.token) {
      alert('Registro feito com sucesso!');

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify({
        username: sanitizedUsername,
        email: sanitizedEmail
      }));

      window.location.href = 'home.html';
    } else {
      alert(result.message || 'Falha no registro. Por favor, tente novamente.');
    }
  } catch (error) {
    alert('Ups, aconteceu alguma coisa, tenta outra vez.');
    console.error('Registration error:', error);
  }
});


const passwordStrengthIndicator = document.createElement('div');
passwordStrengthIndicator.className = 'password-strength';
passwordStrengthIndicator.style.display = 'none';
passwordStrengthIndicator.style.marginTop = '5px';
passwordStrengthIndicator.style.fontSize = '12px';
passwordStrengthIndicator.style.color = '#fff';


passwordInput.parentNode.appendChild(passwordStrengthIndicator);


passwordInput.addEventListener('input', function() {
  const password = this.value.trim();
  const errors = validatePassword(password);
  
  if (password.length > 0) {
    passwordStrengthIndicator.style.display = 'block';
    
    if (errors.length === 0) {
      passwordStrengthIndicator.textContent = 'Senha forte';
      passwordStrengthIndicator.style.color = '#4CAF50';
    } else {
      passwordStrengthIndicator.textContent = 'Senha fraca - ' + errors[0];
      passwordStrengthIndicator.style.color = '#FF9800';
    }
  } else {
    passwordStrengthIndicator.style.display = 'none';
  }
});


confirmPasswordInput.addEventListener('input', function() {
  const password = passwordInput.value.trim();
  const confirmPassword = this.value.trim();
  
  if (confirmPassword.length > 0) {
    if (password === confirmPassword) {
      this.style.borderColor = '#4CAF50';
    } else {
      this.style.borderColor = '#F44336';
    }
  } else {
    this.style.borderColor = '';
  }
});
