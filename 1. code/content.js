/**
 * AWS Cloud Pilot - Content Script
 * AWS Console 페이지에서 사용자 인터페이스 제공
 */

// 동의 관리자 로드 (안전한 DOM 접근)
let consentLoadAttempts = 0;
const MAX_CONSENT_ATTEMPTS = 50;

function loadConsentScript() {
  try {
    if (consentLoadAttempts >= MAX_CONSENT_ATTEMPTS) {
      console.warn('Consent script 로드 최대 시도 횟수 초과');
      // amazonq-ignore-next-line
      return;
    }
    
    consentLoadAttempts++;
    
    if (document && document.head) {
      const consentScript = document.createElement('script');
      consentScript.src = chrome.runtime.getURL('consent.js');
      document.head.appendChild(consentScript);
    } else {
      setTimeout(loadConsentScript, 100);
    }
  } catch (error) {
    console.warn('Consent script 로드 실패:', error);
  }
}

// DOM 완전 로드 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadConsentScript);
} else {
  loadConsentScript();
}

let awsChatbot = null;

/**
 * 챗봇 토글 (CloudTrail 방식)
 */
function toggleChatbot() {
  if (awsChatbot) {
    hideChatbot();
    return;
  }
  showChatbot();
}

/**
 * 챗봇 표시
 */
function showChatbot() {
  if (!awsChatbot) {
    createChatbot();
  }
}

/**
 * 챗봇 숨김
 */
function hideChatbot() {
  if (awsChatbot) {
    awsChatbot.remove();
    awsChatbot = null;
  }
}

/**
 * 챗봇 생성
 */
