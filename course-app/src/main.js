import './index.css';
import { marked } from 'marked';
import Fuse from 'fuse.js';
import * as d3 from 'd3';

let courseData = null;

async function init() {
  document.querySelector('#app').innerHTML = `
    <div style="margin: auto; color: var(--text-muted);">Loading Knowledge Base...</div>
  `;

  try {
    const res = await fetch('/course-data.json');
    courseData = await res.json();
    
    // Initialize search
    fuse = new Fuse(courseData.pages, {
      keys: ['title', 'area', 'tags', 'body'],
      threshold: 0.3
    });
    
    renderApp();
  } catch (err) {
    document.querySelector('#app').innerHTML = `
      <div style="margin: auto; color: #ff7b72;">Failed to load data: ${err.message}</div>
    `;
  }
}

function renderApp() {
  // Setup routing simple hash router
  window.addEventListener('hashchange', handleRoute);
  
  // Initial route
  if (!window.location.hash) {
    window.location.hash = '#/home';
  } else {
    handleRoute();
  }
}

function handleRoute() {
  const hash = window.location.hash.slice(1);
  const app = document.querySelector('#app');
  
  // Create Sidebar
  const sidebarHtml = `
    <div class="sidebar">
      <h2>SystemDesignAI</h2>
      <input type="text" id="searchInput" class="search-input" placeholder="Search concepts..." autocomplete="off">
      <div id="searchResults" style="margin-bottom: 20px;"></div>
      <a href="#/home" class="nav-item ${hash === '/home' ? 'active' : ''}">Home Dashboard</a>
      <a href="#/ask" class="nav-item ${hash === '/ask' ? 'active' : ''}">Ask AI</a>
      <a href="#/areas" class="nav-item ${hash === '/areas' ? 'active' : ''}">Explore Areas</a>
      <a href="#/graph" class="nav-item ${hash === '/graph' ? 'active' : ''}">Knowledge Graph</a>
      <a href="#/quiz" class="nav-item ${hash === '/quiz' ? 'active' : ''}">Active Recall Quiz</a>
    </div>
  `;

  let mainHtml = '';
  
  if (hash === '/home') {
    mainHtml = renderHome();
  } else if (hash === '/ask') {
    mainHtml = renderAsk();
  } else if (hash === '/areas') {
    mainHtml = renderAreas();
  } else if (hash === '/graph') {
    // Render graph without standard padding/max-width
    mainHtml = '<div id="graph-container" style="width: 100%; height: 100vh; margin: -40px -60px;"></div>';
  } else if (hash === '/quiz') {
    mainHtml = renderQuizSetup();
  } else if (hash.startsWith('/page/')) {
    const pageId = decodeURIComponent(hash.split('/page/')[1]);
    mainHtml = renderPage(pageId);
  } else {
    mainHtml = `<div>Not found</div>`;
  }

  // Adjust container class for graph full width
  const contentStyle = hash === '/graph' ? 'flex: 1; overflow: hidden;' : '';
  const contentClass = hash === '/graph' ? '' : 'main-content animate-fade-in';
  app.innerHTML = sidebarHtml + `<div class="${contentClass}" style="${contentStyle}">${mainHtml}</div>`;
  
  // Attach search listener
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      const resContainer = document.getElementById('searchResults');
      if (!q) {
        resContainer.innerHTML = '';
        return;
      }
      const results = fuse.search(q).slice(0, 5);
      resContainer.innerHTML = results.map(r => `
        <a href="#/page/${encodeURIComponent(r.item.id)}" class="search-result">
          <div style="font-weight: 600; font-size: 0.9rem;">${r.item.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${r.item.area}</div>
        </a>
      `).join('');
    });
  }

  // Attach search listener for Home Search (if present)
  const homeSearchInput = document.getElementById('homeSearchInput');
  if (homeSearchInput) {
    homeSearchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      const resContainer = document.getElementById('homeSearchResults');
      if (!q) {
        resContainer.innerHTML = '';
        return;
      }
      const results = fuse.search(q).slice(0, 8);
      resContainer.innerHTML = results.map(r => `
        <a href="#/page/${encodeURIComponent(r.item.id)}" class="search-result" style="padding: 12px 16px; font-size: 1.05rem;">
          <div style="font-weight: 600;">${r.item.title}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${r.item.area}</div>
        </a>
      `).join('');
    });
  }

  // Trigger post-render hooks
  if (hash === '/graph') {
    setTimeout(initGraph, 50);
  } else if (hash === '/quiz') {
    setTimeout(initQuizControls, 50);
  } else if (hash === '/ask') {
    setTimeout(initAskLogic, 50);
  }
}

