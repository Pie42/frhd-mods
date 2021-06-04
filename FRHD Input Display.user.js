// ==UserScript==
// @name         FRHD Input Display
// @namespace    http://freeriderhd.com/
// @version      0.91
// @description  try to take over the world!
// @author       Pie42
// @include      https://www.freeriderhd.com*
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

function drawDisplay() {
    var container = document.getElementById('game-container'),
        children = container == void 0 ? undefined : container.children,
        canvas = children == void 0 ? undefined : children[1];
    if (canvas != void 0) {
        var ctx = canvas.getContext('2d');
        var cPlayer =
            GameManager.game.currentScene.playerManager._players[
                GameManager.game.currentScene.camera.focusIndex
            ],
            cGamepad = cPlayer._gamepad,
            h = canvas.height,
            w = canvas.width;

        //main customization variables
        //to customize a symbol, find the comment stating that key(keys are listed left to right and top to bottom), and then change the drawing done there.
        var bsize = h / 20, //size of the boxes
            dist = h / 40, //distance from the edge of the screen
            lcolor = '#000000', //default line color
            ldcolor = '#fff', //line color of currently pressed inputs
            fcolor = '#000', //fill color of currently pressed inputs
            lwidth = 2; //width of the lines

        //sy and sx can also be customized. right now, they are set to put the input display in the lower left corner, but to move it to the top, you can use:
        //var sy = dist,
        //instead of the line that is currently there.
        var sy = h - dist - 2 * bsize,
            //to move the display to the right, you can use
            //sx = (w - dist) - (3 * bsize),
            //instead of the line that is currently there.
            sx = dist,
            tempx,
            tempy;
        ctx.strokeStyle = lcolor;
        ctx.fillStyle = fcolor;
        ctx.lineWidth = lwidth;

        //up arrow key
        ctx.strokeStyle = lcolor;
        tempx = sx + bsize;
        tempy = sy;
        ctx.beginPath();
        ctx.lineTo(tempx, tempy);
        ctx.lineTo(tempx, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy);
        ctx.lineTo(tempx, tempy);
        cGamepad.downButtons.up && !cPlayer._crashed && ctx.fill();
        ctx.stroke();

        //change this to change the way the symbol is drawn
        if (cGamepad.downButtons.up && !cPlayer._crashed) {
            ctx.strokeStyle = ldcolor;
        }
        ctx.beginPath();
        ctx.lineTo(tempx + (1 * bsize) / 6, tempy + (2 * bsize) / 3);
        ctx.lineTo(tempx + (1 * bsize) / 2, tempy + (1 * bsize) / 3);
        ctx.lineTo(tempx + (5 * bsize) / 6, tempy + (2 * bsize) / 3);
        ctx.stroke();

        //z key
        ctx.strokeStyle = lcolor;
        tempx = sx + 2 * bsize;
        tempy = sy;
        ctx.beginPath();
        ctx.lineTo(tempx, tempy);
        ctx.lineTo(tempx, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy);
        ctx.lineTo(tempx, tempy);
        cGamepad.downButtons.z && !cPlayer._crashed && ctx.fill();
        ctx.stroke();

        //change this to change the way the symbol is drawn
        if (cGamepad.downButtons.z && !cPlayer._crashed) {
            ctx.strokeStyle = ldcolor;
        }
        ctx.beginPath();
        ctx.lineTo(tempx + bsize / 6, tempy + bsize / 6);
        ctx.lineTo(tempx + (5 * bsize) / 6, tempy + bsize / 6);
        ctx.lineTo(tempx + bsize / 6, tempy + (5 * bsize) / 6);
        ctx.lineTo(tempx + (5 * bsize) / 6, tempy + (5 * bsize) / 6);
        ctx.stroke();

        //left key
        ctx.strokeStyle = lcolor;
        tempx = sx;
        tempy = sy + bsize;
        ctx.beginPath();
        ctx.lineTo(tempx, tempy);
        ctx.lineTo(tempx, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy);
        ctx.lineTo(tempx, tempy);
        cGamepad.downButtons.left && !cPlayer._crashed && ctx.fill();
        ctx.stroke();

        //change this to change the way the symbol is drawn
        if (cGamepad.downButtons.left && !cPlayer._crashed) {
            ctx.strokeStyle = ldcolor;
        }
        ctx.beginPath();
        ctx.lineTo(tempx + (2 * bsize) / 3, tempy + (1 * bsize) / 6);
        ctx.lineTo(tempx + (1 * bsize) / 3, tempy + (1 * bsize) / 2);
        ctx.lineTo(tempx + (2 * bsize) / 3, tempy + (5 * bsize) / 6);
        ctx.stroke();

        //down key
        ctx.strokeStyle = lcolor;
        tempx = sx + bsize;
        tempy = sy + bsize;
        ctx.beginPath();
        ctx.lineTo(tempx, tempy);
        ctx.lineTo(tempx, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy);
        ctx.lineTo(tempx, tempy);
        cGamepad.downButtons.down && !cPlayer._crashed && ctx.fill();
        ctx.stroke();

        //change this to change the way the symbol is drawn
        if (cGamepad.downButtons.down && !cPlayer._crashed) {
            ctx.strokeStyle = ldcolor;
        }
        ctx.beginPath();
        ctx.lineTo(tempx + (1 * bsize) / 6, tempy + (1 * bsize) / 3);
        ctx.lineTo(tempx + (1 * bsize) / 2, tempy + (2 * bsize) / 3);
        ctx.lineTo(tempx + (5 * bsize) / 6, tempy + (1 * bsize) / 3);
        ctx.stroke();

        //right key
        ctx.strokeStyle = lcolor;
        tempx = sx + 2 * bsize;
        tempy = sy + bsize;
        ctx.beginPath();
        ctx.lineTo(tempx, tempy);
        ctx.lineTo(tempx, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy + bsize);
        ctx.lineTo(tempx + bsize, tempy);
        ctx.lineTo(tempx, tempy);
        cGamepad.downButtons.right && !cPlayer._crashed && ctx.fill();
        ctx.stroke();

        //change this to change the way the symbol is drawn
        if (cGamepad.downButtons.right && !cPlayer._crashed) {
            ctx.strokeStyle = ldcolor;
        }
        ctx.beginPath();
        ctx.lineTo(tempx + (1 * bsize) / 3, tempy + (1 * bsize) / 6);
        ctx.lineTo(tempx + (2 * bsize) / 3, tempy + (1 * bsize) / 2);
        ctx.lineTo(tempx + (1 * bsize) / 3, tempy + (5 * bsize) / 6);
        ctx.stroke();
    }
}
var track = 0;
window.setInterval(function () {
    if ($('#track-data').data('t_id') != track) {
        track = $('#track-data').data('t_id');
        function rInterval() {
            window.clearInterval(v);
        }
        var v = window.setInterval(function () {
            if (GameManager != undefined && GameManager.game != undefined) {
                rInterval();
                createjs.Ticker.addEventListener('tick', drawDisplay);
            }
        }, 250);
    }
}, 500);
