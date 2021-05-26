// ==UserScript==
// @name         FRHD Input Display 2
// @namespace    http://freeriderhd.com/
// @version      .9
// @description  try to take over the world!
// @author       Pie42
// @include      *freeriderhd.com*
// @grant        none
// ==/UserScript==

/*
  Short explanation: The way this works is that the main drawing function first hooks itself up to the game's main update function,
  because that's the best way to make it draw correctly. After that, every time the game ticks, the input display is drawn onto the game canvas.
  To get button highlighting, each drawing function checks the current player's '_gamepad.downButtons' to see if the current button is being held down
  (whether it's by the current player or the current replay). If the current button is being held down, the box is filled in.

  This input display will automatically highlight the current player, meaning that if you're watching a ghost, the display will show the ghost's
  inputs, and if you're playing, it will show your inputs. I decided not to include 'enter' and 'backspace' because it's pretty easy to tell if those
  are being held. Enjoy!

  Note that you can customize this to your heart's content. I have indicated the main customization things, but feel free to change whatever(just don't
  blame me if it breaks).
*/
//var difx = 0,
//    dify = 0;
function spaceTest(e) {
    if (e.key == ' ') space = e.type == 'keydown' ? true : false;
}
window.addEventListener('keydown', spaceTest);
window.addEventListener('keyup', spaceTest);
var spin = 0,
    up = 0,
    down = 0,
    left = 0,
    right = 0,
    sAcc = 0,
    space = false;