function createChatbot() {
  awsChatbot = document.createElement('div');
  awsChatbot.id = 'aws-security-chatbot';
  awsChatbot.innerHTML = `

    <div class="chatbot-header">
      <span>🛡️ AWS Cloud Pilot</span>
      <div class="chatbot-controls">
        <label class="security-mode-toggle" title="security mode">
          <input type="checkbox" id="security-mode-checkbox">
          <span class="security-mode-label">security mode</span>
        </label>
        <button class="chatbot-warning" title="CloudTrail 오류 확인">⚠️</button>
        <button class="chatbot-clear" title="채팅 내역 지우기">🗑️</button>
        <button class="chatbot-close">×</button>
      </div>
    </div>
    <div class="chatbot-messages" id="chatbot-messages">
      <div class="message bot-message">
👋 안녕하세요! AWS Cloud Pilot입니다.<br>
🔍 AWS Console 작업을 모니터링하고 있습니다.<br>
      </div>
    </div>
    <div class="chatbot-input">
      <input type="text" placeholder="질문을 입력하세요..." id="chatbot-input">
      <button id="chatbot-profile">👤</button>
      <button id="chatbot-send">전송</button>
    </div>
  `;
  
  // 고정 크기 설정
  const width = 450;
  const height = 500;
  
  // 저장된 위치 복원
  const savedPosition = localStorage.getItem('aws-chatbot-position');
  let positionStyle = 'bottom: 90px !important; right: 20px !important;';
  if (savedPosition) {
    try {
      const pos = JSON.parse(savedPosition);
      positionStyle = `left: ${pos.left}px !important; top: ${pos.top}px !important;`;
    } catch (e) {}
  }
  
  awsChatbot.style.cssText = `
    position: fixed !important;
    ${positionStyle}
    width: ${width}px !important;
    height: ${height}px !important;
    background: white !important;
    border: 1px solid #ddd !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    z-index: 100000 !important;
    font-family: Arial, sans-serif !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  `;
  
  if (!document.getElementById('chatbot-style')) {
    const style = document.createElement('style');
    style.id = 'chatbot-style';
    style.textContent = `
      .chatbot-header {
        background: #232f3e !important;
        color: white !important;
        padding: 12px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        cursor: move !important;
      }
      .chatbot-controls {
        display: flex !important;
        gap: 8px !important;
      }
      .security-mode-toggle {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        font-size: 12px !important;
        color: white !important;
        cursor: pointer !important;
      }
      #security-mode-checkbox {
        width: 14px !important;
        height: 14px !important;
        cursor: pointer !important;
      }
      .security-mode-label {
        font-size: 11px !important;
        white-space: nowrap !important;
      }
      .chatbot-close, .chatbot-clear, .chatbot-warning {
        background: none !important;
        border: none !important;
        color: white !important;
        font-size: 18px !important;
        cursor: pointer !important;
        padding: 4px !important;
        border-radius: 4px !important;
      }
      .chatbot-close:hover, .chatbot-clear:hover, .chatbot-warning:hover {
        background: rgba(255,255,255,0.2) !important;
      }

      .chatbot-messages {
        flex: 1 !important;
        padding: 12px !important;
        overflow-y: auto !important;
      }
      .message {
        margin-bottom: 12px !important;
        padding: 8px 12px !important;
        border-radius: 12px !important;
        word-wrap: break-word !important;
        white-space: pre-wrap !important;
        font-size: 12px !important;
        width: fit-content !important;
        display: inline-block !important;
        clear: both !important;
        font-family: monospace !important;
      }
      .bot-message {
        background: #f0f0f0 !important;
        max-width: 70% !important;
        float: left !important;
      }
      .bot-message.threat-message {
        border-left: 4px solid #666 !important;
        padding-left: 16px !important;
      }
      .message.threat-message {
        background: var(--threat-bg-color) !important;
      }
      .user-message {
        background: #007dbc !important;
        color: white !important;
        max-width: 70% !important;
        font-size: 11px !important;
        float: right !important;
      }
      .chatbot-input {
        display: flex !important;
        padding: 12px !important;
        border-top: 1px solid #eee !important;
      }
      #chatbot-input {
        flex: 1 !important;
        padding: 8px !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        margin-right: 8px !important;
      }
      #chatbot-profile {
        background: #34306ee1 !important;
        color: white !important;
        border: none !important;
        padding: 8px 12px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        margin-right: 8px !important;
      }
      #chatbot-profile:hover {
        background: #34306eff !important;
      }
      #chatbot-send {
        background: #007dbc !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
      }
      #chatbot-send:hover {
        background: #0056b3 !important;
      }

    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(awsChatbot);
  
  // 채팅 내역 복원 (알림 포함)
  loadChatHistory();
  
  const closeBtn = awsChatbot.querySelector('.chatbot-close');
  closeBtn.onclick = function(e) {
    e.stopPropagation();
    hideChatbot();
  };
  
  const clearBtn = awsChatbot.querySelector('.chatbot-clear');
  clearBtn.onclick = function(e) {
    e.stopPropagation();
    clearChatHistory();
  };
  
  const profileBtn = awsChatbot.querySelector('#chatbot-profile');
  profileBtn.onclick = function() {
    openProfileWindow();
  };
  
  const sendBtn = awsChatbot.querySelector('#chatbot-send');
  sendBtn.onclick = function() {
    const input = awsChatbot.querySelector('#chatbot-input');
    const query = input.value.trim();
    if (query) {
      // 채팅창에 질문 표시
      addMessage(query, 'user');
      
      // 로딩 메시지 표시
      const loadingId = 'loading-' + Date.now();
      addMessage('🤖 생각하는 중...', 'bot', loadingId);
      
      // /prompt로 POST 요청 전송
      chrome.runtime.sendMessage({
        action: 'sendPrompt',
        query: query,
        loadingId: loadingId
      });
      
      input.value = '';
    }
  };
  
  const inputField = awsChatbot.querySelector('#chatbot-input');
  inputField.onkeypress = function(e) {
    if (e.key === 'Enter') {
      sendBtn.click();
    }
  };
  
  const warningBtn = awsChatbot.querySelector('.chatbot-warning');
  warningBtn.onclick = function(e) {
    e.stopPropagation();
    toggleCloudTrailPopup();
  };
  
  const securityModeCheckbox = awsChatbot.querySelector('#security-mode-checkbox');
  securityModeCheckbox.onchange = function() {
    const isSecurityMode = this.checked;
    chrome.runtime.sendMessage({
      action: 'setSecurityMode',
      securityMode: isSecurityMode
    });
    console.log('보안 모드 변경:', isSecurityMode);
  };
  
  makeChatbotDraggable(awsChatbot);
}

/**
 * 챗봇 드래그 기능
 */
function makeChatbotDraggable(chatbot) {
  const header = chatbot.querySelector('.chatbot-header');
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;
    
    // 화면 범위 내로 제한
    const maxLeft = window.innerWidth - chatbot.offsetWidth;
    const maxTop = window.innerHeight - chatbot.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    chatbot.style.left = newLeft + 'px';
    chatbot.style.top = newTop + 'px';
  };
  
  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 위치 저장
      const rect = chatbot.getBoundingClientRect();
      localStorage.setItem('aws-chatbot-position', JSON.stringify({
        left: rect.left,
        top: rect.top
      }));
    }
  };
  
  header.onmousedown = (e) => {
    // 버튼 클릭 시 드래그 방지
    if (e.target.classList.contains('chatbot-close') || e.target.classList.contains('chatbot-clear') || e.target.classList.contains('chatbot-warning')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = chatbot.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
    // 기본 위치 설정 제거
    chatbot.style.right = 'auto';
    chatbot.style.bottom = 'auto';
    chatbot.style.left = startLeft + 'px';
    chatbot.style.top = startTop + 'px';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    e.preventDefault();
  };
}

/**
 * 챗봇 리사이즈 기능 (8방향 자연스러운 리사이징)
 */
function makeChatbotResizable(chatbot) {
  const resizeHandles = chatbot.querySelectorAll('.chatbot-resize-handle');
  let isResizing = false;
  let resizeType = '';
  let startX, startY, startWidth, startHeight, startLeft, startTop;
  const minWidth = 300;
  const minHeight = 300;
  
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;
    
    // 8방향 리사이즈 로직
    if (resizeType.includes('e')) { // 동쪽 (오른쪽)
      newWidth = Math.max(minWidth, startWidth + deltaX);
    }
    if (resizeType.includes('w')) { // 서쪽 (왼쪽)
      const proposedWidth = startWidth - deltaX;
      if (proposedWidth >= minWidth) {
        newWidth = proposedWidth;
        newLeft = startLeft + deltaX;
      } else {
        newWidth = minWidth;
        newLeft = startLeft + startWidth - minWidth;
      }
    }
    if (resizeType.includes('s')) { // 남쪽 (아래쪽)
      newHeight = Math.max(minHeight, startHeight + deltaY);
    }
    if (resizeType.includes('n')) { // 북쪽 (위쪽)
      const proposedHeight = startHeight - deltaY;
      if (proposedHeight >= minHeight) {
        newHeight = proposedHeight;
        newTop = startTop + deltaY;
      } else {
        newHeight = minHeight;
        newTop = startTop + startHeight - minHeight;
      }
    }
    
    // 화면 경계 제한
    const maxLeft = window.innerWidth - newWidth;
    const maxTop = window.innerHeight - newHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    // 스타일 적용
    chatbot.style.width = newWidth + 'px';
    chatbot.style.height = newHeight + 'px';
    chatbot.style.left = newLeft + 'px';
    chatbot.style.top = newTop + 'px';
  };
  
  const handleMouseUp = () => {
    if (isResizing) {
      isResizing = false;
      resizeType = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      // 크기와 위치 저장
      const rect = chatbot.getBoundingClientRect();
      localStorage.setItem('aws-chatbot-size', JSON.stringify({
        width: rect.width,
        height: rect.height
      }));
      localStorage.setItem('aws-chatbot-position', JSON.stringify({
        left: rect.left,
        top: rect.top
      }));
    }
  };
  
  resizeHandles.forEach(handle => {
    handle.onmousedown = (e) => {
      isResizing = true;
      resizeType = handle.className.split(' ')[1].replace('-resize', '');
      startX = e.clientX;
      startY = e.clientY;
      startWidth = chatbot.offsetWidth;
      startHeight = chatbot.offsetHeight;
      
      const rect = chatbot.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      
      // 절대 위치로 변경
      chatbot.style.right = 'auto';
      chatbot.style.bottom = 'auto';
      chatbot.style.left = startLeft + 'px';
      chatbot.style.top = startTop + 'px';
      
      // 텍스트 선택 방지 및 커서 설정
      document.body.style.userSelect = 'none';
      document.body.style.cursor = handle.style.cursor;
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      e.preventDefault();
      e.stopPropagation();
    };
  });
}

/**
 * 서버에서 프로파일 로드
 */
function loadProfileFromServer(textarea) {
  if (!textarea) {
    console.error('textarea 요소가 없음');
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'fetchProfile'
  }, (response) => {
    if (chrome.runtime.lastError) {
      textarea.placeholder = '네트워크 오류';
      return;
    }
    
    if (response && response.success) {
      if (response.data && response.data.trim()) {
        textarea.value = response.data.trim();
      } else {
        textarea.placeholder = 'profile 입력';
      }
    } else {
      textarea.placeholder = '네트워크 오류';
    }
  });
}

/**
 * 프로파일 창 열기
 */
function openProfileWindow() {
  // 이미 열린 프로파일 창이 있으면 리턴
  if (document.getElementById('profile-window')) {
    return;
  }
  
  const profileWindow = document.createElement('div');
  profileWindow.id = 'profile-window';
  profileWindow.innerHTML = `
    <div class="profile-overlay">
      <div class="profile-container">
        <h3>👤 요구 사항</h3>
        <textarea id="profile-text" placeholder="프로파일을 입력하세요..." readonly></textarea>
        <div class="profile-buttons">
          <button id="profile-edit">Edit</button>
          <button id="profile-submit">Submit</button>
          <button id="profile-close">×</button>
        </div>
      </div>
    </div>
  `;
  
  const style = document.createElement('style');
  style.id = 'profile-window-style';
  style.textContent = `
    .profile-overlay {
      position: fixed !important; top: 0 !important; left: 0 !important; 
      width: 100% !important; height: 100% !important;
      background: rgba(0,0,0,0.7) !important; z-index: 999999 !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
    }
    .profile-container {
      background: white !important; padding: 32px !important; border-radius: 12px !important;
      width: 450px !important; max-width: 90vw !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
      min-width: 300px !important; position: relative !important;
    }
    .profile-container h3 {
      margin: 0 0 20px 0 !important; color: #333 !important; font-size: 18px !important;
    }
    #profile-text {
      width: calc(100% - 24px) !important; height: 120px !important; padding: 12px !important;
      border: 2px solid #e0e0e0 !important; border-radius: 8px !important;
      background: #f8f9fa !important; resize: none !important; font-family: 'Segoe UI', sans-serif !important;
      font-size: 14px !important; line-height: 1.4 !important; transition: all 0.2s ease !important; 
      box-sizing: border-box !important;
    }
    #profile-text.editing { 
      background: white !important; border-color: #6f42c1 !important; 
      box-shadow: 0 0 0 3px rgba(111,66,193,0.1) !important;
    }
    .profile-buttons {
      display: flex !important; gap: 12px !important; margin-top: 20px !important; 
      justify-content: flex-end !important; width: 100% !important; box-sizing: border-box !important;
    }
    .profile-buttons button {
      padding: 10px 20px !important; border: none !important; border-radius: 6px !important; 
      cursor: pointer !important; font-weight: 500 !important; transition: all 0.2s ease !important;
    }
    #profile-edit { background: #007dbc !important; color: white !important; }
    #profile-edit:hover { background: #0056b3 !important; }
    #profile-submit { background: #28a745 !important; color: white !important; }
    #profile-submit:hover { background: #1e7e34 !important; }
    #profile-close { background: #dc3545 !important; color: white !important; }
    #profile-close:hover { background: #c82333 !important; }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(profileWindow);
  
  // DOM에 추가된 후 요소들 찾기
  setTimeout(() => {
    const textarea = document.getElementById('profile-text');
    const editBtn = document.getElementById('profile-edit');
    const submitBtn = document.getElementById('profile-submit');
    const closeBtn = document.getElementById('profile-close');
    
    if (!textarea || !editBtn || !submitBtn || !closeBtn) {
      console.error('프로파일 창 요소를 찾을 수 없음');
      return;
    }
    
    // 서버에서 프로파일 로드
    loadProfileFromServer(textarea);
    
    // 이벤트 리스너 등록
    editBtn.addEventListener('click', () => {
      textarea.classList.add('editing');
      textarea.readOnly = false;
      textarea.focus();
    });
    
    submitBtn.addEventListener('click', () => {
      const profile = textarea.value.trim();
      if (!profile) {
        addMessage('❌ 프로파일을 입력해주세요', 'bot');
        return;
      }
      
      chrome.runtime.sendMessage({
        action: 'sendProfile',
        profile: profile
      }, (response) => {
        if (chrome.runtime.lastError) {
          addMessage('❌ 전송 실패: ' + chrome.runtime.lastError.message, 'bot');
          return;
        }
        
        if (response && response.success) {
          if (response.data && response.data.trim()) {
            addMessage(`${response.data}`, 'bot');
          }
          loadProfileFromServer(textarea);
        } else {
          addMessage(`❌ 프로파일 전송 실패: ${response?.error || '알 수 없는 오류'}`, 'bot');
        }
      });
      
      textarea.classList.remove('editing');
      textarea.readOnly = true;
    });
    
    closeBtn.addEventListener('click', () => {
      profileWindow.remove();
      const styleElement = document.getElementById('profile-window-style');
      if (styleElement) styleElement.remove();
    });
    
    // 오버레이 클릭으로 닫기
    const overlay = profileWindow.querySelector('.profile-overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        profileWindow.remove();
        const styleElement = document.getElementById('profile-window-style');
        if (styleElement) styleElement.remove();
      }
    });
  }, 100);
}

