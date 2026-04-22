/* ============================================
   KCR Submission Manager — Shared JavaScript
   ============================================ */


function getToken() {
  return localStorage.getItem('authToken');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

function getUser(){
  const userStr = localStorage.getItem('user');
  if(userStr) {
    try{
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function setUser (user){
  if (user){
    localStorage.setItem('user', JSON.stringify(user));
  } else{
    localStorage.removeItem('user');
  }
}


function signOut(){
  console.log('Signing out...');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

async function apiFetch(url, options = {}){
  const token = getToken();
  const headers = {
    'Content-Type' : 'application/json',
    ...options.headers
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const config = {
    ...options,
    headers
  };

  try{
    const response = await fetch(url, config);

    if (response.status === 401) {
      const path = window.location.pathname;
      if (!path.endsWith('/index.html') && !path.endsWith('/register.html')) {
        signOut();
      }
      throw new Error('Unauthorized');
    }
    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}


document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile sidebar toggle ---
  const hamburger = document.querySelector('.hamburger');
  const sidebar   = document.getElementById('sidebar');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));

    document.addEventListener('click', (e) => {
      if (
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        sidebar.classList.remove('open');
      }
    });
  }

  // --- Active nav highlighting ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    } else if (link.classList.contains('active') && href !== currentPage) {
      link.classList.remove('active');
    }
  });

  // --- Search filter (client-side demo) ---
  document.querySelectorAll('.search-input input').forEach(input => {
    input.addEventListener('input', () => {
      const query = input.value.toLowerCase();
      const table = input.closest('.page-content')?.querySelector('tbody');
      if (!table) return;
      table.querySelectorAll('tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  });

  // --- Filter selects (demo: show alert with selection) ---
  document.querySelectorAll('.filter-select').forEach(select => {
    select.addEventListener('change', () => {
      // In a real app this would filter the data
      console.log('Filter changed:', select.value);
    });
  });

  // --- "Select all" checkbox in admin tables ---
  document.querySelectorAll('thead input[type="checkbox"]').forEach(selectAll => {
    selectAll.addEventListener('change', () => {
      const tbody = selectAll.closest('table').querySelector('tbody');
      tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = selectAll.checked;
      });
    });
  });

  // --- Close modals on overlay click ---
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
      }
    });
  });

  // --- Close modals on Escape key ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    }
  });

  // --- Notification bell click (demo) ---
  const bell = document.querySelector('.notification-bell .btn-icon');
  if (bell) {
    bell.addEventListener('click', () => {
      alert('Notifications panel would open here.\n\n• New message on "The Glass Garden"\n• "Urban Solitude" accepted\n• Submission confirmation sent');
    });
  }

});