let fuse = null;

function renderHome() {
  const totalPages = courseData.pages.length;
  const maturePages = courseData.pages.filter(p => p.status === 'mature' || p.status === 'comprehensive').length;
  
  return `
    <div class="markdown-body">
      <div style="text-align: center; margin-bottom: 50px; margin-top: 20px;">
        <h1 style="font-size: 3rem; margin-bottom: 10px;">SystemDesignAI</h1>
        <p style="font-size: 1.2rem; color: var(--text-muted);">What do you want to learn today?</p>
      </div>
      
      <div style="position: relative; margin-bottom: 60px;">
        <input type="text" id="homeSearchInput" class="search-input" style="font-size: 1.3rem; padding: 20px 24px; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.4);" placeholder="Search concepts, algorithms, databases..." autocomplete="off">
        <div id="homeSearchResults" style="position: absolute; top: 100%; left: 0; right: 0; background: var(--glass-bg); border: 1px solid var(--border-color); border-radius: 12px; backdrop-filter: blur(10px); z-index: 100; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);"></div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="card">
          <h3 style="color: #fff; margin-bottom: 10px;">Vault Mastery</h3>
          <div style="font-size: 2rem; color: var(--accent); font-weight: 700;">
            ${Math.round((maturePages / totalPages) * 100)}%
          </div>
          <div style="color: var(--text-muted); font-size: 0.9rem;">Concepts marked mature or comprehensive</div>
        </div>
        <div class="card">
          <h3 style="color: #fff; margin-bottom: 10px;">Active Recall</h3>
          <div style="font-size: 2rem; color: #3fb950; font-weight: 700;">
            ${courseData.pages.reduce((acc, p) => acc + (p.recall_questions?.length || 0), 0)}
          </div>
          <div style="color: var(--text-muted); font-size: 0.9rem;">Flashcards ready for review</div>
        </div>
      </div>
      
      <h2>Recently Added</h2>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${courseData.pages.slice(0, 5).map(p => `
          <a href="#/page/${encodeURIComponent(p.id)}" class="card" style="display: block; text-decoration: none; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #fff; font-weight: 600;">${p.title}</span>
              <span class="tag tag-${p.area}">${p.area}</span>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAreas() {
  return `
    <div class="markdown-body">
      <h1>Architectural Areas</h1>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
        ${courseData.areas.map(area => {
          const count = courseData.pages.filter(p => p.area === area).length;
          return `
            <div class="card">
              <h3 style="color: #fff; margin-bottom: 8px; text-transform: capitalize;">${area.replace(/-/g, ' ')}</h3>
              <p style="color: var(--text-muted); margin-bottom: 16px;">${count} concepts</p>
              <div style="max-height: 200px; overflow-y: auto;">
                ${courseData.pages.filter(p => p.area === area).map(p => `
                  <div style="margin-bottom: 6px;">
                    <a href="#/page/${encodeURIComponent(p.id)}" style="font-size: 0.9rem;">${p.title}</a>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function processWikilinks(text) {
  // Convert [[Page Title]] to hash links
  return text.replace(/\\[\\[(.*?)(?:\\|(.*?))?\\]\\]/g, (match, target, alias) => {
    const display = alias || target;
    return `<a href="#/page/${encodeURIComponent(target)}">${display}</a>`;
  });
}

function renderPage(id) {
  const page = courseData.pages.find(p => p.id === id || p.title === id);
  if (!page) {
    return `<div class="markdown-body"><h1>404</h1><p>Page "${id}" not found.</p></div>`;
  }

  let htmlBody = marked.parse(page.body);
  htmlBody = processWikilinks(htmlBody);

  return `
    <div class="markdown-body">
      <div style="margin-bottom: 20px;">
        <span class="tag tag-${page.area}">${page.area}</span>
        <span class="tag tag-default">${page.status}</span>
        <span class="tag tag-default">${page.difficulty}</span>
      </div>
      <h1>${page.title}</h1>
      ${htmlBody}
    </div>
  `;
}

init();

function initGraph() {
  const container = document.getElementById('graph-container');
  if (!container || !courseData.graph) return;
  container.innerHTML = '<svg id="d3-svg" style="width: 100%; height: 100vh; border-radius: 0; border: none;"></svg>';
  
  const width = container.clientWidth;
  const height = container.clientHeight || window.innerHeight;
  
  const svg = d3.select("#d3-svg").attr("viewBox", [0, 0, width, height]);
  
  // Add zooming container
  const g = svg.append("g");
  
  svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      }));
  
  const nodes = courseData.graph.nodes.map(d => ({...d}));
  const links = courseData.graph.edges.map(d => ({...d}));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(25));

  const link = g.append("g")
      .attr("class", "link")
    .selectAll("line")
    .data(links)
    .join("line");

  const node = g.append("g")
      .attr("class", "node")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(simulation));

  // Use the same area colors
  const colorMap = {
    'databases': '#3fb950',
    'networking': '#bc8cff',
    'distributed-systems': '#d29922',
    'caching': '#58a6ff'
  };

  node.append("circle")
      .attr("r", 8)
      .attr("fill", d => colorMap[d.group] || '#8b949e')
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        window.location.hash = '#/page/' + encodeURIComponent(d.id);
      });

  node.append("text")
      .text(d => d.id)
      .attr('x', 12)
      .attr('y', 4)
      .style("font-size", "12px");

  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    node
        .attr("transform", d => `translate(${d.x},${d.y})`);
  });

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }
}

// --- Quiz Logic ---
let quizDeck = [];
let currentCardIndex = 0;

function renderQuizSetup() {
  const areas = courseData.areas;
  return `
    <div class="markdown-body">
      <h1>Active Recall Quiz</h1>
      <p>Select an architectural area to test your knowledge.</p>
      <select id="quizArea" style="padding: 8px; border-radius: 4px; background: #161b22; color: #fff; border: 1px solid #30363d;">
        <option value="all">All Areas</option>
        ${areas.map(a => `<option value="${a}">${a}</option>`).join('')}
      </select>
      <button class="btn btn-primary" id="startQuizBtn" style="margin-left: 10px;">Start Quiz</button>
      <div id="quizWorkspace" style="margin-top: 30px;"></div>
    </div>
  `;
}

function initQuizControls() {
  const startBtn = document.getElementById('startQuizBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const area = document.getElementById('quizArea').value;
      
      // Build deck
      quizDeck = [];
      courseData.pages.forEach(p => {
        if ((area === 'all' || p.area === area) && p.recall_questions && p.recall_questions.length > 0) {
          p.recall_questions.forEach(q => {
            quizDeck.push({
              question: marked.parseInline(q.question),
              answer: marked.parseInline(q.answer),
              concept: p.title,
              area: p.area
            });
          });
        }
      });
      
      // Shuffle
      quizDeck.sort(() => Math.random() - 0.5);
      currentCardIndex = 0;
      
      renderCurrentCard();
    });
  }
}

function renderCurrentCard() {
  const workspace = document.getElementById('quizWorkspace');
  if (quizDeck.length === 0) {
    workspace.innerHTML = '<p>No questions found for this selection.</p>';
    return;
  }
  
  if (currentCardIndex >= quizDeck.length) {
    workspace.innerHTML = '<h2>Quiz Complete! 🎉</h2>';
    return;
  }
  
  const card = quizDeck[currentCardIndex];
  
  workspace.innerHTML = `
    <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">
      Card ${currentCardIndex + 1} of ${quizDeck.length} &middot; <span class="tag tag-${card.area}">${card.area}</span> &middot; ${card.concept}
    </div>
    <div class="flashcard-container" id="cardContainer">
      <div class="flashcard" id="flashcard">
        <div class="flashcard-face">
          <div style="font-size: 1.2rem; font-weight: 600; color: #fff;">${card.question}</div>
          <div style="margin-top: 20px; font-size: 0.85rem; color: var(--text-muted);">(Click to flip)</div>
        </div>
        <div class="flashcard-face flashcard-back">
          <div style="font-size: 1.1rem; line-height: 1.6;">${card.answer}</div>
        </div>
      </div>
    </div>
    <div class="quiz-controls" id="quizControls" style="display: none;">
      <button class="btn" id="btnWrong">Hard (Again)</button>
      <button class="btn btn-primary" id="btnRight">Good (Next)</button>
    </div>
  `;
  
  const flashcard = document.getElementById('flashcard');
  flashcard.addEventListener('click', () => {
    flashcard.classList.add('is-flipped');
    document.getElementById('quizControls').style.display = 'flex';
  }, { once: true });
  
  document.getElementById('btnRight')?.addEventListener('click', () => {
    currentCardIndex++;
    renderCurrentCard();
  });
  
  document.getElementById('btnWrong')?.addEventListener('click', () => {
    // Put at end of deck
    quizDeck.push(quizDeck[currentCardIndex]);
    currentCardIndex++;
    renderCurrentCard();
  });
}

// --- Ask AI Logic ---
let askState = {
  question: "",
  answer: "",
  area: "unknown",
  metaHtml: "",
  isStreaming: false,
  isDone: false
};

function renderAsk() {
  return `
    <div class="markdown-body">
      <h1>Ask SystemDesignAI</h1>
      <p>Ask a question about system architecture. The AI will search your vault and synthesize an answer in real-time.</p>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <input type="text" id="askInput" class="search-input" style="flex: 1; margin: 0; font-size: 1.1rem; padding: 12px 16px;" placeholder="e.g. Compare Redis and MongoDB" autocomplete="off" value="${askState.question.replace(/"/g, '&quot;')}" ${askState.isStreaming ? 'disabled' : ''} />
        <button id="askBtn" class="btn btn-primary" style="font-size: 1.1rem; padding: 0 24px;" ${askState.isStreaming ? 'disabled' : ''}>Ask</button>
      </div>

      <div id="askWorkspace" style="margin-top: 30px; display: ${askState.question || askState.isStreaming ? 'block' : 'none'};">
        <div id="askMeta" style="margin-bottom: 15px; font-size: 0.9rem; color: var(--text-muted);">${askState.metaHtml}</div>
        <div id="askResponse" class="card" style="min-height: 100px; padding: 24px; display: ${askState.isDone ? 'none' : 'block'};">${askState.answer ? marked.parse(askState.answer) : (askState.isStreaming ? "<em style='color: var(--text-muted);'>Generating answer...</em>" : "")}</div>
        
        <textarea id="editAnswer" class="edit-area" style="display: ${askState.isDone ? 'block' : 'none'};">${askState.answer.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
        
        <div id="promotionArea" style="display: none;"></div>

        <div id="askActions" style="margin-top: 20px; display: ${askState.isDone ? 'block' : 'none'}; text-align: right;">
          <button id="saveInsightBtn" class="btn btn-primary">Promote to Vault</button>
        </div>
      </div>
    </div>
  `;
}

function initAskLogic() {
  const askInput = document.getElementById('askInput');
  const askBtn = document.getElementById('askBtn');
  const workspace = document.getElementById('askWorkspace');
  const saveBtn = document.getElementById('saveInsightBtn');

  // Prevent duplicate listeners if navigating back
  if (askBtn.hasAttribute('data-bound')) return;
  askBtn.setAttribute('data-bound', 'true');

  async function submitQuestion() {
    const q = askInput.value.trim();
    if (!q) return;
    
    askState.question = q;
    askState.answer = "";
    askState.area = "unknown";
    askState.metaHtml = "<em>Searching vault...</em>";
    askState.isStreaming = true;
    askState.isDone = false;
    
    // Refresh DOM for immediate feedback
    if (document.getElementById('askBtn')) document.getElementById('askBtn').disabled = true;
    if (document.getElementById('askInput')) document.getElementById('askInput').disabled = true;
    if (document.getElementById('askWorkspace')) document.getElementById('askWorkspace').style.display = 'block';
    if (document.getElementById('askActions')) document.getElementById('askActions').style.display = 'none';
    if (document.getElementById('promotionArea')) document.getElementById('promotionArea').style.display = 'none';
    if (document.getElementById('editAnswer')) document.getElementById('editAnswer').style.display = 'none';
    
    // Reset the promote button for the new question
    if (document.getElementById('saveInsightBtn')) {
      document.getElementById('saveInsightBtn').style.display = 'inline-block';
      document.getElementById('saveInsightBtn').disabled = false;
      document.getElementById('saveInsightBtn').innerText = 'Promote to Vault';
    }
    
    if (document.getElementById('askResponse')) {
      document.getElementById('askResponse').style.display = 'block';
      document.getElementById('askResponse').innerHTML = "<em style='color: var(--text-muted);'>Generating answer...</em>";
    }
    if (document.getElementById('askMeta')) document.getElementById('askMeta').innerHTML = askState.metaHtml;

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      
      if (document.getElementById('askResponse')) document.getElementById('askResponse').innerHTML = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();
        
        for (let part of parts) {
          const lines = part.split('\n');
          for (let line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') {
                askState.isDone = true;
                askState.isStreaming = false;
                if (document.getElementById('askActions')) document.getElementById('askActions').style.display = 'block';
                if (document.getElementById('askResponse')) document.getElementById('askResponse').style.display = 'none';
                if (document.getElementById('editAnswer')) {
                  document.getElementById('editAnswer').style.display = 'block';
                  document.getElementById('editAnswer').value = askState.answer;
                }
                break;
              }
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'meta') {
                  askState.area = data.area;
                  askState.metaHtml = `Source matched: <span class="tag tag-${data.area}">${data.area}</span> <strong>${data.page}</strong>`;
                  if (document.getElementById('askMeta')) document.getElementById('askMeta').innerHTML = askState.metaHtml;
                } else if (data.type === 'chunk') {
                  askState.answer += data.text;
                  if (document.getElementById('askResponse')) document.getElementById('askResponse').innerHTML = marked.parse(askState.answer);
                } else if (data.type === 'error') {
                  askState.answer += `<br><span style="color: #ff7b72;">Error: ${data.text}</span>`;
                  if (document.getElementById('askResponse')) document.getElementById('askResponse').innerHTML = askState.answer;
                }
              } catch (e) { console.error("Parse error:", e, dataStr); }
            }
          }
        }
      }
    } catch (err) {
      if (document.getElementById('askResponse')) document.getElementById('askResponse').innerHTML = `<span style="color: #ff7b72;">Connection error: ${err.message}</span>`;
    } finally {
      askState.isStreaming = false;
      if (document.getElementById('askBtn')) document.getElementById('askBtn').disabled = false;
      if (document.getElementById('askInput')) document.getElementById('askInput').disabled = false;
    }
  }

  askBtn.addEventListener('click', submitQuestion);
  askInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitQuestion();
  });

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.innerText = "Analyzing for Promotion...";
    const editArea = document.getElementById('editAnswer');
    if (editArea) {
      askState.answer = editArea.value;
    }
    
    try {
      const res = await fetch('/api/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askState.question,
          answer: askState.answer,
          area: askState.area
        })
      });
      const data = await res.json();
      
      const promoArea = document.getElementById('promotionArea');
      if (promoArea) {
        promoArea.style.display = 'block';
        if (data.status === 'success' && data.analysis && data.analysis.Promotion === 'APPROVED') {
          saveBtn.style.display = 'none'; // hide the initial promote button
          promoArea.innerHTML = `
            <div class="promotion-modal">
              <h3>✅ Promotion Approved (Confidence: ${data.analysis.Confidence})</h3>
              <p><strong>Type:</strong> ${data.analysis['Promotion Type']}</p>
              <p><strong>Target:</strong> ${data.analysis['Target File']}</p>
              <p><strong>Reason:</strong> ${data.analysis.Reason}</p>
              <div style="margin-top: 16px;">
                <p><strong>Suggested Knowledge:</strong></p>
                <div class="card" style="margin-top: 8px; padding: 16px; background: #0d1117;">
                  ${marked.parse(data.analysis['Suggested Markdown'] || "")}
                </div>
              </div>
              <div style="text-align: right; margin-top: 16px;">
                <button id="confirmPromoBtn" class="btn btn-primary">Confirm & Update Vault</button>
              </div>
            </div>
          `;
          
          document.getElementById('confirmPromoBtn').addEventListener('click', async () => {
            const confBtn = document.getElementById('confirmPromoBtn');
            confBtn.disabled = true;
            confBtn.innerText = "Updating Vault...";
            
            try {
              const cRes = await fetch('/api/confirm_promotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  analysis: data.analysis,
                  area: askState.area
                })
              });
              const cData = await cRes.json();
              if (cData.status === 'success') {
                confBtn.innerText = "✅ Vault Updated!";
                // Refresh the course data
                setTimeout(async () => {
                  const freshRes = await fetch('/course-data.json');
                  courseData = await freshRes.json();
                  fuse = new Fuse(courseData.pages, {
                    keys: ['title', 'area', 'tags', 'body'],
                    threshold: 0.3
                  });
                }, 1000);
              } else {
                confBtn.innerText = "Error: " + cData.message;
              }
            } catch (err) {
              confBtn.innerText = "Error saving: " + err.message;
            }
          });

        } else {
          // Rejected
          saveBtn.innerText = "Promote to Vault";
          saveBtn.disabled = false;
          let reason = data.analysis ? data.analysis.Reason : data.message || "Unknown error";
          promoArea.innerHTML = `
            <div class="promotion-modal" style="border-color: #ff7b72;">
              <h3 style="color: #ff7b72;">❌ Promotion Rejected</h3>
              <p>${reason}</p>
            </div>
          `;
        }
      }
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.innerText = "Error: " + err.message;
    }
  });
}
