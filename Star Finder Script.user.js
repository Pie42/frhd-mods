// ==UserScript==
// @name         Star Finder Script
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  creates arrows pointing to the stars in a track outside of where they can be seen
// @author       Pie42
// @match        https://www.freeriderhd.com/*
// @grant        none
// ==/UserScript==

var track = 0,
    eListener,
    //the base color of the arrows
    //feel free to change it
    color = [0, 255, 0];
function mod(m, n) {
    return ((m % n) + n) % n;
}
function main() {
    var canvas = GameManager.game.canvas,
        ctx = canvas.getContext('2d');
    eListener = createjs.Ticker.addEventListener('tick', function() {
        var camera = GameManager.game.currentScene.camera,
            fIndex = camera.focusIndex,
            cPlayer = GameManager.game.currentScene.playerManager._players[fIndex],
            tC = cPlayer._powerupsConsumed.targets,
            cPos = camera.position,
            cZoom = camera.zoom * 2,
            cBounds = [cPos.x - (canvas.width / cZoom), cPos.y - (canvas.height / cZoom), cPos.x + (canvas.width / cZoom), cPos.y + (canvas.height / cZoom)],
            rect = Math.atan2(canvas.width, canvas.height),
            targets = GameManager.game.currentScene.track.targets,
            done = 0;
        for (let i in targets) {
            let j = targets[i];
            //this 500 is only here because for my device, 500 is about the highest number of arrows it can render before lag starts to happen.
            //however, i am using a chromebook with 2 gb of ram, so if your device can do better, feel free to change this number.
            //         vvv
            if (done > 500) break;
            if (tC.indexOf(j.id) == -1) {
                done++;
                if (j.x < cBounds[0] || j.y < cBounds[1] || j.x > cBounds[2] || j.y > cBounds[3]) {
                    let angle = Math.atan2(j.y - cPos.y, j.x - cPos.x),
                        sDist = Math.sqrt((j.y - cPos.y) ** 2 + (j.x - cPos.x) ** 2) / cZoom,
                        size = (1000 / cZoom) / Math.sqrt(sDist),
                        nAngle = mod(angle, Math.PI),
                        nHeight = canvas.height / 2,
                        nWidth = canvas.width / 2,
                        sine = Math.sin(angle),
                        cosine = Math.cos(angle),
                        gHeight = nHeight - Math.abs(size * sine),
                        gWidth = nWidth - Math.abs(size * cosine),
                        dy = (sine > 0) ? gHeight : -1 * gHeight,
                        dx = (cosine > 0) ? gWidth : -1 * gWidth;
                    if (Math.abs(dx * sine) < Math.abs(dy * cosine)) {
                        dy = (dx * sine) / cosine;
                    }
                    else {
                        dx = (dy * cosine) / sine;
                    }
                    let pos = {x: dx + nWidth, y: dy + nHeight},
                        //i really hate the 2.1 here because it's just sort of a 'magic number'
                        //that makes the opacity work pretty well in both normal view and full screen.
                        //if there are numbers that work better for you, feel free to change it.
                        //alternatively, if you want just one opacity, you can replace it with:
                        //alpha = 0.5;
                        //           vvv
                        //alpha = 1 - ((2.1 / cZoom) / (sDist / (Math.sqrt(dy ** 2 + dx ** 2) / cZoom)));
                        alpha = 1 - ((2.1 / cZoom) / (sDist / (Math.sqrt(dy ** 2 + dx ** 2) / cZoom)));
                    ctx.fillStyle = `rgba(${color.join(', ')}, ${alpha.toString()})`
                    //this is where the arrows themselves are drawn
                    //if you want to draw something else besides arrows, go ahead!
                    //pos.x and pos.y are the center of the arrows
                    ctx.beginPath();
                    ctx.lineTo(pos.x + (Math.cos(angle) * size), pos.y + (Math.sin(angle) * size));
                    ctx.lineTo(pos.x + (Math.cos(angle + (2 * Math.PI / 3)) * size), pos.y + (Math.sin(angle + (2 * Math.PI / 3)) * size));
                    ctx.lineTo(pos.x + (Math.cos(angle - (2 * Math.PI / 3)) * size), pos.y + (Math.sin(angle - (2 * Math.PI / 3)) * size));
                    ctx.fill();
                }
                else {

                }
            }
        }
    })
}
window.setInterval(function () {
    if ($("#track-data").data("t_id") != track) {
        track = $("#track-data").data("t_id");
        function rInterval() {
            window.clearInterval(v)
        }
        var v = window.setInterval(function() {
            if (GameManager != undefined && GameManager.game != undefined) {
                rInterval();
                main();
            }
        }, 250)
    }
}, 500)