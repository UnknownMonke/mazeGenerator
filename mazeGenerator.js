(function(global) {
    'use strict';

    // Cells of the maze.
    let cellMap = [];
    // Number of lines and columns.
    const mazeSize = 49;

    const maze = {
        mazeSize: mazeSize,
        cellMap: cellMap,
        resetGrid: resetGrid,
        primSimpleSingle: primSimpleSingle,
        primSimple: primSimple,
        primWeighted: primWeighted,
        iterativeDFS: iterativeDFS
    };


    // ----------------------------------------------------
    //                       UTILITY
    // ----------------------------------------------------


    // Check if given coordinates are in the maze.
    function validate(x, y) {
        return x >= 0 && y >= 0 && x < mazeSize && y < mazeSize;
    }

    // Check if given coordinates are in the maze and not on its extremities.
    function isNotExtremities(x, y) {
        return x > 0 && y > 0 && x < mazeSize - 1 && y < mazeSize - 1;
    }
    
    // Return a random int between min and max - 1.
    function random(min, max) {
        return Math.floor(Math.random() * (max - min) + min );
    }

    // Return 0 or 1 at random.
    function randOne() {
        return Math.round(Math.random());
    }
    
    // Change the validation conditions to ignore more or less extremities.
    function isWall(x, y) {
        return isNotExtremities(x, y) && cellMap[x][y] === 'wall';
    }

    // Change the validation conditions to ignore more or less extremities.
    function isPassage(x, y) {
        return isNotExtremities(x, y) && cellMap[x][y] !== 'wall';
    }

    function isEntrance(c) {
        return cellMap[c[0]][c[1]] === 'start' || cellMap[c[0]][c[1]] === 'end';
    }

    function drawCell(x, y, cellType) {
        document.getElementById(`[${x},${y}]`).className = cellType;
    }

    // Choose a random cell on the extremities of the maze.
    function chooseExtremity() {
        let x = 0;
        let y = 0;

        let isOnX = randOne() === 0;

        if(isOnX) {
            // x will be fixed.
            const rand  = randOne();
            if(rand === 0) {
                x = 1;
                y = random(2, mazeSize - 2);
            } else {
                x = mazeSize - 2;
                y = random(2, mazeSize - 2);
            }
        } else {
            // y will be fixed.
            const rand  = randOne();
            if(rand === 0) {
                y = 1;
                x = random(2, mazeSize - 2);
            } else {
                y = mazeSize - 2;
                x = random(2, mazeSize - 2);
            }
        }
        return [x, y];
    }

    // Draw an empty grid.
    function resetGrid() {
        cellMap = new Array(mazeSize);
    
        // Reset the container.
        document.getElementById('grid-container').innerHTML = "";
        clearInterval(global.currentInterval);
    
        for(let i = 0; i < mazeSize; i++) {
            for(let j = 0; j < mazeSize; j++) {
                const div = document.createElement('div');
                div.id = `[${i},${j}]`;
                div.className = 'wall';
        
                document.getElementById('grid-container').append(div);

                // Append wall to map.
                if(typeof cellMap[i] === 'undefined') {
                    cellMap[i] = new Array(mazeSize);
                }
                cellMap[i][j] = 'wall';
            }
        }
        maze.cellMap = cellMap;
    }

    /**
     * Check for a given wall if it can be opened.
     * 
     * This is the main condition that will shape the maze and make it more or less 'maze-like'.
     * 
     * For a given direction we check if the 2 next cells in the same direction are walls, and also their cells in the perpendicular directions:
     * 
     * Example for East direction:
     * - O = current opened cell
     * - N = selected wall
     * - X = cells checked
     *  _  _  _  _  _
     * |_||_||_||_||_|
     * |_||_||X||X||_|
     * |O||N||X||X||_|
     * |_||_||X||X||_|
     * |_||_||_||_||_|
     * 
     * Here the wall N and its direct neighbor on the right will be opened.
     */
     function checkNeighbors(x, y, direction) {

        if( direction === 'E' && isWall(x, y+1) && isWall(x-1, y+1) && isWall(x+1, y+1) && isWall(x, y+2) && isWall(x-1, y+2) && isWall(x+1, y+2) ) {
            return true;
        }
        else if( direction === 'W' && isWall(x, y-1) && isWall(x-1, y-1) && isWall(x+1, y-1) && isWall(x, y-2) && isWall(x-1, y-2) && isWall(x+1, y-2) ) {
            return true;
        }
        else if( direction === 'N' && isWall(x-1, y) && isWall(x-1, y+1) && isWall(x-1, y-1) && isWall(x-2, y) && isWall(x-2, y+1) && isWall(x-2, y-1) ) {
            return true;
        }
        else if( direction === 'S' && isWall(x+1, y) && isWall(x+1, y+1) && isWall(x+1, y-1) && isWall(x+2, y)  && isWall(x+2, y+1) && isWall(x+2, y-1) ) {
            return true;
        }
        return false;
    }


    // ----------------------------------------------------
    //                       ALGORITHMS
    // ----------------------------------------------------


    /**
     * Simple version of Prim's Algorithm to generate a maze.
     * 
     * We keep track of every visitable neighbors (openable wall) of the opened cells (the 'frontier') in a list.
     * Every iteration, a random cell from the frontier is picked and opened, and its visitable neighbors are added to the frontier.
     * 
     * This version use cells as walls, with a double opening,
     * which means that we open the passage by opening the wall and the next cell behind, effectively opening 2 cells at each iteration, 
     * except at the frontier since we want to keep an outer wall.
     * 
     * This produces longer corridors, making it more appealing to the eyes. 
     * Also note that this algorithm produces a result stylistically identical to Kruskal's Algorithm, as they are both minimal spanning tree algorithms.
     * 
     * We also wrap the steps in an interval to animate the maze creation process, instead of a while loop.
     * 
     * If a cell has visitable neighbors, we mark the second one in red to visually see which cell is selected.
     * The last one will also serve as exit.
     * 
     * Algorithm:
     * - 1 - Pick a cell, mark it at part of the maze.
     * - 2 - Add the walls of the cell to the frontier (the wall list).
     * - 3 - While the frontier is not empty:
     *      - 1 - Pick a random wall from the frontier. 
     *      - 2 - If only one of the cells that the wall divides is visited, then:
     *          - 1 - Make the wall a passage and mark the unvisited cell as part of the maze.
     *          - 2 - Add the neighboring walls of the cell to the frontier.
     *      - 3 - Remove the wall from the frontier.
     * 
     * Lets note that due to opening 2 cells at once, the maze is not always square (TODO ?). 
     * You can notice that by changing the maze size.
     * 
     * @returns the map of every cell of the maze, with its nature ('wall', 'passage', 'start' or 'end').
     */
    function primSimple() {
        let frontier = [];

        resetGrid();

        // 1 - Pick a cell, mark it at part of the maze.
        // The cell is chosen on the frontier to make it stand visually.
        const start = chooseExtremity();
        mark(start[0], start[1], cellMap, false);

        // 2 - Add the walls of the cell to the frontier (the wall list).
        findOpenableWalls(start[0], start[1]);

        // 3 - While the frontier is not empty:
        global.currentInterval = setInterval(function() {

            if(frontier.length === 0) { // Exit condition.
                clearInterval(global.currentInterval);

                // Draw the starting cell
                cellMap[start[0]][start[1]] = 'start';
                drawCell(start[0], start[1], 'start');

                // Save the ending cell
                if(document.getElementsByClassName('end').length > 0) {
                    const cell = document.getElementsByClassName('end')[0].id.replace('[','').replace(']','').split(',');
                    cellMap[cell[0]][cell[1]] = 'end';
                }

                maze.cellMap = cellMap; // Update the finished map.

                console.log('exit');

            } else {
                // 1 - Pick a random wall from the frontier. 
                const randInt = random(0, frontier.length);
                let chosenCell = frontier[randInt];
                let x = chosenCell[0];
                let y = chosenCell[1];

                // 2 - If only one of the cells that the wall divides is visited, then:
                if(checkNeighbors(x, y, chosenCell[2])) {
                    
                    // Remove the previous red cell so that only the current cell is colored red.
                    if(document.getElementsByClassName('end').length > 0 && frontier.length > 1) {
                        document.getElementsByClassName('end')[0].className = 'passage';
                    }

                    // 1 - Make the wall a passage and mark the unvisited cell as part of the maze.
                    mark(x, y, cellMap, false);
                    switch(chosenCell[2]) {
                        case 'N':
                            mark(x-1, y, cellMap, true);
                            // 2 - Add the neighboring walls of the cell to the frontier.
                            findOpenableWalls(x-1, y);
                            break;
                        case 'S':
                            mark(x+1, y, cellMap, true);
                            findOpenableWalls(x+1, y);
                            break;
                        case 'W':
                            mark(x, y-1, cellMap, true);
                            findOpenableWalls(x, y-1);
                            break;
                        case 'E':
                            mark(x, y+1, cellMap, true);
                            findOpenableWalls(x, y+1);
                            break;
                        default:
                            break;
                    }
                }
                // 3 - Remove the wall from the frontier.
                frontier.splice(randInt, 1);
            }
        }, 10);

        // -------------------- UTILITY --------------------

        // Effectively 'open' a cell.
        function mark(x, y, cellMap, visualize) {
        
            if(validate(x, y)) { // if coordinates are in the maze
                cellMap[x][y] = 'passage';
        
                drawCell(x, y, visualize ? 'end' : 'passage');
            }
        }

        /**
         * Return the list of close visitable walls that can be opened (with the cell behind).
         */
        function findOpenableWalls(x, y) {

            if( isWall(x-1, y) && checkNeighbors(x-1, y, 'N') ) {
                frontier.push([x-1, y, 'N']);
            }
            if( isWall(x+1, y) && checkNeighbors(x+1, y, 'S') ) {
                frontier.push([x+1, y, 'S']);
            }
            if( isWall(x, y-1) && checkNeighbors(x, y-1, 'W') ) {
                frontier.push([x, y-1, 'W']);
            }
            if( isWall(x, y+1) && checkNeighbors(x, y+1, 'E') ) {
                frontier.push([x, y+1, 'E']);
            }
        }
    }

    /**
     * Weighted version of Prim's Algorithm to generate a maze.
     * 
     * ---
     * 
     * The difference between this version and the simple version is that the choosing of the frontier cell is not purely random.
     * 
     * In order to produce longer corridor and force the algorithm to continue on the current corridor, we add weight to the choice:
     * - Here the weight is pretty simple, the last 4 elements of the frontier have 80% chance to get chosen, regardless of the corridor direction.
     * - We therefore increase the chances that a direct neighbor of the last opened cell will be chosen.
     * - More complex weight generation can be implemented to influence the style of the maze.
     * 
     * ---
     * 
     * The algorithm is the same as the simple version.
     * 
     * @returns the map of every cell of the maze, with its nature ('wall', 'passage', 'start' or 'end').
     */
     function primWeighted() {
        let frontier = [];

        resetGrid();

        const start = chooseExtremity();

        mark(start[0], start[1], cellMap, false);
        findOpenableWalls(start[0], start[1]);

        global.currentInterval = setInterval(function() {

            if(frontier.length === 0) {
                clearInterval(global.currentInterval);

                cellMap[start[0]][start[1]] = 'start';
                drawCell(start[0], start[1], 'start');

                if(document.getElementsByClassName('end').length > 0) {
                    const cell = document.getElementsByClassName('end')[0].id.replace('[','').replace(']','').split(',');
                    cellMap[cell[0]][cell[1]] = 'end';
                }

                maze.cellMap = cellMap;

                console.log('exit');

            } else {
                let chosenCell = chooseCell(frontier);
                
                let x = chosenCell.cell[0];
                let y = chosenCell.cell[1];

                if(checkNeighbors(x, y, chosenCell.cell[2])) {

                    // Remove the previous red cell so that only the current cell is colored red.
                    if(document.getElementsByClassName('end').length > 0 && frontier.length > 1) {
                        document.getElementsByClassName('end')[0].className = 'passage';
                    }
                    
                    mark(x, y, cellMap, false);
                    switch(chosenCell.cell[2]) {
                        case 'N':
                            mark(x-1, y, cellMap, true);
                            findOpenableWalls(x-1, y);
                            break;
                        case 'S':
                            mark(x+1, y, cellMap, true);
                            findOpenableWalls(x+1, y);
                            break;
                        case 'W':
                            mark(x, y-1, cellMap, true);
                            findOpenableWalls(x, y-1);
                            break;
                        case 'E':
                            mark(x, y+1, cellMap, true);
                            findOpenableWalls(x, y+1);
                            break;
                        default:
                            break;
                    }
                }
                frontier.splice(chosenCell.index, 1);
            }
        }, 10);

        // -------------------- UTILITY --------------------

        function mark(x, y, cellMap, visualize) {
        
            if(validate(x, y)) { // if coordinates are in the maze
                cellMap[x][y] = 'passage';
        
                drawCell(x, y, visualize ? 'end' : 'passage');
            }
        }

        function findOpenableWalls(x, y) {

            if( isWall(x-1, y) && checkNeighbors(x-1, y, 'N') ) {
                frontier.push([x-1, y, 'N']);
            }
            if( isWall(x+1, y) && checkNeighbors(x+1, y, 'S') ) {
                frontier.push([x+1, y, 'S']);
            }
            if( isWall(x, y-1) && checkNeighbors(x, y-1, 'W') ) {
                frontier.push([x, y-1, 'W']);
            }
            if( isWall(x, y+1) && checkNeighbors(x, y+1, 'E') ) {
                frontier.push([x, y+1, 'E']);
            }
        }

        /**
         * Weighted random generation.
         * 
         * The last 4 elements of the frontier have 80% chance to get chosen.
         * 
         * @param {Array} frontier the frontier.
         * @returns {Object} the chosen cell and the index. 
         */
        function chooseCell(frontier) {
            let randInt = 0;
            let chosenCell = [];
            
            if(frontier.length > 4) {
                const randOne = Math.random();

                if(randOne <= 0.8) {
                    const rand = random(0, 4);

                    chosenCell = frontier[frontier.length - 1 - rand];
                    randInt = frontier.length - 1 - rand;

                } else {
                    randInt = random(0, frontier.length - 4);
                    chosenCell = frontier[randInt];
                }

            } else {
                randInt = random(0, frontier.length);
                chosenCell = frontier[randInt];
            }
            return { cell: chosenCell, index: randInt };
        }
    }

    /**
     * Simple version of Prim's Algorithm with single cell opening.
     * 
     * This version only opens the chosen wall, and not the cell behind.
     * 
     * The result is not really maze-like, but visually interesting nonetheless.
     * 
     * @returns the map of every cell of the maze, with its nature ('wall', 'passage', 'start' or 'end').
     */
    function primSimpleSingle() {
        let frontier = [];
        
        resetGrid();

        const start = chooseExtremity();

        mark(start[0], start[1], cellMap, frontier);

        global.currentInterval = setInterval(function() {

            if(frontier.length === 0) {
                clearInterval(global.currentInterval);

                cellMap[start[0]][start[1]] = 'start';
                drawCell(start[0], start[1], 'start');

                if(document.getElementsByClassName('end').length > 0) {
                    const cell = document.getElementsByClassName('end')[0].id.replace('[','').replace(']','').split(',');
                    cellMap[cell[0]][cell[1]] = 'end';
                }

                maze.cellMap = cellMap;

                console.log('exit');

            } else {
                const randInt = random(0, frontier.length);
                let chosenCell = frontier[randInt];
                let x = chosenCell[0];
                let y = chosenCell[1];

                if(checkNeighbors(x, y)) {

                    if(document.getElementsByClassName('end').length > 0) {
                        document.getElementsByClassName('end')[0].className = 'passage';
                    }
                    mark(x, y, cellMap, frontier); 
                }
                frontier.splice(randInt, 1);
            }
        }, 5);

        // -------------------- UTILITY --------------------

        function mark(x, y, cellMap, frontier) {
        
            if(validate(x, y)) {
                cellMap[x][y] = 'passage';
        
                drawCell(x, y, 'end');

                if (isWall(x-1, y) ) {
                    frontier.push([x-1, y]);
                }
                if( isWall(x+1, y) ) {
                    frontier.push([x+1, y]);
                }
                if( isWall(x, y-1) ) {
                    frontier.push([x, y-1]);
                }
                if( isWall(x, y+1) ) {
                    frontier.push([x, y+1]);
                }
            }
        }

        /**
         * Check for a given wall if it can be opened.
         * 
         * Count the number of passages in the area around the cell:
         * - If a direct neighbor is a passage.
         * - If a direct neighbor is a wall and the cell on the diagonal in the same direction is a passage.
         * 
         * We could use the same function as the other algorithms but I kept this one to show another way of doing it.
         * 
         * Example for East direction:
         * - O = current opened cell
         * - N = selected wall
         * - X = cells checked
         *  _  _  _  _  _
         * |_||_||_||_||_|
         * |_||_||X||_||_|
         * |O||N||_||_||_|
         * |_||_||X||_||_|
         * |_||_||_||_||_|
         * 
         */
        function checkNeighbors(x,y) {
            let count = 0;
        
            if( isPassage(x-1, y) ) {
                count += 1;
            }
            if( isPassage(x+1, y) ) {
                count += 1;
            }
            if( isPassage(x, y-1) ) {
                count += 1;
            }
            if( isPassage(x, y+1) ) {
                count += 1;
            }
        
            if(count === 1) {
                if( isPassage(x-1, y) && isWall(x+1, y) && (isPassage(x+1, y-1) || isPassage(x+1, y+1)) ) {
                    count += 1;
                }
                if( isPassage(x+1, y) && isWall(x-1, y) && (isPassage(x-1, y-1) || isPassage(x-1, y+1)) ) {
                    count += 1;
                }
                if( isPassage(x, y-1) && isWall(x, y+1) && (isPassage(x-1, y+1) || isPassage(x+1, y+1)) ) {
                    count += 1;
                }
                if( isPassage(x, y+1) && isWall(x, y-1) && (isPassage(x-1, y-1) || isPassage(x+1, y-1)) ) {
                    count += 1;
                }
            }
            return count === 1;
        }
    }

    /**
     * Iterative version of Depth-First Search (DFS) to generate a maze.
     * 
     * We keep track of visited cells in a stack.
     * When we reach a dead-end, we backtrack until we find a cell with openable walls.
     * 
     * We keep track of dead ends to choose one randomly at the end that will serve as exit.
     * 
     * This version use cells as walls, with a double opening,
     * which means that we open the passage by opening the wall and the next cell behind, effectively opening 2 cells at each iteration, 
     * except at the frontier since we want to keep an outer wall.
     * 
     * This produces longer corridors, making it more appealing to the eyes. 
     * Also note that this algorithm naturally produces long corridors as it goes all the way to the end before backtracking.
     * 
     * We also wrap the steps in an interval to animate the maze creation process, instead of a while loop.
     * 
     * Algorithm:    
     * - 1 - Choose an initial random cell, make it a passage and push it to the stack.
     * - 2 - While the stack is not empty:
     *      - 1 - Pop a cell from the stack and make it the current cell.
     *      - 2 - If the current cell has any valid neighbors (walls) which have not been visited yet:
     *          - 1 - Push the current cell to the stack.
     *          - 2 - Choose one of the unvisited neighbors.
     *          - 3 - Remove the wall between the current cell and the chosen cell.
     *          - 4 - Mark the chosen cell as visited and push it to the stack.
     * 
     * Lets note that due to opening 2 cells at once, the maze is not always square (TODO ?). 
     * You can notice that by changing the maze size.
     * 
     * @returns the map of every cell of the maze, with its nature ('wall', 'passage', 'start' or 'end').
     */
    function iterativeDFS() {
        let openableWalls = [];
        let stack = [];

        const deadEndList = [];

        resetGrid();

        // 1 - Choose an initial random cell, make it a passage and push it to the stack.
        // The cell is chosen on the frontier to make it stand visually.
        const start = chooseExtremity();
        mark(start[0], start[1], cellMap);

        // 2 - While the stack is not empty :
        global.currentInterval = setInterval(function() {

            if(stack.length === 0) { // Exit condition: stack empty.
                clearInterval(global.currentInterval);

                // Draw the starting cell.
                cellMap[start[0]][start[1]] = 'start';
                drawCell(start[0], start[1], 'start');

                // Choose a random cell from the dead ends and make it the end.
                const randEnd = random(0, deadEndList.length);
                const end = deadEndList[randEnd];

                cellMap[end[0]][end[1]] = 'end';
                drawCell(end[0], end[1], 'end');

                maze.cellMap = cellMap; // Update the finished map.

                console.log('exit');

            } else {
                // 1 - Pop a cell from the stack and make it the current cell.
                let currentCell = stack.pop();

                openableWalls = findOpenableWalls(currentCell[0], currentCell[1]);

                // 2 - If the current cell has any valid neighbors which have not been visited yet:
                if(openableWalls.length > 0) {

                    // 1 - Push the current cell to the stack.
                    stack.push(currentCell);

                    // 2 - Choose one of the unvisited neighbors.
                    const randInt = random(0, openableWalls.length);
                    let chosenCell = openableWalls[randInt];
                    let x = chosenCell[0];
                    let y = chosenCell[1];

                    // 3 - Remove the wall between the current cell and the chosen cell.
                    mark(x, y, cellMap);

                    // 4 - Mark the chosen cell as visited and push it to the stack.
                    switch(chosenCell[2]) {
                        case 'N':
                            mark(x-1, y, cellMap);
                            break;
                        case 'S':
                            mark(x+1, y, cellMap);
                            break;
                        case 'W':
                            mark(x, y-1, cellMap);
                            break;
                        case 'E':
                            mark(x, y+1, cellMap);
                            break;
                        default:
                            break;
                    }

                } else {
                    // Backtracking: mark the cell as passage since the cell will not be visited anymore.
                    drawCell(currentCell[0], currentCell[1], 'passage'); 

                    // Dead end: add the cell to dead end list.
                    if(isDeadEnd(currentCell[0], currentCell[1]) && !isEntrance(currentCell)) {
                        deadEndList.push(currentCell);
                    }
                }
            }
        }, 10);

        // -------------------- UTILITY --------------------

        // Effectively 'open' a cell.
        function mark(x, y, cellMap) {
            if(validate(x, y)) {
                cellMap[x][y] = 'passage';

                stack.push([x,y]); // Push to stack for backtracking.

                // Mark the cell in blue when it is visited the first time so we can better see the algorithm in action.
                drawCell(x, y, 'blue');
            }
        }

        // A dead end means only one of the cell's neighbors is also a passage.
        function isDeadEnd(x,y) {
            let count = 0;
        
            if( isPassage(x-1, y) ) {
                count += 1;
            }
            if( isPassage(x+1, y) ) {
                count += 1;
            }
            if( isPassage(x, y-1) ) {
                count += 1;
            }
            if( isPassage(x, y+1) ) {
                count += 1;
            }
            return count === 1;
        }

        /**
         * Return the list of close visitable walls that can be opened (with the cell behind).
         */
        function findOpenableWalls(x, y) {
            const openableWalls = [];

            if( isWall(x-1, y) && checkNeighbors(x-1, y, 'N') ) {
                openableWalls.push([x-1, y, 'N']);
            }
            if( isWall(x+1, y) && checkNeighbors(x+1, y, 'S') ) {
                openableWalls.push([x+1, y, 'S']);
            }
            if( isWall(x, y-1) && checkNeighbors(x, y-1, 'W') ) {
                openableWalls.push([x, y-1, 'W']);
            }
            if( isWall(x, y+1) && checkNeighbors(x, y+1, 'E') ) {
                openableWalls.push([x, y+1, 'E']);
            }
            return openableWalls;
        }
    }

    // -------------------------------------------------

    if(typeof module !== 'undefined') {
        module.exports = maze;
    } else {
        global.maze = maze;
    }
})(this);