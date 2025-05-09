let selectedType = '';
let token = localStorage.getItem('token');

function refreshTokenIfNeeded() {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (userData && userData.email) {
    return fetch('http://localhost:5000/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: userData.email })
    })
    .then(response => response.json())
    .then(result => {
      if (result.token) {
        localStorage.setItem('token', result.token);
        token = result.token;
        console.log('Token refreshed successfully');
        return true;
      }
      return false;
    })
    .catch(error => {
      console.error('Error refreshing token:', error);
      return false;
    });
  }
  return Promise.resolve(false);
}

document.querySelectorAll('.type-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.type-button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    selectedType = button.textContent.trim();
    fetchRecommendations();
  });
});

let selectedGenre = '';
document.querySelectorAll('.genre-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.genre-button').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    selectedGenre = button.textContent.trim();
    fetchRecommendations();
  });
});

const searchInput = document.querySelector('.search-input');
if (searchInput) {
  searchInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      fetchRecommendations();
    }
  });
}


if (document.getElementById('recommendations-list')) {
  const recommendationsList = document.getElementById('recommendations-list');
  const template = document.getElementById('recommendation-template');
  
  console.log('Found recommendations-list:', recommendationsList);
  console.log('Found template:', template);

  
  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'loading-message';
  loadingMsg.textContent = 'Loading recommendations...';
  recommendationsList.appendChild(loadingMsg);

  console.log('Loading recommendations...');
  
  function fetchRecommendations() {
    return fetch('http://localhost:5000/auth/recommendations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    })
    .then(response => {
      console.log('Response status:', response.status);
      if (response.status === 401) {
        return response.json().then(data => {
          if (data.message === 'jwt expired' || data.message === 'Token is not valid') {
            console.log('Token expired, attempting to refresh...');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!userData || !userData.email) {
              throw new Error('Please login again');
            }
        
            return fetch('http://localhost:5000/auth/refresh-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: userData.email })
            })
            .then(refreshResponse => refreshResponse.json())
            .then(refreshData => {
              if (refreshData.token) {
                localStorage.setItem('token', refreshData.token);
                token = refreshData.token;
                console.log('Token refreshed, retrying fetch...');
                return fetchRecommendations(); // Retry with new token
              } else {
                throw new Error('Session expired');
              }
            });
          } else {
            throw new Error('Failed to load recommendations: ' + response.status);
          }
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to load recommendations: ' + response.status);
      }
      
      return response.json();
    })
    .then(data => {
      console.log('Processing recommendations with filters');
      let recommendations = data;

      if (selectedType) {
        recommendations = recommendations.filter(rec => 
          rec.type.toLowerCase() === selectedType.toLowerCase());
      }
      
  
      if (selectedGenre) {
        recommendations = recommendations.filter(rec => 
          rec.genre.toLowerCase() === selectedGenre.toLowerCase());
      }
      
      const searchText = document.querySelector('.search-input')?.value.trim().toLowerCase();
      if (searchText) {
        recommendations = recommendations.filter(rec => 
          rec.title.toLowerCase().includes(searchText) || 
          rec.description.toLowerCase().includes(searchText));
      }
      
      return recommendations;
    });
  }
  
  
fetchRecommendations()
  .then(recommendations => {
    console.log('Recommendations loaded:', recommendations);
    
    while (recommendationsList.firstChild) {
      recommendationsList.removeChild(recommendationsList.firstChild);
    }
    
    if (!recommendations || recommendations.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = 'No recommendations yet. Be the first to recommend something!';
      noResults.style.padding = '20px';
      noResults.style.textAlign = 'center';
      recommendationsList.appendChild(noResults);
      return;
    }
    
    recommendations.forEach((rec, index) => {
      console.log(`Processing recommendation ${index}:`, rec);
      const card = template.content.cloneNode(true);
      
      try {

        const cardTitle = card.querySelector('.card-title');
        if (cardTitle) {
          cardTitle.textContent = rec.title || 'No Title';
        } else {
          console.warn('Card title element not found in template');
        }
        
        const cardText = card.querySelector('.card-text');
        if (cardText) {
          cardText.textContent = rec.description || 'No description available';
        } else {
          console.warn('Card text element not found in template');
        }
        
        const cardAuthor = card.querySelector('.card-author');
        if (cardAuthor) {
          cardAuthor.textContent = rec.author?.username || 'Anonymous';
        } else {
          console.warn('Card author element not found in template');
        }
        
        const recType = card.querySelector('.recommendation-type');
        if (recType) {
          recType.textContent = rec.type || 'Unknown';
        } else {
          console.warn('Recommendation type element not found in template');
        }
        

        const tagsContainer = card.querySelector('.recommendation-tags');
        if (tagsContainer && rec.tags && rec.tags.length > 0) {
          rec.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tagsContainer.appendChild(tagEl);
          });
        } else if (tagsContainer) {

          tagsContainer.style.display = 'none';
        } else {
          console.warn('Tags container not found in template');
        }


        const date = new Date(rec.createdAt);
        const dateEl = card.querySelector('.recommendation-date');
        if (dateEl) {
          dateEl.textContent = date.toLocaleDateString();
        } else {
          console.warn('Date element not found in template');
        }

        recommendationsList.appendChild(card);
        console.log(`Added recommendation ${index} to the list`);
      } catch (err) {
        console.error('Error processing recommendation:', err);
      }
    });
  })
  .catch(error => {
    console.error('Error loading recommendations:', error);

    while (recommendationsList.firstChild) {
      recommendationsList.removeChild(recommendationsList.firstChild);
    }
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error';
    errorMsg.textContent = 'Error loading recommendations: ' + error.message;
    errorMsg.style.padding = '20px';
    errorMsg.style.color = 'red';
    errorMsg.style.textAlign = 'center';
    recommendationsList.appendChild(errorMsg);
  });
}