function circle(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i <= Math.PI * 2; i += Math.PI / 20) {
        ctx.lineTo(x + (Math.cos(i) * r), y + (Math.sin(i) * r));
    }
    //ctx.stroke();
}
function symbol(ctx, tempx, tempy, bsize, diff) {
    ctx.beginPath();
    ctx.lineTo(tempx + (Math.cos(spin + (diff)) * (bsize / 6)), tempy + (Math.sin(spin + (diff)) * (bsize / 6)));
    ctx.lineTo(tempx + (Math.cos(spin + ((2 * Math.PI / 3) + diff)) * (bsize / 6)), tempy + (Math.sin(spin + ((2 * Math.PI / 3) + diff)) * (bsize / 6)));
    ctx.lineTo(tempx + (Math.cos(spin + ((4 * Math.PI / 3) + diff)) * (bsize / 6)), tempy + (Math.sin(spin + ((4 * Math.PI / 3) + diff)) * (bsize / 6)));
    ctx.lineTo(tempx + (Math.cos(spin + (diff)) * (bsize / 6)), tempy + (Math.sin(spin + (diff)) * (bsize / 6)));
    ctx.stroke();
}
function drawDisplay() {
    var container = document.getElementById('game-container'),
        children = (container == void 0) ? undefined : container.children,
        canvas = (children == void 0) ? undefined : children[1];
    if (canvas != void 0){
        var ctx = canvas.getContext('2d');
        var cPlayer = GameManager.game.currentScene.playerManager._players[GameManager.game.currentScene.camera.focusIndex],
            cGamepad = cPlayer._gamepad,
            h = canvas.height,
            w = canvas.width;

        //main customization variables
        //to customize a symbol, find the comment stating that key(keys are listed left to right and top to bottom), and then change the drawing done there.
        var bsize = h / 10,     //size of the boxes
            dist = h / 8,      //distance from the edge of the screen
            lcolor = '#000000', //color of the lines
            fcolor = '#1B5264', //color that currently pressed inputs are filled in
            lwidth = 2.5;       //width of the lines

        //sy and sx can also be customized. right now, they are set to put the input display in the lower left corner, but to move it to the top, you can use:
        //var sy = dist,
        //instead of the line that is currently there.
        var sy = (h - dist) - (bsize),

            //to move the display to the right, you can use
            //sx = (w - dist) - (3 * bsize),
            //instead of the line that is currently there.
            sx = dist + bsize,
            tempx, tempy;
        ctx.strokeStyle = lcolor;
        ctx.fillStyle = fcolor;
        ctx.lineWidth = lwidth;

        //GameManager.game.currentScene.restartTrack && (up = 0, down = 0, left = 0, right = 0, spin = Math.PI, sAcc = 0);


        //z key
        /*tempx = sx + (2 * bsize);
        tempy = sy;
        ctx.beginPath();
        ctx.lineTo(tempx, tempy);
        ctx.lineTo(tempx, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy);
        ctx.lineTo(tempx, tempy);*/
        tempx = sx;
        tempy = sy;
        circle(ctx, tempx, tempy, bsize / 2);
        cGamepad.downButtons.z && !cPlayer._crashed && (ctx.fill(), sAcc += Math.PI / 100);
        ctx.stroke();
        tempx -= bsize / 2;
        tempy -= bsize / 2;
        //change this to change the way the symbol is drawn
        ctx.beginPath();
        ctx.lineTo(tempx + (bsize / 3), tempy + (bsize / 3));
        ctx.lineTo(tempx + (2 * bsize / 3), tempy + (bsize / 3));
        ctx.lineTo(tempx + (bsize / 3), tempy + (2 * bsize / 3));
        ctx.lineTo(tempx + (2 * bsize / 3), tempy + (2 * bsize / 3));
        ctx.stroke();


        //up arrow key
        tempx = sx + (Math.cos(spin + (Math.PI / 2)) * (bsize + up));
        tempy = sy + (Math.sin(spin + (Math.PI / 2)) * (bsize + up));
        circle(ctx, tempx, tempy, bsize / 2);
        cGamepad.downButtons.up && !cPlayer._crashed && (ctx.fill(), up++);
        //cGamepad.downButtons.pause && !cPlayer._crashed && (ctx.fill(), up++);
        //space && !cPlayer._crashed && (ctx.fill(), up++);
        ctx.stroke();

        //change this to change the way the symbol is drawn
        symbol(ctx, tempx, tempy, bsize, Math.PI / 2);


        //left key
        tempx = sx + (Math.cos(spin + (0)) * (bsize + left));
        tempy = sy + (Math.sin(spin + (0)) * (bsize + left));
        circle(ctx, tempx, tempy, bsize / 2);
        cGamepad.downButtons.left && !cPlayer._crashed && (ctx.fill(), left++);
        ctx.stroke();

        //change this to change the way the symbol is drawn
        symbol(ctx, tempx, tempy, bsize, 0);


        //down key
        tempx = sx + (Math.cos(spin + (3 * Math.PI / 2)) * (bsize + down));
        tempy = sy + (Math.sin(spin + (3 * Math.PI / 2)) * (bsize + down));
        circle(ctx, tempx, tempy, bsize / 2);
        cGamepad.downButtons.down && !cPlayer._crashed && (ctx.fill(), down++);
        ctx.stroke();

        //change this to change the way the symbol is drawn
        symbol(ctx, tempx, tempy, bsize, 3 * Math.PI / 2);


        //right key
        tempx = sx + (Math.cos(spin + (Math.PI)) * (bsize + right));
        tempy = sy + (Math.sin(spin + (Math.PI)) * (bsize + right));
        circle(ctx, tempx, tempy, bsize / 2);
        cGamepad.downButtons.right && !cPlayer._crashed && (ctx.fill(), right++);
        ctx.stroke();

        //change this to change the way the symbol is drawn
        symbol(ctx, tempx, tempy, bsize, Math.PI);
        /*difx = Math.max(Math.min(difx, 20), -20);
        difx *= 0.95;
        dify = Math.max(Math.min(dify, 20), -20);
        dify *= 0.95;*/
        spin += sAcc;
        sAcc *= 0.005;
        up *= .95;
        down *= .95;
        left *= .95;
        right *= .95;
    }
}
var track = 0;
window.setInterval(function () {
    if ($("#track-data").data("t_id") != track) {
        track = $("#track-data").data("t_id");
        function rInterval() {
            window.clearInterval(v)
        }
        var v = window.setInterval(function() {
            if (GameManager != undefined && GameManager.game != undefined && GameManager.game.currentScene != undefined) {
                rInterval();
                createjs.Ticker.addEventListener("tick", drawDisplay);
                spin = Math.PI;
                GameManager.game.currentScene.restart = function() {
                    GameManager.game.currentScene.settings.mobile ? GameManager.game.currentScene.message.show("Press Any Button To Start", 1, "#333333") : GameManager.game.currentScene.message.show("Press Any Key To Start", 1, "#333333", "#FFFFFF"),
                    GameManager.game.currentScene.track.resetPowerups(),
                    GameManager.game.currentScene.restartTrack = !1,
                    GameManager.game.currentScene.state.paused = !1,
                    GameManager.game.currentScene.state.playing = !GameManager.game.currentScene.settings.waitForKeyPress,
                    GameManager.game.currentScene.ticks = 0,
                    GameManager.game.currentScene.playerManager.reset(),
                    GameManager.game.currentScene.playerManager.getPlayerCount() > 0 && (GameManager.game.currentScene.camera.focusIndex = 1),
                    GameManager.game.currentScene.camera.focusOnPlayer(),
                    GameManager.game.currentScene.camera.fastforward(),
                    GameManager.game.currentScene.showControlPlanel("main");
                    up = 0, down = 0, left = 0, right = 0, spin = Math.PI, sAcc = 0;
                }
            }
        }, 250)
    }
}, 500)