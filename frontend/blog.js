const API_URL = 'http://localhost:5000/api';

let currentPage = 1;
let currentCategory = 'all';
const postsPerPage = 9;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  loadBlogPosts();
});

// Setup filter buttons
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Load posts for this category
      currentCategory = button.dataset.category;
      currentPage = 1;
      loadBlogPosts();
    });
  });
}

// Load blog posts
async function loadBlogPosts() {
  const blogGrid = document.getElementById('blogGrid');
  
  // Show loading
  blogGrid.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner"></i>
      <p>Loading blog posts...</p>
    </div>
  `;
  
  try {
    const url = `${API_URL}/blog/posts?page=${currentPage}&limit=${postsPerPage}${currentCategory !== 'all' ? `&category=${currentCategory}` : ''}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      renderBlogPosts(data.posts);
      renderPagination(data.pagination);
    } else {
      throw new Error('Failed to load posts');
    }
  } catch (error) {
    console.error('Error loading blog posts:', error);
    
    // Show fallback posts if API fails
    renderFallbackPosts();
  }
}

// Render blog posts
function renderBlogPosts(posts) {
  const blogGrid = document.getElementById('blogGrid');
  
  if (!posts || posts.length === 0) {
    blogGrid.innerHTML = `
      <div class="no-posts">
        <i class="fas fa-file-alt"></i>
        <h3>No posts found</h3>
        <p>Check back soon for new content!</p>
      </div>
    `;
    return;
  }
  
  blogGrid.innerHTML = posts.map(post => `
    <div class="blog-card">
      <img src="${escapeHtml(post.image_url || 'images/blog-default.jpg')}" 
           alt="${escapeHtml(post.title)}"
           onerror="this.src='https://via.placeholder.com/400x250/667eea/ffffff?text=Blog+Post'">
      <div class="blog-card-content">
        <span class="blog-category">${escapeHtml(post.category || 'General')}</span>
        <div class="blog-meta">
          <span><i class="far fa-calendar"></i> ${formatDate(post.created_at)}</span>
          <span><i class="far fa-user"></i> ${escapeHtml(post.author || 'Admin')}</span>
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt || post.content.substring(0, 150))}...</p>
        <a href="blog-post.html?id=${post.id}" class="blog-link">
          Read More <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `).join('');
}

// Render pagination
function renderPagination(pagination) {
  const paginationContainer = document.getElementById('blogPagination');
  
  if (!pagination || pagination.totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // Previous button
  html += `<button onclick="changePage(${pagination.currentPage - 1})" ${pagination.currentPage === 1 ? 'disabled' : ''}>
    <i class="fas fa-chevron-left"></i> Previous
  </button>`;
  
  // Page numbers
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (i === pagination.currentPage) {
      html += `<button class="active">${i}</button>`;
    } else {
      html += `<button onclick="changePage(${i})">${i}</button>`;
    }
  }
  
  // Next button
  html += `<button onclick="changePage(${pagination.currentPage + 1})" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}>
    Next <i class="fas fa-chevron-right"></i>
  </button>`;
  
  paginationContainer.innerHTML = html;
}

// Change page
function changePage(page) {
  currentPage = page;
  loadBlogPosts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fallback posts when API is unavailable
function renderFallbackPosts() {
  const fallbackPosts = [
    {
      id: 1,
      title: 'The Future of Cybersecurity in 2025: What to Know',
      excerpt: 'Explore the latest trends that are transforming the cybersecurity landscape and how they can protect your business.',
      category: 'Cybersecurity',
      author: 'Michael Chen',
      created_at: new Date('2025-01-15'),
      image_url: 'images/img06.jpg'
    },
    {
      id: 2,
      title: 'AI in Business: A Practical Guide',
      excerpt: 'Learn how artificial intelligence can revolutionize your business operations and drive innovation.',
      category: 'AI & Automation',
      author: 'Sarah Martinez',
      created_at: new Date('2025-01-10'),
      image_url: 'images/img07.jpg'
    },
    {
      id: 3,
      title: 'Cloud Migration Strategies for Success',
      excerpt: 'Discover proven strategies for migrating to the cloud without disrupting your business operations.',
      category: 'Cloud Solutions',
      author: 'Emily Rodriguez',
      created_at: new Date('2025-01-05'),
      image_url: 'images/img08.jpg'
    },
    {
      id: 4,
      title: '5 IT Strategy Mistakes to Avoid',
      excerpt: 'Common pitfalls in IT strategy planning and how to avoid them for better business outcomes.',
      category: 'IT Strategy',
      author: 'John Anderson',
      created_at: new Date('2024-12-28'),
      image_url: 'images/img03.jpg'
    },
    {
      id: 5,
      title: 'Zero Trust Security: The Future is Now',
      excerpt: 'Understanding Zero Trust architecture and why it\'s becoming the new standard in cybersecurity.',
      category: 'Cybersecurity',
      author: 'Michael Chen',
      created_at: new Date('2024-12-20'),
      image_url: 'images/img04.jpg'
    },
    {
      id: 6,
      title: 'The Rise of Edge Computing',
      excerpt: 'How edge computing is changing the way businesses process and analyze data in real-time.',
      category: 'Tech Trends',
      author: 'Sarah Martinez',
      created_at: new Date('2024-12-15'),
      image_url: 'images/img05.jpg'
    }
  ];
  
  // Filter by category if needed
  const filteredPosts = currentCategory === 'all' 
    ? fallbackPosts 
    : fallbackPosts.filter(post => post.category.toLowerCase().includes(currentCategory));
  
  renderBlogPosts(filteredPosts);
  
  // Simple pagination for fallback
  const pagination = {
    currentPage: 1,
    totalPages: 1,
    total: filteredPosts.length
  };
  renderPagination(pagination);
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make changePage available globally
window.changePage = changePage;