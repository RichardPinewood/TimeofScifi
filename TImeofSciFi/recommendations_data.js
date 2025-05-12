let token = localStorage.getItem('token');
let selectedType = '', selectedGenre = '';


const api = {
  async fetch(url, options = {}) {
    const defaultOpts = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };
    const response = await fetch(url, {...defaultOpts, ...options});
    const data = await response.json();
    
    if (response.status === 401 && (data.message === 'jwt expired' || data.message === 'Token is not valid')) {
      await api.refreshToken();
      return this.fetch(url, options);
    }
    
    if (!response.ok) {
      throw new Error(data.message || `Failed: ${response.status}`);
    }
    
    return data;
  },
  
  async refreshToken() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.email) {
      throw new Error('No user data available');
    }
    
    const result = await fetch('http://localhost:5000/auth/refresh-token', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: userData.email })
    }).then(r => r.json());
    
    if (result.token) {
      localStorage.setItem('token', result.token);
      token = result.token;
      return token;
    }
    throw new Error('Failed to refresh token');
  },
  
  getRecommendations() {
    return this.fetch('http://localhost:5000/auth/recommendations');
  },
  
  postRecommendation(data) {
    return this.fetch('http://localhost:5000/auth/recommendations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};


function setupUI() {

  const setupButtons = (selector, variable) => {
    document.querySelectorAll(selector).forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        window[variable] = button.textContent.trim();
        loadRecommendations();
      });
    });
  };
  
  setupButtons('.type-button', 'selectedType');
  setupButtons('.genre-button', 'selectedGenre');
  

  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('keyup', e => e.key === 'Enter' && loadRecommendations());
  }
  

  const postBtn = document.getElementById('postRecommendationBtn');
  if (postBtn) {
    postBtn.addEventListener('click', handleSubmit);
  }
}


function showMessage(container, {text, className, styles = {}}) {
  container.innerHTML = '';
  const msgEl = document.createElement('div');
  msgEl.className = className || 'message';
  msgEl.textContent = text;
  Object.assign(msgEl.style, { padding: '20px', textAlign: 'center', ...styles });
  container.appendChild(msgEl);
}


async function loadRecommendations() {
  const container = document.getElementById('recommendations-list');
  if (!container) return;
  
  showMessage(container, {text: 'Loading recommendations...', className: 'loading-message'});
  
  try {
    let data = await api.getRecommendations();
    

    if (selectedType) {
      data = data.filter(rec => rec.type.toLowerCase() === selectedType.toLowerCase());
    }
    if (selectedGenre) {
      data = data.filter(rec => rec.genre.toLowerCase() === selectedGenre.toLowerCase());
    }
    
    const searchText = document.querySelector('.search-input')?.value.trim().toLowerCase();
    if (searchText) {
      data = data.filter(rec => 
        rec.title.toLowerCase().includes(searchText) || 
        rec.description.toLowerCase().includes(searchText)
      );
    }
    
    displayRecommendations(data, container);
  } catch (error) {
    console.error('Error:', error);
    showMessage(container, {text: 'Error: ' + error.message, className: 'error', styles: {color: 'red'}});
  }
}

function displayRecommendations(recommendations, container) {
  const template = document.getElementById('recommendation-template');
  if (!template) return;
  
  container.innerHTML = '';
  
  if (!recommendations || recommendations.length === 0) {
    showMessage(container, {text: 'No recommendations yet. Be the first to recommend something!', className: 'no-results'});
    return;
  }
  
  recommendations.forEach(rec => {
    try {
      const card = template.content.cloneNode(true);
      
      const cardElement = card.querySelector('.grid-card');
      if (cardElement && rec._id) {
        cardElement.dataset.id = rec._id;
        
        // Make the entire card clickable
        cardElement.style.cursor = 'pointer';
        cardElement.addEventListener('click', function(e) {
          // Only navigate if the user didn't click on the save button
          if (!e.target.closest('.action-button')) {
            window.location.href = `discussion.html?id=${rec._id}`;
          }
        });
      }

      const elements = {
        '.card-title': rec.title || 'No Title',
        '.card-text': rec.description || 'No description available',
        '.card-author': rec.author?.username || 'Anonymous',
        '.recommendation-type': rec.type || 'Unknown',
        '.recommendation-date': new Date(rec.createdAt).toLocaleDateString()
      };
      

      Object.entries(elements).forEach(([selector, value]) => {
        const el = card.querySelector(selector);
        if (el) el.textContent = value;
      });
      

      const tagsContainer = card.querySelector('.recommendation-tags');
      if (tagsContainer) {
        if (rec.tags && rec.tags.length) {
          rec.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tagsContainer.appendChild(tagEl);
          });
        } else {
          tagsContainer.style.display = 'none';
        }
      }
      
      // Add direct event listener to the comments button
      const commentsButton = card.querySelector('.comments-button');
      if (commentsButton && cardElement && rec._id) {
        commentsButton.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation(); // Prevent the card click event from also firing
          
          // Redirect to the discussion page with the recommendation ID as a URL parameter
          window.location.href = `discussion.html?id=${rec._id}`;
        });
      }
      
      container.appendChild(card);
    } catch (err) {
      console.error('Error processing recommendation:', err);
    }
  });
}


async function handleSubmit() {
  if (!token) {
    alert('Please login to post recommendations');
    return;
  }
  
  try {
    const title = document.getElementById('recommendationTitle').value.trim();
    const description = document.getElementById('recommendationSynopsis').value.trim();
    const tags = Array.from(document.querySelectorAll('.tag'))
      .slice(0, 2)
      .map(tag => tag.textContent.trim());
    
    if (!title || !description || !selectedType) {
      throw new Error('Please fill in all required fields');
    }
    
    const formData = { title, description, type: selectedType, tags };
    
    await api.postRecommendation(formData);
    alert('Recommendation posted successfully!');
    window.location.href = 'home.html';
  } catch (error) {
    console.error('Error:', error);
    if (error.message.includes('session') || error.message.includes('login again')) {
      alert('Your session has expired. Please login again.');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    } else {
      alert(error.message || 'Error posting recommendation');
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  
  const hasList = document.getElementById('recommendations-list');
  if (hasList) loadRecommendations();
});
