document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (!form || !emailInput || !passwordInput) {
    console.error('Erro: Elementos do formulário não encontrados no DOM.');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('Por favor, preencha os campos em branco.');
      return;
    }

    const data = { email, password };

    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.token) {
        alert('Login feito com sucesso!');
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        window.location.href = 'home.html';
      } else {
        alert(result.message || 'Erro no sistema. Verifique os dados e tente novamente.');
      }
    } catch (error) {
      alert('Um erro ocorreu, tente novamente mais tarde.');
      console.error('Erro ao fazer login:', error);
    }
  });
});