let cloudTrailPopup = null;

/**
 * CloudTrail 팝업 토글
 */
function toggleCloudTrailPopup() {
  if (cloudTrailPopup) {
    hideCloudTrailPopup();
    return;
  }
  
  showCloudTrailPopup();
}

/**
 * CloudTrail 오류 팝업 표시
 */
function showCloudTrailPopup() {
  if (!awsChatbot) return;
  
  // 팝업 생성
  cloudTrailPopup = document.createElement('div');
  cloudTrailPopup.id = 'cloudtrail-popup';
  cloudTrailPopup.innerHTML = `
    <div class="popup-header" style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: move;">
      <span>⏳ CloudTrail 오류 로딩 중...</span>
      <button class="popup-close" style="background: none; border: none; color: #666; font-size: 16px; cursor: pointer; padding: 4px;">×</button>
    </div>
  `;
  
  // 스타일 적용
  cloudTrailPopup.style.cssText = `
    position: fixed !important;
    background: white !important;
    border: 1px solid #ddd !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    z-index: 100001 !important;
    width: 350px !important;
    max-height: 300px !important;
    overflow-y: auto !important;
    font-family: Arial, sans-serif !important;
    font-size: 12px !important;
  `;
  
  // 채팅창 상단에 위치 설정
  const chatbotRect = awsChatbot.getBoundingClientRect();
  cloudTrailPopup.style.left = chatbotRect.left + 'px';
  cloudTrailPopup.style.bottom = (window.innerHeight - chatbotRect.top + 10) + 'px';
  
  document.body.appendChild(cloudTrailPopup);
  
  // X 버튼 이벤트 리스너
  const closeBtn = cloudTrailPopup.querySelector('.popup-close');
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    hideCloudTrailPopup();
  };
  
  // 드래그 기능 추가
  makePopupDraggable(cloudTrailPopup);
  
  // API 호출
  console.log('CloudTrail API 호출 시작');
  
  chrome.runtime.sendMessage({
    action: 'fetchCloudTrailFailures'
  }, (response) => {
    console.log('CloudTrail API 응답:', response);
    
    if (!cloudTrailPopup) {
      console.log('팝업이 사라졌음');
      return;
    }
    
    if (chrome.runtime.lastError) {
      console.error('Chrome runtime 오류:', chrome.runtime.lastError);
      cloudTrailPopup.innerHTML = `
        <div style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span>❌ 네트워크 오류</span>
          <button onclick="hideCloudTrailPopup()" style="background: none; border: none; color: #666; font-size: 16px; cursor: pointer; padding: 0;">×</button>
        </div>
      `;
      return;
    }
    
    if (!response) {
      console.error('응답 없음');
      cloudTrailPopup.innerHTML = `
        <div style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span>❌ 응답 없음</span>
          <button onclick="hideCloudTrailPopup()" style="background: none; border: none; color: #666; font-size: 16px; cursor: pointer; padding: 0;">×</button>
        </div>
      `;
      return;
    }
    
    if (!response.success) {
      console.error('API 실패:', response.error);
      cloudTrailPopup.innerHTML = `
        <div style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span>❌ ${response.error || 'API 오류'}</span>
          <button onclick="hideCloudTrailPopup()" style="background: none; border: none; color: #666; font-size: 16px; cursor: pointer; padding: 0;">×</button>
        </div>
      `;
      return;
    }
    
    const data = response.data;
    console.log('CloudTrail 데이터:', data);
    
    if (!data) {
      cloudTrailPopup.innerHTML = `
        <div style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span>❌ 데이터 없음</span>
          <button onclick="hideCloudTrailPopup()" style="background: none; border: none; color: #666; font-size: 16px; cursor: pointer; padding: 0;">×</button>
        </div>
      `;
      return;
    }
    
    // 팝업 내용 생성
    let content = `
      <div class="popup-header" style="background: #f8f9fa; padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; display: flex; justify-content: space-between; align-items: center; cursor: move;">
        <span>⚠️ CloudTrail 오류 (${data.count || 0}개)</span>
        <button class="popup-close" style="background: none; border: none; color: #666; font-size: 16px; cursor: pointer; padding: 4px;">×</button>
      </div>
    `;
    
    if (data.events && data.events.length > 0) {
      data.events.forEach((event) => {
        content += `
          <div style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">
            <div style="font-weight: bold; color: #dc3545; margin-bottom: 4px;">${event.ErrorCode}</div>
            <div><a href="${event.URL}" target="_blank" style="color: #007dbc; text-decoration: none; font-size: 11px;">클릭하여 상세 보기</a></div>
          </div>
        `;
      });
    } else {
      content += '<div style="padding: 12px; text-align: center; color: #28a745;">✅ 오류 없음</div>';
    }
    
    cloudTrailPopup.innerHTML = content;
    
    // X 버튼 이벤트 리스너 재등록
    const closeBtn = cloudTrailPopup.querySelector('.popup-close');
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      hideCloudTrailPopup();
    };
    
    // 드래그 기능 재등록
    makePopupDraggable(cloudTrailPopup);
    
    console.log('팝업 내용 업데이트 완료');
  });
}

