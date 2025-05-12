// Global variables
let currentRecommendationId = null;
let currentUser = null;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  initDiscussion();
  loadCurrentUser();
});

// Load current user data
function loadCurrentUser() {
  const userData = localStorage.getItem('user');
  if (userData) {
    currentUser = JSON.parse(userData);
  }
}

// Initialize discussion system
function initDiscussion() {
  // Add event listeners to all discussion buttons
  const discussionButtons = document.querySelectorAll('.comments-button');
  discussionButtons.forEach(button => {
    button.addEventListener('click', openDiscussionModal);
  });

  // Add event listener for posting a comment
  const postCommentBtn = document.getElementById('postCommentBtn');
  if (postCommentBtn) {
    postCommentBtn.addEventListener('click', postComment);
  }

  // Add event delegation for comment actions
  const commentsContainer = document.getElementById('commentsContainer');
  if (commentsContainer) {
    commentsContainer.addEventListener('click', handleCommentActions);
  }
}

// Open discussion modal and load comments
function openDiscussionModal(e) {
  // Find the recommendation card closest to the clicked button
  // Try both grid-card and the wrapper in case of different structures
  let recommendationCard = e.currentTarget.closest('.grid-card');
  
  if (!recommendationCard) {
    // Try to find it from the grid-card-wrapper
    const wrapper = e.currentTarget.closest('.grid-card-wrapper');
    if (wrapper) {
      recommendationCard = wrapper.querySelector('.grid-card');
    }
  }
  
  if (!recommendationCard) {
    console.error('Could not find recommendation card');
    return;
  }

  // Get the recommendation ID from the data-id attribute
  currentRecommendationId = recommendationCard.dataset.id;
  console.log('Opening discussion for recommendation:', currentRecommendationId);
  
  if (!currentRecommendationId) {
    console.error('No recommendation ID found');
    return;
  }

  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById('discussionModal'));
  modal.show();

  // Load comments for this recommendation
  loadComments(currentRecommendationId);
}

// Load comments for the current recommendation
async function loadComments(recommendationId) {
  const commentsContainer = document.getElementById('commentsContainer');
  
  try {
    // Show loading indicator
    commentsContainer.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-light" role="status"></div></div>';
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      commentsContainer.innerHTML = '<div class="text-center my-4">Please <a href="login.html" class="text-warning">login</a> to participate in discussions</div>';
      return;
    }
    
    // Fetch comments from the server
    const response = await fetch(`http://localhost:5000/auth/recommendations/${recommendationId}/comments`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load comments');
    }
    
    const comments = await response.json();
    
    // Clear the container
    commentsContainer.innerHTML = '';
    
    if (comments.length === 0) {
      commentsContainer.innerHTML = '<div class="text-center my-4">No comments yet. Be the first to share your thoughts!</div>';
      return;
    }
    
    // Build a comment tree (for nested comments)
    const commentTree = buildCommentTree(comments);
    
    // Render comments
    commentTree.forEach(comment => {
      renderComment(comment, commentsContainer);
    });
    
  } catch (error) {
    console.error('Error loading comments:', error);
    commentsContainer.innerHTML = '<div class="text-center my-4 text-danger">Error loading comments. Please try again.</div>';
  }
}

// Build a tree structure from flat comments array
function buildCommentTree(comments) {
  const commentMap = {};
  const rootComments = [];
  
  // Create map of comments by ID
  comments.forEach(comment => {
    commentMap[comment._id] = {
      ...comment,
      replies: []
    };
  });
  
  // Build tree structure
  comments.forEach(comment => {
    if (comment.parentComment) {
      // Add as a reply to parent comment
      if (commentMap[comment.parentComment]) {
        commentMap[comment.parentComment].replies.push(commentMap[comment._id]);
      } else {
        // If parent doesn't exist (might have been deleted), add as root
        rootComments.push(commentMap[comment._id]);
      }
    } else {
      // Add as root comment
      rootComments.push(commentMap[comment._id]);
    }
  });
  
  return rootComments;
}

