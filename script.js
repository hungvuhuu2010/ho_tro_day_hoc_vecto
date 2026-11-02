document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const svg = document.getElementById('vector-svg');
    const viewport = document.getElementById('viewport');
    const gridGroup = document.getElementById('grid-group');
    const elementsGroup = document.getElementById('elements-group');
    const exportCanvas = document.getElementById('export-canvas');

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Practice controls
    const modeBtns = document.querySelectorAll('.mode-btn');
    const btnNewPractice = document.getElementById('btn-new-practice');
    const btnCheckPractice = document.getElementById('btn-check-practice');
    const practiceFeedback = document.getElementById('practice-feedback');
    const practiceInstruction = document.getElementById('practice-instruction');

    // Challenge controls
    const formLogin = document.getElementById('form-login');
    const challengeLogin = document.getElementById('challenge-login');
    const challengeWorkspace = document.getElementById('challenge-workspace');
    const dispName = document.getElementById('disp-name');
    const dispClass = document.getElementById('disp-class');
    const dispScore = document.getElementById('disp-score');
    const dispCount = document.getElementById('disp-count');
    const btnLogout = document.getElementById('btn-logout');
    const btnCheckChallenge = document.getElementById('btn-check-challenge');
    const challengeFeedback = document.getElementById('challenge-feedback');
    const challengeTitle = document.getElementById('challenge-title');
    const challengeInstruction = document.getElementById('challenge-instruction');

    // Header tools
    const btnToggleCoords = document.getElementById('btn-toggle-coords'); // Thêm dòng này
	const btnCopySvg = document.getElementById('btn-copy-svg');
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const btnHelp = document.getElementById('btn-help');
    const helpModal = document.getElementById('help-modal');
    const closeModal = document.querySelector('.close-modal');

    // Zoom controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    // State variables
    let practiceMode = 'sum'; // 'sum' or 'diff'
    let showCoordinates = false;
	
    // SVG Pan & Zoom state
    let panX = 0;
    let panY = 0;
    let zoom = 1;
    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;

    // Grid settings
    const gridSize = 40; // pixels per grid unit
    let originX = 0;
    let originY = 0;

    // Drawing state
    let points = []; // [{id, x, y (grid coords)}]
    let vectors = []; // [{id, startPointId, endPointId, type ('given', 'user'), label, color}]
    let selectedPointId = null;

    // Challenge state
    let student = { name: '', class: '', score: 0, count: 0 };
    let currentChallenge = { type: 'sum', ax: 0, ay: 0, bx: 0, by: 0 };

    // Initialize
    function init() {
        setupDimensions();
        initGrid();
        resetPractice();
        setupEventListeners();
    }

    function setupDimensions() {
        const rect = svg.getBoundingClientRect();
        originX = rect.width / 2;
        originY = rect.height / 2;
        panX = 0;
        panY = 0;
        zoom = 1;
        updateTransform();
    }

    function updateTransform() {
        viewport.setAttribute('transform', `translate(${originX + panX}, ${originY + panY}) scale(${zoom})`);
    }


    // Grid rendering (Clean grid without coordinate axes or visible nodes)
    function initGrid() {
        gridGroup.innerHTML = '';
        const w = 6000;
        const h = 6000;
        const startX = -w / 2;
        const endX = w / 2;
        const startY = -h / 2;
        const endY = h / 2;

        // Clean grid lines
        for (let x = startX; x <= endX; x += gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', startY);
            line.setAttribute('x2', x);
            line.setAttribute('y2', endY);
            line.setAttribute('stroke', '#e2e8f0');
            line.setAttribute('stroke-width', '1');
            gridGroup.appendChild(line);
        }

        for (let y = startY; y <= endY; y += gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', startX);
            line.setAttribute('y1', y);
            line.setAttribute('x2', endX);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#e2e8f0');
            line.setAttribute('stroke-width', '1');
            gridGroup.appendChild(line);
        }

        // Nếu bật chế độ tọa độ thì vẽ trục và số
        if (showCoordinates) {
            const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            xAxis.setAttribute('x1', startX);
            xAxis.setAttribute('y1', 0);
            xAxis.setAttribute('x2', endX);
            xAxis.setAttribute('y2', 0);
            xAxis.setAttribute('stroke', '#64748b');
            xAxis.setAttribute('stroke-width', '2');
            gridGroup.appendChild(xAxis);

            const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            yAxis.setAttribute('x1', 0);
            yAxis.setAttribute('y1', startY);
            yAxis.setAttribute('x2', 0);
            yAxis.setAttribute('y2', endY);
            yAxis.setAttribute('stroke', '#64748b');
            yAxis.setAttribute('stroke-width', '2');
            gridGroup.appendChild(yAxis);

            for (let x = -40; x <= 40; x += 1) {
                if (x !== 0) {
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x * gridSize);
                    text.setAttribute('y', 18);
                    text.setAttribute('fill', '#64748b');
                    text.setAttribute('font-size', '11');
                    text.setAttribute('text-anchor', 'middle');
                    text.textContent = x;
                    gridGroup.appendChild(text);
                }
            }

            for (let y = -40; y <= 40; y += 1) {
                if (y !== 0) {
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', -15);
                    text.setAttribute('y', (-y * gridSize) + 4);
                    text.setAttribute('fill', '#64748b');
                    text.setAttribute('font-size', '11');
                    text.setAttribute('text-anchor', 'end');
                    text.textContent = y;
                    gridGroup.appendChild(text);
                }
            }
        }
    }

    // Event listeners setup
    function setupEventListeners() {
        // Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab');
                document.getElementById(`tab-${tabId}`).classList.add('active');
                if (tabId === 'challenge' && !student.name) {
                    challengeLogin.style.display = 'flex';
                    challengeWorkspace.style.display = 'none';
                }
            });
        });

        // Practice mode buttons
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                practiceMode = btn.getAttribute('data-mode');
                resetPractice();
            });
        });

        btnNewPractice.addEventListener('click', resetPractice);
        btnCheckPractice.addEventListener('click', checkPracticeResult);

        // Challenge login
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            student.name = document.getElementById('student-name').value.trim();
            student.class = document.getElementById('student-class').value.trim();
            student.score = 0;
            student.count = 0;
            dispName.textContent = student.name;
            dispClass.textContent = student.class;
            dispScore.textContent = student.score;
            dispCount.textContent = student.count;
            challengeLogin.style.display = 'none';
            challengeWorkspace.style.display = 'flex';
            startNewChallenge();
        });

        btnLogout.addEventListener('click', () => {
            challengeLogin.style.display = 'flex';
            challengeWorkspace.style.display = 'none';
        });

        btnCheckChallenge.addEventListener('click', checkChallengeResult);

        // Header tool buttons
        // Header tool buttons
        btnToggleCoords.addEventListener('click', () => {
            showCoordinates = !showCoordinates;
            if (showCoordinates) {
                btnToggleCoords.classList.add('active');
            } else {
                btnToggleCoords.classList.remove('active');
            }
            initGrid();
            renderElements();
        });
		
		btnCopySvg.addEventListener('click', copySvgImageToClipboard);
        btnFullscreen.addEventListener('click', toggleFullscreen);
        btnHelp.addEventListener('click', () => helpModal.style.display = 'flex');
        closeModal.addEventListener('click', () => helpModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.style.display = 'none';
        });

        // Zoom controls
        btnZoomIn.addEventListener('click', () => { zoom = Math.min(zoom * 1.2, 3); updateTransform(); });
        btnZoomOut.addEventListener('click', () => { zoom = Math.max(zoom / 1.2, 0.4); updateTransform(); });
        btnZoomReset.addEventListener('click', () => { zoom = 1; panX = 0; panY = 0; updateTransform(); });

        // SVG Mouse interactions for Pan & Click to Draw
        svg.addEventListener('mousedown', onMouseDown);
        svg.addEventListener('mousemove', onMouseMove);
        svg.addEventListener('mouseup', onMouseUp);
        svg.addEventListener('wheel', onWheel, { passive: false });
        svg.addEventListener('click', onSvgClick);
    }

    // Pan & Zoom handlers
    function onMouseDown(e) {
        if (e.button === 2 || e.shiftKey || e.button === 0) { // Cho phép cả click trái khi giữ Shift hoặc click phải để Pan
            isPanning = true;
            startPanX = e.clientX - panX;
            startPanY = e.clientY - panY;
            e.preventDefault();
        }
    }

    function onMouseMove(e) {
        const rect = svg.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        const svgX = (clientX - originX - panX) / zoom;
        const svgY = (clientY - originY - panY) / zoom;
        const gridX = Math.round(svgX / gridSize);
        const gridY = Math.round(-svgY / gridSize);

        if (isPanning) {
            panX = e.clientX - startPanX;
            panY = e.clientY - startPanY;
            updateTransform();
        }
    }

    function onMouseUp(e) {
        if (isPanning) {
            isPanning = false;
        }
    }

    function onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.4, Math.min(3, zoom * zoomFactor));
        
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        panX = mouseX - (mouseX - panX) * (newZoom / zoom) - originX * (newZoom / zoom) + originX;
        panY = mouseY - (mouseY - panY) * (newZoom / zoom) - originY * (newZoom / zoom) + originY;
        zoom = newZoom;
        updateTransform();
    }

    // SVG Click to Draw Points and Vectors (Snapping strictly to grid nodes)
    function onSvgClick(e) {
        if (isPanning || e.shiftKey || e.button === 2) return;
        const rect = svg.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const svgX = (clientX - originX - panX) / zoom;
        const svgY = (clientY - originY - panY) / zoom;
        
        const gridX = Math.round(svgX / gridSize);
        const gridY = Math.round(-svgY / gridSize);

        const exactX = gridX * gridSize;
        const exactY = -gridY * gridSize;
        const dist = Math.hypot(svgX - exactX, svgY - exactY);
        if (dist > gridSize * 0.25) return;

        let clickedPoint = points.find(p => p.x === gridX && p.y === gridY);

        if (!clickedPoint) {
            clickedPoint = { id: 'p_' + Date.now() + '_' + Math.random(), x: gridX, y: gridY };
            points.push(clickedPoint);
        }

        if (selectedPointId === null) {
            selectedPointId = clickedPoint.id;
        } else {
            if (selectedPointId === clickedPoint.id) {
                selectedPointId = null;
            } else {
                const startP = points.find(p => p.id === selectedPointId);
                const endP = clickedPoint;
                
                const existingVec = vectors.find(v => v.type === 'user' && v.startPointId === startP.id && v.endPointId === endP.id);
                if (!existingVec) {
                    vectors.push({
                        id: 'v_' + Date.now(),
                        startPointId: startP.id,
                        endPointId: endP.id,
                        type: 'user',
                        color: '#16a34a',
                        label: ''
                    });
                }
                selectedPointId = null;
            }
        }
        renderElements();
    }

    // Double click to delete user vector
    svg.addEventListener('dblclick', (e) => {
        const target = e.target;
        const id = target.getAttribute('data-id');
        if (!id) return;

        if (id.startsWith('v_')) {
            const vec = vectors.find(v => v.id === id);
            if (vec && vec.type === 'user') {
                vectors = vectors.filter(v => v.id !== id);
                // Clean up orphaned points if needed
                cleanupUnusedPoints();
            }
        }
        renderElements();
    });

    function cleanupUnusedPoints() {
        const usedPointIds = new Set();
        vectors.forEach(v => {
            usedPointIds.add(v.startPointId);
            usedPointIds.add(v.endPointId);
        });
        points = points.filter(p => usedPointIds.has(p.id));
    }

	// Render SVG Elements (Không hiện nút mặc định, chỉ hiện vectơ và nhãn chuẩn KaTeX)
    function renderElements() {
        elementsGroup.innerHTML = '';

        // Draw vectors
        vectors.forEach(v => {
            const startP = points.find(p => p.id === v.startPointId);
            const endP = points.find(p => p.id === v.endPointId);
            if (!startP || !endP) return;

            const x1 = startP.x * gridSize;
            const y1 = -startP.y * gridSize;
            const x2 = endP.x * gridSize;
            const y2 = -endP.y * gridSize;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', v.color);
            line.setAttribute('stroke-width', v.type === 'given' ? '2' : '2');
            line.setAttribute('data-id', v.id);
            line.style.cursor = 'pointer';

            if (v.type === 'given') {
                if (v.label === 'a') line.setAttribute('marker-end', 'url(#arrow-a)');
                else if (v.label === 'b') line.setAttribute('marker-end', 'url(#arrow-b)');
                else line.setAttribute('marker-end', 'url(#arrow-temp)');
            } else {
                line.setAttribute('marker-end', 'url(#arrow-user)');
            }
            elementsGroup.appendChild(line);

            // Label trên mặt phẳng SVG cho từng vectơ (đặt đúng bên trong vòng lặp)
            // Label trên mặt phẳng SVG sử dụng foreignObject và KaTeX
            if (v.label) {
                // 1. Tạo thẻ foreignObject của SVG để chứa HTML/KaTeX
                const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                
                foreignObject.setAttribute('x', midX + 10);
                foreignObject.setAttribute('y', midY - 20);
                foreignObject.setAttribute('width', '40');
                foreignObject.setAttribute('height', '30');
                foreignObject.style.overflow = 'visible';

                // 2. Tạo thẻ div HTML bên trong
                const div = document.createElement('div');
                div.style.color = v.color;
                div.style.fontWeight = 'bold';
                div.style.fontSize = '16px';
                div.style.pointerEvents = 'none'; // Không cản trở sự kiện click chuột vào lưới/vector phía dưới

                // Xác định chuỗi LaTeX tương ứng
                const latexStr = v.label === 'a' ? '\\vec{a}' : (v.label === 'b' ? '\\vec{b}' : '\\vec{u}');

                // 3. Sử dụng KaTeX để render trực tiếp vào phần tử DOM
                if (typeof katex !== 'undefined') {
                    try {
                        katex.render(latexStr, div, {
                            displayMode: false,
                            throwOnError: false
                        });
                    } catch (e) {
                        div.textContent = latexStr;
                    }
                } else {
                    div.textContent = latexStr;
                }

                foreignObject.appendChild(div);
                elementsGroup.appendChild(foreignObject);
            }
        });

        // Draw selection indicator dot only for the currently selected starting point
        if (selectedPointId) {
            const sp = points.find(p => p.id === selectedPointId);
            if (sp) {
                const cx = sp.x * gridSize;
                const cy = -sp.y * gridSize;
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', cx);
                circle.setAttribute('cy', cy);
                circle.setAttribute('r', '6');
                circle.setAttribute('fill', '#dc2626');
                circle.setAttribute('stroke', '#ffffff');
                circle.setAttribute('stroke-width', '2');
                elementsGroup.appendChild(circle);
            }
        }
        
        // Draw coordinate points if enabled
        if (showCoordinates) {
            points.forEach(p => {
                const cx = p.x * gridSize;
                const cy = -p.y * gridSize;
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', cx + 8);
                text.setAttribute('y', cy - 8);
                text.setAttribute('fill', '#475569');
                text.setAttribute('font-weight', '600');
                text.setAttribute('font-size', '12');
                text.textContent = `(${p.x}; ${p.y})`;
                elementsGroup.appendChild(text);
            });
        }
    }

    // Practice Mode Logic
	// 1. Cập nhật nội dung hiển thị yêu cầu bài tập luyện tập (có hỗ trợ KaTeX)
    function updatePracticeInstructionText() {
        if (practiceMode === 'sum') {
            practiceInstruction.innerHTML = `Hãy dựng và vẽ vectơ tổng $\\vec{u} = \\vec{a} + \\vec{b}$ xuất phát từ điểm gốc của $\\vec{a}$ đến điểm cuối của $\\vec{b}$.`;
        } else {
            practiceInstruction.innerHTML = `Hãy dựng và vẽ vectơ hiệu $\\vec{u} = \\vec{a} - \\vec{b}$.`;
        }
        modeBtns.forEach(b => {
            if (b.getAttribute('data-mode') === practiceMode) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        if (window.renderMathInElement) renderMathInElement(practiceInstruction);
    }

    // 2. Lưu trạng thái thẻ Luyện tập vào localStorage (không ảnh hưởng Thử thách Điểm 10)
    function savePracticeState() {
        const state = {
            practiceMode,
            points,
            vectors
        };
        localStorage.setItem('vector_practice_state', JSON.stringify(state));
    }

    // 3. Tải trạng thái thẻ Luyện tập từ localStorage khi F5 / mở lại trang
    function loadPracticeState() {
        const saved = localStorage.getItem('vector_practice_state');
        if (!saved) return false;
        try {
            const state = JSON.parse(saved);
            practiceMode = state.practiceMode || 'sum';
            points = state.points || [];
            vectors = state.vectors || [];
            updatePracticeInstructionText();
            renderElements();
            return true;
        } catch (e) {
            return false;
        }
    }
	
    function resetPractice() {
        points = [];
        vectors = [];
        selectedPointId = null;
        practiceFeedback.textContent = '';
        practiceFeedback.style.color = '#1e293b';

        // Tỷ lệ 4 : 3 : 3 cho 3 trường hợp:
        // 0: 4 điểm (2 vectơ không chung đầu nào)
        // 1: 2 vectơ chung gốc
        // 2: 2 vectơ nối đuôi
        const randCase = Math.random();
        let caseType = 0;
        if (randCase < 0.4) {
            caseType = 0; // 40% (4 điểm rời nhau)
        } else if (randCase < 0.7) {
            caseType = 1; // 30% (Chung gốc)
        } else {
            caseType = 2; // 30% (Nối đuôi)
        }

        const ax = getRandomInt(-2, 1);
        const ay = getRandomInt(-2, 1);
        const da_x = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
        const da_y = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);

        let p1, p2, p3, p4;

        if (caseType === 0) {
            // Trường hợp 1: 4 điểm hoàn toàn rời nhau (2 vectơ không có đầu nào chung)
            p1 = { id: 'p_a1', x: ax, y: ay };
            p2 = { id: 'p_a2', x: ax + da_x, y: ay + da_y };

            // Tạo điểm xuất phát cho b lệch hẳn đi để không nối đuôi
            const bx_start = ax + getRandomInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
            const by_start = ay + getRandomInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
            const db_x = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            const db_y = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);

            p3 = { id: 'p_b1', x: bx_start, y: by_start };
            p4 = { id: 'p_b2', x: bx_start + db_x, y: by_start + db_y };

            points.push(p1, p2, p3, p4);

            vectors.push({
                id: 'v_a',
                startPointId: p1.id,
                endPointId: p2.id,
                type: 'given',
                color: '#2563eb',
                label: 'a'
            });

            vectors.push({
                id: 'v_b',
                startPointId: p3.id,
                endPointId: p4.id,
                type: 'given',
                color: '#ea580c',
                label: 'b'
            });

        } else if (caseType === 1) {
            // Trường hợp 2: 2 vectơ chung gốc (xuất phát từ cùng 1 điểm)
            p1 = { id: 'p_common', x: ax, y: ay };
            p2 = { id: 'p_a2', x: ax + da_x, y: ay + da_y };

            const db_x = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            const db_y = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            p3 = { id: 'p_b2', x: ax + db_x, y: ay + db_y };

            points.push(p1, p2, p3);

            vectors.push({
                id: 'v_a',
                startPointId: p1.id,
                endPointId: p2.id,
                type: 'given',
                color: '#2563eb',
                label: 'a'
            });

            vectors.push({
                id: 'v_b',
                startPointId: p1.id,
                endPointId: p3.id,
                type: 'given',
                color: '#ea580c',
                label: 'b'
            });

        } else {
            // Trường hợp 3: 2 vectơ nối đuôi nhau (điểm cuối a là điểm đầu b)
            p1 = { id: 'p_a1', x: ax, y: ay };
            p2 = { id: 'p_a2', x: ax + da_x, y: ay + da_y };

            const db_x = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            const db_y = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            p3 = { id: 'p_b2', x: p2.x + db_x, y: p2.y + db_y };

            points.push(p1, p2, p3);

            vectors.push({
                id: 'v_a',
                startPointId: p1.id,
                endPointId: p2.id,
                type: 'given',
                color: '#2563eb',
                label: 'a'
            });

            vectors.push({
                id: 'v_b',
                startPointId: p2.id,
                endPointId: p3.id,
                type: 'given',
                color: '#ea580c',
                label: 'b'
            });
        }

        updatePracticeInstructionText();
		
        renderElements();
        savePracticeState();
    }

	function updatePracticeInstructionText() {
        if (practiceMode === 'sum') {
            practiceInstruction.innerHTML = `Hãy dựng và vẽ vectơ tổng $\\vec{u} = \\vec{a} + \\vec{b}$.`;
        } else {
            practiceInstruction.innerHTML = `Hãy dựng và vẽ vectơ hiệu $\\vec{u} = \\vec{a} - \\vec{b}$.`;
        }
        
        modeBtns.forEach(b => {
            const mode = b.getAttribute('data-mode');
            if (mode === 'sum') {
                b.innerHTML = `Tổng: $\\vec{u} = \\vec{a} + \\vec{b}$`;
            } else {
                b.innerHTML = `Hiệu: $\\vec{u} = \\vec{a} - \\vec{b}$`;
            }

            if (mode === practiceMode) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        // Bắt buộc gọi renderMathInElement cho cả hộp hướng dẫn và các nút bấm chế độ
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(practiceInstruction, {
                delimiters: [{left: "$", right: "$", display: false}]
            });
            modeBtns.forEach(b => {
                renderMathInElement(b, {
                    delimiters: [{left: "$", right: "$", display: false}]
                });
            });
        }
    }
	
    function checkPracticeResult() {
        const va = vectors.find(v => v.label === 'a');
        const vb = vectors.find(v => v.label === 'b');
        if (!va || !vb) {
            practiceFeedback.textContent = '❌ Không tìm thấy vectơ đề bài!';
            practiceFeedback.style.color = '#dc2626';
            return;
        }

        const pa1 = points.find(p => p.id === va.startPointId);
        const pa2 = points.find(p => p.id === va.endPointId);
        const pb1 = points.find(p => p.id === vb.startPointId);
        const pb2 = points.find(p => p.id === vb.endPointId);

        if (!pa1 || !pa2 || !pb1 || !pb2) {
            practiceFeedback.textContent = '❌ Lỗi dữ liệu điểm của vectơ đề bài!';
            practiceFeedback.style.color = '#dc2626';
            return;
        }

        const vecA = { x: pa2.x - pa1.x, y: pa2.y - pa1.y };
        const vecB = { x: pb2.x - pb1.x, y: pb2.y - pb1.y };

        let targetDx = 0;
        let targetDy = 0;
        if (practiceMode === 'sum') {
            targetDx = vecA.x + vecB.x;
            targetDy = vecA.y + vecB.y;
        } else {
            targetDx = vecA.x - vecB.x;
            targetDy = vecA.y - vecB.y;
        }

        const userVectors = vectors.filter(v => v.type === 'user');
        if (userVectors.length === 0) {
            practiceFeedback.textContent = '❌ Bạn chưa vẽ vectơ kết quả!';
            practiceFeedback.style.color = '#dc2626';
            return;
        }

        // 1. Lấy ĐÚNG vectơ cuối cùng trong danh sách (vectơ vẽ sau cùng)
        const lastUserVec = userVectors[userVectors.length - 1];

        // 2. Đổi màu vectơ chốt đáp án sang xanh thẫm (#15803d) để phân biệt trực quan
        lastUserVec.color = '#15803d';
        renderElements(); // Vẽ lại giao diện SVG để cập nhật màu sắc ngay lập tức

        const up1 = points.find(p => p.id === lastUserVec.startPointId);
        const up2 = points.find(p => p.id === lastUserVec.endPointId);

        if (!up1 || !up2) {
            practiceFeedback.textContent = '❌ Lỗi điểm của vectơ học sinh vẽ!';
            practiceFeedback.style.color = '#dc2626';
            return;
        }

        const userDx = up2.x - up1.x;
        const userDy = up2.y - up1.y;

        // 3. Xét điểm xuất phát và tọa độ của riêng vectơ cuối cùng này
        const correctOrigin = practiceMode === 'sum' ? (up1.x === pa1.x && up1.y === pa1.y) : true;

        if (userDx === targetDx && userDy === targetDy && correctOrigin) {
            practiceFeedback.textContent = '🎉 Chính xác tuyệt đối! Vectơ cuối cùng bạn vẽ là đáp án đúng.';
            practiceFeedback.style.color = '#16a34a';
        } else {
            practiceFeedback.textContent = '❌ Chưa chính xác. Vectơ cuối cùng bạn vẽ chưa đúng hướng, độ dài hoặc điểm xuất phát!';
            practiceFeedback.style.color = '#dc2626';
        }
    }

    // Challenge Mode Logic
    function startNewChallenge() {
        points = [];
        vectors = [];
        selectedPointId = null;
        challengeFeedback.textContent = '';

        const isSum = Math.random() < 0.7;
        currentChallenge.type = isSum ? 'sum' : 'diff';

        challengeTitle.textContent = isSum ? 'Thử thách: Vectơ Tổng' : 'Thử thách: Vectơ Hiệu';
        challengeInstruction.innerHTML = isSum ? 'Vẽ vectơ tổng $\\vec{u} = \\vec{a} + \\vec{b}$.' : 'Vẽ vectơ hiệu $\\vec{u} = \\vec{a} - \\vec{b}$.';
        
		// Cấu hình render KaTeX tường minh cho phần hướng dẫn thử thách
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(challengeInstruction, {
                delimiters: [{left: "$", right: "$", display: false}],
                throwOnError: false
            });
        }
		
        const data = generateVectorsForScenario();
        points = data.points;
        vectors = data.vectors;

        renderElements();
    }
	// Helper to generate 2 vectors based on 3 cases (ratio 4:3:3)
    // Case 0 (40%): 4 points (2 separate vectors)
    // Case 1 (30%): 2 vectors sharing common origin (chung gốc)
    // Case 2 (30%): 2 vectors head-to-tail (nối đuôi)
    function generateVectorsForScenario() {
        const rand = Math.random();
        let caseType = 0;
        if (rand < 0.4) caseType = 0;
        else if (rand < 0.7) caseType = 1;
        else caseType = 2;

        const ax = getRandomInt(-2, 1);
        const ay = getRandomInt(-2, 1);
        const da_x = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
        const da_y = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);

        let p1, p2, p3, p4;
        let generatedPoints = [];
        let generatedVectors = [];

        if (caseType === 0) {
            // 4 points (rời nhau)
            p1 = { id: 'p_' + Math.random(), x: ax, y: ay };
            p2 = { id: 'p_' + Math.random(), x: ax + da_x, y: ay + da_y };

            const bx_start = ax + getRandomInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
            const by_start = ay + getRandomInt(1, 3) * (Math.random() > 0.5 ? 1 : -1);
            const db_x = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            const db_y = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);

            p3 = { id: 'p_' + Math.random(), x: bx_start, y: by_start };
            p4 = { id: 'p_' + Math.random(), x: bx_start + db_x, y: by_start + db_y };

            generatedPoints.push(p1, p2, p3, p4);
            generatedVectors.push({
                id: 'v_a_' + Math.random(),
                startPointId: p1.id,
                endPointId: p2.id,
                type: 'given',
                color: '#2563eb',
                label: 'a'
            });
            generatedVectors.push({
                id: 'v_b_' + Math.random(),
                startPointId: p3.id,
                endPointId: p4.id,
                type: 'given',
                color: '#ea580c',
                label: 'b'
            });
        } else if (caseType === 1) {
            // Chung gốc
            p1 = { id: 'p_' + Math.random(), x: ax, y: ay };
            p2 = { id: 'p_' + Math.random(), x: ax + da_x, y: ay + da_y };

            const db_x = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            const db_y = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            p3 = { id: 'p_' + Math.random(), x: ax + db_x, y: ay + db_y };

            generatedPoints.push(p1, p2, p3);
            generatedVectors.push({
                id: 'v_a_' + Math.random(),
                startPointId: p1.id,
                endPointId: p2.id,
                type: 'given',
                color: '#2563eb',
                label: 'a'
            });
            generatedVectors.push({
                id: 'v_b_' + Math.random(),
                startPointId: p1.id,
                endPointId: p3.id,
                type: 'given',
                color: '#ea580c',
                label: 'b'
            });
        } else {
            // Nối đuôi
            p1 = { id: 'p_' + Math.random(), x: ax, y: ay };
            p2 = { id: 'p_' + Math.random(), x: ax + da_x, y: ay + da_y };

            const db_x = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            const db_y = getRandomInt(2, 4) * (Math.random() > 0.5 ? 1 : -1);
            p3 = { id: 'p_' + Math.random(), x: p2.x + db_x, y: p2.y + db_y };

            generatedPoints.push(p1, p2, p3);
            generatedVectors.push({
                id: 'v_a_' + Math.random(),
                startPointId: p1.id,
                endPointId: p2.id,
                type: 'given',
                color: '#2563eb',
                label: 'a'
            });
            generatedVectors.push({
                id: 'v_b_' + Math.random(),
                startPointId: p2.id,
                endPointId: p3.id,
                type: 'given',
                color: '#ea580c',
                label: 'b'
            });
        }

        return { points: generatedPoints, vectors: generatedVectors };
    }

    function checkChallengeResult() {
        const va = vectors.find(v => v.label === 'a');
        const vb = vectors.find(v => v.label === 'b');
        const pa1 = points.find(p => p.id === va.startPointId);
        const pa2 = points.find(p => p.id === va.endPointId);
        const pb1 = points.find(p => p.id === vb.startPointId);
        const pb2 = points.find(p => p.id === vb.endPointId);

        const vecA = { x: pa2.x - pa1.x, y: pa2.y - pa1.y };
        const vecB = { x: pb2.x - pb1.x, y: pb2.y - pb1.y };

        let targetDx = currentChallenge.type === 'sum' ? (vecA.x + vecB.x) : (vecA.x - vecB.x);
        let targetDy = currentChallenge.type === 'sum' ? (vecA.y + vecB.y) : (vecA.y - vecB.y);

        const userVectors = vectors.filter(v => v.type === 'user');
        if (userVectors.length === 0) {
            challengeFeedback.textContent = '❌ Bạn chưa vẽ vectơ kết quả!';
            challengeFeedback.style.color = '#dc2626';
            return;
        }

        const lastUserVec = userVectors[userVectors.length - 1];
        const up1 = points.find(p => p.id === lastUserVec.startPointId);
        const up2 = points.find(p => p.id === lastUserVec.endPointId);
        const userDx = up2.x - up1.x;
        const userDy = up2.y - up1.y;

        const correctOrigin = currentChallenge.type === 'sum' ? (up1.x === pa1.x && up1.y === pa1.y) : true;

        student.count++;
        if (userDx === targetDx && userDy === targetDy && correctOrigin) {
            student.score += 1;
            challengeFeedback.textContent = '🎉 Chính xác! +1 điểm.';
            challengeFeedback.style.color = '#16a34a';
        } else {
            student.score -= 1;
            challengeFeedback.textContent = '❌ Sai rồi! -1 điểm.';
            challengeFeedback.style.color = '#dc2626';
        }

        dispScore.textContent = student.score;
        dispCount.textContent = student.count;

        setTimeout(() => {
            startNewChallenge();
        }, 1500);
    }

    // Header Tools Implementation: Chụp ảnh mặt phẳng SVG sang Clipboard
    function copySvgImageToClipboard() {
        const svgElement = svg;
        const svgRect = svgElement.getBoundingClientRect();
        
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const image = new Image();
        image.onload = () => {
            exportCanvas.width = svgRect.width * 2; // High DPI for Word
            exportCanvas.height = svgRect.height * 2;
            const context = exportCanvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            context.scale(2, 2);
            context.drawImage(image, 0, 0, svgRect.width, svgRect.height);

            exportCanvas.toBlob(blob => {
                try {
                    navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]).then(() => {
                        alert('✅ Đã chụp ảnh mặt phẳng lưới và sao chép vào Clipboard! Bạn có thể dán (Ctrl+V) trực tiếp vào Microsoft Word.');
                    }).catch(err => {
                        fallbackDownload(blob);
                    });
                } catch (e) {
                    fallbackDownload(blob);
                }
            }, 'image/png');
        };
        image.src = blobURL;
    }

    function fallbackDownload(blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'vector_grid.png';
        link.click();
        alert('Trình duyệt không hỗ trợ copy trực tiếp ảnh vào clipboard, đã tải xuống file ảnh vector_grid.png để bạn chèn vào Word.');
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Không thể bật chế độ toàn màn hình: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    init();
});