/**
 * CloudTrail 오류 팝업 숨김
 */
function hideCloudTrailPopup() {
  if (cloudTrailPopup) {
    console.log('팝업 숨김');
    cloudTrailPopup.remove();
    cloudTrailPopup = null;
  }
}

/**
 * 팝업 드래그 기능
 */
function makePopupDraggable(popup) {
  const header = popup.querySelector('.popup-header');
  if (!header) return;
  
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;
    
    // 화면 범위 내로 제한
    const maxLeft = window.innerWidth - popup.offsetWidth;
    const maxTop = window.innerHeight - popup.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    popup.style.left = newLeft + 'px';
    popup.style.top = newTop + 'px';
  };
  
  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };
  
  header.onmousedown = (e) => {
    // X 버튼 클릭 시 드래그 방지
    if (e.target.classList.contains('popup-close')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = popup.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
    // 기본 위치 설정 제거
    popup.style.bottom = 'auto';
    popup.style.left = startLeft + 'px';
    popup.style.top = startTop + 'px';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    e.preventDefault();
  };
}

function saveUnreadNotification(message, backgroundColor = null) {
  chrome.storage.local.get(['aws-unread-notifications'], (result) => {
    const unread = result['aws-unread-notifications'] || [];
    unread.push({ message, backgroundColor, timestamp: Date.now() });
    chrome.storage.local.set({ 'aws-unread-notifications': unread }, () => {
      updateNotificationBadge();
    });
  });
}

