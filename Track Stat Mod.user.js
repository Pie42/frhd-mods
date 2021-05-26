// ==UserScript==
// @name         Track Stat Mod
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Pie42
// @include      *freeriderhd.com/t/*
// @grant        none
// ==/UserScript==

//time (in frames) for the stats to fade away
var fadeTime = 250,
    //color of the stats
    color = [0, 0, 0],
    //font (will probably default to monospace if you enter something invalid)
    font = 'Monospace';
function s(t) { //this is a direct copy of the time parsing function in the game
    t = parseInt(t, 10);
    var s = Math.floor
    , e = s(t / 6e4)
    , i = (t - 6e4 * e) / 1e3;
    return i = i.toFixed(2),
        10 > e && (e = e),
        10 > i && (i = "0" + i),
        e + ":" + i
}

function inject() {
    var a = Array.from(document.getElementsByClassName('stat-container')).slice(0,-1);
    a = a.map(i=>i.children[0].innerHTML.trim());
    var f = Array.from(document.getElementsByClassName('track-leaderboard-race-row')),
        ff = f.filter(i=>i.dataset.type=='global'&&i.dataset.run_time!='false'),
        g = ff.map(i=>{let k = i.dataset.run_time,l=k.split(':'),m=l[1].split('.'),n=0;n+=(parseInt(m[1])*.3)|0;n+=parseInt(m[0])*30;n+=parseInt(l[0])*1800;return ((n+1)||Infinity)-1}),
        h = g.reduce((i,j)=>i+j,0)/g.length,
        q = Math.sqrt(g.reduce((i,j,k)=>((i*k)+((h-j)**2))/(k+1),0)),
        z = s((1000/GameManager.game.currentScene.settings.drawFPS)*q|0),
        y = [[`Players Completed: ${a[0]}`, (((+a[0]/10)+1)||2)-1],[`Completion Rate:   ${a[2]}`, +a[2]||0],[`Average Time:      ${a[1]}`,0.5],[`LB Average:        ${s(h*1000/GameManager.game.currentScene.settings.drawFPS)}`,Math.min(2/(h**0.2), 1)],[`LB Std Dev:        ${z}`,Math.min(4/(q**0.5), 1)]],
        x = document.createElement('canvas'),
        w = x.getContext('2d');
    w.textBaseline = 'top';
    window.tsmodel = createjs.Ticker.addEventListener('tick', function() {if (GameManager.game.currentScene.ticks < fadeTime) {let fs = Math.sqrt(Math.sqrt(GameManager.game.canvas.width**2 + GameManager.game.canvas.height**2)) / 2; x.width = Math.max(...y.map(i=>w.measureText(i[0]).width)); x.height = fs * y.length; w.textBaseline = 'top'; w.font = `${fs}px ${font}`; w.clearRect(0, 0, x.width, x.height); w.fillStyle = `rgba(250,250,250,${Math.max(1-GameManager.game.currentScene.ticks / fadeTime, 0)/2}`; w.fillRect(0,0,x.width,x.height); /*w.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${Math.max(1-GameManager.game.currentScene.ticks / fadeTime, 0)}`;*/ w.globalAlpha = Math.max(1-GameManager.game.currentScene.ticks / fadeTime, 0); for (var i = 0; i < y.length; (w.fillStyle = `rgb(${(1-y[i][1])*255},${y[i][1]*255},0)`),w.fillText(y[i][0], 0, i++ * fs)); GameManager.game.canvas.getContext('2d').drawImage(x, (GameManager.game.canvas.width - x.width)/2, GameManager.game.canvas.height - (fs * y.length));}});
    //console.log(a,f,ff,h,z,y,x,w);
}

var track = 0;
window.setInterval(function () {
    if ($("#track-data").data("t_id") != track || window.tsmodel == undefined) {
        track = $("#track-data").data("t_id");
        function rInterval() {
            window.clearInterval(v)
        }
        var v = window.setInterval(function() {
            if (GameManager != undefined && GameManager.game != undefined) {
                window.tsmodel!=undefined && createjs.Ticker.removeEventListener('tick', window.tsmodel);
                inject();
                rInterval();
            }
        }, 250)
    }
}, 500)