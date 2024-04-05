// ==UserScript==
// @name         select tool
// @version      2024-04-01.2
// @description  oh god another one !?!
// @author       pie42
// @match        https://www.freeriderhd.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=undefined.
// @grant        none
// ==/UserScript==

function load() {
    // this is more hacky than i'd like it to be but it works
    let zv = GameManager.game.currentScene.camera.position.factor(0),
        vector = (x = 0, y = 0) => {return zv.factor(0).add({x, y})},
        hovered,
        selected,
        hoverList,
        selectList,
        // used for recreating parts of the selectList when playing
        // will be done in the sector the player's in and nearby sectors, and just left until movement starts again
        hoverPhysicsList = {},
        selectPhysicsList = {},
        selectOffset = vector(),
        // since this is used to track, not render, we can get away with only having one of these
        pointOffset = vector(),
        isHoverList = false,
        isSelectList = false,
        hoverPoint,
        selectPoint,
        connected,
        connectedPoint,
        isSelectedUpdated = true,
        // used to temporarily recreate the selected line while you're playing the track (so it feels nicer)
        isSelectIntangible = true,
        tempSelect;
    // for debugging
    let frameMinDist,
        frameBestLine;
    // render info
    let powerups = {
        // the colors for these are the last 2 arguments, and go normal color, nostalgia mode
        "bomb": [20, '#d12929', '#f00'],
        "boost": [Math.sqrt(1000), '#8ac932', '#ff0'],
        "checkpoint": [26, '#826cdc', '#00f'],
        "gravity": [Math.sqrt(1000), '#376eb7', '#0f0'],
        "slowmo": [26, '#733', '#733'],
        "goal": [26, '#fae335', '#ff0'],
        "teleport": [Math.sqrt(1000), '#dd45ec', '#f0f'],
        "antigravity": [Math.sqrt(1000), '#09faf3', '#0ff'],
        "blob": [30, '#a784c5', '#cdbade'],
        "balloon": [30, '#f02728', '#f57070'],
        "helicopter": [30, '#f2902e', '#f6b36f'],
        "truck": [30, '#94d44e', '#b9e38c'],
    },
        polyMod = GameManager.game?.mod;
    window.selected = selected;
    window.hovered = hovered;
    const HOVER_DIST = 10;
    // old line - used to work until mysterious unannounced chrome changes killed it
    //class P extends GameManager.game.currentScene.toolHandler.tools.straightline.__proto__.__proto__.constructor {
    class SelectTool {
        constructor(s) {
            // new line - since i can't seem to use super anymore, i can accomplish the same thing with a temporary variable
            let supa = Object.create(GameManager.game.currentScene.toolHandler.tools.straightline.__proto__.__proto__);
            for (let i in supa) {
                if (!this[i])
                    this.__proto__[i] = supa[i];
            }
            if (polyMod) {
                for (let i of Object.getOwnPropertyNames(supa.__proto__)) {
                    if (!this[i])
                        this.__proto__[i] = supa[i];
                }
            }
            this.supa = supa;
            this.toolUpdate = supa.update;
            console.log(supa, this);
            supa.init.apply(this, [s]);
            this.toolHandler = s;
            this.p1 = undefined;
            this.p2 = undefined;
            this.dashOffset = 0;
            this.name = 'select';
            this.down = false;
            // make a copy
            this.oldMouse = this.mouse.touch.real.factor(1);
        }

        get selected() {
            return isSelectList ? selectList : selected ? [selected] : [];
        }

        get hovered() {
            return isHoverList ? hoverList : hovered ? [hovered] : [];
        }

        press() {
            this.down = true;
            if (hovered && hovered === tempSelect?.[0]) {
                hovered = selected;
                console.log('clicked on temp :P');
                if (selectPoint && selected) {
                    if (selectPoint.x == selected.p1.x && selectPoint.y == selected.p1.y) {
                        selectPoint = selected.p1;
                    } else if (selectPoint.x == selected.p2.x && selectPoint.y == selected.p2.y) {
                        selectPoint = selected.p2;
                    }
                }
            }
            if (selected && selected != hovered) {
                let a = [recreate(selected)];
                if (selectPoint && connected) {
                    remove(connected);
                    a = [a[0], recreate(connected)];
                    connected = connected.newVersion;
                }
                tempSelect?.forEach?.(i=>remove(i));
                tempSelect = undefined;
                if (selectOffset.x || selectOffset.y) {
                    let {x, y} = selectOffset;
                    this.scene.toolHandler.addActionToTimeline({
                        objects: a,
                        type: 'transform',
                        move: {x, y},
                        applied: true,
                    });
                    // idk man this is wack
                    if (selected.p1) {
                        selected.p1.inc(selectOffset);
                        selected.p2.inc(selectOffset);
                    }
                    selectOffset = vector();
                } else if (pointOffset.x || pointOffset.y) {
                    let pointName = (selectPoint.x == selected.p1.x && selectPoint.y == selected.p1.y) ? 'p1' : 'p2',
                        points = [pointName],
                        objects = [selected],
                        {x, y} = pointOffset;
                    if (connected) {
                        points.push(connectedPoint);
                        objects.push(connected);
                    }
                    this.scene.toolHandler.addActionToTimeline({
                        objects,
                        points,
                        type: 'transform',
                        move: {x, y},
                        applied: true,
                    });
                    pointOffset = vector();
                }
                connected = undefined;
                console.log('recreated', a);
            }
            if (isSelectList && (hovered || !pointrect(this.mouse.touch.real, this.p1, this.p2))) {
                for (let i of selectList) {
                    remove(i);
                }
                tempSelect?.forEach?.(i=>remove(i));
                tempSelect = undefined;
                let a = selectList.map(s => recreate(s));
                if (selectOffset.x || selectOffset.y) {
                    let {x, y} = selectOffset;
                    this.scene.toolHandler.addActionToTimeline({
                        objects: a,
                        type: 'transform',
                        move: {x, y},
                        applied: true,
                    });
                }
                console.log('recreated', a);
            }
            if (hovered) {
                // TO-DO: find a better place to put / store this
                let oldConnected = [connected, connectedPoint];
                if (hovered != selected)
                    selectOffset = vector();
                else {
                    tempSelect?.forEach?.(i=>remove(i));
                    tempSelect = undefined;
                    isSelectIntangible = true;
                    if (selectPoint && connected) {
                        remove(connected);
                        recreate(connected);
                        connected = undefined;
                    }
                }
                selected = hovered;
                isHoverList = false;
                window.selected = hovered;
                if (selected) {
                    console.log('selected', selected);
                    remove(selected);
                    let minDist = HOVER_DIST / this.scene.camera.zoom,
                        minPoint = undefined;
                    if (selected.p1) {
                        for (let i of [selected.p1, selected.p2]) {
                            let dist = pointsdf(this.mouse.touch.real, i.add(selectOffset));
                            if (dist < minDist) {
                                minDist = dist;
                                minPoint = i;
                            }
                        }
                        if (minPoint) {
                            let size = this.scene.track.settings.drawSectorSize,
                                sectors = this.scene.track.sectors.drawSectors,
                                sectorPos = minPoint.factor(1 / size),
                                sector = sectors[Math.floor(sectorPos.x)]?.[Math.floor(sectorPos.y)],
                                lines = sector?.['highlight' in selected ? "physicsLines" : "sceneryLines"] || [];
                            if (connected && !connected.newVersion) {
                                remove(connected);
                                recreate(connected);
                            }
                            connected = undefined;
                            for (let i of lines) {
                                if (!i.remove && i.p1.x == minPoint.x && i.p1.y == minPoint.y) {
                                    connected = i;
                                    connectedPoint = 'p1';
                                    break;
                                } else if (!i.remove && i.p2.x == minPoint.x && i.p2.y == minPoint.y) {
                                    connected = i;
                                    connectedPoint = 'p2';
                                    break;
                                }
                            }
                            if (connected) {
                                remove(connected);
                                console.log('connected to', connected);
                            }
                        }
                    }
                    if (selectPoint != minPoint) {
                        if (selectPoint == undefined && (selectOffset.x || selectOffset.y)) {
                            let {x, y} = selectOffset;
                            this.scene.toolHandler.addActionToTimeline({
                                objects: [selected],
                                type: 'transform',
                                move: {x, y},
                                applied: true,
                            });
                            selected.p1.inc(selectOffset);
                            selected.p2.inc(selectOffset);
                            selectOffset = vector();
                        } else if (pointOffset.x || pointOffset.y) {
                            let pointName = (selectPoint.x == selected.p1.x && selectPoint.y == selected.p1.y) ? 'p1' : 'p2',
                                points = [pointName],
                                objects = [selected],
                                {x, y} = pointOffset;
                            if (oldConnected[0]) {
                                points.push(oldConnected[1]);
                                objects.push(oldConnected[0]);
                            }
                            this.scene.toolHandler.addActionToTimeline({
                                objects,
                                points,
                                type: 'transform',
                                move: {x, y},
                                applied: true,
                            });
                            pointOffset = vector();
                        }
                    }
                    selectPoint = minPoint;
                }
                isSelectList = false;
                selectList = selectPhysicsList = undefined;
            } else if (this.p1 && pointrect(this.mouse.touch.real, this.p1, this.p2)) {
                selected = undefined;
                console.log('in rect!');
            } else {
                isSelectedUpdated = false;
                isHoverList = true;
                hoverList = [];
                this.p1 = this.mouse.touch.real.factor(1);
                this.p2 = this.mouse.touch.real.factor(1);
            }
        }

        hold() {
            if (isHoverList) {
                this.p2 = this.mouse.touch.real.factor(1);
            }
        }

        update(force = false) {
            const mousePos = this.mouse.touch.real;
            shouldUpdate: if (force || !(mousePos.x == this.oldMouse.x && mousePos.y == this.oldMouse.y)) {
                if (isHoverList)
                    this.p2 = mousePos.factor(1);
                // this is my current best guess for if there exists something to move and we should move it
                if (this.scene.state.paused && this.down && this.selected.length && isSelectedUpdated) {
                    // remove the line if it's been temporarily recreated
                    if (!isSelectIntangible) {
                        isSelectIntangible = true;
                        tempSelect?.forEach?.(i=>remove(i));
                        tempSelect = undefined;
                        remove(connected);
                    }
                    if (tempSelect && tempSelect.length) {
                        for (let i of tempSelect) {
                            remove(i);
                        }
                        for (let x in selectPhysicsList) {
                            let row = selectPhysicsList[x];
                            for (let y in row) {
                                let cell = row[y];
                                if (cell.mark) {
                                    cell.mark = false;
                                    for (let line of cell) {
                                        line.temp = false;
                                    }
                                }
                            }
                        }
                        isSelectIntangible = true;
                        tempSelect = undefined;
                    }
                    let dMouse = mousePos.sub(this.oldMouse);
                    dMouse.x = Math.round(dMouse.x);
                    dMouse.y = Math.round(dMouse.y);
                    if (this.scene.toolHandler.options.grid) {
                        let gridSize = this.scene.toolHandler.options.gridSize;
                        dMouse.x = Math.round(dMouse.x / gridSize) * gridSize;
                        dMouse.y = Math.round(dMouse.y / gridSize) * gridSize;
                    }
                    // points get moved seperately (since it's only one point moving rather than a whole line or group of objects)
                    if (selectPoint) {
                        selectPoint.inc(dMouse);
                        selected.pp = selected.p2.sub(selected.p1);
                        selected.len = selected.pp.len();
                        if (connected) {
                            connected[connectedPoint].inc(dMouse);
                            connected.pp = connected.p2.sub(connected.p1);
                            connected.len = connected.pp.len();
                        }
                        pointOffset = dMouse.add(pointOffset);
                    } else {
                        // by switching to the selectOffset for everything, this is a lot simpler :)
                        selectOffset = dMouse.add(selectOffset);
                        if (isSelectList) {
                            this.p1.inc(dMouse);
                            this.p2.inc(dMouse);
                        }
                    }
                    break shouldUpdate;
                }

                if (isHoverList) {
                    this.multiHover();
                } else {
                    this.singleHover(mousePos);
                }
            }
            if (force) return;
            this.oldMouse = this.mouse.touch.real.factor(1);
            this.toolUpdate();
        }

        singleHover(mousePos) {
            let minDist = 1000,
                bestLine = undefined,
                adjustedDist = 2 * HOVER_DIST / this.scene.camera.zoom;
            // selected doesn't exist on the track, so we have to check it separately
            if (selected) {
                let dist = selected.p1 ?
                    linesdf(mousePos.sub(selectOffset), selected) :
                pointsdf(mousePos.sub(selectOffset), selected);
                if (dist < minDist) {
                    minDist = dist;
                    bestLine = selected;
                }
            }

            let sectorSize = this.scene.settings.drawSectorSize,
                sectorPos = mousePos.factor(1 / sectorSize);
            sectorPos.x = Math.floor(sectorPos.x);
            sectorPos.y = Math.floor(sectorPos.y);
            let currentSectorData = this.testSectorSingle(sectorPos);
            if (currentSectorData[0] < minDist) {
                [minDist, bestLine] = currentSectorData;
            }
            // this is all to figure out which sectors we even need to check
            // i.e. within range to have a line that can possibly be close enough
            // the position of the sector in track-space
            let sectorTrackPos = sectorPos.factor(sectorSize),
                // the position of the mouse within the sector
                posInSector = mousePos.sub(sectorTrackPos),
                // a zero vector (for checking the top left)
                zeroVector = posInSector.factor(0),
                // a vector of just the sector size (for checking the bottom right)
                maxPos = zeroVector.add({x: sectorSize, y: sectorSize}),
                sectorsToCheck = [],
                positions = [zeroVector, posInSector, maxPos];
            for (let i = -1; i < 2; i++) {
                let x = positions[i + 1].x;
                for (let j = -1; j < 2; j++) {
                    // we don't need to re-check the current sector
                    if (!i && !j)
                        continue;
                    let y = positions[j + 1].y;
                    if (pointsdf(mousePos, {x, y}) <= adjustedDist * 1.5) {
                        sectorsToCheck.push([i, j]);
                    }
                }
            }

            for (let i of sectorsToCheck) {
                let sectorData = this.testSectorSingle(sectorPos.add(i));
                if (sectorData[0] < minDist) {
                    [minDist, bestLine] = sectorData;
                }
            }
            [frameMinDist, frameBestLine] = [minDist, bestLine];
            if (minDist < adjustedDist) {
                hovered = bestLine;
            } else {
                hovered = undefined;
                return;
            }
            minDist = HOVER_DIST / this.scene.camera.zoom;
            let minPoint = undefined,
                isSelected = hovered == selected;
            if (hovered.p1) {
                for (let i of [hovered.p1, hovered.p2]) {
                    let dist = pointsdf(mousePos, i.add(isSelected ? selectOffset : vector()));
                    if (dist < minDist) {
                        minDist = dist;
                        minPoint = i;
                    }
                }
            }
            hoverPoint = minPoint;
        }

        multiHover() {
            // this logic is very simple: decide which sectors to add, then add everything necessary from them
            let sectorSize = this.scene.settings.drawSectorSize,
                minVec = {x: Math.min(this.p1.x, this.p2.x), y: Math.min(this.p1.y, this.p2.y)},
                maxVec = {x: Math.max(this.p1.x, this.p2.x), y: Math.max(this.p1.y, this.p2.y)},
                lines = [];
            hoverPhysicsList = {};
            for (let x = Math.floor(minVec.x / sectorSize); x <= Math.ceil(maxVec.x / sectorSize); x++) {
                let row = this.scene.track.sectors.drawSectors[x];
                if (!row) continue;
                hoverPhysicsList[x] = {};
                for (let y = Math.floor(minVec.y / sectorSize); y <= Math.ceil(maxVec.y / sectorSize); y++) {
                    hoverPhysicsList[x][y] = [];
                    lines.push(...this.testSectorMulti({x, y}, minVec, maxVec).filter(i => !lines.includes(i) && !i.remove));
                }
            }
            hoverList = lines;
        }

        release() {
            this.down = false;
            isSelectedUpdated = true;
            if (isHoverList) {
                selected = undefined;
                isSelectList = true;
                selectList = [...hoverList];
                selectPhysicsList = hoverPhysicsList;
                hoverList = [];
                isHoverList = false;
                selectOffset = vector();
                for (let i of selectList) {
                    remove(i);
                }
                console.log('selected!', selectList);
            }
        }

        draw() {
            let ctx = this.game.canvas.getContext('2d');
            // debug (draw info about the best line
            /*//
            if (frameBestLine) {
                if (frameBestLine.rp1) {
                let rp1 = frameBestLine.p1.toScreen(this.scene),
                    rp2 = frameBestLine.p2.toScreen(this.scene),
                    rpp = frameBestLine.pp;
                ctx.strokeStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(rp1.x, rp1.y);
                ctx.moveTo(rp2.x, rp2.y);
                ctx.stroke();
                ctx.fillText(frameMinDist, rp1.x - rpp.x * Math.sign(rpp.x) / 2, rp1.y - rpp.y * Math.sign(rpp.y) / 2);
                } else {
                    let pos = scene.camera.position.factor(0).add(frameBestLine).toScreen(scene)
                    ctx.fillText(frameMinDist, pos.x + 10, pos.y + 10);
                }
            }
            //*/
            if (!isHoverList && !isSelectList) return;
            let rp1 = this.p1.toScreen(this.scene),
                rp2 = this.p2.toScreen(this.scene),
                w = rp2.x - rp1.x,
                h = rp2.y - rp1.y;
            ctx.save();
            if (ctx.setLineDash)
                ctx.setLineDash([6]);
            ctx.lineDashOffset = this.dashOffset++;
            ctx.beginPath();
            ctx.rect(rp1.x, rp1.y, w, h);
            ctx.fillStyle = "rgba(24, 132, 207, 0.3)";
            isHoverList && ctx.fill();
            ctx.strokeStyle = "rgba(24, 132, 207, 0.7)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
            this.dashOffset %= 23;
        }

        testSectorSingle(sectorPos) {
            let mousePos = this.mouse.touch.real,
                sector = this.scene.track.sectors.drawSectors?.[sectorPos.x]?.[sectorPos.y],
                minDist = 1000,
                bestLine = undefined;
            if (sector == undefined) {
                return [minDist, bestLine];
            }
            for (let i of sector.physicsLines) {
                if (i.remove)
                    continue;
                let dist = linesdf(mousePos, i);
                if (dist < minDist && i != tempSelect) {
                    minDist = dist;
                    bestLine = i;
                }
            }
            for (let i of sector.sceneryLines) {
                if (i.remove)
                    continue;
                let dist = linesdf(mousePos, i);
                if (dist < minDist) {
                    minDist = dist;
                    bestLine = i;
                }
            }
            for (let i of sector.powerups.all) {
                if (i.remove)
                    continue;
                let dist = pointsdf(mousePos, i);
                if (dist < minDist) {
                    minDist = dist;
                    bestLine = i;
                }
            }
            return [minDist, bestLine];
        }

        testSectorMulti(sectorPos, minVec, maxVec) {
            let sectorSize = this.scene.settings.drawSectorSize,
                sectorTrackPos = {x: sectorPos.x * sectorSize, y: sectorPos.y * sectorSize},
                sector = this.scene.track.sectors.drawSectors?.[sectorPos.x]?.[sectorPos.y];
            if (sector == undefined)
                return [];
            // see if we can just return the whole sector
            if (minVec.x <= sectorTrackPos.x &&
                minVec.y <= sectorTrackPos.y &&
                maxVec.x >= sectorTrackPos.x + sectorSize &&
                maxVec.y >= sectorTrackPos.y + sectorSize) {
                hoverPhysicsList[sectorPos.x][sectorPos.y] = sector.physicsLines.filter(i => !i.remove)
                    .concat(sector.powerups.all.filter(i => !i.remove));
                return hoverPhysicsList[sectorPos.x][sectorPos.y]
                    .concat(sector.sceneryLines.filter(i => !i.remove));
            }
            let toReturn = [];
            for (let i of sector.physicsLines) {
                if (i.remove)
                    continue;
                if (rectcollide(i.p1, i.p2, minVec, maxVec))
                    toReturn.push(i);
            }
            for (let i of sector.powerups.all) {
                if (i.remove)
                    continue;
                if (pointrect(i, minVec, maxVec))
                    toReturn.push(i);
            }
            hoverPhysicsList[sectorPos.x][sectorPos.y] = [...toReturn];
            for (let i of sector.sceneryLines) {
                if (i.remove)
                    continue;
                if (rectcollide(i.p1, i.p2, minVec, maxVec))
                    toReturn.push(i);
            }
            return toReturn;
        }
    }

    let game = GameManager.game,
        scene = game.currentScene,
        active = false;

    scene.toolHandler.registerTool(SelectTool);
    let selectTool = scene.toolHandler.tools.select;

    // fix undo / redo for moved objects
    // this is a little bit weird but it seems to work:
    /* - if anything in toRevert has been removed and not recreated, we assume it's been selected and cancel the action
     * (still debating how to actually undo the lines (i.e. whether to use the same lines or recreate them every time))
     */
    scene.toolHandler.revertAction = (old => () => {
        let oldPointer = scene.toolHandler.actionTimelinePointer;
        old.apply(scene.toolHandler);
        if (oldPointer == scene.toolHandler.actionTimelinePointer) return;
        let toRevert = scene.toolHandler.actionTimeline[scene.toolHandler.actionTimelinePointer];
        if (toRevert) toRevert.objects = toRevert.objects.map(i => {while (i.newVersion) i = i.newVersion; return i});
        if (toRevert && toRevert.type == 'transform' && toRevert.applied) {
            if (toRevert.objects.some(i => i.remove)) {
                scene.toolHandler.actionTimelinePointer = oldPointer;
                return;
            }
            //*//
            toRevert.objects = toRevert.objects.map((i, j) => {
                if (i.remove) {
                    while (i.newVersion)
                        i = i.newVersion;
                }
                remove(i);
                if (i.p1 && toRevert.points?.[j]) {
                    i[toRevert.points[j]].inc({x: -toRevert.move.x, y: -toRevert.move.y});
                    return recreate(i);
                }
                return recreate(i, {x: -toRevert.move.x, y: -toRevert.move.y});
            });
            //*/
            /*//
            toRevert.objects.forEach(i => {
                while (i.newVersion) i = i.newVersion;
                remove(i);
            });
            scene.track.cleanTrack();
            toRevert.objects.forEach((i, j) => {
                if (i.p1) {
                    let {x, y} = toRevert.move,
                        backwards = {x: -x, y: -y};
                    if (toRevert.points?.[j]) {
                        i[toRevert.points[j]].inc(backwards);
                    } else {
                        i.p1.inc(backwards);
                        i.p2.inc(backwards);
                    }
                } else {
                    i.x -= toRevert.move.x;
                    i.y -= toRevert.move.y;
                }
            });
            scene.toolHandler.addObjects(toRevert.objects);
            //*/
            toRevert.applied = false;
        }
    })(scene.toolHandler.revertAction);

    scene.toolHandler.applyAction = (old => () => {
        let oldPointer = scene.toolHandler.actionTimelinePointer;
        old.apply(scene.toolHandler);
        if (oldPointer == scene.toolHandler.actionTimelinePointer) return;
        let toRevert = scene.toolHandler.actionTimeline[scene.toolHandler.actionTimelinePointer - 1];
        if (toRevert) toRevert.objects = toRevert.objects.map(i => {while (i.newVersion) i = i.newVersion; return i});
        if (toRevert && toRevert.type == 'transform' && !toRevert.applied) {
            if (toRevert.objects.some(i => i.remove)) {
                scene.toolHandler.actionTimelinePointer = oldPointer;
                return;
            }
            //*//
            toRevert.objects = toRevert.objects.map((i, j) => {
                if (i.remove) {
                    while (i.newVersion)
                        i = i.newVersion;
                }
                remove(i);
                if (i.p1 && toRevert.points?.[j]) {
                    i[toRevert.points[j]].inc(toRevert.move);
                    return recreate(i);
                }
                return recreate(i, {x: toRevert.move.x, y: toRevert.move.y});
            });
            //*/
            /*//
            toRevert.objects.forEach(i => {
                while (i.newVersion) i = i.newVersion;
                remove(i);
            });
            scene.track.cleanTrack();
            toRevert.objects.forEach((i, j) => {
                if (i.p1) {
                    if (toRevert.points?.[j]) {
                        i[toRevert.points[j]].inc(toRevert.move);
                    } else {
                        i.p1.inc(toRevert.move);
                        i.p2.inc(toRevert.move);
                    }
                } else {
                    i.x += toRevert.move.x;
                    i.y += toRevert.move.y;
                }
            });
            scene.toolHandler.addObjects(toRevert.objects);
            //*/
            toRevert.applied = true;
        }
    })(scene.toolHandler.applyAction);

    // also patch removeObjects and addObjects just for fun
    scene.toolHandler.removeObjects = (old => (t) => {
        for (let i in t)
            while (t[i].newVersion)
                t[i] = t[i].newVersion;
        //t = t.map(i => {while (i.newVersion) i = i.newVersion; return i;});
        old.apply(scene.toolHandler, [t]);
    })(scene.toolHandler.removeObjects);

    scene.toolHandler.addObjects = (old => (t) => {
        for (let i in t)
            while (t[i].newVersion)
                t[i] = t[i].newVersion;
        //t = t.map(i => {while (i.newVersion) i = i.newVersion; return i;});
        old.apply(scene.toolHandler, [t]);
    })(scene.toolHandler.addObjects);

    let bottomMenu = createElement('div', null, {
        classes: ['bottomToolOptions', 'bottomToolOptions_select'],
        data: {reactid: '.0.4.0.0'},
        children: [{
            tag: 'div',
            classes: ['bottomToolOptions-toolTitle'],
            data: {reactid: '.0.4.0.0.0'},
            children: [
                {
                    tag: 'span',
                    classes: ['editorgui_icons', 'editorgui_icons-icon_select'],
                    data: {reactid: '.0.4.0.0.0.0'},
                },
                {
                    tag: 'span',
                    classes: ['toolName'],
                    data: {reactid: '.0.4.0.0.0.1'},
                    children: [{
                        tag: 'span',
                        innerHTML: 'Select',
                        data: {reactid: '.0.4.0.0.0.1.0'},
                    }],
                }],
        }],
    }),
        button = createElement('div', null, {
            children: [{
                tag: 'span',
                classes: ['editorgui_icons', 'editorgui_icons-icon_select'],
            }],
            classes: ['sideButton', 'sideButton_selectTool'],
            onclick: () => {
                scene.toolHandler.setTool('select');
                let bottomToolTip = document.querySelector('.bottomMenu .clearfix');
                // need to delete the span that's supposed to be there to avoid react throwing a fit :(
                bottomToolTip.firstElementChild.remove();
                bottomToolTip.insertBefore(bottomMenu, bottomToolTip.firstElementChild);
            },
            oncreate: (e) => {
                doAMario('.leftMenu').then(i=>i.insertBefore(e, document.querySelector('.sideButton_cameraTool')));
            },
        });
    createElement('style', document.head, {
        innerHTML: `
    .editorgui_icons-icon_select {
    background-image: url(https://cdn.freeriderhd.com/free_rider_hd/assets/images/editor/gui/editorgui_icons_v5.png);
    width: 44px;
    height: 44px;
    background-size: 778px 124px;
    background-position: -322.5px 0px;
    }
    `});
    let moveSpeed = 0.3,
        moveAccumulator = 1;

    createjs.Ticker.addEventListener('tick', () => {
        if (!scene.state.paused && selected && isSelectIntangible && !tempSelect?.length) {
            tempSelect = [recreate(selected)];
            console.log('temporary', tempSelect);
            isSelectIntangible = false;
            if (connected) {
                connected.remove = 0;
                scene.track.addPhysicsLineToTrack(connected);
            }
        }
        if (!scene.state.paused && isSelectList) {
            tempSelect = tempSelect || [];
            let sectorSize = scene.settings.drawSectorSize,
                vehicle = scene.playerManager.firstPlayer._tempVehicle || scene.playerManager.firstPlayer._baseVehicle,
                pos = vehicle.masses[0].pos,
                sector = pos.factor(1 / sectorSize);
            sector.x = Math.floor(sector.x);
            sector.y = Math.floor(sector.y);
            for (let x = -1; x < 2; x++) {
                if (!selectPhysicsList[x]) continue;
                for (let y = -1; y < 2; y++) {
                    let cell = selectPhysicsList[x][y];
                    if (!cell || !cell.length || cell.mark) continue;
                    for (let i of cell) {
                        if (i.temp) continue;
                        let line = recreate(i, selectOffset);
                        tempSelect.push(line);
                        i.temp = true;
                    }
                    cell.mark = true;
                }
            }
        }
        // allow moving the currently selected object with movement keys when paused
        if (scene.state.paused && selectTool.selected.length && !tempSelect?.length) {
            let tdb = scene.playerManager.firstPlayer._gamepad.getDownButtons(),
                dir = vector();
            for (let button of tdb) {
                switch (button) {
                    case "up":
                        dir.y--;
                        break;
                    case "down":
                        dir.y++;
                        break;
                    case "right":
                        dir.x++;
                        break;
                    case "left":
                        dir.x--;
                        break;
                    case "46":
                        var objects = [...selectTool.selected];
                        if (connected)
                            objects.push(connected);
                        scene.toolHandler.addActionToTimeline({
                            objects,
                            type: 'remove',
                        });
                        selected = undefined;
                        selectPoint = undefined;
                        isSelectList = false;
                        selectOffset = vector();
                        break;
                }
            }
            if (selected) {
                let dirLen = Math.sqrt(dir.x ** 2 + dir.y ** 2);
                if (dirLen > 0) {
                    dir.x = dir.x * moveAccumulator / dirLen | 0;
                    dir.y = dir.y * moveAccumulator / dirLen | 0;
                    if (selectPoint) {
                        selectPoint.inc(dir);
                        if (connected) {
                            connected[connectedPoint].inc(dir);
                        }
                        pointOffset.inc(dir);
                    } else {
                        selectOffset.inc(dir);
                    }
                    moveSpeed *= 1.02;
                    moveAccumulator %= 1;
                    moveAccumulator += moveSpeed;
                    if (!isSelectIntangible) {
                        isSelectIntangible = true;
                        tempSelect?.forEach?.(i=>remove(i));
                        tempSelect = undefined;
                        remove(connected);
                    }
                } else {
                    moveSpeed = 0.3;
                    moveAccumulator = 1;
                }
            }
        }
        let ctx = game.canvas.getContext('2d'),
            zoom = scene.camera.zoom;
        ctx.lineCap = "round";
        // render selected
        if (selectTool.selected.length) {
            // the actual line
            for (let selected of selectTool.selected) {
                if (selected.p1) {
                    let rp1 = selected.p1.add(selectOffset).toScreen(scene),
                        rp2 = selected.p2.add(selectOffset).toScreen(scene);
                    if (isSelectIntangible) {
                        ctx.lineWidth = Math.max(2 * zoom, 0.5);
                        ctx.strokeStyle = 'highlight' in selected ? '#000000' : '#AAAAAA';
                        ctx.beginPath();
                        ctx.moveTo(rp1.x, rp1.y);
                        ctx.lineTo(rp2.x, rp2.y);
                        ctx.stroke();
                    }
                    // the highlight on the line
                    ctx.lineWidth = Math.max(zoom, 1);
                    ctx.strokeStyle = selectPoint ? '#2200ff' : '#00ffff';
                    ctx.beginPath();
                    ctx.moveTo(rp1.x, rp1.y);
                    ctx.lineTo(rp2.x, rp2.y);
                    ctx.stroke();
                } else {
                    let data = powerups[selected.name];
                    if (!data) continue;
                    let camera = scene.camera,
                        pos = camera.position.factor(0).add(selected).add(selectOffset).toScreen(scene),
                        size = data[0] / zoom;
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = data[1 + !!polyMod?.getVar("crPowerups")];
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, Math.max(data[0] * zoom / 1.5, 1), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }
            // handles
            if (!isSelectList && selected.p1) {
                let rp1 = selected.p1.add(selectOffset).toScreen(scene),
                    rp2 = selected.p2.add(selectOffset).toScreen(scene);
                for (let i of [rp1, rp2]) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#2200ff';
                    ctx.fillStyle = '#00ffff';
                    ctx.rect(i.x - zoom * 2, i.y - zoom * 2, zoom * 4, zoom * 4);
                    ctx.fill();
                    ctx.stroke();
                }
                if (selectPoint) {
                    if (connected) {
                        let rp1 = connected.p1.add(selectOffset).toScreen(scene),
                            rp2 = connected.p2.add(selectOffset).toScreen(scene);
                        ctx.lineWidth = Math.max(2 * zoom, 0.5);
                        ctx.strokeStyle = 'highlight' in connected ? '#000000' : '#AAAAAA';
                        ctx.beginPath();
                        ctx.moveTo(rp1.x, rp1.y);
                        ctx.lineTo(rp2.x, rp2.y);
                        ctx.stroke();
                        // the highlight on the line
                        ctx.lineWidth = Math.max(zoom, 1);
                        ctx.strokeStyle = selectPoint ? '#2200ff' : '#00ffff';
                        ctx.beginPath();
                        ctx.moveTo(rp1.x, rp1.y);
                        ctx.lineTo(rp2.x, rp2.y);
                        ctx.stroke();
                        // the other handle
                        let rsp = connected[connectedPoint == 'p1' ? 'p2' : 'p1'].add(selectOffset).toScreen(scene);
                        ctx.beginPath();
                        ctx.strokeStyle = '#2200ff';
                        ctx.fillStyle = '#00ffff';
                        ctx.rect(rsp.x - zoom * 2, rsp.y - zoom * 2, zoom * 4, zoom * 4);
                        ctx.fill();
                        ctx.stroke();
                    }
                    let rsp = selectPoint.add(selectOffset).toScreen(scene);
                    ctx.beginPath();
                    ctx.strokeStyle = '#00ffff';
                    ctx.fillStyle = '#2200ff';
                    ctx.rect(rsp.x - zoom * 2, rsp.y - zoom * 2, zoom * 4, zoom * 4);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
        // render hovered
        if (selectTool.hovered.length) {
            if (hoverPoint) {
                let isSelect = hovered == selected,
                    rsp = hoverPoint.add(isSelect ? selectOffset : vector()).toScreen(scene);
                ctx.beginPath();
                ctx.strokeStyle = '#00ddff';
                ctx.fillStyle = '#22ff00';
                ctx.rect(rsp.x - zoom * 3, rsp.y - zoom * 3, zoom * 6, zoom * 6);
                ctx.fill();
                ctx.stroke();
            } else {
                for (let hovered of selectTool.hovered) {
                    if (hovered.p1) {
                        ctx.lineWidth = Math.max(2 * zoom, 1);
                        ctx.strokeStyle = '#ffff00';
                        ctx.beginPath();
                        let isSelect = hovered == selected,
                            rp1 = hovered.p1.add(isSelect ? selectOffset : vector()).toScreen(scene),
                            rp2 = hovered.p2.add(isSelect ? selectOffset : vector()).toScreen(scene);
                        ctx.moveTo(rp1.x, rp1.y);
                        ctx.lineTo(rp2.x, rp2.y);
                        ctx.stroke();
                    } else {
                        let data = powerups[hovered.name];
                        if (!data) continue;
                        let isSelect = hovered == selected,
                            camera = scene.camera,
                            pos = camera.position.factor(0).add(hovered).add(isSelect ? selectOffset : vector()).toScreen(scene),
                            size = data[0] / zoom;
                        ctx.globalAlpha = 0.5;
                        ctx.fillStyle = data[1 + !!polyMod?.getVar("crPowerups")];
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, Math.max(data[0] * zoom / 1.2, 1), 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                }
                if (!isHoverList && hovered.p1) {
                    let isSelect = hovered == selected,
                        rp1 = hovered.p1.add(isSelect ? selectOffset : vector()).toScreen(scene),
                        rp2 = hovered.p2.add(isSelect ? selectOffset : vector()).toScreen(scene);
                    //handles
                    for (let i of [rp1, rp2]) {
                        ctx.beginPath();
                        ctx.strokeStyle = '#22ff00';
                        ctx.fillStyle = '#00ddff';
                        ctx.rect(i.x - zoom * 3, i.y - zoom * 3, zoom * 6, zoom * 6);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            }
            // i tried to make it so the cursor would be a pointer, but it didn't really work out
            /*if (game.canvas.style.cursor != 'pointer')
                game.canvas.style.cursor = 'pointer';
        } else {
            game.canvas.style.cursor = 'auto';*/
        }
        let currentTool = scene.toolHandler.currentTool;
        if (active && currentTool != 'select') {
            active = false;
            button.classList.remove('active');
        } else if (!active && currentTool == 'select') {
            active = true;
            button.classList.add('active');
        }
    });

    function remove(object) {
        if (!object) return;
        object.remove = true;
        if (polyMod) {
            object.markSectorsDirty();
            object.redrawSectors();
            object.sectors = [{scene}];
        } else {
            object.removeAllReferences();
        }
    }

    function recreate(object, offset = selectOffset) {
        if (!object) return;
        if ('highlight' in object) {
            let re = scene.track.addPhysicsLine(object.p1.x + offset.x, object.p1.y + offset.y,
                                                object.p2.x + offset.x, object.p2.y + offset.y);
            object.newVersion = re;
            return re;
        } else if (object.p1) {
            let re = scene.track.addSceneryLine(object.p1.x + offset.x, object.p1.y + offset.y,
                                               object.p2.x + offset.x, object.p2.y + offset.y);
            object.newVersion = re;
            return re;
        } else {
            object.x += offset.x;
            object.y += offset.y;
            object.remove = 0;
            object.name == 'goal' && scene.track.addTarget(object);
            scene.track.addPowerup(object);
            return object
        }
    }
}

function linesdf(p, line) {
    // len has to be length squared for algorithm reasons
    let len = line.len * line.len,
        t = (((p.x - line.p1.x) * line.pp.x) + ((p.y - line.p1.y) * line.pp.y)) / len;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot((p.x - (line.p1.x + (t * line.pp.x))), (p.y - (line.p1.y + (t * line.pp.y))));
}

function pointsdf(p, point) {
    return Math.hypot(p.x - point.x, p.y - point.y);
}

function linecollide(a1, b1, a2, b2) {
    let d = (((b2.y - a2.y) * (b1.x - a1.x)) - ((b2.x - a2.x) * (b1.y - a1.y))),
        uA = (((b2.x - a2.x) * (a1.y - a2.y)) - ((b2.y - a2.y) * (a1.x - a2.x))) / d,
        uB = (((b1.x - a1.x) * (a1.y - a2.y)) - ((b1.y - a1.y) * (a1.x - a2.x))) / d;
    return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
}

function rectcollide(l1, l2, ul, lr) {
    // we will always give the points as ul, lr
    /*let ul = {x: Math.min(r1.x, r2.x), y: Math.min(r1.y, r2.y)},
        lr = {x: Math.max(r1.x, r2.x), y: Math.max(r1.y, r2.y)};*/
    // if the line is completely within the rectangle
    if (l1.x >= ul.x && l2.x >= ul.x && l1.x <= lr.x && l2.x <= lr.x &&
        l1.y >= ul.y && l2.y >= ul.y && l1.y <= lr.y && l2.y <= lr.y)
        return true;

    // otherwise, check for collisions with the rectangle line segments
    if (linecollide(l1, l2, ul, {x: ul.x, y: lr.y}) ||
        linecollide(l1, l2, ul, {x: lr.x, y: ul.y}) ||
        linecollide(l1, l2, {x: ul.x, y: lr.y}, lr) ||
        linecollide(l1, l2, {x: lr.x, y: ul.y}, lr))
        return true;
    return false;
}

function pointrect(p, r1, r2) {
    let ul = {x: Math.min(r1.x, r2.x), y: Math.min(r1.y, r2.y)},
        lr = {x: Math.max(r1.x, r2.x), y: Math.max(r1.y, r2.y)};
    return p.x >= ul.x && p.x <= lr.x && p.y >= ul.y && p.y <= lr.y;
}

/**
 * Easy one-stop function to create and set up an element or even trees of elements.
 * @param {String} tag The type of element to create
 * @param {HTMLElement} [parent] (optional) Parent element to add this one to
 * @param {Object} [properties={}] Properties (e.g. innerHTML) to set on the element
 * @param {Array<Object|HTMLElement>} [properties.children] Optional short-circuit to create nested element, but prevents returning them
 * @param {String} properties.children[].tag Tag for the child
 * @param {Object} properties.children[].* Properties for the child
 * @param {Function} [properties.oncreate] Optional function to run once the element has been fully created
 * @param {Array<String>} [properties.classes] Classes to add to the created object
 * @returns {HTMLElement} The created element
 */
function createElement(tag, parent, properties = {}) {
    let element = document.createElement(tag),
        oncreate;
    if (parent) {
        parent.append(element);
    }
    for (let i in properties) {
        switch (i) {
            case 'children':
                for (let child of properties.children) {
                    if (child instanceof HTMLElement) {
                        element.append(child);
                    } else {
                        let properties = child,
                            tag = child.tag;
                        delete properties.tag;
                        createElement(tag, element, properties || {});
                    }
                }
                break;
                // delay running the oncreate function until all properties have been initialized
            case 'oncreate':
                oncreate = properties.oncreate;
                break;
            case 'classes':
                element.classList.add(...properties[i]);
                break;
            case 'data':
                for (let data in properties[i]) {
                    element.dataset[data] = properties[i][data];
                }
            default:
                element[i] = properties[i];
        }
    }
    if (oncreate) {
        oncreate(element);
    }
    return element;
}

function doAMario(selector) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            let found = document.querySelector(selector);
            if (found) {
                resolve(found);
                clearInterval(interval);
            }
        }, 250);
    });
}

function rInterval() {
    window.clearInterval(v)
}
var v = window.setInterval(function() {
    if (GameManager != undefined && GameManager.game != undefined) {
        rInterval();
        load();
    }
}, 250)
