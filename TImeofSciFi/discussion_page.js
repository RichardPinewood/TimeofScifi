let currentRecommendationId = null;
let currentUser = null;
const SERVER_API_URL = 'http://localhost:5000/auth';

document.addEventListener('DOMContentLoaded', () => {
  currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  
  const urlParams = new URLSearchParams(window.location.search);
  currentRecommendationId = urlParams.get('id');
  
  if (!currentRecommendationId) {
    showError("No recommendation ID found. Please go back and try again.");
    return;
  }
  
  loadDiscussionData(currentRecommendationId);
  
  document.getElementById('postCommentBtn')?.addEventListener('click', postComment);
  document.getElementById('commentsContainer')?.addEventListener('click', handleCommentActions);
});

async function loadDiscussionData(recommendationId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showError("Please login to view discussions");
      return;
    }
    const recResponse = await fetch(`${SERVER_API_URL}/recommendations/${recommendationId}`, {
      headers: { 'x-auth-token': token }
    });
    
    if (!recResponse.ok) throw new Error('Failed to load recommendation details');
    const recommendation = await recResponse.json();
    const elements = {
      title: document.getElementById('recommendation-title'),
      description: document.getElementById('recommendation-description'),
      author: document.getElementById('recommendation-author'),
      type: document.getElementById('recommendation-type'),
      date: document.getElementById('recommendation-date'),
      tags: document.getElementById('recommendation-tags')
    };
    
    elements.title.textContent = recommendation.title || 'No Title';
    elements.description.textContent = recommendation.description || 'No description available';
    elements.author.textContent = recommendation.author?.username || 'Anonymous';
    elements.type.textContent = recommendation.type || 'Unknown';
    elements.date.textContent = new Date(recommendation.createdAt).toLocaleDateString();
    document.title = `${recommendation.title} - Discussion - Time of Sci-Fi`;
    if (elements.tags) {
      elements.tags.innerHTML = '';
      if (recommendation.tags?.length) {
        recommendation.tags.forEach(tag => {
          const tagEl = document.createElement('span');
          tagEl.className = 'tag';
          tagEl.textContent = tag;
          elements.tags.appendChild(tagEl);
        });
      }
    }
    const commentsResponse = await fetch(`${SERVER_API_URL}/recommendations/${recommendationId}/comments`, {
      headers: { 'x-auth-token': token }
    });
    
    if (!commentsResponse.ok) throw new Error('Failed to load comments');
    displayComments(await commentsResponse.json());
    
  } catch (error) {
    console.error('Error loading discussion data:', error);
    showError('Error loading discussion data. Please try again.');
  }
}

function displayComments(comments) {
  const commentsContainer = document.getElementById('commentsContainer');
  commentsContainer.innerHTML = '';
  
  if (!comments?.length) {
    commentsContainer.innerHTML = '<div class="text-center my-4">No comments yet. Be the first to share your thoughts!</div>';
    return;
  }
  
  buildCommentTree(comments).forEach(comment => renderComment(comment, commentsContainer));
}

function showError(message) {
  const container = document.querySelector('.container');
  const errorEl = document.createElement('div');
  errorEl.className = 'alert alert-danger';
  errorEl.textContent = message;
  container.insertBefore(errorEl, container.firstChild);
}

function buildCommentTree(comments) {
  const commentMap = {};
  const rootComments = [];
  
  comments.forEach(comment => {
    commentMap[comment._id] = { ...comment, replies: [] };
  });
  
  comments.forEach(comment => {
    comment.parentComment && commentMap[comment.parentComment] 
      ? commentMap[comment.parentComment].replies.push(commentMap[comment._id])
      : rootComments.push(commentMap[comment._id]);
  });
  
  return rootComments;
}

function renderComment(comment, container) {
  const commentEl = document.importNode(
    document.getElementById('commentTemplate').content, 
    true
  ).querySelector('.comment');
  
  commentEl.dataset.id = comment._id;
  commentEl.querySelector('.username').textContent = comment.author?.username || 'Anonymous';
  commentEl.querySelector('.comment-date').textContent = formatDate(comment.createdAt);
  commentEl.querySelector('.comment-content').textContent = comment.content;
  commentEl.querySelector('.upvote-count').textContent = comment.upvotes?.length || 0;
  commentEl.querySelector('.downvote-count').textContent = comment.downvotes?.length || 0;
  
  if (currentUser) {
    if (comment.upvotes?.includes(currentUser.id)) {
      commentEl.querySelector('.upvote-btn').classList.add('upvoted');
    }
    if (comment.downvotes?.includes(currentUser.id)) {
      commentEl.querySelector('.downvote-btn').classList.add('downvoted');
    }
    if (comment.author?._id === currentUser.id) {
      commentEl.querySelector('.delete-btn').classList.remove('d-none');
    }
  }
  
  if (comment.replies?.length) {
    comment.replies.forEach(reply => renderComment(reply, commentEl.querySelector('.replies')));
  }
  
  container.appendChild(commentEl);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  return diffSec < 60 ? 'just now' :
         diffMin < 60 ? `${diffMin} min ago` :
         diffHours < 24 ? `${diffHours} hours ago` :
         diffDays < 7 ? `${diffDays} days ago` :
         date.toLocaleDateString();
}

