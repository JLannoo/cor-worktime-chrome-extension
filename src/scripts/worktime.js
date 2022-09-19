const navbar = document.querySelector(".nav.navbar-nav");

const old = document.querySelector("#worktime");
if(old){
    navbar.removeChild(old);
}

// CONTAINERS
const container = document.createElement("li");
container.id = "worktime";
container.classList.add("messages-menu");

const containerInfo = document.createElement("div");
containerInfo.classList.add("container-info");

const containerInput = document.createElement("div");
containerInput.classList.add("input-group");

const containerCheckbox = document.createElement("div");
containerCheckbox.classList.add("input-group");

// TEXT
const text = document.createElement("p");
const missing = document.createElement("p");

// CHECKBOX
const checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.checked = localStorage.getItem("worktime_rest") === "true";
checkbox.onchange = (e) => {
    updateAll();
    localStorage.setItem("worktime_rest" , checkbox.checked);
}


// INPUT
const input = document.createElement("input");
input.type = "time";
input.min = "08:00";
input.max = (new Date()).toLocaleTimeString();
input.onchange = (e) => {
    updateAll();
}

const cachedTime = readFromCache();
if(cachedTime){
    input.value = [cachedTime.hours.padStart(2,"0") , cachedTime.minutes.padStart(2,"0")].join(":");
}

// CALCULATE
updateAll();

// APPEND
const labelInput = document.createElement("label")
labelInput.innerText = "Hora de inicio";
containerInput.appendChild(labelInput)
containerInput.appendChild(input);
containerInfo.appendChild(containerInput);

const labelCheckbox = document.createElement("label")
labelCheckbox.innerText = "Descanso?";
containerCheckbox.appendChild(labelCheckbox);
containerCheckbox.appendChild(checkbox);
containerInfo.appendChild(containerCheckbox);

container.appendChild(containerInfo);
container.appendChild(text);
container.appendChild(missing);

navbar.appendChild(container);

// ====== HELPERS ======
// UPDATES
window.addEventListener("focus", () => {
    updateAll();
});

function updateAll(){
    updateText(text , calculateWorktime(input.value , checkbox.checked));
    calculateMissingTime().then(time => {
        updateMissing(missing , time);
    });
}

function updateText(element , time){
    if(!time){
        element.innerHTML = "Ingrese hora de inicio";
        return;
    }
    element.innerHTML = `<label> Horas trabajadas hasta ahora: </label> <b>${time.hours}hs y ${time.minutes}m</b>`;
    return;
}

function updateMissing(element , time){
    if(!time){
        element.innerHTML = "";
        return;
    }
    element.innerHTML = `<label> Faltan registrar: </label> <b>${time.hours}hs y ${time.minutes}m</b>`;
}

// HOURS
function calculateWorktime(start, rest=false){
    if(!start) return null;
    
    const timeStart = start.split(':');
    
    const hoursStart = parseInt(timeStart[0], 10);
    const minutesStart = parseInt(timeStart[1], 10);
    
    writeToCache({hoursStart , minutesStart});
    
    const totalMinutesStart = hoursStart * 60 + minutesStart;

    const timeNow = new Date().toLocaleTimeString().split(':');
    const hoursNow = parseInt(timeNow[0], 10);
    const minutesNow = parseInt(timeNow[1], 10);

    const totalMinutesNow = hoursNow * 60 + minutesNow;
    const totalMinutes = totalMinutesNow - totalMinutesStart - (rest ? 60 : 0);

    const hours = totalMinutes > 0 ? Math.floor(totalMinutes / 60) : Math.ceil(totalMinutes / 60);
    const minutes = totalMinutes % 60;


    return {hours , minutes}
}

function getRegisteredTime(){
    return new Promise((resolve , reject) => {
        const observer = new MutationObserver(function (mutations, mutationInstance) {
            const bar = document.querySelector("div[class*=SCBPCInsideWrapper")
            if (bar) {
                setTimeout(() => {
                    const percentage = bar.style.width.split("%")[0];

                    if(!percentage){
                        resolve({hours: 0 , minutes: 0});
                        mutationInstance.disconnect();
                    }

                    const totalMinutes = 8 * 60 * percentage / 100;
                    const hours = totalMinutes > 0 ? Math.floor(totalMinutes / 60) : Math.ceil(totalMinutes / 60);
                    const minutes = parseInt(totalMinutes % 60);

                    resolve({hours , minutes});
                    mutationInstance.disconnect();
                }, 500)
            }
        });
        
        observer.observe(document, {
            childList: true,
            subtree:   true
        });
    });
}   

async function calculateMissingTime(){
    const registered = await getRegisteredTime();
    console.log(registered);
    const worktime = calculateWorktime(input.value , checkbox.checked);

    registerdInMinutes = registered.hours * 60 + registered.minutes;
    worktimeInMinutes = worktime.hours * 60 + worktime.minutes;

    const missingInMinutes = worktimeInMinutes - registerdInMinutes;

    return {hours: Math.floor(missingInMinutes / 60) , minutes: missingInMinutes % 60};
}

// CACHE
function writeToCache(time){
    localStorage.setItem("worktime_hours" , time.hoursStart)
    localStorage.setItem("worktime_minutes" , time.minutesStart);
}

function readFromCache(){
    return {
        hours: localStorage.getItem("worktime_hours"),
        minutes: localStorage.getItem("worktime_minutes")
    }
}