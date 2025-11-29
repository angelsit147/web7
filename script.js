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
    let speed = 2;
    let dx = 0, dy = 0;
    let isAnimating = false;
    let eventCounter = 0;

    playBtn.addEventListener('click', () => {
        workWin.style.display = 'block';
        localStorage.removeItem('animEvents'); 
        eventCounter = 0;
        msgList.innerHTML = '';
    });

    closeBtn.addEventListener('click', () => {
        workWin.style.display = 'none';
        stopAnimation();
        showFinalTable();
    });

    startBtn.addEventListener('click', () => {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        
        createSquare();
        logEvent('Start button clicked');
        startAnimation();
    });

    stopBtn.addEventListener('click', () => {
        stopBtn.style.display = 'none';
        startBtn.style.display = 'inline-block';
        
        logEvent('Stop button clicked');
        stopAnimation();
    });

    reloadBtn.addEventListener('click', () => {
        reloadBtn.style.display = 'none';
        startBtn.style.display = 'inline-block';
        
        logEvent('Reload button clicked');
        if(square) square.remove();
        square = null;
    });

    function createSquare() {
        if(square) square.remove();
        square = document.createElement('div');
        square.id = 'square';
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
        logEvent('Square created at Top');
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

        let hit = false;
        
        if (posX <= 0) {
            posX = 0;
            dx = -dx;
            hit = true;
            logEvent('Hit Left Wall');
        }
        else if (posX >= width - sqSize) {
            posX = width - sqSize;
            dx = -dx;
            hit = true;
            logEvent('Hit Right Wall');
        }
        if (posY <= 0 && dy < 0) {
            posY = 0;
            dy = -dy;
            hit = true;
            logEvent('Hit Top Wall');
        }

        if (posY >= height) {
            logEvent('Square went OUT (Bottom)');
            stopAnimation();
            stopBtn.style.display = 'none';
            reloadBtn.style.display = 'inline-block';
            return;
        }

        logEvent(`Step: ${posX.toFixed(1)}, ${posY.toFixed(1)}`); 

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
        
        const li = document.createElement('li');
        li.textContent = `#${eventCounter} [${timeStr}] ${message}`;
        msgList.prepend(li);

        const dataObj = {
            id: eventCounter,
            clientTime: time.getTime(),
            clientTimeStr: timeStr,
            msg: message
        };

        let storage = JSON.parse(localStorage.getItem('animEvents')) || [];
        dataObj.lsTime = Date.now(); 
        storage.push(dataObj);
        localStorage.setItem('animEvents', JSON.stringify(storage));

        sendToServer(dataObj);
    }

    function sendToServer(data) {
        fetch('server.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(res => {
        })
        .catch(err => console.error('Error:', err));
    }

    function showFinalTable() {
        const localData = JSON.parse(localStorage.getItem('animEvents')) || [];
        
        let html = `
        <table class="log-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Подія</th>
                    <th>Час Client</th>
                    <th>Час LS Save</th>
                </tr>
            </thead>
            <tbody>
        `;

        localData.forEach(row => {
            const d = new Date(row.lsTime);
            const lsTimeStr = d.toLocaleTimeString() + '.' + d.getMilliseconds();
            
            html += `
            <tr>
                <td>${row.id}</td>
                <td>${row.msg}</td>
                <td>${row.clientTimeStr}</td>
                <td>${lsTimeStr}</td> </tr>
            `;
        });

        html += `</tbody></table>`;
        
        logsContainer.innerHTML = html;
        logsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});