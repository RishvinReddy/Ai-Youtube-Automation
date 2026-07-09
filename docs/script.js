// Initialize Lucide Icons
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once animated to keep it visible
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with .fade-up class
    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => observer.observe(el));

    // Smooth Scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all
            faqItems.forEach(faq => faq.classList.remove('active'));
            
            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Live Simulation Controller
    const btnRunSim = document.getElementById('btnRunSim');
    const btnResetSim = document.getElementById('btnResetSim');
    const simTopic = document.getElementById('simTopic');
    const simVoice = document.getElementById('simVoice');
    const simStyle = document.getElementById('simStyle');
    const simTerminalOutput = document.getElementById('simTerminalOutput');
    const simProgressBar = document.getElementById('simProgressBar');
    const simVisualOutput = document.getElementById('simVisualOutput');
    const networkLogs = document.getElementById('networkLogs');
    
    // Checklist items
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');
    const step5 = document.getElementById('step-5');
    
    let simTimeouts = [];
    let isSimRunning = false;
    let spinnerInterval;

    const fakeHash = () => 'sha256-' + Math.random().toString(36).substring(2, 12);

    function addNetworkLog(method, url, statusClass, statusText) {
        if (networkLogs.innerHTML.includes('Idle...')) {
            networkLogs.innerHTML = '';
        }
        const div = document.createElement('div');
        div.className = 'net-log';
        div.innerHTML = `<span class="net-method net-${method.toLowerCase()}">[${method}]</span> <span class="net-url">${url}</span> - <span class="${statusClass}">${statusText}</span>`;
        networkLogs.appendChild(div);
        networkLogs.scrollTop = networkLogs.scrollHeight;
    }

    function addLog(text, type = 'info', useSpinner = false) {
        // Handle removing previous spinner safely
        const oldSpinner = document.querySelector('.spinner');
        if (oldSpinner) {
            clearInterval(spinnerInterval);
            oldSpinner.remove();
        }

        const div = document.createElement('div');
        div.className = `log-line log-${type}`;
        const timestamp = new Date().toISOString().substring(11, 19);
        
        let spinnerHtml = useSpinner ? '<span class="spinner">|</span> ' : '';
        div.innerHTML = `[${timestamp}] ${spinnerHtml}${text}`;
        simTerminalOutput.appendChild(div);
        
        if (useSpinner) {
            const spinnerEl = div.querySelector('.spinner');
            const frames = ['|', '/', '-', '\\'];
            let frameIdx = 0;
            spinnerInterval = setInterval(() => {
                spinnerEl.textContent = frames[frameIdx];
                frameIdx = (frameIdx + 1) % frames.length;
            }, 100);
        }
        
        const terminal = document.querySelector('.sim-terminal');
        terminal.scrollTop = terminal.scrollHeight;
    }

    function updateStep(stepEl, status) {
        stepEl.className = `step-${status}`;
        
        let iconName = 'circle';
        if (status === 'active') iconName = 'loader';
        else if (status === 'done') iconName = 'check-circle-2';
        
        let icon = stepEl.querySelector('i, svg');
        if (icon) {
            const newIcon = document.createElement('i');
            newIcon.setAttribute('data-lucide', iconName);
            icon.replaceWith(newIcon);
        }
        
        lucide.createIcons();
    }

    function addVisualBlock(html) {
        const div = document.createElement('div');
        div.className = 'visual-block';
        div.innerHTML = html;
        simVisualOutput.appendChild(div);
        lucide.createIcons();
    }

    function resetSim() {
        simTimeouts.forEach(clearTimeout);
        simTimeouts = [];
        clearInterval(spinnerInterval);
        isSimRunning = false;
        simTerminalOutput.innerHTML = '<span class="comment">Waiting for webhook trigger...</span>';
        simVisualOutput.innerHTML = '';
        simProgressBar.style.width = '0%';
        simProgressBar.classList.remove('processing');
        btnRunSim.disabled = false;
        btnRunSim.textContent = 'Run Pipeline';
        
        [step1, step2, step3, step4, step5].forEach(step => updateStep(step, 'pending'));
    }

    btnResetSim.addEventListener('click', resetSim);

    btnRunSim.addEventListener('click', () => {
        if (isSimRunning) return;
        
        const topic = simTopic.value.trim() || 'Default Demo Topic';
        const voice = simVoice.options[simVoice.selectedIndex].text;
        const style = simStyle.options[simStyle.selectedIndex].text;
        
        resetSim();
        isSimRunning = true;
        btnRunSim.disabled = true;
        btnRunSim.textContent = 'Pipeline Running...';
        simTerminalOutput.innerHTML = '';
        simVisualOutput.innerHTML = '';
        networkLogs.innerHTML = '';
        simProgressBar.classList.add('processing');
        
        const hash = fakeHash();
        
        // 1. Trigger
        simTimeouts.push(setTimeout(() => {
            updateStep(step1, 'active');
            simProgressBar.style.width = '5%';
            addLog(`Webhook received payload. Topic: "${topic}", ${voice}, ${style}`, 'info');
        }, 0));
        
        // 2. Idempotency Lock
        simTimeouts.push(setTimeout(() => {
            updateStep(step1, 'done');
            updateStep(step2, 'active');
            simProgressBar.style.width = '20%';
            addLog(`Generating SHA-256 fingerprint: ${hash}`, 'system');
            addNetworkLog('POST', 'api.supabase.co/rest/v1/rpc/admit_job', 'net-status-200', '200 OK');
        }, 1000));
        
        simTimeouts.push(setTimeout(() => addLog(`Supabase: Invoking admit_content_factory_job RPC...`, 'info', true), 1500));
        
        const isDuplicate = Math.random() < 0.1;
        if (isDuplicate) {
            simTimeouts.push(setTimeout(() => {
                addLog(`[REJECTED] Duplicate job found! Execution halted to save API costs.`, 'error');
                updateStep(step2, 'pending');
                isSimRunning = false;
                btnRunSim.disabled = false;
                btnRunSim.textContent = 'Run Pipeline';
                simProgressBar.classList.remove('processing');
                addNetworkLog('POST', 'api.supabase.co/rest/v1/rpc/admit_job', 'net-status-404', '409 Conflict');
            }, 2500));
            return;
        }

        simTimeouts.push(setTimeout(() => {
            addLog(`[ACCEPTED] Lock acquired. Database status: received`, 'success');
        }, 2500));
        
        // 3. AI Generation
        simTimeouts.push(setTimeout(() => {
            updateStep(step2, 'done');
            updateStep(step3, 'active');
            simProgressBar.style.width = '40%';
            addLog(`Tavily: Searching for real-time context...`, 'system', true);
            addNetworkLog('GET', 'api.tavily.com/search', 'net-status-200', '200 OK');
        }, 3200));
        
        simTimeouts.push(setTimeout(() => {
            addLog(`OpenAI (GPT-4o): Generating script and scenes...`, 'system', true);
            addNetworkLog('POST', 'api.openai.com/v1/chat/completions', 'net-status-200', 'Processing...');
        }, 4500));
        
        simTimeouts.push(setTimeout(() => {
            addLog(`OpenAI: Script complete. 1,402 tokens generated.`, 'success');
            addNetworkLog('POST', 'api.openai.com/v1/chat/completions', 'net-status-200', '200 OK');
            addVisualBlock(`
                <div class="visual-header"><i data-lucide="file-json"></i> OpenAI Script Output</div>
                <div class="visual-content">
                    <div class="fake-code">{
  "title": "${topic} - Explained",
  "scenes": [
    { "id": 1, "narration": "Welcome...", "prompt": "Cinematic wide shot..." },
    { "id": 2, "narration": "Did you know...", "prompt": "Macro detail shot..." }
  ]
}</div>
                </div>
            `);
        }, 6500));
        
        simTimeouts.push(setTimeout(() => {
            addLog(`ElevenLabs: Rendering text-to-speech audio...`, 'system', true);
            addNetworkLog('POST', 'api.elevenlabs.io/v1/text-to-speech', 'net-status-200', '200 OK');
        }, 7000));
        
        simTimeouts.push(setTimeout(() => {
            addLog(`DALL-E 3: Generating 4 scene images...`, 'system', true);
            addNetworkLog('POST', 'api.openai.com/v1/images/generations', 'net-status-200', '200 OK');
        }, 8500));
        
        simTimeouts.push(setTimeout(() => {
            addLog(`AI Generation tasks completed successfully.`, 'success');
            addVisualBlock(`
                <div class="visual-header"><i data-lucide="image"></i> DALL-E 3 Images</div>
                <div class="visual-content visual-images">
                    <img src="https://picsum.photos/seed/ai1/400/225" alt="Scene 1">
                    <img src="https://picsum.photos/seed/ai2/400/225" alt="Scene 2">
                    <img src="https://picsum.photos/seed/ai3/400/225" alt="Scene 3">
                    <img src="https://picsum.photos/seed/ai4/400/225" alt="Scene 4">
                </div>
            `);
        }, 10500));
        
        // 4. Video Render
        simTimeouts.push(setTimeout(() => {
            updateStep(step3, 'done');
            updateStep(step4, 'active');
            simProgressBar.style.width = '60%';
            addLog(`Creatomate: Starting video render...`, 'info');
            addNetworkLog('POST', 'api.creatomate.com/v1/renders', 'net-status-200', '202 Accepted');
        }, 11500));
        
        simTimeouts.push(setTimeout(() => { 
            simProgressBar.style.width = '70%'; 
            addLog(`n8n: Polling render status... 25%`, 'system', true); 
            addNetworkLog('GET', 'api.creatomate.com/v1/renders/xyz', 'net-status-200', '200 OK (25%)');
        }, 12500));
        
        simTimeouts.push(setTimeout(() => { 
            simProgressBar.style.width = '85%'; 
            addLog(`n8n: Polling render status... 80%`, 'system', true); 
            addNetworkLog('GET', 'api.creatomate.com/v1/renders/xyz', 'net-status-200', '200 OK (80%)');
        }, 14000));
        
        simTimeouts.push(setTimeout(() => { 
            simProgressBar.style.width = '95%'; 
            addLog(`n8n: Polling render status... 100% (Render complete)`, 'success'); 
            addNetworkLog('GET', 'api.creatomate.com/v1/renders/xyz', 'net-status-200', '200 OK (100%)');
        }, 15500));
        
        // 5. Publish
        simTimeouts.push(setTimeout(() => {
            updateStep(step4, 'done');
            updateStep(step5, 'active');
            addLog(`YouTube: Uploading MP4...`, 'info', true);
            addNetworkLog('POST', 'youtube.googleapis.com/youtube/v3/videos', 'net-status-200', 'Uploading...');
        }, 16500));
        
        simTimeouts.push(setTimeout(() => {
            simProgressBar.style.width = '100%';
            updateStep(step5, 'done');
            addLog(`YouTube: Video published! (Video ID: dQw4w9WgXcQ)`, 'success');
            addNetworkLog('POST', 'youtube.googleapis.com/youtube/v3/videos', 'net-status-200', '200 OK');
            addVisualBlock(`
                <div class="visual-header"><i data-lucide="youtube"></i> Published to YouTube</div>
                <div class="visual-content">
                    <div class="fake-youtube">
                        <img src="https://picsum.photos/seed/yt/1280/720" alt="Thumbnail">
                        <div class="youtube-play"><i data-lucide="play"></i></div>
                    </div>
                </div>
            `);
        }, 18500));
        
        simTimeouts.push(setTimeout(() => {
            addLog(`Slack: Sent success notification to #content-factory.`, 'system');
            addNetworkLog('POST', 'hooks.slack.com/services/...', 'net-status-200', '200 OK');
        }, 19000));
        
        simTimeouts.push(setTimeout(() => {
            addLog(`PIPELINE FINISHED. Total Execution Time: 19.5s`, 'info');
            const fakeUrl = 'https://youtu.be/dQw4w9WgXcQ';
            addLog(`View Video: <a href="${fakeUrl}" target="_blank" style="color: #60a5fa">${fakeUrl}</a>`, 'success');
            isSimRunning = false;
            btnRunSim.disabled = false;
            btnRunSim.textContent = 'Run Pipeline Again';
            simProgressBar.classList.remove('processing');
        }, 19500));
    });

    // Hero Section Typing Animation
    const heroTerminal = document.getElementById('heroTerminalOutput');
    if (heroTerminal) {
        const commandText = `curl -X POST "https://n8n.yourdomain.com/webhook/v3-ai-factory" \\
     -H "Content-Type: application/json" \\
     -d '{
           "topic": "The Future of Quantum Computing in 2026",
           "audience": "technology enthusiasts",
           "tone": "educational and inspiring",
           "language": "English"
         }'`;

        const responseText = `\n\n<span class="comment"># Immediate Response (202 Accepted)</span>
{
  <span class="property">"status"</span>: <span class="string">"accepted"</span>,
  <span class="property">"job_id"</span>: <span class="string">"acf-7b4e8c1a..."</span>
}`;

        // Syntax highlighting function for the typed text
        function highlightCurl(text) {
            let highlighted = text;
            highlighted = highlighted.replace(/curl/g, '<span class="keyword">curl</span>');
            highlighted = highlighted.replace(/-X|-H|-d/g, '<span class="flag">$&</span>');
            highlighted = highlighted.replace(/"[^"]*"/g, '<span class="string">$&</span>');
            highlighted = highlighted.replace(/'[^']*'/g, '<span class="string">$&</span>');
            return highlighted;
        }

        let i = 0;
        function typeWriter() {
            if (i < commandText.length) {
                // Type character by character, highlight what we have so far
                heroTerminal.innerHTML = highlightCurl(commandText.substring(0, i + 1)) + '<span class="cursor">|</span>';
                i++;
                // Randomize typing speed for realism
                const speed = Math.random() * 30 + 10;
                setTimeout(typeWriter, speed);
            } else {
                // Done typing command, pause then show response
                heroTerminal.innerHTML = highlightCurl(commandText);
                setTimeout(() => {
                    heroTerminal.innerHTML = highlightCurl(commandText) + responseText;
                }, 800); // 800ms pause before response
            }
        }
        
        // Start typing after a short delay
        setTimeout(typeWriter, 1000);
    }
