// ==UserScript==
// @name         Better Races
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       Pie42
// @match        https://www.freeriderhd.com/*
// @grant        none
// ==/UserScript==

//unfortunately, this script has much less customization, but you could still change it by changing the numbers for v.x, v.y, f.x, and f.y, or by changing
//'GameSettings.raceColors' to have different colors.

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
function raceUpdate() { //this is the function that makes races fancy and cool
    var h = GameManager.game.currentScene.settings.drawFPS; //needed for parsing
    for (let i in window.uselessRaceThing) { //updating every race
        var cGhost = window.uselessRaceThing[i][0].text, //getting the current race to update,
            split = cGhost.split(' '),                   //that race's text split by spaces,
            dname = (split.length == 2) ? split[0] : split[0].slice(0,-1),                //the username in that race(the slice is necessary because the username is stored as {name}:),
            time = window.uselessRaceThing[i][1],        //the time of that race, also stored in that array,
            stars, rGhost;                               //and just setting up some variables for later use
        for (let j in GameManager.game.currentScene.playerManager._players) { //going through the players
            let cPlayer = GameManager.game.currentScene.playerManager._players[j];
            if (cPlayer._ghost && cPlayer._user.d_name == dname) { //if the player is a ghost and the name is the name in the display,
                stars = cPlayer._powerupsConsumed.targets.length;  //get how many stars that ghost has collected
                rGhost = cPlayer;                                  //get that entire player for some reason
                break;
            } //if the ghost hasn't finished, the display is set to an updated version of the form the races start out in
        } //if the ghost has finished, the display is set to {name} + a zero width space + ' finished'
        //the zero width space was the easiest way i could find to fix a bug that was occuring with names being deleted 1 character at a time
        var newT = (stars == GameManager.game.currentScene.track.targetCount) ? dname + ' finished!' : dname + ': ' + stars.toString() + ' / ' + GameManager.game.currentScene.track.targetCount.toString() + ' - ' + s((parseInt(time) - GameManager.game.currentScene.ticks) / h * 1e3);
        window.uselessRaceThing[i][0].text = newT;
    }
}
window.uselessRaceThing = []; //very useful race thing
function replace() {
    GameManager.game.currentScene.raceTimes.addRace = function(t, e) {
            if (this.raceCount < this.maxRaces) {
                var i = this.scene
                  , n = i.game
                  , r = (n.pixelRatio,
                t.user)
                  , o = t.race
                  , a = i.settings
                  , h = a.drawFPS
                  , l = r.color
                  , c = "helsinki"
                  , u = new createjs.Container
                  , v = new createjs.Text('>>', "30px Roboto Medium", l) //only in roboto because helsinki doesn't have the '>' character
                  , f = new createjs.Text(r.d_name + ': 0 / ' + i.track.targetCount.toString() + ' - ' + s(parseInt(o.run_ticks) / h * 1e3), "30px " + c, l); //setting up the display
                v.alpha = 0; //you can just remove the pointer initially, it will be highlighted if needed
                v.x = 1, //uh these numbers work, but feel free to mess around with them
                v.y = 9; //with these numbers you could put the display on the right side, but i couldn't find anywhere that looked good to me,
                f.x = 50,//so that's why it's on the left still
                f.y = 9;
                window.uselessRaceThing.push([f, o.run_ticks]); //very important line, since it lets it get updated
                u.addChild(v, f), //this is just stuff from the default script
                a.mobile ? u.x = e * this.mobileRaceXOffset : (u.x = -2,
                u.y = e * this.raceYOffset),
                this.raceList.push(u),
                this.container.addChild(u),
                this.raceCount++
            }
        }
    GameManager.game.currentScene.raceTimes.highlightRace = function(t) {
            if (GameManager.game.currentScene.raceTimes.highlightedRace !== GameManager.game.currentScene.raceTimes.raceList[t]) {
                GameManager.game.currentScene.raceTimes.unhighlightRace();
                var e = GameManager.game.currentScene.raceTimes.raceList[t].children[0]; //this is the only change i made to this
                e.alpha = 1, //basically, this sets the alpha of the '>>' string to 1, so it's visible
                GameManager.game.currentScene.raceTimes.highlightedRace = e
            }
        }
    GameManager.game.currentScene.raceTimes.unhighlightRace = function() {
            GameManager.game.currentScene.raceTimes.highlightedRace && (GameManager.game.currentScene.raceTimes.highlightedRace.alpha = 0, //hiding it again
            GameManager.game.currentScene.raceTimes.highlightedRace = null)
        }
    for (var race in GameManager.game.currentScene.races) { //now, because this script isn't inserted, once all of the functions are changed,
        GameManager.game.currentScene.addRaces([GameManager.game.currentScene.races[race]]); //it needs to re-add all of the races.
    }
}
var track = 0; //making sure it works still when you go to a different track
window.setInterval(function () {
    if ($("#track-data").data("t_id") != track) {
        track = $("#track-data").data("t_id");
        window.uselessRaceThing = [];
        function rInterval() {
            window.clearInterval(v)
        }
        var v = window.setInterval(function() {
            if (GameManager != undefined && GameManager.game != undefined) {
                rInterval();
                replace();
                createjs.Ticker.addEventListener("tick", raceUpdate);
            }
        }, 250)
    }
}, 500)