// Render a comment and its replies
function renderComment(comment, container) {
  const template = document.getElementById('commentTemplate');
  const commentEl = document.importNode(template.content, true).querySelector('.comment');
  
  // Set comment data
  commentEl.dataset.id = comment._id;
  commentEl.querySelector('.username').textContent = comment.author ? comment.author.username : 'Anonymous';
  commentEl.querySelector('.comment-date').textContent = formatDate(comment.createdAt);
  commentEl.querySelector('.comment-content').textContent = comment.content;
  commentEl.querySelector('.upvote-count').textContent = comment.upvotes ? comment.upvotes.length : 0;
  commentEl.querySelector('.downvote-count').textContent = comment.downvotes ? comment.downvotes.length : 0;
  
  // Check if current user has voted on this comment
  if (currentUser && comment.upvotes && comment.upvotes.includes(currentUser.id)) {
    commentEl.querySelector('.upvote-btn').classList.add('upvoted');
  }
  
  if (currentUser && comment.downvotes && comment.downvotes.includes(currentUser.id)) {
    commentEl.querySelector('.downvote-btn').classList.add('downvoted');
  }
  
  // Show delete button if user is the author
  if (currentUser && comment.author && currentUser.id === comment.author._id) {
    const deleteBtn = commentEl.querySelector('.delete-btn');
    deleteBtn.classList.remove('d-none');
  }
  
  // Render replies if any
  if (comment.replies && comment.replies.length > 0) {
    const repliesContainer = commentEl.querySelector('.replies');
    comment.replies.forEach(reply => {
      renderComment(reply, repliesContainer);
    });
  }
  
  container.appendChild(commentEl);
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Handle comment actions (upvote, downvote, reply, delete)
function handleCommentActions(e) {
  const target = e.target;
  
  // Find the comment element
  const commentEl = target.closest('.comment');
  if (!commentEl) return;
  
  const commentId = commentEl.dataset.id;
  
  // Handle upvote
  if (target.closest('.upvote-btn')) {
    voteOnComment(commentId, 'upvote', commentEl);
  }
  
  // Handle downvote
  if (target.closest('.downvote-btn')) {
    voteOnComment(commentId, 'downvote', commentEl);
  }
  
  // Handle reply button
  if (target.closest('.reply-btn')) {
    const replyForm = commentEl.querySelector('.reply-form');
    replyForm.classList.toggle('d-none');
    
    if (!replyForm.classList.contains('d-none')) {
      replyForm.querySelector('.reply-textarea').focus();
    }
  }
  
  // Handle cancel reply
  if (target.closest('.cancel-reply')) {
    const replyForm = target.closest('.reply-form');
    replyForm.classList.add('d-none');
    replyForm.querySelector('.reply-textarea').value = '';
  }
  
  // Handle submit reply
  if (target.closest('.submit-reply')) {
    const replyForm = target.closest('.reply-form');
    const replyContent = replyForm.querySelector('.reply-textarea').value.trim();
    
    if (replyContent) {
      submitReply(commentId, replyContent, commentEl);
    }
  }
  
  // Handle delete comment
  if (target.closest('.delete-btn')) {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(commentId, commentEl);
    }
  }
}

// Post a new comment
async function postComment() {
  const commentInput = document.getElementById('commentInput');
  const content = commentInput.value.trim();
  
  if (!content) {
    alert('Please enter a comment');
    return;
  }
  
  if (!currentRecommendationId) {
    console.error('No recommendation ID');
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login to post comments');
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/auth/recommendations/${currentRecommendationId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      throw new Error('Failed to post comment');
    }
    
    // Clear input
    commentInput.value = '';
    
    // Reload comments
    loadComments(currentRecommendationId);
    
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Error posting comment. Please try again.');
  }
}

// Submit a reply to a comment
async function submitReply(parentCommentId, content, commentEl) {
  if (!currentRecommendationId) {
    console.error('No recommendation ID');
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login to reply');
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/auth/recommendations/${currentRecommendationId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ 
        content,
        parentComment: parentCommentId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to post reply');
    }
    
    // Hide reply form and clear input
    const replyForm = commentEl.querySelector('.reply-form');
    replyForm.classList.add('d-none');
    replyForm.querySelector('.reply-textarea').value = '';
    
    // Reload comments
    loadComments(currentRecommendationId);
    
  } catch (error) {
    console.error('Error posting reply:', error);
    alert('Error posting reply. Please try again.');
  }
}

// Vote on a comment
async function voteOnComment(commentId, voteType, commentEl) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login to vote');
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/auth/comments/${commentId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ voteType })
    });
    
    if (!response.ok) {
      throw new Error('Failed to vote');
    }
    
    const result = await response.json();
    
    // Update vote counts
    commentEl.querySelector('.upvote-count').textContent = result.upvotes;
    commentEl.querySelector('.downvote-count').textContent = result.downvotes;
    
    // Update vote button styles
    const upvoteBtn = commentEl.querySelector('.upvote-btn');
    const downvoteBtn = commentEl.querySelector('.downvote-btn');
    
    upvoteBtn.classList.remove('upvoted');
    downvoteBtn.classList.remove('downvoted');
    
    if (voteType === 'upvote') {
      upvoteBtn.classList.add('upvoted');
    } else if (voteType === 'downvote') {
      downvoteBtn.classList.add('downvoted');
    }
    
  } catch (error) {
    console.error('Error voting:', error);
    alert('Error voting. Please try again.');
  }
}

// Delete a comment
async function deleteComment(commentId, commentEl) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login to delete comments');
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/auth/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
    
    // Reload comments
    loadComments(currentRecommendationId);
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    alert('Error deleting comment. Please try again.');
  }
}
