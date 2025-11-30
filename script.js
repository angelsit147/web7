document.addEventListener('DOMContentLoaded', () => {
    const workWin = document.getElementById('work');
    const animBox = document.getElementById('anim');
    const playBtn = document.getElementById('playBtn');
    const closeBtn = document.getElementById('closeBtn');
    
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    
    const msgList = document.getElementById('msgList');
    const logsContainer = document.getElementById('logsTableContainer');

    let square = null;
    let animId = null;
    let posX = 0, posY = 0;
    let dx = 0, dy = 0;
    const speed = 3;
    let isAnimating = false;

    let eventCounter = 0;
    let serverResponses = [];

    playBtn.addEventListener('click', () => {
        workWin.style.display = 'block';
        
        localStorage.removeItem('animEvents'); 
        serverResponses = []; 
        eventCounter = 0;
        msgList.innerHTML = '';
        logsContainer.innerHTML = '';
    });

    closeBtn.addEventListener('click', () => {
        workWin.style.display = 'none';
        stopAnimation();
        showFinalTable();
    });

    startBtn.addEventListener('click', () => {
        toggleButtons('start');
        
        if (!square) createSquare();
        
        logEvent('Start button clicked');
        startAnimation();
    });

    stopBtn.addEventListener('click', () => {
        toggleButtons('stop');
        logEvent('Stop button clicked');
        stopAnimation();
    });

    reloadBtn.addEventListener('click', () => {
        toggleButtons('reload');
        logEvent('Reload button clicked');
        if(square) square.remove();
        square = null;
    });

    function toggleButtons(state) {
        if(state === 'start') {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            reloadBtn.style.display = 'none';
        } else if (state === 'stop') {
            stopBtn.style.display = 'none';
            startBtn.style.display = 'inline-block';
        } else if (state === 'reload') {
            reloadBtn.style.display = 'none';
            startBtn.style.display = 'inline-block';
        } else if (state === 'out') {
            stopBtn.style.display = 'none';
            reloadBtn.style.display = 'inline-block';
        }
    }

    function createSquare() {
        if(square) square.remove();
        square = document.createElement('div');
        square.id = 'square';
        square.style.width = '10px';
        square.style.height = '10px';
        square.style.backgroundColor = 'red';
        square.style.position = 'absolute';
        square.style.display = 'block';
        animBox.appendChild(square);

        const animRect = animBox.getBoundingClientRect();
        const maxX = animRect.width - 10;
        
        posX = Math.random() * maxX;
        posY = 0; 

        const angleDeg = 20 + Math.random() * 140; 
        const angleRad = angleDeg * (Math.PI / 180);

        dx = Math.cos(angleRad) * speed;
        dy = Math.sin(angleRad) * speed;

        updateSquarePos();
    }

    function startAnimation() {
        if(!isAnimating) {
            isAnimating = true;
            loop();
        }
    }

    function stopAnimation() {
        isAnimating = false;
        if(animId) cancelAnimationFrame(animId);
    }

    function loop() {
        if(!isAnimating) return;

        const animRect = animBox.getBoundingClientRect();
        const width = animRect.width;
        const height = animRect.height;
        const sqSize = 10;

        posX += dx;
        posY += dy;

        if (posX <= 0) {
            posX = 0; dx = -dx;
            logEvent('Hit Left Wall');
        }
        else if (posX >= width - sqSize) {
            posX = width - sqSize; dx = -dx;
            logEvent('Hit Right Wall');
        }
        if (posY <= 0 && dy < 0) {
            posY = 0; dy = -dy;
            logEvent('Hit Top Wall');
        }
        if (posY >= height) {
            logEvent('Square went OUT');
            stopAnimation();
            toggleButtons('out');
            return;
        }

        logEvent(`Step: ${Math.round(posX)}, ${Math.round(posY)}`);

        updateSquarePos();
        animId = requestAnimationFrame(loop);
    }

    function updateSquarePos() {
        if(square) {
            square.style.left = posX + 'px';
            square.style.top = posY + 'px';
        }
    }

    function logEvent(message) {
        eventCounter++;
        const time = new Date();
        const timeStr = time.toLocaleTimeString() + '.' + time.getMilliseconds();

        if (eventCounter % 10 === 0 || message.includes('Hit') || message.includes('Button')) {
            const li = document.createElement('li');
            li.textContent = `#${eventCounter} ${message}`;
            msgList.prepend(li);
        }

        const dataObj = {
            id: eventCounter,
            clientTime: time.getTime(),
            clientTimeStr: timeStr,
            msg: message,
            lsTime: Date.now()
        };

        let storage = JSON.parse(localStorage.getItem('animEvents')) || [];
        storage.push(dataObj);
        localStorage.setItem('animEvents', JSON.stringify(storage));

        sendToServer(dataObj);
    }

    function sendToServer(data) {
        fetch('server.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(res => {
            serverResponses.push({
                originalId: res.receivedId,
                serverTime: res.serverTimeReadable
            });
        })
        .catch(err => console.error('Error:', err));
    }

    function showFinalTable() {
        const localData = JSON.parse(localStorage.getItem('animEvents')) || [];
        
        let html = `
        <h3 style="text-align:center;">Порівняння: LocalStorage (Синхронно) vs Server (Асинхронно)</h3>
        <table class="log-table" style="width:100%; text-align:center;">
            <thead>
                <tr>
                    <th colspan="2" style="background:#e0f7fa">КЛІЄНТ (Порядок відправки)</th>
                    <th colspan="2" style="background:#ffe0b2">СЕРВЕР (Порядок отримання)</th>
                </tr>
                <tr>
                    <th>ID</th>
                    <th>Час запису (LS)</th>
                    <th>ID отриманий</th>
                    <th>Час відповіді</th>
                </tr>
            </thead>
            <tbody>
        `;

        localData.forEach((clientItem, index) => {
            const serverItem = serverResponses[index];

            const d = new Date(clientItem.lsTime);
            const clientTime = d.toLocaleTimeString() + '.' + d.getMilliseconds();

            const clientId = clientItem.id;
            
            const serverId = serverItem ? serverItem.originalId : '...';
            const serverTime = serverItem ? serverItem.serverTime : '...';

            let rowStyle = "";
            let idMismatch = false;

            if (serverItem && clientId !== serverId) {
                rowStyle = "background-color: #ffcccc; font-weight: bold;";
                idMismatch = true;
            }

            html += `
            <tr style="${rowStyle}">
                <td>${clientId}</td>
                <td>${clientTime}</td>
                <td style="${idMismatch ? 'color:red; font-size:1.1em;' : ''}">${serverId}</td>
                <td>${serverTime}</td>
            </tr>
            `;
        });

        html += `</tbody></table>`;

        if (localData.length !== serverResponses.length) {
            html += `<p style="color:red; margin-top:5px;">* Увага: Кількість відправлених (${localData.length}) та отриманих (${serverResponses.length}) пакетів не збігається (деякі ще в дорозі).</p>`;
        }
        
        logsContainer.innerHTML = html;
        logsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});