function handleCommentActions(e) {
  const commentEl = e.target.closest('.comment');
  if (!commentEl) return;
  
  const commentId = commentEl.dataset.id;
  const clickedElement = e.target.closest('.upvote-btn, .downvote-btn, .reply-btn, .cancel-reply, .submit-reply, .delete-btn');
  if (!clickedElement) return;
  
  const actionType = clickedElement.classList[0];
  
  switch(actionType) {
    case 'upvote-btn':
      voteOnComment(commentId, 'upvote', commentEl);
      break;
    case 'downvote-btn':
      voteOnComment(commentId, 'downvote', commentEl);
      break;
    case 'reply-btn':
      const replyForm = commentEl.querySelector('.reply-form');
      replyForm.classList.toggle('d-none');
      !replyForm.classList.contains('d-none') && replyForm.querySelector('.reply-textarea').focus();
      break;
    case 'cancel-reply':
      const cancelForm = clickedElement.closest('.reply-form');
      cancelForm.classList.add('d-none');
      cancelForm.querySelector('.reply-textarea').value = '';
      break;
    case 'submit-reply':
      const submitForm = clickedElement.closest('.reply-form');
      const content = submitForm.querySelector('.reply-textarea').value.trim();
      content && submitReply(commentId, content, commentEl);
      break;
    case 'delete-btn':
      confirm('Are you sure you want to delete this comment?') && deleteComment(commentId, commentEl);
      break;
  }
}

async function postComment() {
  const commentInput = document.getElementById('commentInput');
  const content = commentInput.value.trim();
  
  if (!content || !currentRecommendationId) return alert('Please enter a comment');
  
  const token = localStorage.getItem('token');
  if (!token) return alert('Please login to post comments');
  
  try {
    const response = await fetch(`${SERVER_API_URL}/recommendations/${currentRecommendationId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) throw new Error('Failed to post comment');
    
    commentInput.value = '';
    loadDiscussionData(currentRecommendationId);
    
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Error posting comment. Please try again.');
  }
}

async function submitReply(parentCommentId, content, commentEl) {
  if (!currentRecommendationId) return console.error('No recommendation ID');
  
  const token = localStorage.getItem('token');
  if (!token) return alert('Please login to reply');
  
  try {
    const response = await fetch(`${SERVER_API_URL}/recommendations/${currentRecommendationId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ content, parentComment: parentCommentId })
    });
    
    if (!response.ok) throw new Error('Failed to post reply');
    const replyForm = commentEl.querySelector('.reply-form');
    replyForm.classList.add('d-none');
    replyForm.querySelector('.reply-textarea').value = '';
    
    loadDiscussionData(currentRecommendationId);
  } catch (error) {
    console.error('Error posting reply:', error);
    alert('Error posting reply. Please try again.');
  }
}

async function voteOnComment(commentId, voteType, commentEl) {
  const token = localStorage.getItem('token');
  if (!token) return alert('Please login to vote');
  
  try {
    const response = await fetch(`${SERVER_API_URL}/comments/${commentId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ voteType })
    });
    
    if (!response.ok) throw new Error('Failed to vote');
    const result = await response.json();
    commentEl.querySelector('.upvote-count').textContent = result.upvotes;
    commentEl.querySelector('.downvote-count').textContent = result.downvotes;
    
    const btns = {
      upvote: commentEl.querySelector('.upvote-btn'),
      downvote: commentEl.querySelector('.downvote-btn')
    };
    
    btns.upvote.classList.remove('upvoted');
    btns.downvote.classList.remove('downvoted');
    
    if (voteType === 'upvote' || voteType === 'downvote') {
      btns[voteType].classList.add(`${voteType}d`);
    }
  } catch (error) {
    console.error('Error voting:', error);
    alert('Error voting. Please try again.');
  }
}

async function deleteComment(commentId) {
  const token = localStorage.getItem('token');
  if (!token) return alert('Please login to delete comments');
  
  try {
    const response = await fetch(`${SERVER_API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
    
    if (!response.ok) throw new Error('Failed to delete comment');
    loadDiscussionData(currentRecommendationId);
  } catch (error) {
    console.error('Error deleting comment:', error);
    alert('Error deleting comment. Please try again.');
  }
}