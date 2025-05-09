// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Direct DOM manipulation for the navbar and brand
    const navbarLinks = document.querySelectorAll('.nav-link');
    const brand = document.querySelector('.brand');
    
    // Add active class to the current page link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navbarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
            link.style.color = '#FFD166 !important';
            link.style.fontWeight = '600';
        }
    });
    
    // Add hover effect to brand with direct DOM manipulation
    if (brand) {
        brand.addEventListener('mouseenter', function() {
            this.style.color = '#ffde79';
            this.style.textShadow = '0 0 15px rgba(255, 209, 102, 0.9)';
            this.style.transform = 'translateY(-2px)';
        });
        
        brand.addEventListener('mouseleave', function() {
            this.style.color = '#FFD166';
            this.style.textShadow = '0 0 10px rgba(255, 209, 102, 0.7)';
            this.style.transform = 'translateY(0)';
        });
    }
    
    // Add filter buttons to the navbar if needed
    function addFilterButtons() {
        const navbar = document.querySelector('.navbar-nav');
        if (!navbar) return;
        
        // Create filter button container
        const filterContainer = document.createElement('div');
        filterContainer.className = 'd-flex ms-lg-4';
        
        // Create filter buttons with icons
        const filterBtn = createButton('filterBtn', 'bi-brush', 'Filtering');
        const randomBtn = createButton('randomBtn', 'bi-shuffle', 'Random');
        const allBtn = createButton('allBtn', 'bi-compass', 'All');
        
        // Set 'All' as active by default
        allBtn.classList.add('active');
        
        // Add buttons to container
        filterContainer.appendChild(filterBtn);
        filterContainer.appendChild(randomBtn);
        filterContainer.appendChild(allBtn);
        
        // Add container to navbar
        const navbarCollapse = document.querySelector('.navbar-collapse');
        navbarCollapse.appendChild(filterContainer);
        
        // Add event listeners to filter buttons
        setupFilterButtonListeners(filterBtn, randomBtn, allBtn);
    }
    
    // Helper function to create a button
    function createButton(id, iconClass, text) {
        const button = document.createElement('button');
        button.id = id;
        button.className = 'btn me-2';
        button.style.border = '2px solid #FFD166';
        button.style.backgroundColor = 'transparent';
        button.style.color = 'white';
        button.style.borderRadius = '8px';
        button.style.padding = '0.4rem 0.8rem';
        button.style.fontFamily = "'Orbitron', sans-serif";
        button.style.fontSize = '0.9rem';
        button.style.transition = 'all 0.3s ease';
        
        const icon = document.createElement('i');
        icon.className = `bi ${iconClass} me-1`;
        button.appendChild(icon);
        
        const span = document.createElement('span');
        span.textContent = text;
        button.appendChild(span);
        
        // Add hover event listeners
        button.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 15px rgba(255, 209, 102, 0.5)';
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.boxShadow = 'none';
                this.style.transform = 'translateY(0)';
            }
        });
        
        return button;
    }
    
    // Setup event listeners for filter buttons
    function setupFilterButtonListeners(filterBtn, randomBtn, allBtn) {
        // Filter button click
        filterBtn.addEventListener('click', function() {
            toggleButtonActive(this);
            randomBtn.classList.remove('active');
            setButtonInactive(randomBtn);
            allBtn.classList.remove('active');
            setButtonInactive(allBtn);
            
            if (this.classList.contains('active')) {
                // Here you would implement the filtering functionality
                console.log('Filter button active');
                // For example, you could show a filter modal or sidebar
                // showFilterOptions();
            }
        });
        
        // Random button click
        randomBtn.addEventListener('click', function() {
            toggleButtonActive(this);
            filterBtn.classList.remove('active');
            setButtonInactive(filterBtn);
            allBtn.classList.remove('active');
            setButtonInactive(allBtn);
            
            if (this.classList.contains('active')) {
                // Here you would implement the random functionality
                console.log('Random button active');
                // For example, you could fetch random recommendations
                // fetchRandomRecommendations();
            }
        });
        
        // All button click
        allBtn.addEventListener('click', function() {
            toggleButtonActive(this);
            filterBtn.classList.remove('active');
            setButtonInactive(filterBtn);
            randomBtn.classList.remove('active');
            setButtonInactive(randomBtn);
            
            if (this.classList.contains('active')) {
                // Here you would show all recommendations
                console.log('All button active');
                // For example, you could fetch all recommendations
                // fetchAllRecommendations();
            }
        });
    }
    
    // Toggle button active state
    function toggleButtonActive(button) {
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            button.style.background = 'transparent';
            button.style.color = 'white';
            button.style.boxShadow = 'none';
            button.style.transform = 'translateY(0)';
        } else {
            button.classList.add('active');
            button.style.background = 'linear-gradient(145deg, #FFD166, #ffc137)';
            button.style.color = '#121212';
            button.style.boxShadow = '0 0 15px rgba(255, 209, 102, 0.5)';
            button.style.transform = 'translateY(-2px)';
        }
    }
    
    // Set button to inactive state
    function setButtonInactive(button) {
        button.style.background = 'transparent';
        button.style.color = 'white';
        button.style.boxShadow = 'none';
        button.style.transform = 'translateY(0)';
    }
    
    // Uncomment this if you want to add filter buttons to the navbar
    // addFilterButtons();
});