const postBtn = document.getElementById('postRecommendationBtn');
if (postBtn) {
  postBtn.addEventListener('click', () => {
    if (!token) {
      alert('Please login to post recommendations');
      return;
    }

    const title = document.getElementById('recommendationTitle').value.trim();
    const description = document.getElementById('recommendationSynopsis').value.trim();
    
    
    let tags = [];
    const tagElements = document.querySelectorAll('.tag');
    if (tagElements.length > 0) {
      
      tags = Array.from(tagElements).slice(0, 2).map(tag => {
        return tag.textContent.trim();
      });
    }
    
    if (!title || !description || !selectedType) {
      alert('Please fill in all required fields');
      return;
    }
    
    
    if (tags.length > 2) {
      alert('You can only have a maximum of 2 tags');
      return;
    }

    
    const formattedData = { 
      title, 
      description, 
      type: selectedType,
      tags: tags.slice(0, 2) 
    };
    
    
    console.log('Tags being submitted:', formattedData.tags);
    console.log('Submitting recommendation:', formattedData);
    
    function submitRecommendation() {
      console.log('Using token:', token);
      
      return fetch('http://localhost:5000/auth/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(formattedData)
      })
      .then(response => {
        console.log('Response status:', response.status);
        return response.json().then(data => {
          if (response.status === 401 && (data.message === 'jwt expired' || data.message === 'Token is not valid')) {
            console.log('Token expired, attempting to refresh...');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!userData || !userData.email) {
              throw new Error('Please login again');
            }
          
            return fetch('http://localhost:5000/auth/refresh-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: userData.email })
            })
            .then(refreshResponse => refreshResponse.json())
            .then(refreshData => {
              if (refreshData.token) {
                localStorage.setItem('token', refreshData.token);
                token = refreshData.token;
                console.log('Token refreshed, retrying submission...');
                return submitRecommendation();
              } else {
                throw new Error('Session expired. Please login again.');
              }
            });
          }
          
          if (!response.ok) {
            console.error(data);
            throw new Error(data.message || 'Error posting recommendation');
          }
          return data;
        });
      });
    }
    
    submitRecommendation()
    .then(data => {
      console.log('Success:', data);
      alert('Recommendation posted successfully!');
      window.location.href = 'home.html';
    })
    .catch(error => {
      console.error('Error posting recommendation:', error);
      if (error.message === 'Please login again' || error.message === 'Session expired. Please login again.') {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
      } else {
        alert(error.message || 'Error posting recommendation');
      }
    });
  });
}