function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  
  chrome.storage.local.get(['aws-unread-notifications'], (result) => {
    const unread = result['aws-unread-notifications'] || [];
    if (unread.length > 0) {
      badge.textContent = unread.length > 99 ? '99+' : unread.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

function clearNotificationBadge() {
  updateNotificationBadge();
}

// loadUnreadNotifications 기능은 loadChatHistory에 통합됨

// 전역 함수로 등록 (인라인 onclick에서 사용)
window.hideCloudTrailPopup = hideCloudTrailPopup;
window.hideChatbot = hideChatbot;

/**
 * 채팅 내역 저장
 */
function saveChatHistory() {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (messagesContainer) {
    const messages = Array.from(messagesContainer.children).map(msg => ({
      className: msg.className,
      content: msg.innerHTML,
      backgroundColor: msg.style.backgroundColor || null
    }));
    localStorage.setItem('aws-chat-history', JSON.stringify(messages));
  }
}

/**
 * 채팅 내역 복원 (알림 포함)
 */
function loadChatHistory() {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (messagesContainer) {
    const saved = localStorage.getItem('aws-chat-history');
    if (saved) {
      try {
        const messages = JSON.parse(saved);
        messagesContainer.innerHTML = '';
        messages.forEach(msg => {
          const div = document.createElement('div');
          div.className = msg.className;
          div.innerHTML = msg.content;
          if (msg.backgroundColor) {
            div.style.setProperty('background-color', msg.backgroundColor, 'important');
            div.style.setProperty('background', msg.backgroundColor, 'important');
            if (msg.content.includes('🚨 Threat:')) {
              div.classList.add('threat-message');
            }
          }
          messagesContainer.appendChild(div);
        });
      } catch (e) {
        // 기본 메시지
        messagesContainer.innerHTML = `
<div class="message bot-message">
👋 안녕하세요! AWS Cloud Pilot입니다.<br>
🔍 AWS Console 작업을 모니터링하고 있습니다.<br>
</div>
        `;
      }
    } else {
      // 기본 메시지
      messagesContainer.innerHTML = `
<div class="message bot-message">
👋 안녕하세요! AWS Cloud Pilot입니다.<br>
🔍 AWS Console 작업을 모니터링하고 있습니다.<br>
</div>
      `;
    }
    
    // 알림 로드 및 표시
    chrome.storage.local.get(['aws-unread-notifications'], (result) => {
      const unread = result['aws-unread-notifications'] || [];
      
      if (unread.length > 0) {
        unread.forEach((notification) => {
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message bot-message';
          messageDiv.textContent = notification.message;
          if (notification.backgroundColor) {
            messageDiv.style.setProperty('background-color', notification.backgroundColor, 'important');
            messageDiv.style.setProperty('background', notification.backgroundColor, 'important');
            if (notification.message.includes('🚨 Threat:')) {
              messageDiv.classList.add('threat-message');
            }
          }
          messagesContainer.appendChild(messageDiv);
        });
        
        // 채팅 내역 저장
        saveChatHistory();
        
        // 알림 삭제
        chrome.storage.local.remove(['aws-unread-notifications'], () => {
          updateNotificationBadge();
        });
      }
      
      // 스크롤 맨 아래로
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }
}

/**
 * 채팅 내역 지우기
 */
function clearChatHistory() {
  localStorage.removeItem('aws-chat-history');
  loadChatHistory();
}

/**
 * 메시지 추가
 */



function addMessage(text, sender, messageId = null, backgroundColor = null) {
  console.log('addMessage 호출:', { sender, awsChatbotExists: !!awsChatbot });
  
  if (!awsChatbot) {
    console.log('채팅봇 없음 - 알림 저장');
    if (sender === 'bot') {
      saveUnreadNotification(text, backgroundColor);
    }
    return;
  }
  
  console.log('채팅봇에 메시지 추가');
  const messagesContainer = awsChatbot.querySelector('#chatbot-messages');
  if (!messagesContainer) {
    console.log('메시지 컨테이너 없음');
    return;
  }
  
  const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 20;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  if (messageId) {
    messageDiv.id = messageId;
  }
  
  // Value 메시지인 경우 배경색 적용
  if (backgroundColor && text.includes('🚨')) {
    messageDiv.classList.add('value-message');
    messageDiv.style.setProperty('background-color', backgroundColor, 'important');
    messageDiv.style.setProperty('background', backgroundColor, 'important');
  }
  
  // 원본 텍스트 그대로 표시 (특별한 포맷팅 제거)
  messageDiv.style.whiteSpace = 'pre-wrap';
  messageDiv.textContent = text;
  
  messagesContainer.appendChild(messageDiv);
  
  if (isAtBottom) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 채팅 내역 저장
  saveChatHistory();
  console.log('메시지 추가 완료');
}

// 로딩 메시지 제거 함수
function removeLoadingMessage(loadingId) {
  if (!awsChatbot) return;
  const loadingElement = awsChatbot.querySelector(`#${loadingId}`);
  if (loadingElement) {
    loadingElement.remove();
    saveChatHistory();
  }
}

/**
 * 보안 경고 표시
 */
function showSecurityAlert(message) {
  if (!awsChatbot) showChatbot();
  addMessage(`⚠️ 보안 알림: ${message}`, 'bot');
}

let buttonCreateAttempts = 0;
const MAX_BUTTON_ATTEMPTS = 50;

/**
 * 플로팅 버튼 생성
 */
function createFloatingButton() {
  const existingButton = document.getElementById('aws-security-button-container');
  if (existingButton) {
    existingButton.remove();
  }
  
  if (!document.body) {
    setTimeout(createFloatingButton, 100);
    return;
  }
    
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'aws-security-button-container';
  buttonContainer.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    z-index: 99999 !important;
  `;
  
  const button = document.createElement('button');
  button.id = 'aws-security-button';
  button.textContent = '🛡️';
  button.title = 'AWS AWS Cloud Pilot';
    
  button.style.cssText = `
    width: 60px !important;
    height: 60px !important;
    border-radius: 50% !important;
    background: #232f3e !important;
    color: white !important;
    border: none !important;
    font-size: 24px !important;
    cursor: pointer !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    position: relative !important;
  `;
  
  const badge = document.createElement('div');
  badge.id = 'notification-badge';
  badge.style.cssText = `
    position: absolute !important;
    top: -5px !important;
    right: -5px !important;
    background: #ffc107 !important;
    color: #000 !important;
    border-radius: 50% !important;
    width: 20px !important;
    height: 20px !important;
    font-size: 10px !important;
    font-weight: bold !important;
    display: none !important;
    align-items: center !important;
    justify-content: center !important;
    border: 2px solid white !important;
  `;
  
  buttonContainer.appendChild(button);
  buttonContainer.appendChild(badge);
    
  button.onclick = function() {
    toggleChatbot();
  };
    
  document.body.appendChild(buttonContainer);
  updateNotificationBadge();
}

/**
 * AWS Console 페이지 감지 및 초기화
 */
async function initializeOnAwsConsole() {
  // AWS Console 페이지인지 확인
  if (window.location.hostname.includes('console.aws.amazon.com') || 
      window.location.hostname.includes('amazonaws.com')) {
    
    // amazonq-ignore-next-line
    // DOM 로드 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkConsentAndInit, 500);
      });
    } else {
      setTimeout(checkConsentAndInit, 500);
    }
  }
}

async function checkConsentAndInit() {
  // UI 먼저 생성
  initializeUI();
  
  // 동의 확인은 비동기로 처리 (오류 방지)
  setTimeout(async () => {
    try {
      const hasConsent = await chrome.storage.sync.get(['userConsent']);
      if (!hasConsent.userConsent) {
        // ConsentManager 로드 대기 및 다이얼로그 표시
        let attempts = 0;
        const MAX_CONSENT_SHOW_ATTEMPTS = 10; // 시도 횟수 감소
        const showConsent = () => {
          attempts++;
          if (window.ConsentManager && typeof window.ConsentManager.showConsentDialog === 'function') {
            window.ConsentManager.showConsentDialog();
          } else if (attempts < MAX_CONSENT_SHOW_ATTEMPTS) {
            setTimeout(showConsent, 200); // 대기 시간 증가
          }
          // 타임아웃 메시지 제거 (오류 로그 방지)
        };
        showConsent();
      }
    } catch (error) {
      // 동의 확인 실패는 조용히 무시
    }
  }, 2000);
// amazonq-ignore-next-line
}
// amazonq-ignore-next-line

/**
 * UI 초기화
 */
function initializeUI() {
  createFloatingButton();
}

/**
 * 페이지 변경 감지 (SPA 대응) - 안전 버전
 */
// amazonq-ignore-next-line
let currentUrl = window.location.href;
let pageObserver = null;
// amazonq-ignore-next-line
let observerSetupAttempts = 0;
const MAX_OBSERVER_ATTEMPTS = 5;

function setupPageObserver() {
  if (observerSetupAttempts >= MAX_OBSERVER_ATTEMPTS) {
    console.warn('MutationObserver 설정 최대 시도 횟수 초과');
    return;
  }
  
  observerSetupAttempts++;
  
  try {
    // 기존 observer 정리
    if (pageObserver) {
      pageObserver.disconnect();
      pageObserver = null;
    }
    
    // DOM 요소 존재 확인
    if (!document || !document.body) {
      setTimeout(setupPageObserver, 1000);
      return;
    }
    
    // MutationObserver 생성 및 설정
    pageObserver = new MutationObserver((mutations) => {
      try {
        // URL 변경 감지
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          console.log('페이지 변경 감지, UI 재생성:', currentUrl);
          
          // UI 재생성
          
          // UI 재생성
          setTimeout(createFloatingButton, 1000);
        }
        
        // 버튼이 DOM에서 제거되었는지 확인
        if (!document.getElementById('aws-security-button')) {
          setTimeout(createFloatingButton, 500);
        }
      } catch (error) {
        console.warn('MutationObserver 콜백 오류:', error);
      }
    });
    
    // 안전하게 observe 시작 - Node 타입 확인
    if (document.body && document.body.nodeType === Node.ELEMENT_NODE) {
      pageObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      throw new Error('document.body is not a valid Node');
    }
    
    console.log('MutationObserver 설정 완료');
    
  } catch (error) {
    console.warn(`MutationObserver 설정 실패 (시도 ${observerSetupAttempts}):`, error);
    
    // 재시도
    if (observerSetupAttempts < MAX_OBSERVER_ATTEMPTS) {
      setTimeout(setupPageObserver, 2000);
    }
  }
}

// 안전한 Observer 설정
function initPageObserver() {
  if (document.readyState === 'complete') {
    // amazonq-ignore-next-line
    setTimeout(setupPageObserver, 500);
  } else if (document.readyState === 'interactive') {
    setTimeout(setupPageObserver, 1000);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(setupPageObserver, 1000);
    });
  }
}

// 초기화
initPageObserver();

// 백그라운드에서 오는 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('메시지 수신:', request.action);
  
  if (request.action === 'addChatMessage') {
    console.log('백그라운드에서 메시지 수신:', request.message.substring(0, 50));
    
    try {
      // 채팅봇이 열려있는지 확인
      if (!awsChatbot) {
        console.log('채팅봇 닫혀있음 - 실패 응답');
        sendResponse({ success: false, reason: 'chatbot_closed' });
        return true;
      }
      
      // 메시지 추가 (배경색 정보 포함)
      addMessage(request.message, request.sender, null, request.backgroundColor);
      console.log('응답 전송: success');
      sendResponse({ success: true });
    } catch (error) {
      console.error('메시지 처리 오류:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  } else if (request.action === 'updateNotificationBadge') {
    // 백그라운드에서 배지 업데이트 요청
    const badge = document.getElementById('notification-badge');
    if (badge && request.count > 0) {
      badge.textContent = request.count > 99 ? '99+' : request.count;
      badge.style.display = 'flex';
    }
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'removeLoadingMessage') {
    // 로딩 메시지 제거
    removeLoadingMessage(request.loadingId);
    sendResponse({ success: true });
    return true;
  }
  return false;
});

// 초기화
initializeOnAwsConsole();